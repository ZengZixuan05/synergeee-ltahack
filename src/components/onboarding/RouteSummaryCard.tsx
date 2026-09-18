'use client';

import React from 'react';
import { Pencil, Trash2, ArrowRight } from 'lucide-react';
import { DAYS_OF_WEEK, RegularRoute } from '@/types';
import { formatTimeForDisplay } from '@/lib/utils';

interface RouteSummaryCardProps {
  route: RegularRoute;
  onEdit: () => void;
  onRemove: () => void;
}

const WEEKDAY_VALUES = ['mon', 'tue', 'wed', 'thu', 'fri'];

function describeDays(days: RegularRoute['days']): string {
  if (days.length === 0) return 'No days set';
  if (days.length === 7) return 'Every day';
  if (days.length === 5 && WEEKDAY_VALUES.every((d) => days.includes(d as never))) {
    return 'Mon–Fri';
  }
  return days
    .map((d) => DAYS_OF_WEEK.find((day) => day.value === d)?.label ?? d)
    .join(', ');
}

export function RouteSummaryCard({ route, onEdit, onRemove }: RouteSummaryCardProps) {
  return (
    <div className="p-3.5 rounded-xl border border-slate-200 bg-white shadow-xs">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="text-sm font-bold text-slate-900 truncate">{route.name}</p>
          <div className="flex items-center gap-1.5 text-xs text-slate-500 font-medium mt-0.5 min-w-0">
            <span className="truncate">{route.origin}</span>
            <ArrowRight className="w-3 h-3 shrink-0" />
            <span className="truncate">{route.destination}</span>
          </div>
        </div>
        <div className="flex items-center gap-1 shrink-0">
          <button
            type="button"
            onClick={onEdit}
            aria-label={`Edit ${route.name}`}
            className="p-1.5 rounded-lg text-slate-400 hover:text-[#004b87] hover:bg-slate-50"
          >
            <Pencil className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={onRemove}
            aria-label={`Remove ${route.name}`}
            className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-slate-50"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
      <div className="flex items-center gap-2 mt-2 pt-2 border-t border-slate-50 text-[11px] font-bold">
        <span className="px-2 py-0.5 rounded-full bg-[#f0f5fa] text-[#004b87]">
          {describeDays(route.days)}
        </span>
        {route.time && (
          <span className="px-2 py-0.5 rounded-full bg-slate-50 text-slate-600">
            {route.timeType === 'arrive-by' ? 'Arrive by' : 'Depart'} {formatTimeForDisplay(route.time)}
          </span>
        )}
      </div>
    </div>
  );
}
