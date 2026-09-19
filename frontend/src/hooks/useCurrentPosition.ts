'use client';

import { useEffect, useState } from 'react';

export type CurrentPositionStatus = 'idle' | 'loading' | 'success' | 'error';

interface UseCurrentPositionResult {
  position: { latitude: number; longitude: number } | null;
  status: CurrentPositionStatus;
  requestLocation: () => void;
}

/** Requests the device's geolocation once on mount, with a manual retry. */
export function useCurrentPosition(): UseCurrentPositionResult {
  const [position, setPosition] = useState<{ latitude: number; longitude: number } | null>(null);
  const [status, setStatus] = useState<CurrentPositionStatus>('idle');
  const [reloadToken, setReloadToken] = useState(0);

  useEffect(() => {
    const run = () => {
      if (navigator.geolocation === undefined) {
        setStatus('error');
        return;
      }
      setStatus('loading');
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setPosition({ latitude: pos.coords.latitude, longitude: pos.coords.longitude });
          setStatus('success');
        },
        () => setStatus('error'),
        { enableHighAccuracy: true, timeout: 10000 }
      );
    };
    run();
  }, [reloadToken]);

  return { position, status, requestLocation: () => setReloadToken((n) => n + 1) };
}
