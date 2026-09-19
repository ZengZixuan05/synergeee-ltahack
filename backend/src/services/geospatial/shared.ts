import { convertGeometryToWgs84, WgsGeometry } from '../../geo/geometry';
import { RawGeoFeature } from '../../lta/geospatial';
import { logError } from '../../utils/logger';

/** Validates and converts one raw feature's geometry to WGS84, or returns null (and logs) if it's missing/unrecognisable — callers skip the record rather than emitting one with bad geometry. */
export function requireWgs84Geometry(feature: RawGeoFeature, layerId: string, index: number): WgsGeometry | null {
  const converted = convertGeometryToWgs84(feature.geometry);
  if (!converted) {
    logError(`geospatial.${layerId}.normalise.skip`, new Error('Missing or unrecognised geometry'), { index });
    return null;
  }
  return converted;
}

/**
 * Id for one feature within a layer. Always includes the feature's index so
 * two distinct records can never collide (e.g. a station footprint split
 * into multiple polygon features with the same name) — the optional
 * discriminator is appended only to make the id more readable/searchable.
 */
export function buildGeospatialId(layerId: string, index: number, discriminator?: string | number | null): string {
  if (discriminator !== undefined && discriminator !== null && discriminator !== '') {
    const slug = String(discriminator).trim().toLowerCase().replace(/[^a-z0-9]+/g, '-');
    return `${layerId}:${index}:${slug}`;
  }
  return `${layerId}:${index}`;
}
