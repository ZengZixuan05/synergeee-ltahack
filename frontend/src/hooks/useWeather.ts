'use client';

import { useEffect, useRef, useState } from 'react';
import { WeatherForecastArea, WeatherForecastResponse } from '@/types/weather';

export type WeatherStatus = 'idle' | 'loading' | 'success' | 'empty' | 'error';

interface UseWeatherResult {
  areas: WeatherForecastArea[];
  status: WeatherStatus;
  errorMessage: string | null;
}

/** Fetches the live 2-hour weather forecast (by area) from /api/weather/forecast on mount. */
export function useWeather(): UseWeatherResult {
  const [areas, setAreas] = useState<WeatherForecastArea[]>([]);
  const [status, setStatus] = useState<WeatherStatus>('idle');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const requestSeq = useRef(0);

  useEffect(() => {
    const seq = ++requestSeq.current;

    const run = async () => {
      setStatus('loading');
      try {
        const response = await fetch('/api/weather/forecast');
        if (seq !== requestSeq.current) return;

        if (response.ok === false) {
          const body = await response.json().catch(() => null);
          setStatus('error');
          setErrorMessage(body?.message || 'Live weather data is temporarily unavailable.');
          setAreas([]);
          return;
        }

        const data = (await response.json()) as WeatherForecastResponse;
        if (seq !== requestSeq.current) return;

        setAreas(data.areas);
        setStatus(data.areas.length > 0 ? 'success' : 'empty');
        setErrorMessage(null);
      } catch {
        if (seq !== requestSeq.current) return;
        setStatus('error');
        setErrorMessage('Could not reach live weather data.');
        setAreas([]);
      }
    };

    run();
  }, []);

  return { areas, status, errorMessage };
}
