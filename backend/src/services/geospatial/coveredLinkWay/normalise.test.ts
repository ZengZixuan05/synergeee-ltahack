import { describe, expect, it } from 'vitest';
import { RawGeoFeature } from '../../../lta/geospatial';
import { normaliseCoveredLinkWay } from './normalise';

const FETCHED_AT = '2026-09-19T02:00:00.000Z';

const FEATURE: RawGeoFeature = {
  type: 'Feature',
  properties: { OBJECTID: 112 },
  geometry: {
    type: 'Polygon',
    coordinates: [
      [
        [27851.234899999574, 45327.79800000042],
        [27851.629900000058, 45318.835000000894],
        [27851.234899999574, 45327.79800000042],
      ],
    ],
  },
};

describe('normaliseCoveredLinkWay', () => {
  it('normalises a valid segment, converting geometry to WGS84', () => {
    const { records, skippedCount } = normaliseCoveredLinkWay([FEATURE], FETCHED_AT);

    expect(skippedCount).toBe(0);
    expect(records).toHaveLength(1);
    expect(records[0]).toMatchObject({ source: 'LTA', provenance: 'LIVE', objectId: 112 });
    expect(records[0]!.geometry.type).toBe('Polygon');
  });

  it('this layer carries no descriptive attributes beyond OBJECTID — normalise does not fabricate any', () => {
    const { records } = normaliseCoveredLinkWay([FEATURE], FETCHED_AT);
    expect(Object.keys(records[0]!)).toEqual(
      expect.arrayContaining(['id', 'source', 'provenance', 'lastUpdated', 'objectId', 'geometry'])
    );
    expect(Object.keys(records[0]!)).toHaveLength(6);
  });

  it('skips a record with missing geometry', () => {
    const feature: RawGeoFeature = { type: 'Feature', properties: { OBJECTID: 999 }, geometry: null };
    const { records, skippedCount } = normaliseCoveredLinkWay([feature], FETCHED_AT);
    expect(records).toEqual([]);
    expect(skippedCount).toBe(1);
  });
});
