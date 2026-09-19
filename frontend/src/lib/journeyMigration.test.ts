import { describe, it, expect } from 'vitest';
import { isLegacySavedJourney, migrateLegacySavedJourney, migrateSavedJourneys } from '@/lib/journeyMigration';

describe('isLegacySavedJourney', () => {
  it('detects a pre-refinement flat route (no schedule field)', () => {
    expect(
      isLegacySavedJourney({
        id: '1', name: 'Commute', origin: 'A', destination: 'B',
        timeType: 'depart-at', time: '08:00', days: ['mon'], legs: [],
      })
    ).toBe(true);
  });

  it('does not flag an already-migrated SavedJourney', () => {
    expect(
      isLegacySavedJourney({
        id: '1', name: 'Commute', origin: 'A', destination: 'B',
        schedule: { frequency: 'once', date: '2026-01-01', time: { type: 'depart-at', value: '08:00' } },
        route: [], monitoringEnabled: true, createdAt: '2026-01-01',
      })
    ).toBe(false);
  });

  it('rejects non-object input', () => {
    expect(isLegacySavedJourney(null)).toBe(false);
    expect(isLegacySavedJourney('not an object')).toBe(false);
  });
});

describe('migrateLegacySavedJourney', () => {
  it('converts day booleans + free-text legs into a structured weekly schedule and route', () => {
    const legacy = {
      id: 'route-1',
      name: 'Commute to work',
      origin: 'Sky Eden @ Bedok',
      destination: 'Raffles Place',
      timeType: 'depart-at' as const,
      time: '08:00',
      days: ['mon', 'tue', 'wed', 'thu', 'fri'],
      legs: [
        { id: 'leg-1', mode: 'walk', description: 'Bedok MRT' },
        { id: 'leg-2', mode: 'rail', description: 'Take East West Line to Raffles Place' },
      ],
    };

    const migrated = migrateLegacySavedJourney(legacy);

    expect(migrated.id).toBe('route-1');
    expect(migrated.name).toBe('Commute to work');
    expect(migrated.schedule).toMatchObject({
      frequency: 'weekly',
      intervalWeeks: 1,
      days: ['mon', 'tue', 'wed', 'thu', 'fri'],
      time: { type: 'depart-at', value: '08:00' },
    });
    expect(migrated.route).toHaveLength(2);
    expect(migrated.route[0]).toMatchObject({ mode: 'walk', to: 'Bedok MRT' });
    // Free-text rail/bus legs can't be safely reconstructed into a validated
    // RailLeg/BusLeg, so their text is preserved as a transfer-style note.
    expect(migrated.route[1]).toMatchObject({ mode: 'transfer', notes: 'Take East West Line to Raffles Place' });
  });

  it('falls back to a one-time schedule when no legacy days were ever set', () => {
    const legacy = { id: 'route-2', name: 'Skipped route', origin: '', destination: '', timeType: 'arrive-by', time: '', days: [], legs: [] };
    const migrated = migrateLegacySavedJourney(legacy);
    expect(migrated.schedule.frequency).toBe('once');
  });

  it('never throws on missing/malformed fields', () => {
    expect(() => migrateLegacySavedJourney({})).not.toThrow();
  });
});

describe('migrateSavedJourneys', () => {
  it('upgrades only legacy entries, leaving already-migrated ones untouched', () => {
    const modern = {
      id: 'modern-1', name: 'Already migrated', origin: 'A', destination: 'B',
      schedule: { frequency: 'once' as const, date: '2026-01-01', time: { type: 'depart-at' as const, value: '08:00' } },
      route: [], monitoringEnabled: true, createdAt: '2026-01-01',
    };
    const legacy = { id: 'legacy-1', name: 'Old', origin: 'A', destination: 'B', timeType: 'depart-at', time: '08:00', days: ['mon'], legs: [] };

    const result = migrateSavedJourneys([modern, legacy]);

    expect(result).toHaveLength(2);
    expect(result[0]).toBe(modern); // untouched, same reference
    expect(result[1].schedule.frequency).toBe('weekly');
  });
});
