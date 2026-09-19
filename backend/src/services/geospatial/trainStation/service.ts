import { ltaDataMallClient } from '../../../lta/client';
import { GeospatialLayerService } from '../layerService';
import { normaliseTrainStations } from './normalise';

// Station footprints barely ever change, so this is cached far longer than
// the ad-hoc FacilitiesMaintenance data — default 24h, tunable via env.
const DEFAULT_CACHE_TTL_MS = 24 * 60 * 60 * 1000;

function resolveCacheTtlMs(): number {
  const raw = Number(process.env.TRAIN_STATION_CACHE_TTL_MS);
  return Number.isFinite(raw) && raw > 0 ? raw : DEFAULT_CACHE_TTL_MS;
}

export const trainStationService = new GeospatialLayerService(
  'TrainStation',
  ltaDataMallClient,
  normaliseTrainStations,
  resolveCacheTtlMs()
);
