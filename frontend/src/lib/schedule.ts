import { DayOfWeek } from '@/types';
import {
  JourneySchedule,
  RecurrenceEnd,
  SavedJourney,
  TimePreference,
  NthWeekOrdinal,
} from '@/types/journey';
import { formatTimeForDisplay } from '@/lib/utils';

// ---------------------------------------------------------------------------
// Date helpers. All dates are treated as local calendar dates (no timezone
// conversion) since this app only needs day-level scheduling precision.
// ---------------------------------------------------------------------------

const DOW_ORDER: DayOfWeek[] = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'];
const DOW_JS_INDEX: Record<DayOfWeek, number> = {
  sun: 0,
  mon: 1,
  tue: 2,
  wed: 3,
  thu: 4,
  fri: 5,
  sat: 6,
};
const JS_INDEX_TO_DOW: DayOfWeek[] = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'];

const FULL_DAY_NAMES: Record<DayOfWeek, string> = {
  mon: 'Monday',
  tue: 'Tuesday',
  wed: 'Wednesday',
  thu: 'Thursday',
  fri: 'Friday',
  sat: 'Saturday',
  sun: 'Sunday',
};

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

const ORDINAL_WORDS: Record<NthWeekOrdinal, string> = {
  1: 'First',
  2: 'Second',
  3: 'Third',
  4: 'Fourth',
  [-1]: 'Last',
};

export function parseISODate(iso: string): Date {
  const [y, m, d] = iso.split('-').map(Number);
  return new Date(y, (m ?? 1) - 1, d ?? 1);
}

export function formatISODate(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function startOfDay(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}

function addDays(d: Date, n: number): Date {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate() + n);
}

function diffInDays(a: Date, b: Date): number {
  return Math.round((startOfDay(a).getTime() - startOfDay(b).getTime()) / 86400000);
}

function dayCode(d: Date): DayOfWeek {
  return JS_INDEX_TO_DOW[d.getDay()];
}

function isWeekend(d: Date): boolean {
  const jsDay = d.getDay();
  return jsDay === 0 || jsDay === 6;
}

function mondayOf(d: Date): Date {
  const jsDay = d.getDay();
  const diffToMonday = jsDay === 0 ? -6 : 1 - jsDay;
  return addDays(d, diffToMonday);
}

function weeksSinceAnchor(d: Date, anchor: Date): number {
  return Math.floor(diffInDays(mondayOf(d), mondayOf(anchor)) / 7);
}

function dateClamped(year: number, monthIndexAbsolute: number, day: number): Date {
  const lastDayOfMonth = new Date(year, monthIndexAbsolute + 1, 0).getDate();
  return new Date(year, monthIndexAbsolute, Math.min(day, lastDayOfMonth));
}

function nthWeekdayOfMonth(
  year: number,
  monthIndexAbsolute: number,
  dow: DayOfWeek,
  ordinal: NthWeekOrdinal
): Date | null {
  const targetJsDay = DOW_JS_INDEX[dow];
  const firstOfMonth = new Date(year, monthIndexAbsolute, 1);

  if (ordinal === -1) {
    const lastOfMonth = new Date(year, monthIndexAbsolute + 1, 0);
    let d = lastOfMonth;
    while (d.getDay() !== targetJsDay) d = addDays(d, -1);
    return d;
  }

  let d = firstOfMonth;
  while (d.getDay() !== targetJsDay) d = addDays(d, 1);
  d = addDays(d, (ordinal - 1) * 7);
  if (d.getMonth() !== firstOfMonth.getMonth() || d.getFullYear() !== firstOfMonth.getFullYear()) {
    return null; // e.g. a "5th" weekday that doesn't exist in this month
  }
  return d;
}

// ---------------------------------------------------------------------------
// Occurrence generation
// ---------------------------------------------------------------------------

const MAX_DAY_ITERATIONS = 3660; // ~10 years of daily stepping
const MAX_MONTH_ITERATIONS = 240; // 20 years of monthly stepping

function stepDailyLike(
  anchor: Date,
  from: Date,
  count: number,
  end: RecurrenceEnd,
  qualifies: (d: Date) => boolean
): Date[] {
  const results: Date[] = [];
  const endDate = end.kind === 'on-date' ? startOfDay(parseISODate(end.date)) : null;
  const maxOccurrences = end.kind === 'after-occurrences' ? end.count : Infinity;
  let ordinal = 0;
  let candidate = anchor;

  for (let i = 0; i < MAX_DAY_ITERATIONS && results.length < count; i++) {
    if (qualifies(candidate)) {
      ordinal += 1;
      if (ordinal > maxOccurrences) break;
      if (endDate && candidate.getTime() > endDate.getTime()) break;
      if (candidate.getTime() >= from.getTime()) {
        results.push(candidate);
      }
    }
    candidate = addDays(candidate, 1);
  }
  return results;
}

function stepMonthlyLike(
  anchor: Date,
  from: Date,
  count: number,
  end: RecurrenceEnd,
  intervalMonths: number,
  resolveCandidate: (monthsFromAnchor: number) => Date | null
): Date[] {
  const results: Date[] = [];
  const endDate = end.kind === 'on-date' ? startOfDay(parseISODate(end.date)) : null;
  const maxOccurrences = end.kind === 'after-occurrences' ? end.count : Infinity;
  let ordinal = 0;

  for (let k = 0; k < MAX_MONTH_ITERATIONS && results.length < count; k++) {
    const candidate = resolveCandidate(k * intervalMonths);
    if (!candidate) continue;
    ordinal += 1;
    if (ordinal > maxOccurrences) break;
    if (endDate && candidate.getTime() > endDate.getTime()) break;
    if (candidate.getTime() >= from.getTime()) {
      results.push(candidate);
    }
  }
  return results;
}

/**
 * Computes the next occurrence dates for a saved journey's schedule, anchored
 * at the journey's creation date. This is deliberately a pure function (no
 * network or storage access) so a future proactive-monitoring job can call it
 * to know when to next check a journey for disruptions.
 */
export function getNextOccurrences(
  journey: Pick<SavedJourney, 'schedule' | 'createdAt'>,
  options?: { from?: Date; count?: number }
): Date[] {
  const count = options?.count ?? 5;
  const from = startOfDay(options?.from ?? new Date());
  const anchor = startOfDay(parseISODate(journey.createdAt));
  const schedule = journey.schedule;

  switch (schedule.frequency) {
    case 'once': {
      const date = startOfDay(parseISODate(schedule.date));
      return date.getTime() >= from.getTime() ? [date] : [];
    }
    case 'daily':
      return stepDailyLike(anchor, from, count, schedule.end, () => true);
    case 'weekdays':
      return stepDailyLike(anchor, from, count, schedule.end, (d) => !isWeekend(d));
    case 'weekly':
    case 'biweekly':
      return stepDailyLike(
        anchor,
        from,
        count,
        schedule.end,
        (d) => schedule.days.includes(dayCode(d)) && weeksSinceAnchor(d, anchor) % schedule.intervalWeeks === 0
      );
    case 'monthly': {
      if (schedule.monthlyMode === 'day-of-month') {
        const dayOfMonth = schedule.dayOfMonth ?? anchor.getDate();
        return stepMonthlyLike(anchor, from, count, schedule.end, schedule.intervalMonths, (offset) =>
          dateClamped(anchor.getFullYear(), anchor.getMonth() + offset, dayOfMonth)
        );
      }
      const nthWeekDay = schedule.nthWeekDay ?? dayCode(anchor);
      const nthWeekOrdinal = schedule.nthWeekOrdinal ?? 1;
      return stepMonthlyLike(anchor, from, count, schedule.end, schedule.intervalMonths, (offset) =>
        nthWeekdayOfMonth(anchor.getFullYear(), anchor.getMonth() + offset, nthWeekDay, nthWeekOrdinal)
      );
    }
    case 'custom': {
      if (schedule.unit === 'days') {
        return stepDailyLike(
          anchor,
          from,
          count,
          schedule.end,
          (d) => diffInDays(d, anchor) % schedule.interval === 0
        );
      }
      if (schedule.unit === 'weeks') {
        const days = schedule.days ?? [];
        return stepDailyLike(
          anchor,
          from,
          count,
          schedule.end,
          (d) => days.includes(dayCode(d)) && weeksSinceAnchor(d, anchor) % schedule.interval === 0
        );
      }
      return stepMonthlyLike(anchor, from, count, schedule.end, schedule.interval, (offset) =>
        dateClamped(anchor.getFullYear(), anchor.getMonth() + offset, anchor.getDate())
      );
    }
    default:
      return [];
  }
}

// ---------------------------------------------------------------------------
// Human-readable summaries
// ---------------------------------------------------------------------------

function formatTimeLabel(time: TimePreference): string {
  const prefix = time.type === 'arrive-by' ? 'Arrive by' : 'Depart at';
  return `${prefix} ${formatTimeForDisplay(time.value)}`;
}

function joinDayNames(days: DayOfWeek[]): string {
  const ordered = DOW_ORDER.filter((d) => days.includes(d));
  const names = ordered.map((d) => FULL_DAY_NAMES[d]);
  if (names.length === 0) return 'no days selected';
  if (names.length === 1) return names[0];
  if (names.length === 2) return `${names[0]} and ${names[1]}`;
  return `${names.slice(0, -1).join(', ')} and ${names[names.length - 1]}`;
}

function formatShortDate(d: Date): string {
  return `${d.getDate()} ${MONTH_NAMES[d.getMonth()]}`;
}

function formatEndClause(end: RecurrenceEnd): string {
  if (end.kind === 'on-date') {
    return ` until ${formatShortDate(parseISODate(end.date))}`;
  }
  if (end.kind === 'after-occurrences') {
    return ` for ${end.count} journey${end.count === 1 ? '' : 's'}`;
  }
  return '';
}

/** Recurrence portion only (frequency + end clause), no time-of-day. */
export function describeRecurrence(schedule: JourneySchedule): string {
  if (schedule.frequency === 'once') {
    const date = parseISODate(schedule.date);
    const weekday = FULL_DAY_NAMES[dayCode(date)];
    return `Once on ${weekday}, ${formatShortDate(date)}`;
  }

  let base: string;

  switch (schedule.frequency) {
    case 'daily':
      base = 'Every day';
      break;
    case 'weekdays':
      base = 'Every weekday';
      break;
    case 'weekly':
    case 'biweekly':
      base =
        schedule.intervalWeeks === 1
          ? `Every ${joinDayNames(schedule.days)}`
          : `Every ${schedule.intervalWeeks} weeks on ${joinDayNames(schedule.days)}`;
      break;
    case 'monthly': {
      const monthUnit = schedule.intervalMonths > 1 ? `${schedule.intervalMonths} months` : 'month';
      if (schedule.monthlyMode === 'day-of-month') {
        base = `Day ${schedule.dayOfMonth ?? 1} of every ${monthUnit}`;
      } else {
        const ordinal = ORDINAL_WORDS[schedule.nthWeekOrdinal ?? 1];
        const dayName = FULL_DAY_NAMES[schedule.nthWeekDay ?? 'mon'];
        base = `${ordinal} ${dayName} of every ${monthUnit}`;
      }
      break;
    }
    case 'custom': {
      if (schedule.unit === 'days') {
        base = `Every ${schedule.interval} day${schedule.interval === 1 ? '' : 's'}`;
      } else if (schedule.unit === 'weeks') {
        base =
          schedule.interval === 1
            ? `Every ${joinDayNames(schedule.days ?? [])}`
            : `Every ${schedule.interval} weeks on ${joinDayNames(schedule.days ?? [])}`;
      } else {
        base = `Every ${schedule.interval} month${schedule.interval === 1 ? '' : 's'}`;
      }
      break;
    }
    default:
      base = 'Repeats';
  }

  const end: RecurrenceEnd = 'end' in schedule ? schedule.end : { kind: 'never' };
  return `${base}${formatEndClause(end)}`;
}

/** Generates a single human-readable summary line for a journey schedule. */
export function describeSchedule(schedule: JourneySchedule): string {
  if (schedule.frequency === 'once') {
    return `${describeRecurrence(schedule)} at ${formatTimeForDisplay(schedule.time.value)}`;
  }
  return `${describeRecurrence(schedule)} · ${formatTimeLabel(schedule.time)}`;
}
