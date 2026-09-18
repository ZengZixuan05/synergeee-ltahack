'use client';

import React from 'react';
import { RegularRouteTimeType } from '@/types';

interface RouteTimeInputProps {
  timeType: RegularRouteTimeType;
  time: string;
  onTimeTypeChange: (timeType: RegularRouteTimeType) => void;
  onTimeChange: (time: string) => void;
}

export function RouteTimeInput({
  timeType,
  time,
  onTimeTypeChange,
  onTimeChange,
}: RouteTimeInputProps) {
  return (
    <div className="space-y-2">
      <label className="text-xs font-bold uppercase tracking-wider text-slate-700 block">
        Time
      </label>
      <div className="flex gap-2">
        <div
          role="radiogroup"
          aria-label="Departure or arrival timing"
          className="grid grid-cols-2 gap-1.5 p-1 bg-slate-100 rounded-xl flex-1"
        >
          <button
            type="button"
            role="radio"
            aria-checked={timeType === 'depart-at'}
            onClick={() => onTimeTypeChange('depart-at')}
            className={`py-1.5 text-xs font-bold rounded-lg transition-all min-h-[38px] ${
              timeType === 'depart-at'
                ? 'bg-white text-[#004b87] shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Depart at
          </button>
          <button
            type="button"
            role="radio"
            aria-checked={timeType === 'arrive-by'}
            onClick={() => onTimeTypeChange('arrive-by')}
            className={`py-1.5 text-xs font-bold rounded-lg transition-all min-h-[38px] ${
              timeType === 'arrive-by'
                ? 'bg-white text-[#004b87] shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Arrive by
          </button>
        </div>
        <input
          type="time"
          value={time}
          onChange={(e) => onTimeChange(e.target.value)}
          aria-label="Time"
          className="w-28 px-2.5 py-1.5 rounded-xl border border-slate-200 bg-slate-50 text-sm font-semibold text-slate-900 outline-none focus:border-[#004b87] focus:ring-1 focus:ring-[#004b87]"
        />
      </div>
    </div>
  );
}
