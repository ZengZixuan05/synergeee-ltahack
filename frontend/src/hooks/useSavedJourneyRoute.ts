'use client';

import { useEffect, useRef, useState } from 'react';
import { Place } from '@/types/place';
import { JourneyPlanResult, JourneyItinerary } from '@/types/journeyPlan';
import { SavedJourney } from '@/types/journey';
import { subtractMinutesFromTime } from '@/lib/time';

export type SavedJourneyRouteStatus = 'idle' | 'loading' | 'success' | 'unavailable';

interface UseSavedJourneyRouteResult {
  itinerary: JourneyItinerary | null;
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

async function fetchPlan(
  from: Place,
  to: Place,
  time: string | undefined,
  signal: AbortSignal
): Promise<JourneyPlanResult | null> {
  const query = new URLSearchParams();
  query.set('from', `${from.latitude},${from.longitude}`);
  query.set('to', `${to.latitude},${to.longitude}`);
  if (time) query.set('time', time);

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
 * back by that duration so the resulting itinerary's arrival genuinely lands
 * close to what the commuter asked for, rather than showing a naive
 * "depart at the arrival time" result whose arrival doesn't match the label.
 */
export function useSavedJourneyRoute(saved: SavedJourney | null): UseSavedJourneyRouteResult {
  const [itinerary, setItinerary] = useState<JourneyItinerary | null>(null);
  const [status, setStatus] = useState<SavedJourneyRouteStatus>('idle');
  const requestSeq = useRef(0);

  const origin = saved?.origin ?? '';
  const destination = saved?.destination ?? '';
  const originPlace = saved?.originPlace;
  const destinationPlace = saved?.destinationPlace;
  const timeType = saved?.schedule.time.type;
  const timeValue = saved?.schedule.time.value;

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
          setItinerary(null);
          return;
        }

        const requestedTime = timeValue ? `${timeValue}:00` : undefined;
        let result = await fetchPlan(resolvedOrigin, resolvedDestination, requestedTime, controller.signal);
        if (seq !== requestSeq.current) return;

        if (timeType === 'arrive-by' && timeValue) {
          const firstPass = bestItinerary(result);
          if (firstPass) {
            const estimatedMinutes = Math.round(firstPass.durationSeconds / 60);
            const adjustedDeparture = subtractMinutesFromTime(timeValue, estimatedMinutes);
            const refined = await fetchPlan(resolvedOrigin, resolvedDestination, `${adjustedDeparture}:00`, controller.signal);
            if (seq !== requestSeq.current) return;
            if (refined && bestItinerary(refined)) {
              result = refined;
            }
          }
        }

        const best = bestItinerary(result);
        setItinerary(best);
        setStatus(best ? 'success' : 'unavailable');
      } catch (error) {
        if ((error as { name?: string })?.name === 'AbortError') return;
        if (seq !== requestSeq.current) return;
        setStatus('unavailable');
        setItinerary(null);
      }
    };

    run();
    return () => controller.abort();
  }, [origin, destination, originPlace, destinationPlace, timeType, timeValue]);

  if (!origin || !destination) {
    return { itinerary: null, status: 'unavailable' };
  }

  return { itinerary, status };
}
