import { ltaDataMallClient } from '../../../lta/client';
import { GeospatialLayerService } from '../layerService';
import { normaliseCoveredLinkWay } from './normalise';

const DEFAULT_CACHE_TTL_MS = 24 * 60 * 60 * 1000;

function resolveCacheTtlMs(): number {
  const raw = Number(process.env.COVERED_LINKWAY_CACHE_TTL_MS);
  return Number.isFinite(raw) && raw > 0 ? raw : DEFAULT_CACHE_TTL_MS;
}

export const coveredLinkWayService = new GeospatialLayerService(
  'CoveredLinkWay',
  ltaDataMallClient,
  normaliseCoveredLinkWay,
  resolveCacheTtlMs()
);
