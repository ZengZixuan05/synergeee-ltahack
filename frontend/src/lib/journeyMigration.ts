import { CrowdingLevel, DayOfWeek, Journey, RouteMetric, RouteOption } from '@/types';
import { JourneySchedule, RouteLeg, SavedJourney, TimePreferenceType } from '@/types/journey';
import { describeRecurrence, formatISODate } from '@/lib/schedule';
import { formatTimeForDisplay } from '@/lib/utils';
import { SAMPLE_AFFECTED_ROUTE, SAMPLE_RECOMMENDED_ROUTE } from '@/fixtures/routes';
import { JourneyItinerary } from '@/types/journeyPlan';
import type { SavedJourneyRouteStatus } from '@/hooks/useSavedJourneyRoute';

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

function withLocations(route: RouteOption, saved: SavedJourney): RouteOption {
  return {
    ...route,
    departureLocation: saved.origin || route.departureLocation,
    arrivalLocation: saved.destination || route.arrivalLocation,
  };
}

function formatClock(iso: string): string {
  return new Date(iso).toLocaleTimeString('en-SG', { hour: 'numeric', minute: '2-digit' });
}

const CROWD_LEVEL_TO_CROWDING: Record<string, CrowdingLevel> = {
  LOW: 'low',
  MODERATE: 'moderate',
  HIGH: 'high',
  UNKNOWN: 'low',
};

/** Worst crowd level reported across any RAIL leg's live station crowding, or 'low' when none is known. */
function worstCrowdingFromItinerary(itinerary: JourneyItinerary): CrowdingLevel {
  let worst: CrowdingLevel = 'low';
  for (const leg of itinerary.legs) {
    if (leg.mode !== 'RAIL' || !leg.live) continue;
    for (const snapshot of leg.live.crowding) {
      const level = CROWD_LEVEL_TO_CROWDING[snapshot.crowdLevel] ?? 'low';
      if (level === 'high') return 'high';
      if (level === 'moderate') worst = 'moderate';
    }
  }
  return worst;
}

/** Builds a RouteOption from a real, live-computed itinerary for this saved journey. */
function routeOptionFromItinerary(saved: SavedJourney, itinerary: JourneyItinerary): RouteOption {
  const metrics: RouteMetric = {
    durationMinutes: Math.round(itinerary.durationSeconds / 60),
    walkingDistanceMeters: Math.round(itinerary.walkDistanceMeters),
    transfersCount: itinerary.transfers,
    crowding: worstCrowdingFromItinerary(itinerary),
    isStepFree: !itinerary.hasLiftWarning,
    hasWorkingLifts: !itinerary.hasLiftWarning,
    isMostlySheltered: true,
  };

  return {
    id: `${saved.id}-live`,
    title: 'Your saved route',
    badgeType: 'usual',
    metrics,
    departureTime: formatClock(itinerary.startTime),
    arrivalTime: formatClock(itinerary.endTime),
    departureLocation: saved.origin,
    arrivalLocation: saved.destination,
    steps: [],
  };
}

/** Builds a RouteOption purely from what the commuter actually keyed in, when no live route could be computed yet. */
function routeOptionFromScheduleOnly(saved: SavedJourney): RouteOption {
  const { type, value } = saved.schedule.time;
  const chosenTime = formatTimeForDisplay(value);

  const metrics: RouteMetric = {
    durationMinutes: 0,
    walkingDistanceMeters: 0,
    transfersCount: 0,
    crowding: 'low',
    isStepFree: true,
    hasWorkingLifts: true,
    isMostlySheltered: true,
  };

  return {
    id: `${saved.id}-pending`,
    title: 'Your saved route',
    badgeType: 'usual',
    metrics,
    departureTime: type === 'depart-at' ? chosenTime : 'Not yet calculated',
    arrivalTime: type === 'arrive-by' ? chosenTime : 'Not yet calculated',
    departureLocation: saved.origin,
    arrivalLocation: saved.destination,
    steps: [],
  };
}

/**
 * Converts a user's SavedJourney (from onboarding/profile) into the richer
 * Journey shape the home screen's JourneyCard renders. When a live itinerary
 * has been computed for this journey's actual origin/destination (see
 * useSavedJourneyRoute), that real route detail is used; otherwise the
 * displayed departure/arrival time comes straight from the schedule the
 * commuter chose, rather than an unrelated placeholder route.
 */
export function savedJourneyToJourney(
  saved: SavedJourney,
  opts: { isDisrupted: boolean; itinerary?: JourneyItinerary | null; routeStatus?: SavedJourneyRouteStatus }
): Journey {
  const { isDisrupted, itinerary, routeStatus } = opts;

  const normalRoute =
    routeStatus === 'success' && itinerary ? routeOptionFromItinerary(saved, itinerary) : routeOptionFromScheduleOnly(saved);

  return {
    id: saved.id,
    title: saved.name,
    recurrence: describeRecurrence(saved.schedule),
    targetArrivalTime: formatTimeForDisplay(saved.schedule.time.value),
    originName: saved.origin,
    originPlace: saved.originPlace ?? null,
    destinationName: saved.destination,
    destinationPlace: saved.destinationPlace ?? null,
    scheduleTimeType: saved.schedule.time.type,
    scheduleTimeValue: saved.schedule.time.value,
    isAffected: isDisrupted,
    ...(isDisrupted && {
      affectedReason: 'The lift used by your usual route is unavailable.',
      affectedDetail: 'Outram Park MRT Exit A lift is out of service for unscheduled repair.',
      recommendedAction: 'Recommended: Use the accessible alternative route via Exit B and leave 7 minutes earlier.',
    }),
    normalRoute,
    affectedRoute: withLocations(SAMPLE_AFFECTED_ROUTE, saved),
    recommendedRoute: withLocations(SAMPLE_RECOMMENDED_ROUTE, saved),
  };
}
