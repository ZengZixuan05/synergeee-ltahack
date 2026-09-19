import { describe, expect, it } from 'vitest';
import { decodePolyline } from './polyline';

describe('decodePolyline', () => {
  it('decodes Google\'s own published reference example correctly', () => {
    // https://developers.google.com/maps/documentation/utilities/polylinealgorithm
    // Encodes [(38.5, -120.2), (40.7, -120.95), (43.252, -126.453)].
    const result = decodePolyline('_p~iF~ps|U_ulLnnqC_mqNvxq`@');
    expect(result).toHaveLength(3);
    expect(result[0]![0]).toBeCloseTo(-120.2, 5);
    expect(result[0]![1]).toBeCloseTo(38.5, 5);
    expect(result[1]![0]).toBeCloseTo(-120.95, 5);
    expect(result[1]![1]).toBeCloseTo(40.7, 5);
    expect(result[2]![0]).toBeCloseTo(-126.453, 5);
    expect(result[2]![1]).toBeCloseTo(43.252, 5);
  });

  it('matches a real OneMap leg geometry observed live (short WALK leg, Outram Park exit, 2026-09-19)', () => {
    const result = decodePolyline('ohyFs`xxR?GBE@@DG@@TJEHCBg@b@A@GF??CD?@B@');
    // First point should be near Outram Park MRT (1.2815, 103.839), not somewhere absurd.
    expect(result[0]![0]).toBeCloseTo(103.839, 2);
    expect(result[0]![1]).toBeCloseTo(1.2815, 2);
  });

  it('returns an empty array for an empty string', () => {
    expect(decodePolyline('')).toEqual([]);
  });
});
