import { describe, it, expect } from 'vitest';
import { getNextOccurrences, describeSchedule, formatISODate } from '@/lib/schedule';
import { SavedJourney, JourneySchedule } from '@/types/journey';

const WEEKDAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

function journeyWith(schedule: JourneySchedule, createdAt: Date): Pick<SavedJourney, 'schedule' | 'createdAt'> {
  return { schedule, createdAt: formatISODate(createdAt) };
}

describe('getNextOccurrences', () => {
  it('one-time journey: returns the single date when on/after `from`, none once past', () => {
    const date = new Date(2026, 9, 12); // 12 October 2026
    const schedule: JourneySchedule = { frequency: 'once', date: formatISODate(date), time: { type: 'arrive-by', value: '10:00' } };
    const journey = journeyWith(schedule, new Date(2026, 8, 1));

    expect(getNextOccurrences(journey, { from: new Date(2026, 9, 1) })).toEqual([date]);
    expect(getNextOccurrences(journey, { from: new Date(2026, 9, 13) })).toEqual([]);
  });

  it('weekdays: only returns Mon-Fri, consecutively', () => {
    const anchor = new Date(2026, 0, 5);
    const schedule: JourneySchedule = { frequency: 'weekdays', time: { type: 'depart-at', value: '08:00' }, end: { kind: 'never' } };
    const results = getNextOccurrences(journeyWith(schedule, anchor), { from: anchor, count: 10 });

    expect(results).toHaveLength(10);
    for (const d of results) {
      expect(d.getDay()).not.toBe(0);
      expect(d.getDay()).not.toBe(6);
    }
  });

  it('weekly Monday: every occurrence falls on Monday, 7 days apart', () => {
    const anchor = new Date(2026, 0, 1);
    const schedule: JourneySchedule = {
      frequency: 'weekly', intervalWeeks: 1, days: ['mon'], time: { type: 'depart-at', value: '08:00' }, end: { kind: 'never' },
    };
    const results = getNextOccurrences(journeyWith(schedule, anchor), { from: anchor, count: 6 });

    expect(results).toHaveLength(6);
    results.forEach((d) => expect(d.getDay()).toBe(1));
    for (let i = 1; i < results.length; i++) {
      const gapDays = (results[i].getTime() - results[i - 1].getTime()) / 86400000;
      expect(gapDays).toBe(7);
    }
  });

  it('Tuesday + Thursday: alternates correctly, spaced 2 and 5 days apart', () => {
    const anchor = new Date(2026, 0, 1);
    const schedule: JourneySchedule = {
      frequency: 'weekly', intervalWeeks: 1, days: ['tue', 'thu'], time: { type: 'depart-at', value: '07:30' }, end: { kind: 'never' },
    };
    const results = getNextOccurrences(journeyWith(schedule, anchor), { from: anchor, count: 6 });

    expect(results).toHaveLength(6);
    results.forEach((d) => expect([2, 4]).toContain(d.getDay()));
    const gaps = results.slice(1).map((d, i) => (d.getTime() - results[i].getTime()) / 86400000);
    gaps.forEach((gap) => expect([2, 5]).toContain(gap));
  });

  it('every two weeks Monday (Mdm Lim): consecutive occurrences are exactly 14 days apart', () => {
    const anchor = new Date(2026, 0, 5); // a Monday
    const schedule: JourneySchedule = {
      frequency: 'biweekly', intervalWeeks: 2, days: ['mon'], time: { type: 'arrive-by', value: '10:00' }, end: { kind: 'never' },
    };
    const results = getNextOccurrences(journeyWith(schedule, anchor), { from: anchor, count: 5 });

    expect(results).toHaveLength(5);
    results.forEach((d) => expect(d.getDay()).toBe(1));
    for (let i = 1; i < results.length; i++) {
      const gapDays = (results[i].getTime() - results[i - 1].getTime()) / 86400000;
      expect(gapDays).toBe(14);
    }
  });

  it('monthly (day of month): occurrence lands on the configured day every month', () => {
    const anchor = new Date(2026, 0, 10);
    const schedule: JourneySchedule = {
      frequency: 'monthly', monthlyMode: 'day-of-month', dayOfMonth: 15, intervalMonths: 1,
      time: { type: 'arrive-by', value: '09:00' }, end: { kind: 'never' },
    };
    const results = getNextOccurrences(journeyWith(schedule, anchor), { from: anchor, count: 4 });

    expect(results).toHaveLength(4);
    results.forEach((d) => expect(d.getDate()).toBe(15));
    for (let i = 1; i < results.length; i++) {
      expect(results[i].getMonth()).toBe((results[i - 1].getMonth() + 1) % 12);
    }
  });

  it('monthly (nth weekday): first Monday of every month', () => {
    const anchor = new Date(2026, 0, 1);
    const schedule: JourneySchedule = {
      frequency: 'monthly', monthlyMode: 'nth-weekday', nthWeekOrdinal: 1, nthWeekDay: 'mon', intervalMonths: 1,
      time: { type: 'arrive-by', value: '09:00' }, end: { kind: 'never' },
    };
    const results = getNextOccurrences(journeyWith(schedule, anchor), { from: anchor, count: 3 });

    expect(results).toHaveLength(3);
    results.forEach((d) => {
      expect(d.getDay()).toBe(1);
      expect(d.getDate()).toBeLessThanOrEqual(7);
    });
  });

  it('custom every 3 weeks on Wednesday', () => {
    const anchor = new Date(2026, 0, 7); // a Wednesday
    const schedule: JourneySchedule = {
      frequency: 'custom', unit: 'weeks', interval: 3, days: ['wed'], time: { type: 'depart-at', value: '09:00' }, end: { kind: 'never' },
    };
    const results = getNextOccurrences(journeyWith(schedule, anchor), { from: anchor, count: 4 });

    expect(results).toHaveLength(4);
    results.forEach((d) => expect(d.getDay()).toBe(3));
    for (let i = 1; i < results.length; i++) {
      const gapDays = (results[i].getTime() - results[i - 1].getTime()) / 86400000;
      expect(gapDays).toBe(21);
    }
  });

  it('ends on a date: stops generating occurrences after the end date', () => {
    const anchor = new Date(2026, 0, 5); // a Monday
    const endDate = new Date(2026, 0, 26); // 3 weeks later, still a Monday
    const schedule: JourneySchedule = {
      frequency: 'weekly', intervalWeeks: 1, days: ['mon'], time: { type: 'depart-at', value: '08:00' },
      end: { kind: 'on-date', date: formatISODate(endDate) },
    };
    const results = getNextOccurrences(journeyWith(schedule, anchor), { from: anchor, count: 20 });

    expect(results.length).toBe(4); // Jan 5, 12, 19, 26
    expect(results[results.length - 1].getTime()).toBe(endDate.getTime());
  });

  it('ends after N occurrences: returns exactly N results even when more are requested', () => {
    const anchor = new Date(2026, 0, 5); // a Monday
    const schedule: JourneySchedule = {
      frequency: 'biweekly', intervalWeeks: 2, days: ['mon'], time: { type: 'arrive-by', value: '10:00' },
      end: { kind: 'after-occurrences', count: 6 },
    };
    const results = getNextOccurrences(journeyWith(schedule, anchor), { from: anchor, count: 50 });

    expect(results).toHaveLength(6);
  });
});

describe('describeSchedule', () => {
  it('formats a one-time schedule', () => {
    const date = new Date(2026, 9, 12); // 12 October 2026
    const schedule: JourneySchedule = { frequency: 'once', date: formatISODate(date), time: { type: 'arrive-by', value: '10:00' } };
    const expectedWeekday = WEEKDAY_NAMES[date.getDay()];

    expect(describeSchedule(schedule)).toBe(`Once on ${expectedWeekday}, 12 October at 10:00 AM`);
  });

  it('formats a weekdays schedule', () => {
    const schedule: JourneySchedule = { frequency: 'weekdays', time: { type: 'depart-at', value: '08:00' }, end: { kind: 'never' } };
    expect(describeSchedule(schedule)).toBe('Every weekday · Depart at 8:00 AM');
  });

  it('formats a biweekly Monday schedule (Mdm Lim)', () => {
    const schedule: JourneySchedule = {
      frequency: 'biweekly', intervalWeeks: 2, days: ['mon'], time: { type: 'arrive-by', value: '10:00' }, end: { kind: 'never' },
    };
    expect(describeSchedule(schedule)).toBe('Every 2 weeks on Monday · Arrive by 10:00 AM');
  });

  it('formats a Tuesday + Thursday schedule with an end date', () => {
    const endDate = new Date(2026, 11, 18); // 18 December 2026
    const schedule: JourneySchedule = {
      frequency: 'weekly', intervalWeeks: 1, days: ['tue', 'thu'], time: { type: 'depart-at', value: '07:30' },
      end: { kind: 'on-date', date: formatISODate(endDate) },
    };
    expect(describeSchedule(schedule)).toBe('Every Tuesday and Thursday until 18 December · Depart at 7:30 AM');
  });

  it('formats a "first Monday of every month" schedule', () => {
    const schedule: JourneySchedule = {
      frequency: 'monthly', monthlyMode: 'nth-weekday', nthWeekOrdinal: 1, nthWeekDay: 'mon', intervalMonths: 1,
      time: { type: 'arrive-by', value: '09:00' }, end: { kind: 'never' },
    };
    expect(describeSchedule(schedule)).toBe('First Monday of every month · Arrive by 9:00 AM');
  });

  it('formats an after-occurrences end clause', () => {
    const schedule: JourneySchedule = {
      frequency: 'biweekly', intervalWeeks: 2, days: ['mon'], time: { type: 'arrive-by', value: '10:00' },
      end: { kind: 'after-occurrences', count: 6 },
    };
    expect(describeSchedule(schedule)).toBe('Every 2 weeks on Monday for 6 journeys · Arrive by 10:00 AM');
  });
});

