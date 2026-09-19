'use client';

import React from 'react';
import { CloudRain, Sun, Radio, WifiOff } from 'lucide-react';
import { useWeather } from '@/hooks/useWeather';

function LiveBadge() {
  return (
    <span
      role="status"
      aria-label="Live data from data.gov.sg"
      className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider rounded-md bg-emerald-100 text-emerald-900 border border-emerald-400 px-1.5 py-0.5 select-none"
    >
      <Radio className="w-3 h-3 text-emerald-700 flex-shrink-0" aria-hidden="true" />
      <span>LIVE</span>
    </span>
  );
}

export function WeatherWidget() {
  const { areas, status, errorMessage } = useWeather();

  const rainingCount = areas.filter((a) => a.isRaining).length;
  // No home-page geolocation prompt — representative area is simply the
  // first one alphabetically, consistent for a given forecast snapshot.
  const representative = [...areas].sort((a, b) => a.area.localeCompare(b.area))[0] ?? null;

  return (
    <section aria-label="Weather" className="space-y-2">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-1.5">
          {rainingCount > 0 ? (
            <CloudRain className="w-4 h-4 text-[#004b87]" aria-hidden="true" />
          ) : (
            <Sun className="w-4 h-4 text-amber-500" aria-hidden="true" />
          )}
          <h2 className="text-sm font-bold text-slate-900">Weather</h2>
        </div>
        <LiveBadge />
      </div>

      {(status === 'idle' || status === 'loading') && (
        <div className="rounded-xl border border-slate-200 bg-white p-3 text-xs text-slate-500">
          Checking live weather&hellip;
        </div>
      )}

      {status === 'error' && (
        <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 flex items-start gap-2 text-xs text-slate-600">
          <WifiOff className="w-4 h-4 text-slate-500 flex-shrink-0 mt-0.5" aria-hidden="true" />
          <span>{errorMessage || 'Live weather is unavailable right now.'}</span>
        </div>
      )}

      {status === 'empty' && (
        <div className="rounded-xl border border-slate-200 bg-white p-3 text-xs text-slate-500">
          No forecast data available right now.
        </div>
      )}

      {status === 'success' && representative && (
        <div className="rounded-xl border border-slate-200 bg-white p-3">
          <p className="text-sm font-semibold text-slate-900">
            {rainingCount > 0
              ? `Raining in ${rainingCount} of ${areas.length} areas`
              : 'No rain reported across the island right now'}
          </p>
          <p className="text-xs text-slate-500 mt-0.5">
            {representative.area}: {representative.forecast}
          </p>
        </div>
      )}
    </section>
  );
}
