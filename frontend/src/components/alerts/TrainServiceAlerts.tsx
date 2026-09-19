'use client';

import React from 'react';
import { Train, RefreshCw, Radio, WifiOff, CheckCircle2 } from 'lucide-react';
import { useTrainServiceAlerts } from '@/hooks/useTrainServiceAlerts';
import { DemoBadge } from '@/components/alerts/DemoBadge';

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

/**
 * Live train service alerts, shown on the home page as "Transport updates" —
 * this is the network-wide advisory section (see AGENTS.md: live LTA data
 * never lives behind the demo-scenario toggle, so it's kept separate from
 * the demo-only disruption fixtures used elsewhere on this page).
 */
export function TrainServiceAlerts() {
  const { events, status, errorMessage, refetch } = useTrainServiceAlerts();

  return (
    <section aria-label="Transport updates" className="space-y-2">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-1.5">
          <Train className="w-4 h-4 text-[#004b87]" aria-hidden="true" />
          <h2 className="text-sm font-bold text-slate-900">Transport updates</h2>
        </div>
        <div className="flex items-center gap-2">
          <LiveBadge />
          <button
            type="button"
            onClick={refetch}
            aria-label="Refresh transport updates"
            className="p-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 active:scale-95 transition"
          >
            <RefreshCw className={'w-3.5 h-3.5 ' + (status === 'loading' ? 'animate-spin' : '')} aria-hidden="true" />
          </button>
        </div>
      </div>

      <p className="text-xs text-slate-500 leading-normal">
        Network-wide train service advisories for Singapore public transport, from LTA DataMall.
      </p>

      {(status === 'idle' || status === 'loading') && (
        <div className="rounded-xl border border-slate-200 bg-white p-3 text-xs text-slate-500">
          Checking live train service alerts&hellip;
        </div>
      )}

      {status === 'error' && (
        <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 flex items-start gap-2 text-xs text-slate-600">
          <WifiOff className="w-4 h-4 text-slate-500 flex-shrink-0 mt-0.5" aria-hidden="true" />
          <span>{errorMessage || 'Live train service alerts are unavailable right now.'}</span>
        </div>
      )}

      {status === 'empty' && (
        <div className="rounded-xl border border-emerald-200 bg-emerald-50/70 p-3 flex items-start gap-2 text-xs text-emerald-950">
          <CheckCircle2 className="w-4 h-4 text-emerald-700 flex-shrink-0 mt-0.5" aria-hidden="true" />
          <span>No active line disruptions reported right now.</span>
        </div>
      )}

      {status === 'success' && (
        <ul className="space-y-2">
          {events.map((event) => (
            <li key={event.id} className="rounded-xl border border-slate-200 border-l-4 border-l-red-500 bg-red-50/40 p-3">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-slate-900 leading-snug">
                    {event.line ?? event.rawLine}
                    {event.direction ? ` · ${event.direction}` : ''}
                  </p>
                  {event.affectedStationCodes.length > 0 && (
                    <p className="text-xs text-slate-600 mt-0.5">
                      Affected stations: {event.affectedStationCodes.join(', ')}
                    </p>
                  )}
                  {event.freePublicBus && (
                    <p className="text-xs text-slate-600 mt-0.5">Free bus bridging: {event.freePublicBus}</p>
                  )}
                  {event.freeMrtShuttle && (
                    <p className="text-xs text-slate-600 mt-0.5">
                      Free shuttle: {event.freeMrtShuttle}
                      {event.mrtShuttleDirection ? ` (${event.mrtShuttleDirection})` : ''}
                    </p>
                  )}
                </div>
                {event.provenance === 'DEMO' && <DemoBadge size="sm" />}
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
