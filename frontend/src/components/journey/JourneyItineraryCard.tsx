'use client';

import React from 'react';
import { Footprints, Train, Bus, AlertTriangle, ArrowUpDown, Users, Sparkles } from 'lucide-react';
import { DurationRangeSeconds, JourneyItinerary, JourneyLeg } from '@/types/journeyPlan';
import { Card } from '@/components/ui/Card';
import { cn } from '@/lib/utils';
import { BusLegArrival } from './BusLegArrival';

function formatClock(iso: string): string {
  return new Date(iso).toLocaleTimeString('en-SG', { hour: 'numeric', minute: '2-digit' });
}

function formatDuration(seconds: number): string {
  const minutes = Math.round(seconds / 60);
  if (minutes < 60) return `${minutes} min`;
  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;
  return rest === 0 ? `${hours} hr` : `${hours} hr ${rest} min`;
}

/** "(54–61 min)" — a heuristic uncertainty band, not a measured one; see backend/src/services/journeyPlanning/uncertainty.ts. Omitted when the band collapses to a single minute (e.g. very short walk-only legs). */
function formatDurationRange(range: DurationRangeSeconds): string | null {
  const minMinutes = Math.floor(range.min / 60);
  const maxMinutes = Math.ceil(range.max / 60);
  if (minMinutes >= maxMinutes) return null;
  return `${minMinutes}–${maxMinutes} min`;
}

const CROWD_LABEL: Record<string, string> = { LOW: 'Low crowding', MODERATE: 'Moderate crowding', HIGH: 'High crowding', UNKNOWN: 'Crowding unknown' };
const CROWD_COLOR: Record<string, string> = {
  LOW: 'text-emerald-800 bg-emerald-100 border-emerald-300',
  MODERATE: 'text-amber-800 bg-amber-100 border-amber-300',
  HIGH: 'text-red-800 bg-red-100 border-red-300',
  UNKNOWN: 'text-slate-600 bg-slate-100 border-slate-300',
};

function LegRow({ leg }: { leg: JourneyLeg }) {
  if (leg.mode === 'WALK') {
    return (
      <div className="flex items-start gap-2.5 py-2">
        <Footprints className="w-4 h-4 text-slate-500 shrink-0 mt-0.5" aria-hidden="true" />
        <div className="min-w-0">
          <p className="text-sm font-semibold text-slate-900">
            Walk to {leg.toName} <span className="text-slate-400 font-normal">· {formatDuration(leg.durationSeconds)}</span>
          </p>
        </div>
      </div>
    );
  }

  if (leg.mode === 'RAIL') {
    return (
      <div className="flex items-start gap-2.5 py-2">
        <Train className="w-4 h-4 text-[#009645] shrink-0 mt-0.5" aria-hidden="true" />
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-slate-900">
            {leg.line ?? leg.rawLine}: {leg.fromStationName} <span className="text-slate-400">&rarr;</span> {leg.toStationName}
          </p>
          <p className="text-xs text-slate-500 mt-0.5">
            {formatClock(leg.startTime)}&ndash;{formatClock(leg.endTime)} · {formatDuration(leg.durationSeconds)}
          </p>
          {leg.live && (
            <div className="flex items-center gap-1.5 flex-wrap mt-1">
              {leg.live.disrupted && (
                <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-red-800 bg-red-100 border border-red-300 rounded px-1.5 py-0.5">
                  <AlertTriangle className="w-3 h-3" aria-hidden="true" />
                  {leg.live.disruptionMessage || 'Service disrupted'}
                </span>
              )}
              {leg.live.liftWarnings.map((w, i) => (
                <span
                  key={i}
                  className="inline-flex items-center gap-1 text-[11px] font-semibold text-amber-800 bg-amber-100 border border-amber-300 rounded px-1.5 py-0.5"
                >
                  <ArrowUpDown className="w-3 h-3" aria-hidden="true" />
                  Lift down at {w.stationName || w.stationCode}
                </span>
              ))}
              {leg.live.crowding.map((c, i) => (
                <span
                  key={i}
                  className={cn(
                    'inline-flex items-center gap-1 text-[11px] font-semibold rounded px-1.5 py-0.5 border',
                    CROWD_COLOR[c.crowdLevel]
                  )}
                >
                  <Users className="w-3 h-3" aria-hidden="true" />
                  {c.stationCode}: {CROWD_LABEL[c.crowdLevel]}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  }

  // BUS
  return (
    <div className="flex items-start gap-2.5 py-2">
      <Bus className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" aria-hidden="true" />
      <div className="min-w-0 flex-1">
        <p className="text-sm font-semibold text-slate-900">
          Bus {leg.serviceNo}: {leg.fromStopName} <span className="text-slate-400">&rarr;</span> {leg.toStopName}
        </p>
        <p className="text-xs text-slate-500 mt-0.5">
          {formatClock(leg.startTime)}&ndash;{formatClock(leg.endTime)} · {formatDuration(leg.durationSeconds)}
        </p>
        <BusLegArrival busStopCode={leg.fromStopCode} serviceNo={leg.serviceNo} />
      </div>
    </div>
  );
}

interface JourneyItineraryCardProps {
  itinerary: JourneyItinerary;
  isRecommended?: boolean;
  recommendationReason?: string;
}

export function JourneyItineraryCard({ itinerary, isRecommended, recommendationReason }: JourneyItineraryCardProps) {
  return (
    <Card variant={isRecommended ? 'highlight' : 'default'} className="p-4 bg-white space-y-1">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-lg font-black text-slate-900">
            {formatDuration(itinerary.durationSeconds)}
            {formatDurationRange(itinerary.durationRangeSeconds) && (
              <span className="text-sm font-semibold text-slate-400 ml-1">
                ({formatDurationRange(itinerary.durationRangeSeconds)})
              </span>
            )}
          </p>
          <p className="text-xs text-slate-500 font-medium">
            {formatClock(itinerary.startTime)}&ndash;{formatClock(itinerary.endTime)} · {itinerary.transfers} transfer
            {itinerary.transfers === 1 ? '' : 's'}
            {itinerary.fare ? ` · $${itinerary.fare}` : ''}
          </p>
        </div>
        {isRecommended && itinerary.source === 'BUS_FALLBACK' && (
          <span className="inline-flex items-center gap-1 text-[11px] font-bold uppercase tracking-wide text-amber-900 bg-amber-100 border border-amber-300 rounded-full px-2 py-1 shrink-0">
            <Bus className="w-3 h-3" aria-hidden="true" />
            Bus alternative
          </span>
        )}
        {isRecommended && itinerary.source !== 'BUS_FALLBACK' && (
          <span className="inline-flex items-center gap-1 text-[11px] font-bold uppercase tracking-wide text-[#004b87] bg-[#f0f5fa] border border-[#b8d2eb] rounded-full px-2 py-1 shrink-0">
            <Sparkles className="w-3 h-3" aria-hidden="true" />
            Recommended
          </span>
        )}
      </div>

      {isRecommended && recommendationReason && (
        <p className="text-xs text-[#004b87]/90 font-medium pb-1">{recommendationReason}</p>
      )}

      <div className="divide-y divide-slate-100 pt-1">
        {itinerary.legs.map((leg, index) => (
          <LegRow key={index} leg={leg} />
        ))}
      </div>
    </Card>
  );
}
