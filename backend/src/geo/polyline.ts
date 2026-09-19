// Decodes the "encoded polyline algorithm format" (Google's original
// precision-5 variant) that OneMap's routing service returns for both
// `route_geometry` (routeType=walk/drive/cycle) and each leg's
// `legGeometry.points` (routeType=pt) — confirmed live 2026-09-19 by
// decoding a real Bedok-to-SGH route and checking the output against known
// station coordinates. Not LTA-specific; this has nothing to do with SVY21
// (src/geo/svy21.ts) — OneMap already returns WGS84 lat/lng.
//
// Reference: https://developers.google.com/maps/documentation/utilities/polylinealgorithm

/** Returns [longitude, latitude] pairs, GeoJSON coordinate order. */
export function decodePolyline(encoded: string, precision = 5): [number, number][] {
  const factor = Math.pow(10, precision);
  const coordinates: [number, number][] = [];
  let index = 0;
  let lat = 0;
  let lng = 0;

  while (index < encoded.length) {
    lat += decodeSignedValue();
    lng += decodeSignedValue();
    coordinates.push([lng / factor, lat / factor]);
  }

  function decodeSignedValue(): number {
    let result = 0;
    let shift = 0;
    let byte: number;
    do {
      byte = encoded.charCodeAt(index++) - 63;
      result |= (byte & 0x1f) << shift;
      shift += 5;
    } while (byte >= 0x20);
    return result & 1 ? ~(result >> 1) : result >> 1;
  }

  return coordinates;
}
