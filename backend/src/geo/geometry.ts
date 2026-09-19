import { convertCoordinatesDeep } from './svy21';

// Minimal GeoJSON-shaped geometry types, WGS84 only (already converted from
// SVY21 by the time anything outside src/geo/ sees these). Deliberately not
// pulling in a full GeoJSON typings dependency for a handful of shapes.
export type WgsGeometry =
  | { type: 'Point'; coordinates: [number, number] }
  | { type: 'MultiPoint'; coordinates: [number, number][] }
  | { type: 'LineString'; coordinates: [number, number][] }
  | { type: 'MultiLineString'; coordinates: [number, number][][] }
  | { type: 'Polygon'; coordinates: [number, number][][] }
  | { type: 'MultiPolygon'; coordinates: [number, number][][][] };

/** Converts a raw (SVY21) GeoJSON-shaped geometry object into WGS84, preserving its `type`. Returns null if the shape is unrecognisable rather than guessing. */
export function convertGeometryToWgs84(raw: unknown): WgsGeometry | null {
  if (!raw || typeof raw !== 'object' || !('type' in raw) || !('coordinates' in raw)) return null;
  const type = (raw as { type: unknown }).type;
  const coordinates = (raw as { coordinates: unknown }).coordinates;
  if (typeof type !== 'string' || coordinates === undefined) return null;

  return { type, coordinates: convertCoordinatesDeep(coordinates) } as WgsGeometry;
}
