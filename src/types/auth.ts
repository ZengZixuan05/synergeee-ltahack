import { CommuterPreferences, RegularRoute } from '@/types';

export interface UserProfile {
  uid: string;
  displayName: string;
  email: string;
  onboardingComplete: boolean;
  createdAt?: string | number | null;
  updatedAt?: string | number | null;
  preferences?: CommuterPreferences;
  regularRoutes?: RegularRoute[];
}

export interface OnboardingFormState {
  // Step 1: Journey Priorities
  priorities: {
    faster: boolean;
    lessWalking: boolean;
    sheltered: boolean;
    fewerTransfers: boolean;
    lessCrowded: boolean;
  };
  // Step 2: Accessibility
  accessibility: {
    avoidStairs: boolean;
    requireWorkingLifts: boolean;
    wheelchairMode: boolean;
  };
  // Step 3: Walking
  walking: {
    walkingPace: 'slow' | 'standard' | 'fast';
    maxContinuousWalk: '200m' | '400m' | '600m' | 'no-preference';
  };
  // Step 4: Display
  display: {
    textSize: 'standard' | 'large' | 'xlarge';
    language: 'en' | 'zh' | 'ms' | 'ta';
  };
  // Step 5: Regular Routes
  regularRoutes: RegularRoute[];
}
