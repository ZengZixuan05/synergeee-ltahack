'use client';

import { useEffect, useRef, useState } from 'react';
import { FacilitiesResponse, LiftMaintenanceEvent } from '@/types/transport';

export type LiftMaintenanceStatus = 'idle' | 'loading' | 'success' | 'empty' | 'error';

interface UseLiftMaintenanceResult {
  events: LiftMaintenanceEvent[];
  status: LiftMaintenanceStatus;
  errorMessage: string | null;
  fetchedAt: string | null;
  refetch: () => void;
}

/**
 * Fetches live lift-maintenance events from /api/transport/facilities on mount.
 * Ignores out-of-order responses so a rapid refetch never shows stale data.
 */
export function useLiftMaintenance(): UseLiftMaintenanceResult {
  const [events, setEvents] = useState<LiftMaintenanceEvent[]>([]);
  const [status, setStatus] = useState<LiftMaintenanceStatus>('idle');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [fetchedAt, setFetchedAt] = useState<string | null>(null);
  const [reloadToken, setReloadToken] = useState(0);
  const requestSeq = useRef(0);

  useEffect(() => {
    const seq = ++requestSeq.current;

    const run = async () => {
      setStatus('loading');
      try {
        const response = await fetch('/api/transport/facilities');
        if (seq !== requestSeq.current) return;

        if (response.ok === false) {
          const body = await response.json().catch(() => null);
          setStatus('error');
          setErrorMessage(body?.message || 'Live transport data is temporarily unavailable.');
          setEvents([]);
          return;
        }

        const data = (await response.json()) as FacilitiesResponse;
        if (seq !== requestSeq.current) return;

        setEvents(data.events);
        setFetchedAt(data.fetchedAt);
        setStatus(data.events.length > 0 ? 'success' : 'empty');
        setErrorMessage(null);
      } catch {
        if (seq !== requestSeq.current) return;
        setStatus('error');
        setErrorMessage('Could not reach live transport data.');
        setEvents([]);
      }
    };

    run();
  }, [reloadToken]);

  const refetch = () => setReloadToken((n) => n + 1);

  return { events, status, errorMessage, fetchedAt, refetch };
}
