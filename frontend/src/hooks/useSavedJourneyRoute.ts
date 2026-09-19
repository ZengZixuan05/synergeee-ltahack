'use client';

import { useEffect, useRef, useState } from 'react';
import { Place } from '@/types/place';
import { JourneyPlanResult, JourneyItinerary } from '@/types/journeyPlan';
import { SavedJourney } from '@/types/journey';
import { CommuterPreferences } from '@/types';
import { ARRIVE_BY_BUFFER_MINUTES, subtractMinutesFromTime } from '@/lib/time';
import { transportModesToOneMapMode, maxContinuousWalkToMeters } from '@/lib/journeyPreferences';

export type SavedJourneyRouteStatus = 'idle' | 'loading' | 'success' | 'unavailable';

interface UseSavedJourneyRouteResult {
  /** The full plan (every itinerary OneMap returned, plus which one the backend recommends) — not just one itinerary, so a caller can tell whether the usual/fastest route is currently affected and what the clean alternative is. */
  planResult: JourneyPlanResult | null;
  status: SavedJourneyRouteStatus;
}

async function geocodeFirst(query: string, signal: AbortSignal): Promise<Place | null> {
  const trimmed = query.trim();
  if (trimmed.length < 2) return null;

  const response = await fetch(`/api/places/search?q=${encodeURIComponent(trimmed)}`, { signal });
  if (!response.ok) return null;

  const data = (await response.json()) as { results: Place[] };
  return data.results[0] ?? null;
}

/**
 * Resolves a saved journey endpoint to coordinates. Prefers the geocoded
 * Place captured when the commuter picked it from search results in the
 * journey editor — the exact location, not a guess. Falls back to
 * geocoding the free-text label (best-effort, first match) only for older
 * saved journeys created before the editor captured coordinates.
 */
async function resolveEndpoint(label: string, place: Place | null | undefined, signal: AbortSignal): Promise<Place | null> {
  if (place) return place;
  return geocodeFirst(label, signal);
}

// OneMap's `pt` routing hard-caps numItineraries at 3 (confirmed live:
// asking for more returns HTTP 400 "numItineraries must be between 1 and 3
// (inclusive)."). Requesting the max it actually allows.
const REQUESTED_ITINERARY_COUNT = 3;

interface FetchPlanPreferences {
  mode: 'TRANSIT' | 'BUS' | 'RAIL';
  maxWalkDistance: number | undefined;
}

async function fetchPlan(
  from: Place,
  to: Place,
  time: string | undefined,
  preferences: FetchPlanPreferences,
  signal: AbortSignal
): Promise<JourneyPlanResult | null> {
  const query = new URLSearchParams();
  query.set('from', `${from.latitude},${from.longitude}`);
  query.set('to', `${to.latitude},${to.longitude}`);
  if (time) query.set('time', time);
  if (preferences.mode !== 'TRANSIT') query.set('mode', preferences.mode);
  if (preferences.maxWalkDistance !== undefined) query.set('maxWalkDistance', String(preferences.maxWalkDistance));
  query.set('numItineraries', String(REQUESTED_ITINERARY_COUNT));

  const response = await fetch('/api/journey/plan?' + query.toString(), { signal });
  if (!response.ok) return null;
  return (await response.json()) as JourneyPlanResult;
}

function bestItinerary(result: JourneyPlanResult | null): JourneyItinerary | null {
  if (!result) return null;
  return result.itineraries[result.recommendation?.index ?? 0] ?? null;
}

/**
 * Computes a real live route for a saved journey (from onboarding/profile) by
 * resolving its origin/destination to coordinates and calling the same
 * /api/journey/plan endpoint the Directions page uses. This replaces the old
 * placeholder RouteOption fixtures with an itinerary that actually reflects
 * the origin, destination and schedule the commuter keyed in.
 *
 * OneMap's routing only accepts a departure time — there's no native
 * "arrive by" query. For an arrive-by schedule this does a first pass to
 * estimate travel duration, then re-queries with a departure time shifted
 * back by that duration plus ARRIVE_BY_BUFFER_MINUTES of slack, so the
 * resulting itinerary's arrival genuinely lands a few minutes before what
 * the commuter asked for, rather than showing a naive "depart at the
 * arrival time" result whose arrival doesn't match the label, or cutting it
 * exactly to the deadline with no margin for real-world delay.
 */
export function useSavedJourneyRoute(saved: SavedJourney | null, preferences: CommuterPreferences): UseSavedJourneyRouteResult {
  const [planResult, setPlanResult] = useState<JourneyPlanResult | null>(null);
  const [status, setStatus] = useState<SavedJourneyRouteStatus>('idle');
  const requestSeq = useRef(0);

  const origin = saved?.origin ?? '';
  const destination = saved?.destination ?? '';
  const originPlace = saved?.originPlace;
  const destinationPlace = saved?.destinationPlace;
  const timeType = saved?.schedule.time.type;
  const timeValue = saved?.schedule.time.value;
  const mode = transportModesToOneMapMode(preferences.transportModes);
  const maxWalkDistance = maxContinuousWalkToMeters(preferences.maxContinuousWalk);

  useEffect(() => {
    if (!origin || !destination) return;

    const seq = ++requestSeq.current;
    const controller = new AbortController();

    const run = async () => {
      setStatus('loading');
      try {
        const [resolvedOrigin, resolvedDestination] = await Promise.all([
          resolveEndpoint(origin, originPlace, controller.signal),
          resolveEndpoint(destination, destinationPlace, controller.signal),
        ]);
        if (seq !== requestSeq.current) return;

        if (!resolvedOrigin || !resolvedDestination) {
          setStatus('unavailable');
          setPlanResult(null);
          return;
        }

        const planPrefs: FetchPlanPreferences = { mode, maxWalkDistance };
        const requestedTime = timeValue ? `${timeValue}:00` : undefined;
        let result = await fetchPlan(resolvedOrigin, resolvedDestination, requestedTime, planPrefs, controller.signal);
        if (seq !== requestSeq.current) return;

        if (timeType === 'arrive-by' && timeValue) {
          const firstPass = bestItinerary(result);
          if (firstPass) {
            const estimatedMinutes = Math.round(firstPass.durationSeconds / 60);
            const adjustedDeparture = subtractMinutesFromTime(timeValue, estimatedMinutes + ARRIVE_BY_BUFFER_MINUTES);
            const refined = await fetchPlan(
              resolvedOrigin,
              resolvedDestination,
              `${adjustedDeparture}:00`,
              planPrefs,
              controller.signal
            );
            if (seq !== requestSeq.current) return;
            if (refined && bestItinerary(refined)) {
              result = refined;
            }
          }
        }

        const hasItineraries = result !== null && result.itineraries.length > 0;
        setPlanResult(result);
        setStatus(hasItineraries ? 'success' : 'unavailable');
      } catch (error) {
        if ((error as { name?: string })?.name === 'AbortError') return;
        if (seq !== requestSeq.current) return;
        setStatus('unavailable');
        setPlanResult(null);
      }
    };

    run();
    return () => controller.abort();
  }, [origin, destination, originPlace, destinationPlace, timeType, timeValue, mode, maxWalkDistance]);

  if (!origin || !destination) {
    return { planResult: null, status: 'unavailable' };
  }

  return { planResult, status };
}
