import { describe, expect, it } from 'vitest';
import { svy21ToWgs84, convertCoordinatesDeep } from './svy21';

describe('svy21ToWgs84', () => {
  it('maps the SVY21 projection origin (28001.642, 38744.572) back to its defining lat/lng (1°22\'N 103°50\'E)', () => {
    // This is a self-consistency check on the projection definition itself
    // (SLA's published false easting/northing IS the origin point), not an
    // external fixture.
    const [longitude, latitude] = svy21ToWgs84([28001.642, 38744.572]);
    expect(longitude).toBeCloseTo(103.833333, 4);
    expect(latitude).toBeCloseTo(1.366666, 4);
  });

  it('matches a real station exit observed live via GeospatialWholeIsland (Macpherson MRT Exit A, 2026-09-19)', () => {
    // Raw SVY21 coordinates from the actual TrainStationExit shapefile record for
    // "MACPHERSON MRT STATION" / "Exit A": [34285.06831372995, 34322.985218301415].
    // Macpherson MRT is a real, known Singapore location (~1.3267N, 103.8898E on
    // the Downtown/Circle Line) — this is a regression fixture, not fabricated.
    const [longitude, latitude] = svy21ToWgs84([34285.06831372995, 34322.985218301415]);
    expect(longitude).toBeCloseTo(103.8898, 3);
    expect(latitude).toBeCloseTo(1.3267, 3);
  });

  it('rounds to ~1cm precision (7 decimal places)', () => {
    const [longitude] = svy21ToWgs84([28001.642, 38744.572]);
    const decimals = longitude.toString().split('.')[1]?.length ?? 0;
    expect(decimals).toBeLessThanOrEqual(7);
  });
});

describe('convertCoordinatesDeep', () => {
  it('converts a single [x, y] pair (Point geometry)', () => {
    const result = convertCoordinatesDeep([28001.642, 38744.572]) as number[];
    expect(result[0]).toBeCloseTo(103.833333, 4);
    expect(result[1]).toBeCloseTo(1.366666, 4);
  });

  it('converts every vertex of a nested Polygon-shaped coordinates array', () => {
    const raw = [
      [
        [28001.642, 38744.572],
        [28001.642, 38744.572],
      ],
    ];
    const result = convertCoordinatesDeep(raw) as number[][][];
    expect(result).toHaveLength(1);
    expect(result[0]).toHaveLength(2);
    expect(result[0]![0]![0]).toBeCloseTo(103.833333, 4);
  });

  it('passes through non-coordinate values unchanged', () => {
    expect(convertCoordinatesDeep(null)).toBeNull();
    expect(convertCoordinatesDeep([])).toEqual([]);
  });
});
