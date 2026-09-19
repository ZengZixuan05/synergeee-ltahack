import { describe, expect, it } from 'vitest';
import { RawGeoFeature } from '../../../lta/geospatial';
import { normaliseTrainStations } from './normalise';

const FETCHED_AT = '2026-09-19T02:00:00.000Z';

// Shapes below mirror an actual live GeospatialWholeIsland?ID=TrainStation
// response (2026-09-19), including SVY21 coordinates.
const HOUGANG_FEATURE: RawGeoFeature = {
  type: 'Feature',
  properties: {
    TYP_CD: 0,
    STN_NAM: null,
    ATTACHEMEN: 'NE14_HGN STN.zip',
    TYP_CD_DES: 'MRT',
    STN_NAM_DE: 'HOUGANG MRT STATION',
  },
  geometry: {
    type: 'Polygon',
    coordinates: [
      [
        [34585.72520000022, 39351.601500000805],
        [34585.72919999994, 39319.648399999365],
        [34585.72520000022, 39351.601500000805],
      ],
    ],
  },
};

describe('normaliseTrainStations', () => {
  it('normalises a valid station footprint, converting geometry to WGS84', () => {
    const { records, skippedCount } = normaliseTrainStations([HOUGANG_FEATURE], FETCHED_AT);

    expect(skippedCount).toBe(0);
    expect(records).toHaveLength(1);
    expect(records[0]).toMatchObject({
      source: 'LTA',
      provenance: 'LIVE',
      lastUpdated: FETCHED_AT,
      name: 'HOUGANG MRT STATION',
      stationType: 'MRT',
      attachmentReference: 'NE14_HGN STN.zip',
    });
    expect(records[0]!.geometry.type).toBe('Polygon');
    const firstVertex = (records[0]!.geometry as { coordinates: number[][][] }).coordinates[0]![0]!;
    // Should now be plausible Singapore lat/lng, not SVY21 metres.
    expect(firstVertex[0]).toBeGreaterThan(103);
    expect(firstVertex[0]).toBeLessThan(105);
    expect(firstVertex[1]).toBeGreaterThan(1);
    expect(firstVertex[1]).toBeLessThan(2);
  });

  it('treats a null STN_NAM_DE/ATTACHEMEN as absent rather than the literal string "null"', () => {
    const feature: RawGeoFeature = {
      type: 'Feature',
      properties: { STN_NAM_DE: null, TYP_CD_DES: 'LRT', ATTACHEMEN: null },
      geometry: HOUGANG_FEATURE.geometry,
    };
    const { records } = normaliseTrainStations([feature], FETCHED_AT);
    expect(records[0]!.name).toBeUndefined();
    expect(records[0]!.attachmentReference).toBeUndefined();
    expect(records[0]!.stationType).toBe('LRT');
  });

  it('skips a feature with unrecognisable geometry rather than emitting a broken record', () => {
    const feature: RawGeoFeature = {
      type: 'Feature',
      properties: { STN_NAM_DE: 'BROKEN STATION' },
      geometry: null,
    };
    const { records, skippedCount } = normaliseTrainStations([feature], FETCHED_AT);
    expect(records).toEqual([]);
    expect(skippedCount).toBe(1);
  });

  it('generates distinct ids for two stations at the same index-adjacent positions', () => {
    const other: RawGeoFeature = { ...HOUGANG_FEATURE, properties: { ...HOUGANG_FEATURE.properties, STN_NAM_DE: 'BEDOK MRT STATION' } };
    const { records } = normaliseTrainStations([HOUGANG_FEATURE, other], FETCHED_AT);
    expect(records[0]!.id).not.toBe(records[1]!.id);
  });
});
