import { describe, expect, it } from 'vitest';
import { normaliseBusStops } from './normalise';

const FETCHED_AT = '2026-09-19T02:00:00.000Z';

// Mirrors a real live BusStops record (2026-09-19) — plain WGS84 numbers, no SVY21 conversion needed.
const VICTORIA_ST_STOP = {
  BusStopCode: '01012',
  RoadName: 'Victoria St',
  Description: 'Hotel Grand Pacific',
  Latitude: 1.29684825487647,
  Longitude: 103.85253591654006,
};

describe('normaliseBusStops', () => {
  it('normalises a valid bus stop record', () => {
    const { records, skippedCount } = normaliseBusStops([VICTORIA_ST_STOP], FETCHED_AT);

    expect(skippedCount).toBe(0);
    expect(records).toEqual([
      {
        id: 'bus-stop:01012',
        source: 'LTA',
        provenance: 'LIVE',
        lastUpdated: FETCHED_AT,
        busStopCode: '01012',
        roadName: 'Victoria St',
        description: 'Hotel Grand Pacific',
        latitude: 1.29684825487647,
        longitude: 103.85253591654006,
      },
    ]);
  });

  it('skips a malformed record (missing required BusStopCode) rather than discarding the whole batch', () => {
    const { records, skippedCount } = normaliseBusStops(
      [VICTORIA_ST_STOP, { RoadName: 'No code here', Latitude: 1.3, Longitude: 103.8 }],
      FETCHED_AT
    );
    expect(records).toHaveLength(1);
    expect(skippedCount).toBe(1);
  });
});
