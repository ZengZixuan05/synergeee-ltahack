'use client';

import { useEffect, useRef, useState } from 'react';
import { TrainServiceAlertEvent, TrainServiceAlertsResponse } from '@/types/transport';

export type TrainServiceAlertsStatus = 'idle' | 'loading' | 'success' | 'empty' | 'error';

interface UseTrainServiceAlertsResult {
  events: TrainServiceAlertEvent[];
  status: TrainServiceAlertsStatus;
  errorMessage: string | null;
  fetchedAt: string | null;
  refetch: () => void;
}

/** Fetches live train service alerts from /api/transport/train-service-alerts on mount. */
export function useTrainServiceAlerts(): UseTrainServiceAlertsResult {
  const [events, setEvents] = useState<TrainServiceAlertEvent[]>([]);
  const [status, setStatus] = useState<TrainServiceAlertsStatus>('idle');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [fetchedAt, setFetchedAt] = useState<string | null>(null);
  const [reloadToken, setReloadToken] = useState(0);
  const requestSeq = useRef(0);

  useEffect(() => {
    const seq = ++requestSeq.current;

    const run = async () => {
      setStatus('loading');
      try {
        const response = await fetch('/api/transport/train-service-alerts');
        if (seq !== requestSeq.current) return;

        if (response.ok === false) {
          const body = await response.json().catch(() => null);
          setStatus('error');
          setErrorMessage(body?.message || 'Live train service alerts are temporarily unavailable.');
          setEvents([]);
          return;
        }

        const data = (await response.json()) as TrainServiceAlertsResponse;
        if (seq !== requestSeq.current) return;

        setEvents(data.events);
        setFetchedAt(data.fetchedAt);
        setStatus(data.events.length > 0 ? 'success' : 'empty');
        setErrorMessage(null);
      } catch {
        if (seq !== requestSeq.current) return;
        setStatus('error');
        setErrorMessage('Could not reach live train service alerts.');
        setEvents([]);
      }
    };

    run();
  }, [reloadToken]);

  const refetch = () => setReloadToken((n) => n + 1);

  return { events, status, errorMessage, fetchedAt, refetch };
}
