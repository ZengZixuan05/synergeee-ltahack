import { CrowdingLevel, DayOfWeek, Journey, JourneyStep, RouteMetric, RouteOption } from '@/types';
import { JourneySchedule, RouteLeg, SavedJourney, TimePreferenceType } from '@/types/journey';
import { describeRecurrence, formatISODate } from '@/lib/schedule';
import { formatTimeForDisplay } from '@/lib/utils';
import { JourneyItinerary, JourneyLeg, JourneyPlanResult } from '@/types/journeyPlan';
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

/** "54–61 min", from a heuristic durationRangeSeconds band — see backend/src/services/journeyPlanning/uncertainty.ts for how it's computed. */
function formatDurationRangeMinutes(range: { min: number; max: number }): string {
  const minMinutes = Math.floor(range.min / 60);
  const maxMinutes = Math.ceil(range.max / 60);
  if (minMinutes >= maxMinutes) return `${maxMinutes} min`;
  return `${minMinutes}–${maxMinutes} min`;
}

/** Builds a RouteOption from a real, live-computed itinerary for this saved journey. */
function routeOptionFromItinerary(
  saved: SavedJourney,
  itinerary: JourneyItinerary,
  variant: { idSuffix: string; title: string; badgeType: RouteOption['badgeType']; isRecommendedAlternative?: boolean }
): RouteOption {
  const metrics: RouteMetric = {
    durationMinutes: Math.round(itinerary.durationSeconds / 60),
    durationRange: formatDurationRangeMinutes(itinerary.durationRangeSeconds),
    walkingDistanceMeters: Math.round(itinerary.walkDistanceMeters),
    transfersCount: itinerary.transfers,
    crowding: worstCrowdingFromItinerary(itinerary),
    isStepFree: !itinerary.hasLiftWarning,
    hasWorkingLifts: !itinerary.hasLiftWarning,
    isMostlySheltered: !itinerary.hasRainExposure,
  };

  return {
    id: `${saved.id}-${variant.idSuffix}`,
    title: variant.title,
    badgeType: variant.badgeType,
    isRecommendedAlternative: variant.isRecommendedAlternative,
    metrics,
    departureTime: formatClock(itinerary.startTime),
    arrivalTime: formatClock(itinerary.endTime),
    departureLocation: saved.origin,
    arrivalLocation: saved.destination,
    affectedReason: itinerary.hasDisruption || itinerary.hasLiftWarning ? describeItineraryIssue(itinerary) : undefined,
    steps: journeyStepsFromItinerary(itinerary),
  };
}

function legLabel(leg: JourneyLeg): { instruction: string; lineName?: string; boardAt?: string } {
  switch (leg.mode) {
    case 'WALK':
      return { instruction: `Walk to ${leg.toName}` };
    case 'RAIL':
      return { instruction: `Take the train to ${leg.toStationName}`, lineName: leg.line ?? leg.rawLine, boardAt: leg.fromStationName };
    case 'BUS':
      return { instruction: `Take bus ${leg.serviceNo} to ${leg.toStopName}`, boardAt: leg.fromStopName };
  }
}

/**
 * One JourneyStep per leg of a live itinerary, for the Guided Journey screen.
 * This is coarser than a hand-authored script — live data has no per-exit
 * lift metadata, only the station-level `liftWarnings`/`disrupted` flags the
 * backend already cross-referenced — but every instruction here traces back
 * to a real leg instead of a fixture.
 */
export function journeyStepsFromItinerary(itinerary: JourneyItinerary): JourneyStep[] {
  const totalSteps = itinerary.legs.length;
  return itinerary.legs.map((leg, index) => {
    const { instruction, lineName, boardAt } = legLabel(leg);
    const liftWarning = leg.mode === 'RAIL' ? leg.live?.liftWarnings[0] : undefined;
    const disruptionMessage = leg.mode === 'RAIL' ? leg.live?.disruptionMessage : undefined;

    return {
      id: `${itinerary.startTime}-leg-${index}`,
      stepNumber: index + 1,
      totalSteps,
      instruction,
      distanceMeters: leg.mode === 'WALK' ? Math.round(leg.distanceMeters) : undefined,
      estimatedMinutes: Math.round(leg.durationSeconds / 60),
      mode: leg.mode === 'RAIL' ? 'rail' : leg.mode === 'BUS' ? 'bus' : 'walk',
      crowding: leg.mode === 'RAIL' ? worstCrowdingFromItinerary({ ...itinerary, legs: [leg] }) : undefined,
      lineName,
      boardAt,
      warningAlert: disruptionMessage
        ? { type: 'critical', title: 'Service disruption', message: disruptionMessage }
        : liftWarning
          ? {
              type: 'warning',
              title: 'Lift under maintenance',
              message: liftWarning.liftDescription
                ? `${liftWarning.liftDescription} at ${liftWarning.stationName ?? liftWarning.stationCode} is down.`
                : `A lift at ${liftWarning.stationName ?? liftWarning.stationCode} is down.`,
            }
          : undefined,
    };
  });
}

/** Plain-language description of what's actually wrong with an itinerary, built from the live rail-leg data the backend already enriched it with — never a guess. */
function describeItineraryIssue(itinerary: JourneyItinerary): string {
  const messages: string[] = [];
  for (const leg of itinerary.legs) {
    if (leg.mode !== 'RAIL' || !leg.live) continue;
    if (leg.live.disrupted && leg.live.disruptionMessage) {
      messages.push(leg.live.disruptionMessage);
    }
    for (const warning of leg.live.liftWarnings) {
      const station = warning.stationName || warning.stationCode;
      messages.push(warning.liftDescription ? `${warning.liftDescription} at ${station} is down` : `A lift at ${station} is down`);
    }
  }
  return messages.length > 0 ? messages.join('. ') + '.' : 'A live service disruption or lift outage is affecting this route right now.';
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
 * Journey shape the home screen's JourneyCard renders. When a live plan has
 * been computed for this journey's actual origin/destination (see
 * useSavedJourneyRoute), "affected" is driven by real live data: if the
 * usual/fastest itinerary currently has a lift outage or service disruption
 * on it, the journey is marked affected and — when the backend found a
 * clean alternative among OneMap's other itineraries — that alternative
 * becomes `recommendedRoute`, ready to route the commuter around the actual
 * problem. Nothing here is simulated; without a computed plan yet, the
 * displayed departure/arrival time comes straight from the schedule the
 * commuter chose instead of a placeholder route.
 */
export function savedJourneyToJourney(
  saved: SavedJourney,
  opts: {
    planResult?: JourneyPlanResult | null;
    routeStatus?: SavedJourneyRouteStatus;
    /** When false, a lift-only issue is not treated as "affected" — the commuter said they don't need that guarantee. A real service disruption is always affected regardless, since that's safety-relevant rather than a comfort preference. Defaults to true. */
    requireWorkingLifts?: boolean;
  }
): Journey {
  const { planResult, routeStatus, requireWorkingLifts = true } = opts;

  const base = {
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
  };

  if (routeStatus === 'success' && planResult && planResult.itineraries.length > 0) {
    const fastest = planResult.itineraries[0]!;
    const recommendedIndex = planResult.recommendation?.index ?? 0;
    // A bus-fallback itinerary (see backend journeyPlanning/service.ts) has
    // no RAIL legs, so hasLiftWarning/hasDisruption are trivially false —
    // "affected" only ever describes an itinerary that actually tried rail.
    const isAffected =
      fastest.source !== 'BUS_FALLBACK' &&
      (fastest.hasDisruption || (requireWorkingLifts && fastest.hasLiftWarning));
    const hasAlternative = isAffected && recommendedIndex !== 0;

    const normalRoute = routeOptionFromItinerary(saved, fastest, {
      idSuffix: 'usual',
      title: fastest.source === 'BUS_FALLBACK' ? 'Bus route' : 'Your usual route',
      badgeType: 'usual',
    });

    const recommendedRoute = hasAlternative
      ? (() => {
          const alternative = planResult.itineraries[recommendedIndex]!;
          const isBusAlternative = alternative.source === 'BUS_FALLBACK';
          return routeOptionFromItinerary(saved, alternative, {
            idSuffix: 'alternative',
            title: isBusAlternative ? 'Bus alternative' : 'Recommended alternative',
            badgeType: 'recommended',
            isRecommendedAlternative: true,
          });
        })()
      : undefined;

    return {
      ...base,
      isAffected,
      ...(isAffected && {
        affectedReason: describeItineraryIssue(fastest),
        recommendedAction: hasAlternative
          ? planResult.recommendation?.reason
          : 'Every option currently has this issue — no alternative avoids it right now.',
      }),
      normalRoute,
      recommendedRoute,
    };
  }

  return {
    ...base,
    isAffected: false,
    normalRoute: routeOptionFromScheduleOnly(saved),
  };
}
