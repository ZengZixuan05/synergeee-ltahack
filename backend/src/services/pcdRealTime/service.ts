import { isLtaConfigured, MissingLtaAccountKeyError } from '../../config/env';
import { LtaDataMallClient, ltaDataMallClient } from '../../lta/client';
import { LtaHttpError, LtaNetworkError, LtaResponseShapeError, LtaTimeoutError } from '../../lta/errors';
import { StationCrowdingObservedEvent, TransportEventProvenance } from '../../models/transportEvent';
import { TtlCache } from '../../utils/ttlCache';
import { logError } from '../../utils/logger';
import { fetchAllPcdRealTime } from './adapter';
import { normalisePcdRealTime } from './normalise';

export type PcdRealTimeStatus = 'LIVE_SUCCESS' | 'LIVE_EMPTY' | 'LIVE_ERROR';

export interface PcdRealTimeResult {
  status: PcdRealTimeStatus;
  provenance: TransportEventProvenance;
  fetchedAt: string;
  recordCount: number;
  skippedLineCount: number;
  events: StationCrowdingObservedEvent[];
  errorMessage?: string;
}

export interface PcdRealTimeDiagnostics {
  configured: boolean;
  lastRequestAt: string | null;
  lastStatus: PcdRealTimeStatus | 'NOT_YET_CALLED';
  lastRecordCount: number | null;
  lastErrorMessage?: string;
}

const CACHE_KEY = 'pcdRealTime';
const DEFAULT_CACHE_TTL_MS = 5 * 60 * 1000; // guide: PCDRealTime updates every 10 minutes

function resolveCacheTtlMs(): number {
  const raw = Number(process.env.PCD_REALTIME_CACHE_TTL_MS);
  return Number.isFinite(raw) && raw > 0 ? raw : DEFAULT_CACHE_TTL_MS;
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
  return 'Unexpected error while fetching LTA PCDRealTime data.';
}

/**
 * Fetches real-time station crowding across all 11 known TrainLine codes.
 * Network/HTTP failure on ANY line's request fails the whole result
 * (LIVE_ERROR) — this milestone does not report partial per-line success;
 * see backend/docs/LTA_INTEGRATION.md known limitations.
 */
export class PcdRealTimeService {
  private readonly cache: TtlCache<PcdRealTimeResult>;
  private diagnostics: PcdRealTimeDiagnostics = {
    configured: isLtaConfigured(),
    lastRequestAt: null,
    lastStatus: 'NOT_YET_CALLED',
    lastRecordCount: null,
  };

  constructor(private readonly client: LtaDataMallClient) {
    this.cache = new TtlCache<PcdRealTimeResult>(resolveCacheTtlMs());
  }

  async getStationCrowding(): Promise<PcdRealTimeResult> {
    const cached = this.cache.get(CACHE_KEY);
    if (cached) return cached;

    const requestedAt = new Date().toISOString();

    try {
      const byLine = await fetchAllPcdRealTime(this.client);
      const { events, skippedLineCount } = normalisePcdRealTime(byLine, requestedAt);

      const result: PcdRealTimeResult = {
        status: events.length > 0 ? 'LIVE_SUCCESS' : 'LIVE_EMPTY',
        provenance: 'LIVE',
        fetchedAt: requestedAt,
        recordCount: events.length,
        skippedLineCount,
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
      logError('pcdRealTime.service.error', error);
      const errorMessage = safeErrorMessage(error);
      const result: PcdRealTimeResult = {
        status: 'LIVE_ERROR',
        provenance: 'LIVE',
        fetchedAt: requestedAt,
        recordCount: 0,
        skippedLineCount: 0,
        events: [],
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

  getDiagnosticsSnapshot(): PcdRealTimeDiagnostics {
    return { ...this.diagnostics, configured: isLtaConfigured() };
  }
}

export const pcdRealTimeService = new PcdRealTimeService(ltaDataMallClient);
