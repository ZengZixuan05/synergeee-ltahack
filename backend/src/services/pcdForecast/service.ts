import { isLtaConfigured, MissingLtaAccountKeyError } from '../../config/env';
import { LtaDataMallClient, ltaDataMallClient } from '../../lta/client';
import { LtaHttpError, LtaNetworkError, LtaResponseShapeError, LtaTimeoutError } from '../../lta/errors';
import { StationCrowdingForecast } from '../../models/stationCrowdingForecast';
import { TransportEventProvenance } from '../../models/transportEvent';
import { TtlCache } from '../../utils/ttlCache';
import { logError } from '../../utils/logger';
import { fetchAllPcdForecast } from './adapter';
import { normalisePcdForecast } from './normalise';

export type PcdForecastStatus = 'LIVE_SUCCESS' | 'LIVE_EMPTY' | 'LIVE_ERROR';

export interface PcdForecastResult {
  status: PcdForecastStatus;
  provenance: TransportEventProvenance;
  fetchedAt: string;
  recordCount: number;
  skippedLineCount: number;
  records: StationCrowdingForecast[];
  errorMessage?: string;
}

export interface PcdForecastDiagnostics {
  configured: boolean;
  lastRequestAt: string | null;
  lastStatus: PcdForecastStatus | 'NOT_YET_CALLED';
  lastRecordCount: number | null;
  lastErrorMessage?: string;
}

const CACHE_KEY = 'pcdForecast';
const DEFAULT_CACHE_TTL_MS = 12 * 60 * 60 * 1000; // guide: PCDForecast updates every 24 hours

function resolveCacheTtlMs(): number {
  const raw = Number(process.env.PCD_FORECAST_CACHE_TTL_MS);
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
  return 'Unexpected error while fetching LTA PCDForecast data.';
}

export class PcdForecastService {
  private readonly cache: TtlCache<PcdForecastResult>;
  private diagnostics: PcdForecastDiagnostics = {
    configured: isLtaConfigured(),
    lastRequestAt: null,
    lastStatus: 'NOT_YET_CALLED',
    lastRecordCount: null,
  };

  constructor(private readonly client: LtaDataMallClient) {
    this.cache = new TtlCache<PcdForecastResult>(resolveCacheTtlMs());
  }

  async getStationCrowdingForecast(): Promise<PcdForecastResult> {
    const cached = this.cache.get(CACHE_KEY);
    if (cached) return cached;

    const requestedAt = new Date().toISOString();

    try {
      const byLine = await fetchAllPcdForecast(this.client);
      const { records, skippedLineCount } = normalisePcdForecast(byLine, requestedAt);

      const result: PcdForecastResult = {
        status: records.length > 0 ? 'LIVE_SUCCESS' : 'LIVE_EMPTY',
        provenance: 'LIVE',
        fetchedAt: requestedAt,
        recordCount: records.length,
        skippedLineCount,
        records,
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
      logError('pcdForecast.service.error', error);
      const errorMessage = safeErrorMessage(error);
      const result: PcdForecastResult = {
        status: 'LIVE_ERROR',
        provenance: 'LIVE',
        fetchedAt: requestedAt,
        recordCount: 0,
        skippedLineCount: 0,
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

  getDiagnosticsSnapshot(): PcdForecastDiagnostics {
    return { ...this.diagnostics, configured: isLtaConfigured() };
  }
}

export const pcdForecastService = new PcdForecastService(ltaDataMallClient);
