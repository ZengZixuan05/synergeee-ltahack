import { DayOfWeek } from '@/types';

// ---------------------------------------------------------------------------
// Time preference — shared by every recurrence variant below.
// ---------------------------------------------------------------------------

export type TimePreferenceType = 'depart-at' | 'arrive-by';

export interface TimePreference {
  type: TimePreferenceType;
  value: string; // "HH:mm" 24h, from <input type="time">
}

// ---------------------------------------------------------------------------
// Recurrence end condition — applies to every repeating schedule.
// ---------------------------------------------------------------------------

export type RecurrenceEnd =
  | { kind: 'never' }
  | { kind: 'on-date'; date: string } // ISO yyyy-mm-dd
  | { kind: 'after-occurrences'; count: number };

// ---------------------------------------------------------------------------
// Journey schedule — a strongly-typed discriminated union on `frequency`.
// Every variant carries its own `time` so consumers (e.g. the Directions
// quick-fill chip) never need to branch on frequency just to read the time.
// ---------------------------------------------------------------------------

export interface OnceSchedule {
  frequency: 'once';
  date: string; // ISO yyyy-mm-dd
  time: TimePreference;
}

export interface DailySchedule {
  frequency: 'daily';
  time: TimePreference;
  end: RecurrenceEnd;
}

export interface WeekdaysSchedule {
  frequency: 'weekdays';
  time: TimePreference;
  end: RecurrenceEnd;
}

/** Covers both "Weekly" (intervalWeeks = 1) and "Every 2 weeks" (intervalWeeks = 2). */
export interface WeeklySchedule {
  frequency: 'weekly' | 'biweekly';
  intervalWeeks: number;
  days: DayOfWeek[];
  time: TimePreference;
  end: RecurrenceEnd;
}

export type MonthlyMode = 'day-of-month' | 'nth-weekday';
export type NthWeekOrdinal = 1 | 2 | 3 | 4 | -1; // -1 = last

export interface MonthlySchedule {
  frequency: 'monthly';
  monthlyMode: MonthlyMode;
  dayOfMonth?: number; // 1-31, when monthlyMode === 'day-of-month'
  nthWeekOrdinal?: NthWeekOrdinal; // when monthlyMode === 'nth-weekday'
  nthWeekDay?: DayOfWeek; // when monthlyMode === 'nth-weekday'
  intervalMonths: number; // usually 1
  time: TimePreference;
  end: RecurrenceEnd;
}

export type CustomIntervalUnit = 'days' | 'weeks' | 'months';

export interface CustomSchedule {
  frequency: 'custom';
  unit: CustomIntervalUnit;
  interval: number;
  days?: DayOfWeek[]; // only meaningful when unit === 'weeks'
  time: TimePreference;
  end: RecurrenceEnd;
}

export type JourneySchedule =
  | OnceSchedule
  | DailySchedule
  | WeekdaysSchedule
  | WeeklySchedule
  | MonthlySchedule
  | CustomSchedule;

export type ScheduleFrequency = JourneySchedule['frequency'];

// ---------------------------------------------------------------------------
// Usual route — structured transport legs. These concepts are deliberately
// named to stay compatible with a future real-routing CandidateRoute model
// (WalkingLeg / RailLeg / BusLeg / TransferLeg), so the manual route a user
// builds here can later be replaced or assisted by computed routes without a
// data migration.
// ---------------------------------------------------------------------------

export interface WalkingLeg {
  id: string;
  mode: 'walk';
  to: string; // destination/place text, e.g. "Bedok MRT"
  notes?: string;
}

export interface RailLeg {
  id: string;
  mode: 'rail';
  boardStationCode: string; // e.g. "EW5"
  boardStationName: string; // e.g. "Bedok"
  lineCode: string; // e.g. "EWL"
  lineName: string; // e.g. "East West Line"
  direction?: string; // e.g. "Towards Tuas Link"
  alightStationCode: string;
  alightStationName: string;
}

export interface BusLeg {
  id: string;
  mode: 'bus';
  boardStop: string; // bus stop name/code, free text
  serviceNumber: string; // e.g. "14"
  alightStop: string;
}

export interface TransferLeg {
  id: string;
  mode: 'transfer';
  stationName?: string; // interchange station where the transfer happens
  notes?: string;
  auto?: boolean; // true when inferred/rendered automatically, not stored
}

export type RouteLeg = WalkingLeg | RailLeg | BusLeg | TransferLeg;
export type RouteLegMode = RouteLeg['mode'];

// ---------------------------------------------------------------------------
// Saved Journey — the top-level record a user configures in the onboarding
// "Regular Routes" step or the Profile "My Journeys" section.
// ---------------------------------------------------------------------------

export interface SavedJourney {
  id: string;
  name: string; // e.g. "SGH Appointment"
  origin: string;
  destination: string;
  schedule: JourneySchedule;
  route: RouteLeg[]; // "usual route" — optional, may be empty
  monitoringEnabled: boolean; // review-step toggle; inert until proactive monitoring exists
  createdAt: string; // ISO yyyy-mm-dd, used as the recurrence anchor date
}
