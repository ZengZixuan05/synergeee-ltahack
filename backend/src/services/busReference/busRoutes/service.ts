import { ltaDataMallClient } from '../../../lta/client';
import { PaginatedReferenceLayerService } from '../layerService';
import { normaliseBusRoutes } from './normalise';

const DEFAULT_CACHE_TTL_MS = 24 * 60 * 60 * 1000; // ad hoc update freq per the guide

function resolveCacheTtlMs(): number {
  const raw = Number(process.env.BUS_ROUTES_CACHE_TTL_MS);
  return Number.isFinite(raw) && raw > 0 ? raw : DEFAULT_CACHE_TTL_MS;
}

export const busRoutesService = new PaginatedReferenceLayerService(
  '/BusRoutes',
  ltaDataMallClient,
  normaliseBusRoutes,
  resolveCacheTtlMs()
);
