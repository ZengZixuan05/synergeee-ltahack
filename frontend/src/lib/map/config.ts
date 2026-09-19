// ---------------------------------------------------------------------------
// Map source configuration. Kept in one place so the tile/style provider can
// be swapped later (e.g. to a licensed MapTiler/Mapbox-compatible style)
// without touching the Directions feature or any map component internals.
// ---------------------------------------------------------------------------

/**
 * OpenFreeMap "Liberty" — a free, unlimited, no-API-key MapLibre style built
 * from OpenStreetMap data via OpenMapTiles. Chosen because it is a CDN-backed
 * provider designed for production use, unlike hot-linking the raw
 * tile.openstreetmap.org raster tiles (which OSM's tile usage policy
 * reserves for light/occasional use). See https://openfreemap.org.
 */
const DEFAULT_MAP_STYLE_URL = 'https://tiles.openfreemap.org/styles/liberty';

export const MAP_STYLE_URL = process.env.NEXT_PUBLIC_MAP_STYLE_URL || DEFAULT_MAP_STYLE_URL;

/** Required attribution text per OSM's copyright/attribution guidelines. */
export const OSM_ATTRIBUTION = '© OpenStreetMap contributors';

export const SINGAPORE_DEFAULT_CENTER: [number, number] = [103.8198, 1.3521];
export const SINGAPORE_DEFAULT_ZOOM = 11;

/**
 * Reserved layer/source id prefixes for a future routing milestone. Not used
 * yet — no route layers are added tonight — but naming them here keeps the
 * eventual addition additive rather than a refactor of MapView.
 */
export const ROUTE_LAYER_IDS = {
  walking: 'route-walking',
  mrt: 'route-mrt',
  bus: 'route-bus',
  original: 'route-original',
  affectedSegment: 'route-affected-segment',
  recommendedAlternative: 'route-recommended-alternative',
} as const;
