'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { doc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { Commuter, CommuterPreferences, Journey, TextSize } from '@/types';
import { MDM_LIM_COMMUTER } from '@/fixtures/mdm-lim';
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
  const { planResult: savedJourneyPlanResult, status: savedJourneyRouteStatus } = useSavedJourneyRoute(
    primarySavedJourney ?? null,
    activePreferences
  );
  // No fabricated persona journey when the commuter hasn't saved one of their
  // own. When they have, "affected" — and everything /journey/compare and
  // /journey/guide show — is driven entirely by real live LTA data (see
  // savedJourneyToJourney). `isDisrupted` is a separate, cosmetic demo-badge
  // toggle only; it doesn't fabricate route data.
  const currentJourney = primarySavedJourney
    ? savedJourneyToJourney(primarySavedJourney, {
        planResult: savedJourneyPlanResult,
        routeStatus: savedJourneyRouteStatus,
        requireWorkingLifts: activePreferences.requireWorkingLifts,
      })
    : null;

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
