import { ltaDataMallClient } from '../../../lta/client';
import { PaginatedReferenceLayerService } from '../layerService';
import { normaliseBusStops } from './normalise';

// Ad hoc update frequency per the guide — bus stops barely change, so this
// is cached about as long as the GIS layers.
const DEFAULT_CACHE_TTL_MS = 24 * 60 * 60 * 1000;

function resolveCacheTtlMs(): number {
  const raw = Number(process.env.BUS_STOPS_CACHE_TTL_MS);
  return Number.isFinite(raw) && raw > 0 ? raw : DEFAULT_CACHE_TTL_MS;
}

export const busStopsService = new PaginatedReferenceLayerService(
  '/BusStops',
  ltaDataMallClient,
  normaliseBusStops,
  resolveCacheTtlMs()
);
