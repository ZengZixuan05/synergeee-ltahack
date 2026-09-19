import { isLtaConfigured } from '../../config/env';
import { LtaDataMallClient } from '../../lta/client';
import { GeospatialFetchDeps, RawGeoFeature, fetchGeospatialLayerFeatures } from '../../lta/geospatial';
import { LtaHttpError, LtaNetworkError, LtaResponseShapeError, LtaTimeoutError } from '../../lta/errors';
import { MissingLtaAccountKeyError } from '../../config/env';
import { TtlCache } from '../../utils/ttlCache';
import { logError } from '../../utils/logger';

// Shared orchestration (cache + status tracking + error handling) for the
// three GeospatialWholeIsland layers implemented so far (TrainStation,
// TrainStationExit, CoveredLinkWay). Their fetch/cache/status shape is
// identical — only the layer id and the properties→domain-model
// normalisation differ — so this is factored once rather than duplicated
// three times, the same way FacilitiesMaintenanceService would be if a
// second FacilitiesMaintenance-shaped endpoint existed.

export type GeospatialLayerStatus = 'LIVE_SUCCESS' | 'LIVE_EMPTY' | 'LIVE_ERROR';

export interface GeospatialLayerResult<T> {
  status: GeospatialLayerStatus;
  provenance: 'LIVE';
  fetchedAt: string;
  recordCount: number;
  skippedRecordCount: number;
  records: T[];
  errorMessage?: string;
}

export interface GeospatialLayerDiagnostics {
  configured: boolean;
  lastRequestAt: string | null;
  lastStatus: GeospatialLayerStatus | 'NOT_YET_CALLED';
  lastRecordCount: number | null;
  lastErrorMessage?: string;
}

export interface NormaliseFeatures<T> {
  (features: RawGeoFeature[], fetchedAt: string): { records: T[]; skippedCount: number };
}

function safeErrorMessage(error: unknown): string {
  if (
    error instanceof LtaHttpError ||
    error instanceof LtaTimeoutError ||
    error instanceof LtaNetworkError ||
    error instanceof LtaResponseShapeError ||
    error instanceof MissingLtaAccountKeyError
  ) {
    return error.message;
  }
  return 'Unexpected error while fetching an LTA geospatial layer.';
}

export class GeospatialLayerService<T> {
  private readonly cache: TtlCache<GeospatialLayerResult<T>>;
  private diagnostics: GeospatialLayerDiagnostics = {
    configured: isLtaConfigured(),
    lastRequestAt: null,
    lastStatus: 'NOT_YET_CALLED',
    lastRecordCount: null,
  };

  constructor(
    private readonly layerId: string,
    private readonly client: LtaDataMallClient,
    private readonly normalise: NormaliseFeatures<T>,
    cacheTtlMs: number,
    private readonly fetchDeps: GeospatialFetchDeps = {}
  ) {
    this.cache = new TtlCache<GeospatialLayerResult<T>>(cacheTtlMs);
  }

  async getLayer(): Promise<GeospatialLayerResult<T>> {
    const cacheKey = this.layerId;
    const cached = this.cache.get(cacheKey);
    if (cached) return cached;

    const requestedAt = new Date().toISOString();

    try {
      const features = await fetchGeospatialLayerFeatures(this.client, this.layerId, this.fetchDeps);
      const { records, skippedCount } = this.normalise(features, requestedAt);

      const result: GeospatialLayerResult<T> = {
        status: records.length > 0 ? 'LIVE_SUCCESS' : 'LIVE_EMPTY',
        provenance: 'LIVE',
        fetchedAt: requestedAt,
        recordCount: records.length,
        skippedRecordCount: skippedCount,
        records,
      };

      this.cache.set(cacheKey, result);
      this.diagnostics = {
        configured: isLtaConfigured(),
        lastRequestAt: requestedAt,
        lastStatus: result.status,
        lastRecordCount: result.recordCount,
      };
      return result;
    } catch (error) {
      logError(`geospatial.${this.layerId}.error`, error);
      const errorMessage = safeErrorMessage(error);
      const result: GeospatialLayerResult<T> = {
        status: 'LIVE_ERROR',
        provenance: 'LIVE',
        fetchedAt: requestedAt,
        recordCount: 0,
        skippedRecordCount: 0,
        records: [],
        errorMessage,
      };

      this.diagnostics = {
        configured: isLtaConfigured(),
        lastRequestAt: requestedAt,
        lastStatus: 'LIVE_ERROR',
        lastRecordCount: null,
        lastErrorMessage: errorMessage,
      };
      return result;
    }
  }

  getDiagnosticsSnapshot(): GeospatialLayerDiagnostics {
    return { ...this.diagnostics, configured: isLtaConfigured() };
  }
}
