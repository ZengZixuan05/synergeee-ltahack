'use client';

import { useEffect, useRef, useState } from 'react';
import { BusReferenceLayer, BusServiceReference } from '@/types/bus';

export type BusServicesStatus = 'idle' | 'loading' | 'success' | 'empty' | 'error';

interface UseBusServicesResult {
  services: BusServiceReference[];
  status: BusServicesStatus;
  errorMessage: string | null;
}

/** Fetches the full live bus-service reference layer from /api/bus/services on mount. */
export function useBusServices(): UseBusServicesResult {
  const [services, setServices] = useState<BusServiceReference[]>([]);
  const [status, setStatus] = useState<BusServicesStatus>('idle');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const requestSeq = useRef(0);

  useEffect(() => {
    const seq = ++requestSeq.current;

    const run = async () => {
      setStatus('loading');
      try {
        const response = await fetch('/api/bus/services');
        if (seq !== requestSeq.current) return;

        if (response.ok === false) {
          const body = await response.json().catch(() => null);
          setStatus('error');
          setErrorMessage(body?.message || 'Live bus service data is temporarily unavailable.');
          setServices([]);
          return;
        }

        const data = (await response.json()) as BusReferenceLayer<BusServiceReference>;
        if (seq !== requestSeq.current) return;

        setServices(data.records);
        setStatus(data.records.length > 0 ? 'success' : 'empty');
        setErrorMessage(null);
      } catch {
        if (seq !== requestSeq.current) return;
        setStatus('error');
        setErrorMessage('Could not reach live bus service data.');
        setServices([]);
      }
    };

    run();
  }, []);

  return { services, status, errorMessage };
}
