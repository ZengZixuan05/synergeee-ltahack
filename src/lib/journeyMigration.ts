import { DayOfWeek } from '@/types';
import { JourneySchedule, RouteLeg, SavedJourney, TimePreferenceType } from '@/types/journey';
import { formatISODate } from '@/lib/schedule';

/**
 * Shape of a route saved by the earlier (pre-refinement) onboarding flow:
 * a single flat object with weekday booleans and free-text "legs" instead of
 * a structured schedule/route. Detected purely structurally so this file has
 * no compile-time dependency on the removed `RegularRoute` type.
 */
interface LegacyRegularRouteLike {
  id?: unknown;
  name?: unknown;
  origin?: unknown;
  destination?: unknown;
  timeType?: unknown;
  time?: unknown;
  days?: unknown;
  legs?: unknown;
}

/** True when `raw` looks like a pre-refinement saved route (no `schedule` field yet). */
export function isLegacySavedJourney(raw: unknown): raw is LegacyRegularRouteLike {
  if (!raw || typeof raw !== 'object') return false;
  if ('schedule' in raw) return false;
  return 'timeType' in raw || 'days' in raw || 'legs' in raw;
}

function randomId(): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return crypto.randomUUID();
  }
  return `id-${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

/**
 * Converts a legacy flat route (day booleans + free-text leg descriptions)
 * into the new SavedJourney shape (structured schedule + structured route
 * legs). Free-text leg descriptions can't be safely reconstructed into
 * validated RailLeg/BusLeg data, so non-walk legs are preserved verbatim as
 * a note on a transfer-style leg rather than dropped.
 */
export function migrateLegacySavedJourney(raw: LegacyRegularRouteLike): SavedJourney {
  const days: DayOfWeek[] = Array.isArray(raw.days) ? (raw.days as DayOfWeek[]) : [];
  const timeType: TimePreferenceType = raw.timeType === 'arrive-by' ? 'arrive-by' : 'depart-at';
  const time = typeof raw.time === 'string' && raw.time ? raw.time : '08:00';

  const schedule: JourneySchedule =
    days.length > 0
      ? {
          frequency: 'weekly',
          intervalWeeks: 1,
          days,
          time: { type: timeType, value: time },
          end: { kind: 'never' },
        }
      : {
          // No weekday information was ever captured for this legacy route;
          // fall back to a one-time schedule dated today rather than guessing.
          frequency: 'once',
          date: formatISODate(new Date()),
          time: { type: timeType, value: time },
        };

  const legacyLegs = Array.isArray(raw.legs) ? raw.legs : [];
  const route: RouteLeg[] = legacyLegs.map((leg): RouteLeg => {
    const legRecord = leg as { id?: unknown; mode?: unknown; description?: unknown };
    const description = typeof legRecord.description === 'string' ? legRecord.description : '';
    const id = typeof legRecord.id === 'string' ? legRecord.id : randomId();

    if (legRecord.mode === 'walk') {
      return { id, mode: 'walk', to: description || 'Unknown destination' };
    }
    return { id, mode: 'transfer', notes: description || undefined };
  });

  return {
    id: typeof raw.id === 'string' ? raw.id : randomId(),
    name: typeof raw.name === 'string' && raw.name ? raw.name : 'Saved journey',
    origin: typeof raw.origin === 'string' ? raw.origin : '',
    destination: typeof raw.destination === 'string' ? raw.destination : '',
    schedule,
    route,
    monitoringEnabled: true,
    createdAt: formatISODate(new Date()),
  };
}

/** Migrates a raw array of Firestore-stored routes, upgrading any legacy entries in place. */
export function migrateSavedJourneys(raw: unknown[]): SavedJourney[] {
  return raw.map((entry) =>
    isLegacySavedJourney(entry) ? migrateLegacySavedJourney(entry) : (entry as SavedJourney)
  );
}
