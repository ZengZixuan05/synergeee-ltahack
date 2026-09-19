'use client';

import { useEffect, useRef, useState } from 'react';
import { BusArrivalResponse, BusLoadObservedEvent } from '@/types/bus';

export type BusArrivalStatus = 'idle' | 'loading' | 'success' | 'empty' | 'error';

interface UseBusArrivalResult {
  events: BusLoadObservedEvent[];
  status: BusArrivalStatus;
  errorMessage: string | null;
}

/**
 * Fetches live upcoming arrivals for one bus stop (optionally filtered to
 * one service) from /api/bus/arrival. Refetches whenever busStopCode or
 * serviceNo changes; pass an empty busStopCode to skip fetching.
 */
export function useBusArrival(busStopCode: string, serviceNo?: string): UseBusArrivalResult {
  const [events, setEvents] = useState<BusLoadObservedEvent[]>([]);
  const [status, setStatus] = useState<BusArrivalStatus>('idle');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const requestSeq = useRef(0);

  useEffect(() => {
    if (!busStopCode) return;

    const seq = ++requestSeq.current;

    const run = async () => {
      setStatus('loading');
      try {
        const query = new URLSearchParams({ busStopCode });
        if (serviceNo) query.set('serviceNo', serviceNo);

        const response = await fetch('/api/bus/arrival?' + query.toString());
        if (seq !== requestSeq.current) return;

        if (response.ok === false) {
          const body = await response.json().catch(() => null);
          setStatus('error');
          setErrorMessage(body?.message || 'Live bus arrival data is temporarily unavailable.');
          setEvents([]);
          return;
        }

        const data = (await response.json()) as BusArrivalResponse;
        if (seq !== requestSeq.current) return;

        setEvents(data.events);
        setStatus(data.events.length > 0 ? 'success' : 'empty');
        setErrorMessage(null);
      } catch {
        if (seq !== requestSeq.current) return;
        setStatus('error');
        setErrorMessage('Could not reach live bus arrival data.');
        setEvents([]);
      }
    };

    run();
  }, [busStopCode, serviceNo]);

  if (!busStopCode) {
    return { events: [], status: 'idle', errorMessage: null };
  }

  return { events, status, errorMessage };
}
