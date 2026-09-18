'use client';

import React from 'react';
import { Pencil, Trash2, ArrowRight, Route as RouteIcon } from 'lucide-react';
import { SavedJourney } from '@/types/journey';
import { describeSchedule } from '@/lib/schedule';

interface JourneySummaryCardProps {
  journey: SavedJourney;
  onEdit: () => void;
  onRemove: () => void;
}

export function JourneySummaryCard({ journey, onEdit, onRemove }: JourneySummaryCardProps) {
  return (
    <div className="p-3.5 rounded-xl border border-slate-200 bg-white shadow-xs">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="text-sm font-bold text-slate-900 truncate">{journey.name}</p>
          <div className="flex items-center gap-1.5 text-xs text-slate-500 font-medium mt-0.5 min-w-0">
            <span className="truncate">{journey.origin}</span>
            <ArrowRight className="w-3 h-3 shrink-0" />
            <span className="truncate">{journey.destination}</span>
          </div>
        </div>
        <div className="flex items-center gap-1 shrink-0">
          <button
            type="button"
            onClick={onEdit}
            aria-label={`Edit ${journey.name}`}
            className="p-1.5 rounded-lg text-slate-400 hover:text-[#004b87] hover:bg-slate-50"
          >
            <Pencil className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={onRemove}
            aria-label={`Remove ${journey.name}`}
            className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-slate-50"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
      <div className="flex flex-wrap items-center gap-1.5 mt-2 pt-2 border-t border-slate-50 text-[11px] font-bold">
        <span className="px-2 py-0.5 rounded-full bg-[#f0f5fa] text-[#004b87]">
          {describeSchedule(journey.schedule)}
        </span>
        {journey.route.length > 0 && (
          <span className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-slate-50 text-slate-600">
            <RouteIcon className="w-3 h-3" /> {journey.route.length} step{journey.route.length === 1 ? '' : 's'}
          </span>
        )}
      </div>
    </div>
  );
}
