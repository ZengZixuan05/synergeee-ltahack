'use client';

import React from 'react';
import { Radio } from 'lucide-react';
import { useBusArrival } from '@/hooks/useBusArrival';

const LOAD_LABEL: Record<string, string> = {
  SEATS_AVAILABLE: 'Seats available',
  STANDING_AVAILABLE: 'Standing room',
  LIMITED_STANDING: 'Limited standing',
  UNKNOWN: 'Load unknown',
};

function minutesUntil(iso: string | undefined): number | null {
  if (!iso) return null;
  const diffMs = new Date(iso).getTime() - Date.now();
  return Math.max(0, Math.round(diffMs / 60000));
}

interface BusLegArrivalProps {
  busStopCode: string;
  serviceNo: string;
}

/**
 * Live upcoming arrivals for one BUS leg's boarding stop — the one
 * enrichment /api/journey/plan deliberately skips (per-stop query, too
 * costly to call for every leg of every itinerary), fetched here only for
 * the itinerary actually being viewed.
 */
export function BusLegArrival({ busStopCode, serviceNo }: BusLegArrivalProps) {
  const { events, status, errorMessage } = useBusArrival(busStopCode, serviceNo);

  if (status === 'idle' || status === 'loading') {
    return <p className="text-[11px] text-slate-400 mt-1">Checking live arrival…</p>;
  }

  if (status === 'error') {
    return <p className="text-[11px] text-slate-400 mt-1">{errorMessage || 'Live arrival unavailable.'}</p>;
  }

  if (status === 'empty') {
    return <p className="text-[11px] text-slate-400 mt-1">No live arrival reported for this service right now.</p>;
  }

  const upcoming = events.slice(0, 2);

  return (
    <div className="flex items-center gap-1.5 mt-1 flex-wrap">
      <Radio className="w-3 h-3 text-emerald-700 shrink-0" aria-hidden="true" />
      {upcoming.map((event, index) => {
        const mins = minutesUntil(event.estimatedArrival);
        return (
          <span
            key={index}
            className="text-[11px] font-semibold text-emerald-900 bg-emerald-100 border border-emerald-300 rounded px-1.5 py-0.5"
          >
            {mins === null ? 'Arriving' : mins === 0 ? 'Arriving now' : `${mins} min`} · {LOAD_LABEL[event.load]}
          </span>
        );
      })}
    </div>
  );
}
