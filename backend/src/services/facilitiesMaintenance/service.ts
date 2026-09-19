import { isLtaConfigured } from '../../config/env';
import { LtaDataMallClient, ltaDataMallClient } from '../../lta/client';
import { LtaHttpError, LtaNetworkError, LtaResponseShapeError, LtaTimeoutError } from '../../lta/errors';
import { MissingLtaAccountKeyError } from '../../config/env';
import { LiftMaintenanceEvent, TransportEventProvenance } from '../../models/transportEvent';
import { TtlCache } from '../../utils/ttlCache';
import { logError } from '../../utils/logger';
import { fetchRawFacilitiesMaintenance } from './adapter';
import { normaliseFacilitiesMaintenance } from './normalise';

export type FacilitiesMaintenanceStatus = 'LIVE_SUCCESS' | 'LIVE_EMPTY' | 'LIVE_ERROR';

export interface FacilitiesMaintenanceResult {
  status: FacilitiesMaintenanceStatus;
  provenance: TransportEventProvenance;
  fetchedAt: string;
  recordCount: number;
  skippedRecordCount: number;
  events: LiftMaintenanceEvent[];
  /** Present only on LIVE_ERROR. A generic, secret-free message — never the raw caught error for unrecognised failures. */
  errorMessage?: string;
}

export interface FacilitiesMaintenanceDiagnostics {
  configured: boolean;
  lastRequestAt: string | null;
  lastStatus: FacilitiesMaintenanceStatus | 'NOT_YET_CALLED';
  lastRecordCount: number | null;
  lastErrorMessage?: string;
}

const CACHE_KEY = 'facilitiesMaintenance';
const DEFAULT_CACHE_TTL_MS = 60_000; // avoid hammering DataMall for an ad-hoc-update dataset; tune via env if needed

function resolveCacheTtlMs(): number {
  const raw = Number(process.env.FACILITIES_MAINTENANCE_CACHE_TTL_MS);
  return Number.isFinite(raw) && raw > 0 ? raw : DEFAULT_CACHE_TTL_MS;
}

/** Known, non-secret error types get their message surfaced; anything else gets a generic fallback. */
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
  return 'Unexpected error while fetching LTA FacilitiesMaintenance data.';
}

export class FacilitiesMaintenanceService {
  private readonly cache: TtlCache<FacilitiesMaintenanceResult>;
  private diagnostics: FacilitiesMaintenanceDiagnostics = {
    configured: isLtaConfigured(),
    lastRequestAt: null,
    lastStatus: 'NOT_YET_CALLED',
    lastRecordCount: null,
  };

  constructor(private readonly client: LtaDataMallClient) {
    this.cache = new TtlCache<FacilitiesMaintenanceResult>(resolveCacheTtlMs());
  }

  async getFacilitiesMaintenance(): Promise<FacilitiesMaintenanceResult> {
    const cached = this.cache.get(CACHE_KEY);
    if (cached) return cached;

    const requestedAt = new Date().toISOString();

    try {
      const raw = await fetchRawFacilitiesMaintenance(this.client);
      const { events, skippedCount } = normaliseFacilitiesMaintenance(raw, requestedAt);

      const result: FacilitiesMaintenanceResult = {
        status: events.length > 0 ? 'LIVE_SUCCESS' : 'LIVE_EMPTY',
        provenance: 'LIVE',
        fetchedAt: requestedAt,
        recordCount: events.length,
        skippedRecordCount: skippedCount,
        events,
      };

      this.cache.set(CACHE_KEY, result);
      this.diagnostics = {
        configured: isLtaConfigured(),
        lastRequestAt: requestedAt,
        lastStatus: result.status,
        lastRecordCount: result.recordCount,
      };
      return result;
    } catch (error) {
      logError('facilitiesMaintenance.service.error', error);
      const errorMessage = safeErrorMessage(error);
      const result: FacilitiesMaintenanceResult = {
        status: 'LIVE_ERROR',
        provenance: 'LIVE',
        fetchedAt: requestedAt,
        recordCount: 0,
        skippedRecordCount: 0,
        events: [],
        errorMessage,
      };

      // Errors are never cached, so the next call retries against LTA rather than repeating a stale failure.
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

  /** Returns the last known state without making a new LTA request. Safe to poll frequently. */
  getDiagnosticsSnapshot(): FacilitiesMaintenanceDiagnostics {
    return { ...this.diagnostics, configured: isLtaConfigured() };
  }
}

export const facilitiesMaintenanceService = new FacilitiesMaintenanceService(ltaDataMallClient);
