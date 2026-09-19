import { isLtaConfigured, MissingLtaAccountKeyError } from '../../config/env';
import { LtaDataMallClient } from '../../lta/client';
import { LtaHttpError, LtaNetworkError, LtaResponseShapeError, LtaTimeoutError } from '../../lta/errors';
import { TtlCache } from '../../utils/ttlCache';
import { logError } from '../../utils/logger';

// Shared orchestration for the three standard OData `{ value: [...] }`,
// $skip-paginated bus reference endpoints (BusStops, BusServices,
// BusRoutes) — structurally identical to each other (and to
// FacilitiesMaintenance) apart from the endpoint path and the raw
// record→domain-model normalisation, so this is factored once. This
// deliberately does not replace `FacilitiesMaintenanceService`, which
// shipped and was verified before this generalisation existed — migrating
// it is a pure refactor with no behaviour change, left for a later pass
// rather than risking regressions in already-verified code.

export type ReferenceLayerStatus = 'LIVE_SUCCESS' | 'LIVE_EMPTY' | 'LIVE_ERROR';

export interface ReferenceLayerResult<T> {
  status: ReferenceLayerStatus;
  provenance: 'LIVE';
  fetchedAt: string;
  recordCount: number;
  skippedRecordCount: number;
  records: T[];
  errorMessage?: string;
}

export interface ReferenceLayerDiagnostics {
  configured: boolean;
  lastRequestAt: string | null;
  lastStatus: ReferenceLayerStatus | 'NOT_YET_CALLED';
  lastRecordCount: number | null;
  lastErrorMessage?: string;
}

export interface NormaliseReferenceRecords<T> {
  (raw: unknown[], fetchedAt: string): { records: T[]; skippedCount: number };
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
  return 'Unexpected error while fetching an LTA bus reference layer.';
}

export class PaginatedReferenceLayerService<T> {
  private readonly cache: TtlCache<ReferenceLayerResult<T>>;
  private diagnostics: ReferenceLayerDiagnostics = {
    configured: isLtaConfigured(),
    lastRequestAt: null,
    lastStatus: 'NOT_YET_CALLED',
    lastRecordCount: null,
  };

  constructor(
    private readonly path: string,
    private readonly client: LtaDataMallClient,
    private readonly normalise: NormaliseReferenceRecords<T>,
    cacheTtlMs: number
  ) {
    this.cache = new TtlCache<ReferenceLayerResult<T>>(cacheTtlMs);
  }

  async getLayer(): Promise<ReferenceLayerResult<T>> {
    const cacheKey = this.path;
    const cached = this.cache.get(cacheKey);
    if (cached) return cached;

    const requestedAt = new Date().toISOString();

    try {
      const raw = await this.client.getAllPages(this.path);
      const { records, skippedCount } = this.normalise(raw, requestedAt);

      const result: ReferenceLayerResult<T> = {
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
      logError(`busReference.${this.path}.error`, error);
      const errorMessage = safeErrorMessage(error);
      const result: ReferenceLayerResult<T> = {
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

  getDiagnosticsSnapshot(): ReferenceLayerDiagnostics {
    return { ...this.diagnostics, configured: isLtaConfigured() };
  }
}
