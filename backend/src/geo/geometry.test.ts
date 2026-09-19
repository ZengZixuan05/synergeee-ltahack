import { describe, expect, it } from 'vitest';
import { convertGeometryToWgs84 } from './geometry';

describe('convertGeometryToWgs84', () => {
  it('converts a Point geometry, preserving its type', () => {
    const result = convertGeometryToWgs84({ type: 'Point', coordinates: [28001.642, 38744.572] });
    expect(result?.type).toBe('Point');
    const [lng, lat] = (result as { coordinates: [number, number] }).coordinates;
    expect(lng).toBeCloseTo(103.833333, 4);
    expect(lat).toBeCloseTo(1.366666, 4);
  });

  it('converts a Polygon geometry, preserving nesting depth', () => {
    const raw = {
      type: 'Polygon',
      coordinates: [
        [
          [28001.642, 38744.572],
          [28001.642, 38744.572],
          [28001.642, 38744.572],
        ],
      ],
    };
    const result = convertGeometryToWgs84(raw);
    expect(result?.type).toBe('Polygon');
    expect((result as { coordinates: number[][][] }).coordinates[0]).toHaveLength(3);
  });

  it('returns null for null/undefined/non-object input rather than throwing', () => {
    expect(convertGeometryToWgs84(null)).toBeNull();
    expect(convertGeometryToWgs84(undefined)).toBeNull();
    expect(convertGeometryToWgs84('not a geometry')).toBeNull();
  });

  it('returns null when type or coordinates is missing', () => {
    expect(convertGeometryToWgs84({ type: 'Point' })).toBeNull();
    expect(convertGeometryToWgs84({ coordinates: [1, 2] })).toBeNull();
  });
});
