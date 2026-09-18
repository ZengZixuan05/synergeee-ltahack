'use client';

import React from 'react';
import { Footprints, Train, Bus, ArrowUpDown, Pencil, Trash2, ChevronUp, ChevronDown, MapPin } from 'lucide-react';
import { RouteLeg } from '@/types/journey';
import { isAutoTransfer } from '@/lib/routeLegs';

interface RouteTimelineProps {
  origin: string;
  destination: string;
  legs: RouteLeg[];
  onEdit: (leg: RouteLeg) => void;
  onRemove: (id: string) => void;
  onMoveUp: (id: string) => void;
  onMoveDown: (id: string) => void;
}

export function legIcon(leg: RouteLeg) {
  switch (leg.mode) {
    case 'walk':
      return <Footprints className="w-4 h-4 text-[#00847f]" />;
    case 'rail':
      return <Train className="w-4 h-4 text-[#009645]" />;
    case 'bus':
      return <Bus className="w-4 h-4 text-amber-600" />;
    case 'transfer':
      return <ArrowUpDown className="w-4 h-4 text-[#004b87]" />;
  }
}

export function legTitle(leg: RouteLeg): string {
  switch (leg.mode) {
    case 'walk':
      return `Walk${leg.to ? ` to ${leg.to}` : ''}`;
    case 'rail':
      return leg.lineName || 'MRT / LRT';
    case 'bus':
      return leg.serviceNumber ? `Bus ${leg.serviceNumber}` : 'Bus';
    case 'transfer':
      return 'Transfer';
  }
}

function legSubtitle(leg: RouteLeg): string | undefined {
  switch (leg.mode) {
    case 'walk':
      return leg.notes;
    case 'rail':
      return leg.direction;
    case 'bus':
      return [leg.boardStop, leg.alightStop].filter(Boolean).join(' → ') || undefined;
    case 'transfer':
      return leg.notes ?? leg.stationName;
  }
}

function StopMarker({ label, dotClassName }: { label: string; dotClassName: string }) {
  return (
    <div className="flex items-center gap-2.5">
      <span className={`w-2.5 h-2.5 rounded-full shrink-0 ${dotClassName}`} />
      <span className="text-sm font-bold text-slate-900 truncate">{label}</span>
    </div>
  );
}

export function RouteTimeline({ origin, destination, legs, onEdit, onRemove, onMoveUp, onMoveDown }: RouteTimelineProps) {
  if (legs.length === 0) {
    return (
      <div className="p-4 rounded-xl border border-dashed border-slate-300 text-center">
        <MapPin className="w-5 h-5 text-slate-300 mx-auto mb-1" />
        <p className="text-xs text-slate-500 font-medium">No steps added yet</p>
      </div>
    );
  }

  return (
    <div className="space-y-0">
      <StopMarker label={origin || 'Starting point'} dotClassName="bg-slate-400" />
      {legs.map((leg, index) => {
        const prev = index > 0 ? legs[index - 1] : null;
        const showAutoTransfer = prev ? isAutoTransfer(prev, leg) : false;
        return (
          <React.Fragment key={leg.id}>
            <div className="pl-[5px] border-l-2 border-dashed border-slate-200 ml-[5px]">
              {showAutoTransfer && (
                <div className="flex items-center gap-2.5 py-1.5 -ml-[5px] pl-[5px]">
                  <span className="w-2.5 h-2.5 shrink-0" />
                  <span className="text-[11px] font-bold text-[#004b87] uppercase tracking-wider flex items-center gap-1">
                    <ArrowUpDown className="w-3 h-3" /> Transfer
                  </span>
                </div>
              )}
              <div className="flex items-start gap-2.5 py-2 -ml-[5px] pl-[5px]">
                <div className="p-1.5 rounded-lg bg-slate-50 border border-slate-100 shrink-0 mt-0.5">{legIcon(leg)}</div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-slate-900">{legTitle(leg)}</p>
                  {legSubtitle(leg) && <p className="text-xs text-slate-500">{legSubtitle(leg)}</p>}
                </div>
                <div className="flex items-center gap-0.5 shrink-0">
                  <button
                    type="button"
                    onClick={() => onMoveUp(leg.id)}
                    disabled={index === 0}
                    aria-label="Move step up"
                    className="p-1.5 rounded-lg text-slate-400 hover:text-[#004b87] hover:bg-slate-50 disabled:opacity-30 disabled:pointer-events-none"
                  >
                    <ChevronUp className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => onMoveDown(leg.id)}
                    disabled={index === legs.length - 1}
                    aria-label="Move step down"
                    className="p-1.5 rounded-lg text-slate-400 hover:text-[#004b87] hover:bg-slate-50 disabled:opacity-30 disabled:pointer-events-none"
                  >
                    <ChevronDown className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => onEdit(leg)}
                    aria-label="Edit step"
                    className="p-1.5 rounded-lg text-slate-400 hover:text-[#004b87] hover:bg-slate-50"
                  >
                    <Pencil className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => onRemove(leg.id)}
                    aria-label="Remove step"
                    className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-slate-50"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          </React.Fragment>
        );
      })}
      <div className="pl-[5px] border-l-2 border-dashed border-transparent ml-[5px] pt-1">
        <StopMarker label={destination || 'Destination'} dotClassName="bg-[#004b87]" />
      </div>
    </div>
  );
}
