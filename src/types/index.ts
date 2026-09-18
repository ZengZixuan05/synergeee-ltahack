export type CrowdingLevel = 'low' | 'moderate' | 'high';

export type TransportMode = 'rail' | 'bus' | 'walking' | 'cycling';

export type WalkingPace = 'slow' | 'standard' | 'fast';

export type ContinuousWalkDistance = '200m' | '400m' | '600m' | 'no-preference';

export type TextSize = 'standard' | 'large' | 'xlarge';

export type LanguageCode = 'en' | 'zh' | 'ms' | 'ta';

export interface AccessibilityFeature {
  id: string;
  label: string;
  status: 'verified' | 'unavailable' | 'partially-available';
  description?: string;
  icon?: string;
}

export interface CommuterPreferences {
  minimiseWalking: boolean;
  preferSheltered: boolean;
  preferFewerTransfers: boolean;
  avoidHighCrowding: boolean;
  transportModes: TransportMode[];
  avoidStairs: boolean;
  requireWorkingLifts: boolean;
  wheelchairMode: boolean;
  walkingPace: WalkingPace;
  maxContinuousWalk: ContinuousWalkDistance;
  textSize: TextSize;
  language: LanguageCode;
  notifications: {
    plannedDisruptions: boolean;
    unexpectedDisruptions: boolean;
    weatherDisruptions: boolean;
    crowdingDisruptions: boolean;
  };
}

export interface Commuter {
  id: string;
  name: string;
  greetingTitle?: string;
  homeLocation: {
    name: string;
    address: string;
    postalCode?: string;
  };
  preferences: CommuterPreferences;
}

export interface RouteMetric {
  durationMinutes: number;
  durationRange?: string; // e.g. "61–68 min"
  walkingDistanceMeters: number;
  transfersCount: number;
  crowding: CrowdingLevel;
  shelteredPercentage?: number; // e.g. 85%
  isStepFree: boolean;
  hasWorkingLifts: boolean;
  isMostlySheltered: boolean;
}

export interface JourneyStep {
  id: string;
  stepNumber: number;
  totalSteps: number;
  instruction: string;
  subInstruction?: string;
  detail?: string;
  mode: 'walk' | 'rail' | 'bus' | 'transfer' | 'lift';
  distanceMeters?: number;
  estimatedMinutes?: number;
  crowding?: CrowdingLevel;
  isSheltered?: boolean;
  warningAlert?: {
    type: 'warning' | 'info' | 'critical';
    title: string;
    message: string;
    recommendation?: string;
  };
  confirmedStatus?: string; // e.g. "Working lift confirmed"
  lineName?: string; // e.g. "East West Line"
  destination?: string; // e.g. "Towards Tuas Link"
  boardAt?: string; // e.g. "Bedok"
  stopsCount?: number;
  platform?: string;
}

export interface RouteOption {
  id: string;
  title: string; // e.g. "Recommended route", "Usual route"
  badgeType: 'recommended' | 'usual' | 'affected' | 'alternative';
  metrics: RouteMetric;
  departureTime: string; // e.g. "8:38 AM"
  arrivalTime: string; // e.g. "9:44–9:53 AM"
  departureLocation: string;
  arrivalLocation: string;
  summarySteps?: string[];
  affectedReason?: string; // e.g. "Lift unavailable on this route"
  isRecommendedAlternative?: boolean;
  steps: JourneyStep[];
}

export interface Journey {
  id: string;
  title: string; // e.g. "SGH Appointment"
  recurrence: string; // e.g. "Every alternate Monday"
  targetArrivalTime: string; // e.g. "10:00 AM"
  originName: string; // e.g. "Sky Eden @ Bedok"
  destinationName: string; // e.g. "Singapore General Hospital"
  isAffected: boolean;
  affectedReason?: string;
  affectedDetail?: string;
  recommendedAction?: string;
  normalRoute: RouteOption;
  recommendedRoute?: RouteOption;
  affectedRoute?: RouteOption;
}

export type DayOfWeek = 'mon' | 'tue' | 'wed' | 'thu' | 'fri' | 'sat' | 'sun';

export type RegularRouteTimeType = 'depart-at' | 'arrive-by';

export type RegularRouteLegMode = 'walk' | 'rail' | 'bus' | 'transfer';

export interface RegularRouteLeg {
  id: string;
  mode: RegularRouteLegMode;
  description: string; // e.g. "Take East West Line to Outram Park"
}

export interface RegularRoute {
  id: string;
  name: string; // e.g. "Commute to work"
  origin: string;
  destination: string;
  timeType: RegularRouteTimeType;
  time: string; // "HH:mm" 24h, from <input type="time">
  days: DayOfWeek[];
  legs: RegularRouteLeg[];
}

export const DAYS_OF_WEEK: { value: DayOfWeek; label: string }[] = [
  { value: 'mon', label: 'Mon' },
  { value: 'tue', label: 'Tue' },
  { value: 'wed', label: 'Wed' },
  { value: 'thu', label: 'Thu' },
  { value: 'fri', label: 'Fri' },
  { value: 'sat', label: 'Sat' },
  { value: 'sun', label: 'Sun' },
];

export interface TransportAlert {
  id: string;
  title: string;
  description: string;
  severity: 'low' | 'moderate' | 'critical';
  category: 'rail' | 'weather' | 'crowding' | 'bus';
  updatedAt: string;
  affectedLineOrStation?: string;
  isSampleData: boolean;
}
