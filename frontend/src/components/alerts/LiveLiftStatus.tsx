'use client';

import React from 'react';
import { ArrowUpDown, CheckCircle2, RefreshCw, Radio, WifiOff } from 'lucide-react';
import { useLiftMaintenance } from '@/hooks/useLiftMaintenance';

function LiveBadge() {
  return (
    <span
      role="status"
      aria-label="Live data from LTA DataMall"
      className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider rounded-md bg-emerald-100 text-emerald-900 border border-emerald-400 px-1.5 py-0.5 select-none"
    >
      <Radio className="w-3 h-3 text-emerald-700 flex-shrink-0" aria-hidden="true" />
      <span>LIVE · LTA</span>
    </span>
  );
}

export function LiveLiftStatus() {
  const { events, status, errorMessage, refetch } = useLiftMaintenance();

  return (
    <section aria-label="Live lift status" className="space-y-2">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-1.5">
          <ArrowUpDown className="w-4 h-4 text-[#004b87]" aria-hidden="true" />
          <h2 className="text-sm font-bold text-slate-900">Lift availability</h2>
        </div>
        <div className="flex items-center gap-2">
          <LiveBadge />
          <button
            type="button"
            onClick={refetch}
            aria-label="Refresh live lift status"
            className="p-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 active:scale-95 transition"
          >
            <RefreshCw className={'w-3.5 h-3.5 ' + (status === 'loading' ? 'animate-spin' : '')} aria-hidden="true" />
          </button>
        </div>
      </div>

      {(status === 'idle' || status === 'loading') && (
        <div className="rounded-xl border border-slate-200 bg-white p-3 text-xs text-slate-500">
          Checking live lift status…
        </div>
      )}

      {status === 'error' && (
        <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 flex items-start gap-2 text-xs text-slate-600">
          <WifiOff className="w-4 h-4 text-slate-500 flex-shrink-0 mt-0.5" aria-hidden="true" />
          <span>{errorMessage || 'Live lift status is unavailable right now.'}</span>
        </div>
      )}

      {status === 'empty' && (
        <div className="rounded-xl border border-emerald-200 bg-emerald-50/70 p-3 flex items-start gap-2 text-xs text-emerald-950">
          <CheckCircle2 className="w-4 h-4 text-emerald-700 flex-shrink-0 mt-0.5" aria-hidden="true" />
          <span>No lift maintenance reported on the network right now.</span>
        </div>
      )}

      {status === 'success' && (
        <ul className="space-y-2">
          {events.map((event) => (
            <li
              key={event.id}
              className="rounded-xl border border-slate-200 border-l-4 border-l-amber-500 bg-amber-50/40 p-3"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-slate-900 leading-snug">
                    {event.station.stationName || event.station.stationCode}
                    {event.station.line ? ' (' + event.station.line + ')' : ''}
                  </p>
                  <p className="text-xs text-slate-600 mt-0.5">
                    {event.liftDescription || 'Lift maintenance in progress'}
                  </p>
                </div>
                <span className="text-[10px] uppercase font-bold tracking-wider text-amber-900 bg-amber-100 border border-amber-300 px-1.5 py-0.5 rounded flex-shrink-0">
                  Lift maintenance
                </span>
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
