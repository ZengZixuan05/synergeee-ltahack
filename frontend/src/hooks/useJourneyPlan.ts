'use client';

import { useCallback, useRef, useState } from 'react';
import { JourneyPlanResult } from '@/types/journeyPlan';
import { ARRIVE_BY_BUFFER_MINUTES, subtractMinutesFromTime } from '@/lib/time';

export type JourneyPlanStatus = 'idle' | 'loading' | 'success' | 'empty' | 'error';

export interface PlanJourneyParams {
  from: { latitude: number; longitude: number };
  to: { latitude: number; longitude: number };
  date?: string; // MM-DD-YYYY
  time?: string; // HH:mm:ss
  /** The commuter's transport-mode preference, converted via journeyPreferences.ts. Omit for the default multi-modal search. */
  mode?: 'TRANSIT' | 'BUS' | 'RAIL';
  /** The commuter's max-continuous-walk preference in meters, converted via journeyPreferences.ts. */
  maxWalkDistance?: number;
  /**
   * When true, `time` is the desired ARRIVAL time, not departure. OneMap's
   * routing only accepts a departure time, so this does a first-pass plan to
   * estimate travel duration, then re-queries with the departure shifted
   * back by that duration (plus ARRIVE_BY_BUFFER_MINUTES of slack) so the
   * itinerary's actual arrival lands a few minutes before what was asked
   * for, instead of naively treating the arrival time as a departure time
   * (which is what produced arrivals an hour+ later than the commuter asked
   * to arrive by) or cutting it exactly to the deadline with no margin for
   * real-world delay.
   */
  arriveBy?: boolean;
}

interface UseJourneyPlanResult {
  result: JourneyPlanResult | null;
  status: JourneyPlanStatus;
  errorMessage: string | null;
  plan: (params: PlanJourneyParams) => void;
}

async function fetchPlanResult(query: URLSearchParams): Promise<{ ok: true; data: JourneyPlanResult } | { ok: false; message: string }> {
  const response = await fetch('/api/journey/plan?' + query.toString());
  if (response.ok === false) {
    const body = await response.json().catch(() => null);
    return { ok: false, message: body?.message || 'Journey planning is temporarily unavailable.' };
  }
  return { ok: true, data: (await response.json()) as JourneyPlanResult };
}

// OneMap's `pt` routing hard-caps numItineraries at 3 (confirmed live:
// asking for more returns HTTP 400 "numItineraries must be between 1 and 3
// (inclusive)."). Requesting the max it actually allows.
const REQUESTED_ITINERARY_COUNT = 3;

function buildQuery(params: PlanJourneyParams, time: string | undefined): URLSearchParams {
  const query = new URLSearchParams();
  query.set('from', `${params.from.latitude},${params.from.longitude}`);
  query.set('to', `${params.to.latitude},${params.to.longitude}`);
  if (params.date) query.set('date', params.date);
  if (time) query.set('time', time);
  if (params.mode) query.set('mode', params.mode);
  if (params.maxWalkDistance !== undefined) query.set('maxWalkDistance', String(params.maxWalkDistance));
  query.set('numItineraries', String(REQUESTED_ITINERARY_COUNT));
  return query;
}

/**
 * Fetch-on-demand journey planning against /api/journey/plan. Unlike
 * useLiftMaintenance (fetch on mount), this fires only when `plan()` is
 * called, but keeps the same out-of-order-response guard.
 */
export function useJourneyPlan(): UseJourneyPlanResult {
  const [result, setResult] = useState<JourneyPlanResult | null>(null);
  const [status, setStatus] = useState<JourneyPlanStatus>('idle');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const requestSeq = useRef(0);

  const plan = useCallback((params: PlanJourneyParams) => {
    const seq = ++requestSeq.current;

    const run = async () => {
      setStatus('loading');
      setErrorMessage(null);

      try {
        let outcome = await fetchPlanResult(buildQuery(params, params.time));
        if (seq !== requestSeq.current) return;

        if (outcome.ok && params.arriveBy && params.time) {
          const firstBest = outcome.data.itineraries[outcome.data.recommendation?.index ?? 0];
          if (firstBest) {
            const estimatedMinutes = Math.round(firstBest.durationSeconds / 60);
            const adjustedDeparture = subtractMinutesFromTime(params.time, estimatedMinutes + ARRIVE_BY_BUFFER_MINUTES);
            const refined = await fetchPlanResult(buildQuery(params, adjustedDeparture));
            if (seq !== requestSeq.current) return;
            if (refined.ok && refined.data.itineraries.length > 0) {
              outcome = refined;
            }
          }
        }

        if (!outcome.ok) {
          setStatus('error');
          setErrorMessage(outcome.message);
          setResult(null);
          return;
        }

        // A LIVE_ERROR (e.g. an upstream OneMap failure) still comes back as
        // an HTTP 200 with an empty itineraries array — treating it as
        // 'empty' would show "no route found" for what is actually a
        // temporary backend/upstream problem, hiding the real cause.
        if (outcome.data.status === 'LIVE_ERROR') {
          setStatus('error');
          setErrorMessage(outcome.data.errorMessage || 'Journey planning is temporarily unavailable.');
          setResult(outcome.data);
          return;
        }

        setResult(outcome.data);
        setStatus(outcome.data.itineraries.length > 0 ? 'success' : 'empty');
        setErrorMessage(outcome.data.errorMessage ?? null);
      } catch {
        if (seq !== requestSeq.current) return;
        setStatus('error');
        setErrorMessage('Could not reach journey planning.');
        setResult(null);
      }
    };

    run();
  }, []);

  return { result, status, errorMessage, plan };
}
