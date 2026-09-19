import { describe, expect, it } from 'vitest';
import { normaliseFacilitiesMaintenance } from './normalise';

const FETCHED_AT = '2026-09-19T02:00:00.000Z';

describe('normaliseFacilitiesMaintenance', () => {
  it('normalises a valid record into a LIFT_MAINTENANCE event with a resolved canonical line', () => {
    const { events, skippedCount } = normaliseFacilitiesMaintenance(
      [
        {
          Line: 'NEL',
          StationCode: 'NE12',
          StationName: 'Serangoon',
          LiftID: 'B1L01',
          LiftDesc: 'Exit B Street level - Concourse',
        },
      ],
      FETCHED_AT
    );

    expect(skippedCount).toBe(0);
    expect(events).toHaveLength(1);
    expect(events[0]!).toMatchObject({
      type: 'LIFT_MAINTENANCE',
      source: 'LTA',
      provenance: 'LIVE',
      lastUpdated: FETCHED_AT,
      liftId: 'B1L01',
      liftDescription: 'Exit B Street level - Concourse',
      station: {
        stationCode: 'NE12',
        stationName: 'Serangoon',
        line: 'NEL',
        rawLine: 'NEL',
      },
    });
    expect(events[0]!.id).toBeTruthy();
  });

  it('handles an empty response without error', () => {
    const { events, skippedCount } = normaliseFacilitiesMaintenance([], FETCHED_AT);
    expect(events).toEqual([]);
    expect(skippedCount).toBe(0);
  });

  it('produces a LIFT_MAINTENANCE event even when LiftID is absent, since the guide marks it optional', () => {
    const { events } = normaliseFacilitiesMaintenance(
      [{ Line: 'CCL', StationCode: 'CC1', StationName: 'Dhoby Ghaut', LiftDesc: 'Platform to concourse' }],
      FETCHED_AT
    );
    expect(events).toHaveLength(1);
    expect(events[0]!.liftId).toBeUndefined();
  });

  it('skips malformed records (missing required fields) rather than discarding the whole batch', () => {
    const { events, skippedCount } = normaliseFacilitiesMaintenance(
      [
        { Line: 'NEL', StationCode: 'NE12', StationName: 'Serangoon' }, // valid
        { Line: 'NEL', StationName: 'Missing station code' }, // invalid: no StationCode
        null, // invalid: not an object
        'unexpected string', // invalid
      ],
      FETCHED_AT
    );

    expect(events).toHaveLength(1);
    expect(skippedCount).toBe(3);
  });

  it('preserves an unrecognised Line code as raw data with a null canonical rather than inventing one', () => {
    const { events } = normaliseFacilitiesMaintenance(
      [{ Line: 'ZZZ', StationCode: 'ZZ1', StationName: 'Unknown Station' }],
      FETCHED_AT
    );
    expect(events[0]!.station.line).toBeNull();
    expect(events[0]!.station.rawLine).toBe('ZZZ');
  });

  it('generates distinct ids for two lifts at the same station', () => {
    const { events } = normaliseFacilitiesMaintenance(
      [
        { Line: 'NEL', StationCode: 'NE12', StationName: 'Serangoon', LiftID: 'B1L01' },
        { Line: 'NEL', StationCode: 'NE12', StationName: 'Serangoon', LiftID: 'B1L02' },
      ],
      FETCHED_AT
    );
    expect(events[0]!.id).not.toBe(events[1]!.id);
  });
});
