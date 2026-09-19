'use client';

import React, { useEffect, useRef, useState } from 'react';
// Type-only import: erased at build time, so this never pulls the runtime
// library into the webpack bundle (see the CDN-loading note below).
import type { Map as MapLibreMap, Marker as MapLibreMarker } from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import { Place } from '@/types/place';
import { JourneyItinerary, JourneyLeg } from '@/types/journeyPlan';
import { cn } from '@/lib/utils';
import { MAP_STYLE_URL, OSM_ATTRIBUTION, ROUTE_LAYER_IDS, SINGAPORE_DEFAULT_CENTER, SINGAPORE_DEFAULT_ZOOM } from '@/lib/map/config';

type MapLibreModule = typeof import('maplibre-gl');

// maplibre-gl v6 spins up its tile worker via `new Worker(new URL(...,
// import.meta.url))`. Next's webpack build does not rewrite that URL for a
// pre-built dependency, so a webpack-bundled copy requests a worker script
// that resolves to Next's own dev/prod server, gets its HTML fallback back
// instead of a JS module, and silently never finishes loading the style —
// only the flat background layer paints, no tiles/roads/labels ever render.
// Loading the library from its own CDN build (unbundled) sidesteps the
// bundler entirely: the worker's relative import.meta.url then resolves
// against jsdelivr, where the real file lives. jsdelivr is an approved CDN
// for this project's tooling. Cached at module scope so it's fetched once.
const MAPLIBRE_CDN_URL = 'https://cdn.jsdelivr.net/npm/maplibre-gl@6.10.0/dist/maplibre-gl.mjs';
let maplibreModulePromise: Promise<MapLibreModule> | null = null;
function loadMaplibre(): Promise<MapLibreModule> {
  if (!maplibreModulePromise) {
    maplibreModulePromise = import(/* webpackIgnore: true */ MAPLIBRE_CDN_URL);
  }
  return maplibreModulePromise;
}

interface MapViewProps {
  origin?: Place | null;
  destination?: Place | null;
  itinerary?: JourneyItinerary | null;
  className?: string;
  heightClass?: string;
}

const ORIGIN_MARKER_COLOR = '#64748b'; // slate-500, matches the "From" dot
const DESTINATION_MARKER_COLOR = '#004b87'; // civic transit blue, matches the "To" dot
// Generous, asymmetric padding: the top-right corner also hosts the zoom
// controls, and a marker's pin extends ~40px above its coordinate, so a
// bound point placed too close to that corner gets visually clipped/hidden
// behind the controls without this extra clearance.
const FIT_BOUNDS_PADDING = { top: 90, bottom: 56, left: 48, right: 72 };
const SINGLE_POINT_ZOOM = 15;

function routeLayerIdForLeg(leg: JourneyLeg): string {
  if (leg.mode === 'WALK') return ROUTE_LAYER_IDS.walking;
  if (leg.mode === 'BUS') return ROUTE_LAYER_IDS.bus;
  return ROUTE_LAYER_IDS.mrt;
}

const ROUTE_LEG_COLORS: Record<string, string> = {
  [ROUTE_LAYER_IDS.walking]: '#64748b', // slate-500, dashed
  [ROUTE_LAYER_IDS.mrt]: '#009645', // matches the rail leg icon color used elsewhere
  [ROUTE_LAYER_IDS.bus]: '#d97706', // amber-600, matches the bus leg icon color used elsewhere
};

const ALL_ROUTE_LAYER_IDS = [ROUTE_LAYER_IDS.walking, ROUTE_LAYER_IDS.mrt, ROUTE_LAYER_IDS.bus];

export function MapView({ origin, destination, itinerary, className, heightClass = 'h-52' }: MapViewProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<MapLibreMap | null>(null);
  const originMarkerRef = useRef<MapLibreMarker | null>(null);
  const destinationMarkerRef = useRef<MapLibreMarker | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [isMapReady, setIsMapReady] = useState(false);

  // Create the map once the library has loaded from the CDN.
  useEffect(() => {
    if (!containerRef.current) return;
    let cancelled = false;

    loadMaplibre()
      .then((maplibregl) => {
        if (cancelled || !containerRef.current || mapRef.current) return;

        const map = new maplibregl.Map({
          container: containerRef.current,
          style: MAP_STYLE_URL,
          center: SINGAPORE_DEFAULT_CENTER,
          zoom: SINGAPORE_DEFAULT_ZOOM,
          attributionControl: false,
        });

        map.addControl(new maplibregl.NavigationControl({ showCompass: false }), 'top-right');
        map.addControl(
          new maplibregl.AttributionControl({ compact: false, customAttribution: OSM_ATTRIBUTION }),
          'bottom-right'
        );

        mapRef.current = map;
        applyMarkers(map, maplibregl);
        map.on('load', () => setIsMapReady(true));
      })
      .catch(() => {
        if (!cancelled) setLoadError('Map failed to load. Check your connection and reload the page.');
      });

    const resizeObserver = new ResizeObserver(() => mapRef.current?.resize());
    if (containerRef.current) resizeObserver.observe(containerRef.current);

    return () => {
      cancelled = true;
      resizeObserver.disconnect();
      mapRef.current?.remove();
      mapRef.current = null;
      setIsMapReady(false);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function applyMarkers(map: MapLibreMap, maplibregl: MapLibreModule) {
    originMarkerRef.current?.remove();
    destinationMarkerRef.current?.remove();
    originMarkerRef.current = null;
    destinationMarkerRef.current = null;

    if (origin) {
      originMarkerRef.current = new maplibregl.Marker({ color: ORIGIN_MARKER_COLOR })
        .setLngLat([origin.longitude, origin.latitude])
        .setPopup(new maplibregl.Popup({ offset: 20 }).setText(origin.label))
        .addTo(map);
    }

    if (destination) {
      destinationMarkerRef.current = new maplibregl.Marker({ color: DESTINATION_MARKER_COLOR })
        .setLngLat([destination.longitude, destination.latitude])
        .setPopup(new maplibregl.Popup({ offset: 20 }).setText(destination.label))
        .addTo(map);
    }

    if (origin && destination) {
      const bounds = new maplibregl.LngLatBounds(
        [origin.longitude, origin.latitude],
        [origin.longitude, origin.latitude]
      );
      bounds.extend([destination.longitude, destination.latitude]);
      map.fitBounds(bounds, { padding: FIT_BOUNDS_PADDING, maxZoom: 16, duration: 600 });
    } else if (origin || destination) {
      const point = (origin || destination)!;
      map.flyTo({ center: [point.longitude, point.latitude], zoom: SINGLE_POINT_ZOOM, duration: 600 });
    } else {
      map.flyTo({ center: SINGAPORE_DEFAULT_CENTER, zoom: SINGAPORE_DEFAULT_ZOOM, duration: 600 });
    }
  }

  // Keep markers and camera in sync with the selected origin/destination.
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    loadMaplibre().then((maplibregl) => applyMarkers(map, maplibregl));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [origin, destination]);

  function clearRoute(map: MapLibreMap) {
    for (const layerId of ALL_ROUTE_LAYER_IDS) {
      if (map.getLayer(layerId)) map.removeLayer(layerId);
      if (map.getSource(layerId)) map.removeSource(layerId);
    }
  }

  function applyRoute(map: MapLibreMap, maplibregl: MapLibreModule) {
    clearRoute(map);
    if (!itinerary) return;

    const featuresByLayer = new Map<string, GeoJSON.Feature[]>();
    for (const leg of itinerary.legs) {
      const layerId = routeLayerIdForLeg(leg);
      const feature: GeoJSON.Feature = { type: 'Feature', properties: {}, geometry: leg.geometry };
      featuresByLayer.set(layerId, [...(featuresByLayer.get(layerId) ?? []), feature]);
    }

    const bounds = new maplibregl.LngLatBounds();
    let hasBoundsPoint = false;

    for (const [layerId, features] of featuresByLayer) {
      map.addSource(layerId, { type: 'geojson', data: { type: 'FeatureCollection', features } });
      map.addLayer({
        id: layerId,
        type: 'line',
        source: layerId,
        layout: { 'line-join': 'round', 'line-cap': 'round' },
        paint: {
          'line-color': ROUTE_LEG_COLORS[layerId] ?? '#004b87',
          'line-width': 4,
          ...(layerId === ROUTE_LAYER_IDS.walking ? { 'line-dasharray': [1, 1.5] } : {}),
        },
      });

      for (const feature of features) {
        if (feature.geometry.type === 'LineString') {
          for (const coord of feature.geometry.coordinates) {
            bounds.extend(coord as [number, number]);
            hasBoundsPoint = true;
          }
        }
      }
    }

    if (hasBoundsPoint) {
      map.fitBounds(bounds, { padding: FIT_BOUNDS_PADDING, maxZoom: 16, duration: 600 });
    }
  }

  // Draw the planned itinerary's legs as route lines once the map has
  // finished its initial style load (adding sources/layers any earlier fails
  // silently) and whenever the itinerary changes.
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !isMapReady) return;
    loadMaplibre().then((maplibregl) => applyRoute(map, maplibregl));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [itinerary, isMapReady]);

  return (
    <div className="relative">
      <div
        ref={containerRef}
        role="region"
        aria-label="Interactive map of Singapore"
        className={cn(
          'w-full rounded-2xl overflow-hidden border-2 border-slate-300 shadow-inner bg-[#f8f4f0]',
          heightClass,
          className
        )}
      />
      {loadError && (
        <div className="absolute inset-0 flex items-center justify-center p-4 text-center text-xs font-medium text-slate-600 bg-white/90 rounded-2xl">
          {loadError}
        </div>
      )}
    </div>
  );
}
