'use client';

import { useEffect, useRef, useState } from 'react';
import { BusReferenceLayer, BusStopReference } from '@/types/bus';

export type BusStopsStatus = 'idle' | 'loading' | 'success' | 'empty' | 'error';

interface UseBusStopsResult {
  stops: BusStopReference[];
  status: BusStopsStatus;
  errorMessage: string | null;
}

/** Fetches the full live bus-stop reference layer from /api/bus/stops on mount. */
export function useBusStops(): UseBusStopsResult {
  const [stops, setStops] = useState<BusStopReference[]>([]);
  const [status, setStatus] = useState<BusStopsStatus>('idle');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const requestSeq = useRef(0);

  useEffect(() => {
    const seq = ++requestSeq.current;

    const run = async () => {
      setStatus('loading');
      try {
        const response = await fetch('/api/bus/stops');
        if (seq !== requestSeq.current) return;

        if (response.ok === false) {
          const body = await response.json().catch(() => null);
          setStatus('error');
          setErrorMessage(body?.message || 'Live bus stop data is temporarily unavailable.');
          setStops([]);
          return;
        }

        const data = (await response.json()) as BusReferenceLayer<BusStopReference>;
        if (seq !== requestSeq.current) return;

        setStops(data.records);
        setStatus(data.records.length > 0 ? 'success' : 'empty');
        setErrorMessage(null);
      } catch {
        if (seq !== requestSeq.current) return;
        setStatus('error');
        setErrorMessage('Could not reach live bus stop data.');
        setStops([]);
      }
    };

    run();
  }, []);

  return { stops, status, errorMessage };
}
