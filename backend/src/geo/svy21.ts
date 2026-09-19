import proj4 from 'proj4';

// ---------------------------------------------------------------------------
// SVY21 (EPSG:3414) — Singapore's official projected coordinate system —
// converted to WGS84 lat/lng.
//
// Confirmed live (2026-09-19): every GeospatialWholeIsland shapefile layer
// (TrainStation, TrainStationExit, CoveredLinkWay) returns geometry in SVY21
// projected metres, not WGS84 degrees — e.g. a real TrainStation vertex was
// `[36786.93, 41775.31]`, nowhere near a Singapore lat/lng. The LTA guide
// does not mention this; it was only discoverable by inspecting a live
// response. Left unconverted, this geometry would be useless to anything
// expecting lat/lng (a map, OneMap coordinates, a distance calculation).
//
// The projection parameters below are the Singapore Land Authority's public
// SVY21 definition (Transverse Mercator, origin 1°22'N 103°50'E, false
// easting/northing 28001.642 / 38744.572, WGS84 ellipsoid) — not something
// invented for this project; see https://epsg.io/3414.
// ---------------------------------------------------------------------------

const SVY21_DEF =
  '+proj=tmerc +lat_0=1.366666666666667 +lon_0=103.8333333333333 +k=1 +x_0=28001.642 +y_0=38744.572 +ellps=WGS84 +units=m +no_defs';
const WGS84_DEF = 'WGS84';

/** Converts an [easting, northing] SVY21 pair to [longitude, latitude] WGS84 degrees, rounded to ~1cm precision. */
export function svy21ToWgs84([easting, northing]: [number, number]): [number, number] {
  const [longitude, latitude] = proj4(SVY21_DEF, WGS84_DEF, [easting, northing]);
  return [round7(longitude), round7(latitude)];
}

function round7(value: number): number {
  return Math.round(value * 1e7) / 1e7;
}

/** Recursively converts every [x, y] coordinate pair in a GeoJSON-style coordinates array, regardless of nesting depth (Point vs Polygon vs MultiPolygon). */
export function convertCoordinatesDeep(coordinates: unknown): unknown {
  if (
    Array.isArray(coordinates) &&
    coordinates.length >= 2 &&
    typeof coordinates[0] === 'number' &&
    typeof coordinates[1] === 'number'
  ) {
    return svy21ToWgs84([coordinates[0], coordinates[1]]);
  }
  if (Array.isArray(coordinates)) {
    return coordinates.map(convertCoordinatesDeep);
  }
  return coordinates;
}
