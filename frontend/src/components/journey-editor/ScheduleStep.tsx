'use client';

import React from 'react';
import { Calendar, Repeat } from 'lucide-react';
import {
  JourneySchedule,
  RecurrenceEnd,
  TimePreference,
  TimePreferenceType,
  MonthlyMode,
  NthWeekOrdinal,
  ScheduleFrequency,
} from '@/types/journey';
import { DAYS_OF_WEEK, DayOfWeek } from '@/types';
import { describeSchedule, formatISODate } from '@/lib/schedule';
import { DaySelector } from './DaySelector';

interface ScheduleStepProps {
  schedule: JourneySchedule;
  onChange: (schedule: JourneySchedule) => void;
}

const todayISO = () => formatISODate(new Date());

function defaultForFrequency(frequency: ScheduleFrequency, time: TimePreference): JourneySchedule {
  switch (frequency) {
    case 'once':
      return { frequency: 'once', date: todayISO(), time };
    case 'daily':
      return { frequency: 'daily', time, end: { kind: 'never' } };
    case 'weekdays':
      return { frequency: 'weekdays', time, end: { kind: 'never' } };
    case 'weekly':
      return { frequency: 'weekly', intervalWeeks: 1, days: [], time, end: { kind: 'never' } };
    case 'biweekly':
      return { frequency: 'biweekly', intervalWeeks: 2, days: [], time, end: { kind: 'never' } };
    case 'monthly':
      return {
        frequency: 'monthly', monthlyMode: 'day-of-month', dayOfMonth: 1, intervalMonths: 1, time, end: { kind: 'never' },
      };
    case 'custom':
    default:
      return { frequency: 'custom', unit: 'weeks', interval: 3, days: [], time, end: { kind: 'never' } };
  }
}

const REPEAT_OPTIONS: { value: ScheduleFrequency; label: string }[] = [
  { value: 'daily', label: 'Daily' },
  { value: 'weekdays', label: 'Weekdays' },
  { value: 'weekly', label: 'Weekly' },
  { value: 'biweekly', label: 'Every 2 weeks' },
  { value: 'monthly', label: 'Monthly' },
  { value: 'custom', label: 'Custom' },
];

const ORDINAL_OPTIONS: { value: NthWeekOrdinal; label: string }[] = [
  { value: 1, label: 'First' },
  { value: 2, label: 'Second' },
  { value: 3, label: 'Third' },
  { value: 4, label: 'Fourth' },
  { value: -1, label: 'Last' },
];

function SegmentedChoice<T extends string>({
  options,
  value,
  onChange,
  ariaLabel,
}: {
  options: { value: T; label: string }[];
  value: T;
  onChange: (v: T) => void;
  ariaLabel: string;
}) {
  return (
    <div role="radiogroup" aria-label={ariaLabel} className="grid gap-1.5 p-1 bg-slate-100 rounded-xl" style={{ gridTemplateColumns: `repeat(${options.length}, minmax(0, 1fr))` }}>
      {options.map((opt) => (
        <button
          key={opt.value}
          type="button"
          role="radio"
          aria-checked={value === opt.value}
          onClick={() => onChange(opt.value)}
          className={`py-1.5 px-1 text-xs font-bold rounded-lg transition-all min-h-[38px] ${
            value === opt.value ? 'bg-white text-[#004b87] shadow-xs' : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
}

function TimePreferenceFields({
  time,
  onChange,
}: {
  time: TimePreference;
  onChange: (time: TimePreference) => void;
}) {
  return (
    <div className="space-y-2">
      <label className="text-xs font-bold uppercase tracking-wider text-slate-700 block">
        I want to
      </label>
      <div className="flex gap-2">
        <div className="flex-1">
          <SegmentedChoice<TimePreferenceType>
            ariaLabel="Depart at or arrive by"
            options={[{ value: 'depart-at', label: 'Depart at' }, { value: 'arrive-by', label: 'Arrive by' }]}
            value={time.type}
            onChange={(type) => onChange({ ...time, type })}
          />
        </div>
        <input
          type="time"
          value={time.value}
          onChange={(e) => onChange({ ...time, value: e.target.value })}
          aria-label="Time"
          className="w-28 px-2.5 py-1.5 rounded-xl border border-slate-200 bg-slate-50 text-sm font-semibold text-slate-900 outline-none focus:border-[#004b87] focus:ring-1 focus:ring-[#004b87]"
        />
      </div>
    </div>
  );
}

function RecurrenceEndFields({ end, onChange }: { end: RecurrenceEnd; onChange: (end: RecurrenceEnd) => void }) {
  return (
    <div className="space-y-2">
      <label className="text-xs font-bold uppercase tracking-wider text-slate-700 block">Ends</label>
      <SegmentedChoice<RecurrenceEnd['kind']>
        ariaLabel="Recurrence end condition"
        options={[
          { value: 'never', label: 'Never' },
          { value: 'on-date', label: 'On date' },
          { value: 'after-occurrences', label: 'After N' },
        ]}
        value={end.kind}
        onChange={(kind) => {
          if (kind === 'never') onChange({ kind: 'never' });
          else if (kind === 'on-date') onChange({ kind: 'on-date', date: todayISO() });
          else onChange({ kind: 'after-occurrences', count: 6 });
        }}
      />
      {end.kind === 'on-date' && (
        <input
          type="date"
          value={end.date}
          onChange={(e) => onChange({ kind: 'on-date', date: e.target.value })}
          aria-label="End date"
          className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 text-sm font-semibold text-slate-900 outline-none focus:border-[#004b87] focus:ring-1 focus:ring-[#004b87]"
        />
      )}
      {end.kind === 'after-occurrences' && (
        <div className="flex items-center gap-2 text-sm font-semibold text-slate-700">
          <span>After</span>
          <input
            type="number"
            min={1}
            value={end.count}
            onChange={(e) => onChange({ kind: 'after-occurrences', count: Math.max(1, Number(e.target.value) || 1) })}
            aria-label="Number of journeys"
            className="w-20 px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 text-sm font-semibold text-slate-900 outline-none focus:border-[#004b87] focus:ring-1 focus:ring-[#004b87]"
          />
          <span>journeys</span>
        </div>
      )}
    </div>
  );
}

export function ScheduleStep({ schedule, onChange }: ScheduleStepProps) {
  const mode: 'once' | 'repeats' = schedule.frequency === 'once' ? 'once' : 'repeats';

  const setMode = (next: 'once' | 'repeats') => {
    if (next === mode) return;
    onChange(defaultForFrequency(next === 'once' ? 'once' : 'weekly', schedule.time));
  };

  const setFrequency = (frequency: ScheduleFrequency) => {
    if (frequency === schedule.frequency) return;
    onChange(defaultForFrequency(frequency, schedule.time));
  };

  return (
    <div className="space-y-5 animate-fadeIn">
      <div>
        <h1 className="text-xl font-black text-slate-900 tracking-tight">Schedule</h1>
        <p className="text-xs text-slate-500 mt-1">When do you make this journey?</p>
      </div>

      {/* WHEN IS THIS JOURNEY? */}
      <div className="space-y-2">
        <label className="text-xs font-bold uppercase tracking-wider text-slate-700 block">
          When is this journey?
        </label>
        <div className="grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={() => setMode('once')}
            className={`p-3.5 rounded-xl border flex items-center justify-center gap-2 min-h-[52px] transition-all ${
              mode === 'once'
                ? 'border-[#004b87] bg-[#f0f5fa] text-[#004b87] font-bold shadow-xs'
                : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300'
            }`}
          >
            <Calendar className="w-4 h-4" />
            <span className="text-sm">One time</span>
          </button>
          <button
            type="button"
            onClick={() => setMode('repeats')}
            className={`p-3.5 rounded-xl border flex items-center justify-center gap-2 min-h-[52px] transition-all ${
              mode === 'repeats'
                ? 'border-[#004b87] bg-[#f0f5fa] text-[#004b87] font-bold shadow-xs'
                : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300'
            }`}
          >
            <Repeat className="w-4 h-4" />
            <span className="text-sm">Repeats</span>
          </button>
        </div>
      </div>

      {mode === 'once' && schedule.frequency === 'once' && (
        <div className="space-y-2">
          <label htmlFor="once-date" className="text-xs font-bold uppercase tracking-wider text-slate-700 block">
            Date
          </label>
          <input
            id="once-date"
            type="date"
            value={schedule.date}
            onChange={(e) => onChange({ ...schedule, date: e.target.value })}
            className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-sm font-semibold text-slate-900 outline-none focus:border-[#004b87] focus:ring-1 focus:ring-[#004b87]"
          />
        </div>
      )}

      {mode === 'repeats' && (
        <div className="space-y-2">
          <label className="text-xs font-bold uppercase tracking-wider text-slate-700 block">Repeats</label>
          <div className="grid grid-cols-2 gap-2">
            {REPEAT_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                type="button"
                aria-pressed={schedule.frequency === opt.value}
                onClick={() => setFrequency(opt.value)}
                className={`p-3 rounded-xl border text-center transition-all min-h-[46px] ${
                  schedule.frequency === opt.value
                    ? 'border-[#004b87] bg-[#f0f5fa] text-[#004b87] font-bold shadow-xs'
                    : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300'
                }`}
              >
                <p className="text-sm font-bold">{opt.label}</p>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Weekly / biweekly sub-fields */}
      {mode === 'repeats' && (schedule.frequency === 'weekly' || schedule.frequency === 'biweekly') && (
        <div className="space-y-3 p-3 rounded-xl bg-slate-50 border border-slate-200">
          <div className="flex items-center gap-2 text-sm font-semibold text-slate-700">
            <span>Repeat every</span>
            <input
              type="number"
              min={1}
              value={schedule.intervalWeeks}
              onChange={(e) => onChange({ ...schedule, intervalWeeks: Math.max(1, Number(e.target.value) || 1) })}
              aria-label="Interval in weeks"
              className="w-16 px-2 py-1.5 rounded-lg border border-slate-200 bg-white text-sm font-semibold text-slate-900 outline-none focus:border-[#004b87]"
            />
            <span>week{schedule.intervalWeeks === 1 ? '' : 's'}</span>
          </div>
          <DaySelector selectedDays={schedule.days} onChange={(days) => onChange({ ...schedule, days })} />
        </div>
      )}

      {/* Monthly sub-fields */}
      {mode === 'repeats' && schedule.frequency === 'monthly' && (
        <div className="space-y-3 p-3 rounded-xl bg-slate-50 border border-slate-200">
          <SegmentedChoice<MonthlyMode>
            ariaLabel="Monthly recurrence type"
            options={[{ value: 'day-of-month', label: 'Day of month' }, { value: 'nth-weekday', label: 'Day of week' }]}
            value={schedule.monthlyMode}
            onChange={(monthlyMode) => onChange({ ...schedule, monthlyMode })}
          />
          {schedule.monthlyMode === 'day-of-month' ? (
            <div className="flex items-center gap-2 text-sm font-semibold text-slate-700">
              <span>Day</span>
              <input
                type="number"
                min={1}
                max={31}
                value={schedule.dayOfMonth ?? 1}
                onChange={(e) =>
                  onChange({ ...schedule, dayOfMonth: Math.min(31, Math.max(1, Number(e.target.value) || 1)) })
                }
                aria-label="Day of the month"
                className="w-16 px-2 py-1.5 rounded-lg border border-slate-200 bg-white text-sm font-semibold text-slate-900 outline-none focus:border-[#004b87]"
              />
              <span>of every month</span>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-2">
              <select
                aria-label="Week ordinal"
                value={schedule.nthWeekOrdinal ?? 1}
                onChange={(e) => onChange({ ...schedule, nthWeekOrdinal: Number(e.target.value) as NthWeekOrdinal })}
                className="px-3 py-2 rounded-lg border border-slate-200 bg-white text-sm font-semibold text-slate-900 outline-none focus:border-[#004b87]"
              >
                {ORDINAL_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </select>
              <select
                aria-label="Day of the week"
                value={schedule.nthWeekDay ?? 'mon'}
                onChange={(e) => onChange({ ...schedule, nthWeekDay: e.target.value as DayOfWeek })}
                className="px-3 py-2 rounded-lg border border-slate-200 bg-white text-sm font-semibold text-slate-900 outline-none focus:border-[#004b87]"
              >
                {DAYS_OF_WEEK.map((d) => (
                  <option key={d.value} value={d.value}>{FULL_DAY_LABEL[d.value]}</option>
                ))}
              </select>
            </div>
          )}
        </div>
      )}

      {/* Custom sub-fields */}
      {mode === 'repeats' && schedule.frequency === 'custom' && (
        <div className="space-y-3 p-3 rounded-xl bg-slate-50 border border-slate-200">
          <div className="flex items-center gap-2 text-sm font-semibold text-slate-700">
            <span>Repeat every</span>
            <input
              type="number"
              min={1}
              value={schedule.interval}
              onChange={(e) => onChange({ ...schedule, interval: Math.max(1, Number(e.target.value) || 1) })}
              aria-label="Custom interval"
              className="w-16 px-2 py-1.5 rounded-lg border border-slate-200 bg-white text-sm font-semibold text-slate-900 outline-none focus:border-[#004b87]"
            />
            <select
              aria-label="Interval unit"
              value={schedule.unit}
              onChange={(e) =>
                onChange({ ...schedule, unit: e.target.value as typeof schedule.unit, days: schedule.days ?? [] })
              }
              className="px-2 py-1.5 rounded-lg border border-slate-200 bg-white text-sm font-semibold text-slate-900 outline-none focus:border-[#004b87]"
            >
              <option value="days">days</option>
              <option value="weeks">weeks</option>
              <option value="months">months</option>
            </select>
          </div>
          {schedule.unit === 'weeks' && (
            <DaySelector
              selectedDays={schedule.days ?? []}
              onChange={(days) => onChange({ ...schedule, days })}
            />
          )}
        </div>
      )}

      {/* Recurrence end (repeating schedules only) */}
      {mode === 'repeats' && 'end' in schedule && (
        <RecurrenceEndFields end={schedule.end} onChange={(end) => onChange({ ...schedule, end } as JourneySchedule)} />
      )}

      {/* Time preference — shared by every variant */}
      <TimePreferenceFields time={schedule.time} onChange={(time) => onChange({ ...schedule, time } as JourneySchedule)} />

      {/* Live human-readable summary */}
      <div className="p-3 rounded-xl bg-[#f0f5fa] border border-[#b8d2eb]">
        <p className="text-[10px] font-bold uppercase tracking-wider text-[#004b87]">Schedule summary</p>
        <p className="text-sm font-bold text-slate-900 mt-0.5">{describeSchedule(schedule)}</p>
      </div>
    </div>
  );
}

const FULL_DAY_LABEL: Record<DayOfWeek, string> = {
  mon: 'Monday',
  tue: 'Tuesday',
  wed: 'Wednesday',
  thu: 'Thursday',
  fri: 'Friday',
  sat: 'Saturday',
  sun: 'Sunday',
};
