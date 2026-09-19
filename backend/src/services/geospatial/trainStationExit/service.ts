import { ltaDataMallClient } from '../../../lta/client';
import { GeospatialLayerService } from '../layerService';
import { normaliseTrainStationExits } from './normalise';

const DEFAULT_CACHE_TTL_MS = 24 * 60 * 60 * 1000;

function resolveCacheTtlMs(): number {
  const raw = Number(process.env.TRAIN_STATION_EXIT_CACHE_TTL_MS);
  return Number.isFinite(raw) && raw > 0 ? raw : DEFAULT_CACHE_TTL_MS;
}

export const trainStationExitService = new GeospatialLayerService(
  'TrainStationExit',
  ltaDataMallClient,
  normaliseTrainStationExits,
  resolveCacheTtlMs()
);
