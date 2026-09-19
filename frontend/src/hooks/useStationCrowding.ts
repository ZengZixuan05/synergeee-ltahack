'use client';

import { useEffect, useRef, useState } from 'react';
import { StationCrowdingObservedEvent, StationCrowdingRealTimeResponse } from '@/types/transport';

export type StationCrowdingStatus = 'idle' | 'loading' | 'success' | 'empty' | 'error';

interface UseStationCrowdingResult {
  events: StationCrowdingObservedEvent[];
  status: StationCrowdingStatus;
  errorMessage: string | null;
  fetchedAt: string | null;
  refetch: () => void;
}

/** Fetches live real-time station crowding from /api/transport/station-crowding/real-time on mount. */
export function useStationCrowding(): UseStationCrowdingResult {
  const [events, setEvents] = useState<StationCrowdingObservedEvent[]>([]);
  const [status, setStatus] = useState<StationCrowdingStatus>('idle');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [fetchedAt, setFetchedAt] = useState<string | null>(null);
  const [reloadToken, setReloadToken] = useState(0);
  const requestSeq = useRef(0);

  useEffect(() => {
    const seq = ++requestSeq.current;

    const run = async () => {
      setStatus('loading');
      try {
        const response = await fetch('/api/transport/station-crowding/real-time');
        if (seq !== requestSeq.current) return;

        if (response.ok === false) {
          const body = await response.json().catch(() => null);
          setStatus('error');
          setErrorMessage(body?.message || 'Live station crowding data is temporarily unavailable.');
          setEvents([]);
          return;
        }

        const data = (await response.json()) as StationCrowdingRealTimeResponse;
        if (seq !== requestSeq.current) return;

        setEvents(data.events);
        setFetchedAt(data.fetchedAt);
        setStatus(data.events.length > 0 ? 'success' : 'empty');
        setErrorMessage(null);
      } catch {
        if (seq !== requestSeq.current) return;
        setStatus('error');
        setErrorMessage('Could not reach live station crowding data.');
        setEvents([]);
      }
    };

    run();
  }, [reloadToken]);

  const refetch = () => setReloadToken((n) => n + 1);

  return { events, status, errorMessage, fetchedAt, refetch };
}
