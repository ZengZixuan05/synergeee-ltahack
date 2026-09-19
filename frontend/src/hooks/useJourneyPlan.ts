'use client';

import { useCallback, useRef, useState } from 'react';
import { JourneyPlanResult } from '@/types/journeyPlan';
import { subtractMinutesFromTime } from '@/lib/time';

export type JourneyPlanStatus = 'idle' | 'loading' | 'success' | 'empty' | 'error';

export interface PlanJourneyParams {
  from: { latitude: number; longitude: number };
  to: { latitude: number; longitude: number };
  date?: string; // MM-DD-YYYY
  time?: string; // HH:mm:ss
  /**
   * When true, `time` is the desired ARRIVAL time, not departure. OneMap's
   * routing only accepts a departure time, so this does a first-pass plan to
   * estimate travel duration, then re-queries with the departure shifted
   * back by that duration so the itinerary's actual arrival lands close to
   * what was asked for, instead of naively treating the arrival time as a
   * departure time (which is what produced arrivals an hour+ later than the
   * commuter asked to arrive by).
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

function buildQuery(params: PlanJourneyParams, time: string | undefined): URLSearchParams {
  const query = new URLSearchParams();
  query.set('from', `${params.from.latitude},${params.from.longitude}`);
  query.set('to', `${params.to.latitude},${params.to.longitude}`);
  if (params.date) query.set('date', params.date);
  if (time) query.set('time', time);
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
            const adjustedDeparture = subtractMinutesFromTime(params.time, estimatedMinutes);
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
