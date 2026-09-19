'use client';

import React from 'react';
import { Radio, WifiOff, CheckCircle2, Bus } from 'lucide-react';
import { useBusArrival } from '@/hooks/useBusArrival';
import { BusLoadObservedEvent } from '@/types/bus';

const LOAD_LABEL: Record<string, string> = {
  SEATS_AVAILABLE: 'Seats available',
  STANDING_AVAILABLE: 'Standing room',
  LIMITED_STANDING: 'Limited standing',
  UNKNOWN: 'Load unknown',
};

const LOAD_COLOR: Record<string, string> = {
  SEATS_AVAILABLE: 'text-emerald-900 bg-emerald-100 border-emerald-300',
  STANDING_AVAILABLE: 'text-amber-900 bg-amber-100 border-amber-300',
  LIMITED_STANDING: 'text-red-900 bg-red-100 border-red-300',
  UNKNOWN: 'text-slate-600 bg-slate-100 border-slate-300',
};

function minutesUntil(iso: string | undefined): number | null {
  if (!iso) return null;
  const diffMs = new Date(iso).getTime() - Date.now();
  return Math.max(0, Math.round(diffMs / 60000));
}

function groupByService(events: BusLoadObservedEvent[]): { serviceNo: string; operator: string; arrivals: BusLoadObservedEvent[] }[] {
  const groups = new Map<string, { serviceNo: string; operator: string; arrivals: BusLoadObservedEvent[] }>();
  for (const event of events) {
    const existing = groups.get(event.serviceNo);
    if (existing) {
      existing.arrivals.push(event);
    } else {
      groups.set(event.serviceNo, { serviceNo: event.serviceNo, operator: event.operator, arrivals: [event] });
    }
  }
  return [...groups.values()].sort((a, b) => a.serviceNo.localeCompare(b.serviceNo, undefined, { numeric: true }));
}

interface BusStopArrivalsProps {
  busStopCode: string;
}

/** Live upcoming arrivals for every service serving one bus stop. */
export function BusStopArrivals({ busStopCode }: BusStopArrivalsProps) {
  const { events, status, errorMessage } = useBusArrival(busStopCode);

  if (status === 'idle' || status === 'loading') {
    return <div className="rounded-xl border border-slate-200 bg-white p-3 text-xs text-slate-500">Checking live arrivals&hellip;</div>;
  }

  if (status === 'error') {
    return (
      <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 flex items-start gap-2 text-xs text-slate-600">
        <WifiOff className="w-4 h-4 text-slate-500 flex-shrink-0 mt-0.5" aria-hidden="true" />
        <span>{errorMessage || 'Live bus arrivals are unavailable right now.'}</span>
      </div>
    );
  }

  if (status === 'empty') {
    return (
      <div className="rounded-xl border border-slate-200 bg-white p-3 flex items-start gap-2 text-xs text-slate-500">
        <CheckCircle2 className="w-4 h-4 text-slate-400 flex-shrink-0 mt-0.5" aria-hidden="true" />
        <span>No buses reported for this stop right now.</span>
      </div>
    );
  }

  const groups = groupByService(events);

  return (
    <ul className="space-y-2">
      {groups.map((group) => (
        <li key={group.serviceNo} className="rounded-xl border border-slate-200 bg-white p-3">
          <div className="flex items-center gap-2 mb-2">
            <span className="inline-flex items-center gap-1 text-xs font-black text-white bg-[#004b87] rounded px-2 py-1 shrink-0">
              <Bus className="w-3.5 h-3.5" aria-hidden="true" />
              {group.serviceNo}
            </span>
            <span className="text-[11px] text-slate-500 font-medium">{group.operator}</span>
          </div>
          <div className="flex items-center gap-1.5 flex-wrap">
            {group.arrivals.slice(0, 3).map((event, index) => {
              const mins = minutesUntil(event.estimatedArrival);
              return (
                <span
                  key={index}
                  className={`inline-flex items-center gap-1 text-[11px] font-semibold rounded px-1.5 py-0.5 border ${LOAD_COLOR[event.load]}`}
                >
                  <Radio className="w-3 h-3" aria-hidden="true" />
                  {mins === null ? 'Arriving' : mins === 0 ? 'Now' : `${mins} min`} · {LOAD_LABEL[event.load]}
                </span>
              );
            })}
          </div>
        </li>
      ))}
    </ul>
  );
}
