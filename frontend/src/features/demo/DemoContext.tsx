'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { doc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { Commuter, CommuterPreferences, Journey, RouteOption, TextSize } from '@/types';
import { MDM_LIM_COMMUTER } from '@/fixtures/mdm-lim';
import { SAMPLE_USUAL_ROUTE, SAMPLE_AFFECTED_ROUTE, SAMPLE_RECOMMENDED_ROUTE } from '@/fixtures/routes';
import { useAuth } from '@/features/auth/useAuth';
import { db } from '@/lib/firebase';
import { savedJourneyToJourney } from '@/lib/journeyMigration';
import { useSavedJourneyRoute } from '@/hooks/useSavedJourneyRoute';

interface DemoContextValue {
  isDisrupted: boolean;
  setIsDisrupted: (disrupted: boolean) => void;
  toggleDisruption: () => void;
  commuter: Commuter;
  updatePreferences: (updates: Partial<CommuterPreferences>) => void;
  textSize: TextSize;
  setTextSize: (size: TextSize) => void;
  currentJourney: Journey | null;
  usualRoute: RouteOption;
  recommendedRoute: RouteOption;
}

const DemoContext = createContext<DemoContextValue | undefined>(undefined);

export function DemoProvider({ children }: { children: React.ReactNode }) {
  const { user, profile } = useAuth();
  const [isDisrupted, setIsDisrupted] = useState<boolean>(false);
  const [localOverrides, setLocalOverrides] = useState<Partial<CommuterPreferences>>({});

  // Merge baseline Mdm Lim, authenticated profile, and local overrides
  const activePreferences: CommuterPreferences = {
    ...MDM_LIM_COMMUTER.preferences,
    ...(profile?.preferences || {}),
    ...localOverrides,
  };

  const activeCommuter: Commuter = {
    ...MDM_LIM_COMMUTER,
    name: profile?.displayName || MDM_LIM_COMMUTER.name,
    greetingTitle: `Welcome back, ${profile?.displayName || MDM_LIM_COMMUTER.name}`,
    preferences: activePreferences,
  };

  const textSize: TextSize = activePreferences.textSize || MDM_LIM_COMMUTER.preferences.textSize;

  const updatePreferences = async (updates: Partial<CommuterPreferences>) => {
    setLocalOverrides((prev) => ({
      ...prev,
      ...updates,
    }));

    // Persist to Firestore if authenticated
    if (user && db) {
      try {
        const userDocRef = doc(db, 'users', user.uid);
        await updateDoc(userDocRef, {
          preferences: {
            ...activePreferences,
            ...updates,
          },
          updatedAt: serverTimestamp(),
        });
      } catch (e) {
        console.warn('Failed to sync preference updates to Firestore:', e);
      }
    }
  };

  const setTextSize = (size: TextSize) => {
    updatePreferences({ textSize: size });
  };

  const toggleDisruption = () => {
    setIsDisrupted((prev) => !prev);
  };

  // Sync text size with document/root data attribute
  useEffect(() => {
    if (typeof document !== 'undefined') {
      document.documentElement.setAttribute('data-text-size', textSize);
    }
  }, [textSize]);

  const primarySavedJourney = profile?.regularRoutes?.[0];
  const { itinerary: savedJourneyItinerary, status: savedJourneyRouteStatus } = useSavedJourneyRoute(
    primarySavedJourney ?? null
  );
  // No fabricated persona journey when the commuter hasn't saved one of their
  // own — the demo-disruption toggle simulates a disruption on the
  // commuter's real saved journey, it never invents one from scratch.
  const currentJourney = primarySavedJourney
    ? savedJourneyToJourney(primarySavedJourney, {
        isDisrupted,
        itinerary: savedJourneyItinerary,
        routeStatus: savedJourneyRouteStatus,
      })
    : null;
  const usualRoute = isDisrupted ? SAMPLE_AFFECTED_ROUTE : SAMPLE_USUAL_ROUTE;
  const recommendedRoute = SAMPLE_RECOMMENDED_ROUTE;

  return (
    <DemoContext.Provider
      value={{
        isDisrupted,
        setIsDisrupted,
        toggleDisruption,
        commuter: activeCommuter,
        updatePreferences,
        textSize,
        setTextSize,
        currentJourney,
        usualRoute,
        recommendedRoute,
      }}
    >
      {children}
    </DemoContext.Provider>
  );
}

export function useDemoMode() {
  const context = useContext(DemoContext);
  if (!context) {
    throw new Error('useDemoMode must be used within a DemoProvider');
  }
  return context;
}
