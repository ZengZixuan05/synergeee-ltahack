'use client';

import React from 'react';
import { DAYS_OF_WEEK, DayOfWeek } from '@/types';

const WEEKDAYS: DayOfWeek[] = ['mon', 'tue', 'wed', 'thu', 'fri'];

interface DaySelectorProps {
  selectedDays: DayOfWeek[];
  onChange: (days: DayOfWeek[]) => void;
}

export function DaySelector({ selectedDays, onChange }: DaySelectorProps) {
  const toggleDay = (day: DayOfWeek) => {
    if (selectedDays.includes(day)) {
      onChange(selectedDays.filter((d) => d !== day));
    } else {
      onChange([...selectedDays, day]);
    }
  };

  const isWeekdaysSelected =
    WEEKDAYS.every((d) => selectedDays.includes(d)) && selectedDays.length === WEEKDAYS.length;

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <label className="text-xs font-bold uppercase tracking-wider text-slate-700 block">
          Days
        </label>
        <button
          type="button"
          onClick={() => onChange(isWeekdaysSelected ? [] : [...WEEKDAYS])}
          className={`text-[11px] font-bold uppercase tracking-wider ${
            isWeekdaysSelected ? 'text-[#004b87]' : 'text-slate-400 hover:text-slate-600'
          }`}
        >
          Weekdays
        </button>
      </div>
      <div className="grid grid-cols-7 gap-1.5">
        {DAYS_OF_WEEK.map((day) => {
          const checked = selectedDays.includes(day.value);
          return (
            <button
              key={day.value}
              type="button"
              aria-pressed={checked}
              onClick={() => toggleDay(day.value)}
              className={`p-2 rounded-lg border text-center transition-all min-h-[44px] ${
                checked
                  ? 'border-[#004b87] bg-[#f0f5fa] text-[#004b87] font-bold shadow-xs'
                  : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300'
              }`}
            >
              <p className="text-[11px] font-bold">{day.label}</p>
            </button>
          );
        })}
      </div>
    </div>
  );
}
