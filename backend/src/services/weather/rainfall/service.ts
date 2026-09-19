import { WeatherClient, weatherClient } from '../../../weather/client';
import { WeatherResponseShapeError, WeatherTimeoutError, WeatherUpstreamError } from '../../../weather/errors';
import { RainfallReading } from '../../../models/weather';
import { TtlCache } from '../../../utils/ttlCache';
import { logError } from '../../../utils/logger';
import { fetchRawRainfall } from './adapter';
import { normaliseRainfall } from './normalise';

export type RainfallStatus = 'LIVE_SUCCESS' | 'LIVE_EMPTY' | 'LIVE_ERROR';

export interface RainfallResult {
  status: RainfallStatus;
  provenance: 'LIVE';
  fetchedAt: string;
  recordCount: number;
  readings: RainfallReading[];
  errorMessage?: string;
}

export interface RainfallDiagnostics {
  lastRequestAt: string | null;
  lastStatus: RainfallStatus | 'NOT_YET_CALLED';
  lastRecordCount: number | null;
  lastErrorMessage?: string;
}

const CACHE_KEY = 'rainfall';
const DEFAULT_CACHE_TTL_MS = 5 * 60 * 1000; // readingType confirmed live: "5 Minute Total"

function resolveCacheTtlMs(): number {
  const raw = Number(process.env.WEATHER_RAINFALL_CACHE_TTL_MS);
  return Number.isFinite(raw) && raw > 0 ? raw : DEFAULT_CACHE_TTL_MS;
}

function safeErrorMessage(error: unknown): string {
  if (error instanceof WeatherUpstreamError || error instanceof WeatherTimeoutError || error instanceof WeatherResponseShapeError) {
    return error.message;
  }
  return 'Unexpected error while fetching rainfall data.';
}

export class RainfallService {
  private readonly cache: TtlCache<RainfallResult>;
  private diagnostics: RainfallDiagnostics = { lastRequestAt: null, lastStatus: 'NOT_YET_CALLED', lastRecordCount: null };

  constructor(private readonly client: WeatherClient) {
    this.cache = new TtlCache<RainfallResult>(resolveCacheTtlMs());
  }

  async getRainfall(): Promise<RainfallResult> {
    const cached = this.cache.get(CACHE_KEY);
    if (cached) return cached;

    const requestedAt = new Date().toISOString();

    try {
      const raw = await fetchRawRainfall(this.client);
      const readings = normaliseRainfall(raw, requestedAt);

      const result: RainfallResult = {
        status: readings.length > 0 ? 'LIVE_SUCCESS' : 'LIVE_EMPTY',
        provenance: 'LIVE',
        fetchedAt: requestedAt,
        recordCount: readings.length,
        readings,
      };

      this.cache.set(CACHE_KEY, result);
      this.diagnostics = { lastRequestAt: requestedAt, lastStatus: result.status, lastRecordCount: result.recordCount };
      return result;
    } catch (error) {
      logError('rainfall.service.error', error);
      const errorMessage = safeErrorMessage(error);
      const result: RainfallResult = {
        status: 'LIVE_ERROR',
        provenance: 'LIVE',
        fetchedAt: requestedAt,
        recordCount: 0,
        readings: [],
        errorMessage,
      };
      this.diagnostics = { lastRequestAt: requestedAt, lastStatus: 'LIVE_ERROR', lastRecordCount: null, lastErrorMessage: errorMessage };
      return result;
    }
  }

  getDiagnosticsSnapshot(): RainfallDiagnostics {
    return { ...this.diagnostics };
  }
}

export const rainfallService = new RainfallService(weatherClient);
