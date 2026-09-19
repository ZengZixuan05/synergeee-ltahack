import { describe, expect, it } from 'vitest';
import { RawGeoFeature } from '../../../lta/geospatial';
import { normaliseTrainStationExits } from './normalise';

const FETCHED_AT = '2026-09-19T02:00:00.000Z';

// Mirrors an actual live GeospatialWholeIsland?ID=TrainStationExit record
// for "MACPHERSON MRT STATION" / "Exit A" (2026-09-19).
const MACPHERSON_EXIT_A: RawGeoFeature = {
  type: 'Feature',
  properties: { stn_name: 'MACPHERSON MRT STATION', exit_code: 'Exit A' },
  geometry: { type: 'Point', coordinates: [34285.06831372995, 34322.985218301415] },
};

describe('normaliseTrainStationExits', () => {
  it('normalises a valid exit point, converting geometry to WGS84', () => {
    const { records, skippedCount } = normaliseTrainStationExits([MACPHERSON_EXIT_A], FETCHED_AT);

    expect(skippedCount).toBe(0);
    expect(records).toHaveLength(1);
    expect(records[0]).toMatchObject({
      source: 'LTA',
      provenance: 'LIVE',
      stationName: 'MACPHERSON MRT STATION',
      exitCode: 'Exit A',
    });
    expect(records[0]!.geometry.type).toBe('Point');
    const [lng, lat] = (records[0]!.geometry as { coordinates: [number, number] }).coordinates;
    expect(lng).toBeCloseTo(103.8898, 3);
    expect(lat).toBeCloseTo(1.3267, 3);
  });

  it('skips a record with missing geometry', () => {
    const feature: RawGeoFeature = { type: 'Feature', properties: { stn_name: 'X', exit_code: 'Exit Z' }, geometry: undefined };
    const { records, skippedCount } = normaliseTrainStationExits([feature], FETCHED_AT);
    expect(records).toEqual([]);
    expect(skippedCount).toBe(1);
  });

  it('builds a readable id combining station name and exit code, still unique per index', () => {
    const exitB: RawGeoFeature = { ...MACPHERSON_EXIT_A, properties: { stn_name: 'MACPHERSON MRT STATION', exit_code: 'Exit B' } };
    const { records } = normaliseTrainStationExits([MACPHERSON_EXIT_A, exitB], FETCHED_AT);
    expect(records[0]!.id).toContain('exit-a');
    expect(records[1]!.id).toContain('exit-b');
    expect(records[0]!.id).not.toBe(records[1]!.id);
  });
});
