'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { Commuter, CommuterPreferences, Journey, RouteOption, TextSize } from '@/types';
import { MDM_LIM_COMMUTER } from '@/fixtures/mdm-lim';
import { MDM_LIM_SGH_JOURNEY, MDM_LIM_SGH_AFFECTED_JOURNEY } from '@/fixtures/journeys';
import { SAMPLE_USUAL_ROUTE, SAMPLE_AFFECTED_ROUTE, SAMPLE_RECOMMENDED_ROUTE } from '@/fixtures/routes';

interface DemoContextValue {
  isDisrupted: boolean;
  setIsDisrupted: (disrupted: boolean) => void;
  toggleDisruption: () => void;
  commuter: Commuter;
  updatePreferences: (updates: Partial<CommuterPreferences>) => void;
  textSize: TextSize;
  setTextSize: (size: TextSize) => void;
  currentJourney: Journey;
  usualRoute: RouteOption;
  recommendedRoute: RouteOption;
}

const DemoContext = createContext<DemoContextValue | undefined>(undefined);

export function DemoProvider({ children }: { children: React.ReactNode }) {
  const [isDisrupted, setIsDisrupted] = useState<boolean>(false);
  const [commuter, setCommuter] = useState<Commuter>(MDM_LIM_COMMUTER);
  const [textSize, setTextSizeState] = useState<TextSize>(MDM_LIM_COMMUTER.preferences.textSize);

  const setTextSize = (size: TextSize) => {
    setTextSizeState(size);
    setCommuter((prev) => ({
      ...prev,
      preferences: {
        ...prev.preferences,
        textSize: size,
      },
    }));
  };

  const updatePreferences = (updates: Partial<CommuterPreferences>) => {
    setCommuter((prev) => ({
      ...prev,
      preferences: {
        ...prev.preferences,
        ...updates,
      },
    }));
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

  const currentJourney = isDisrupted ? MDM_LIM_SGH_AFFECTED_JOURNEY : MDM_LIM_SGH_JOURNEY;
  const usualRoute = isDisrupted ? SAMPLE_AFFECTED_ROUTE : SAMPLE_USUAL_ROUTE;
  const recommendedRoute = SAMPLE_RECOMMENDED_ROUTE;

  return (
    <DemoContext.Provider
      value={{
        isDisrupted,
        setIsDisrupted,
        toggleDisruption,
        commuter,
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
