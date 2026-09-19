import { WeatherClient, weatherClient } from '../../../weather/client';
import { WeatherResponseShapeError, WeatherTimeoutError, WeatherUpstreamError } from '../../../weather/errors';
import { WeatherForecastArea } from '../../../models/weather';
import { TtlCache } from '../../../utils/ttlCache';
import { logError } from '../../../utils/logger';
import { fetchRawTwoHourForecast } from './adapter';
import { normaliseTwoHourForecast } from './normalise';

export type TwoHourForecastStatus = 'LIVE_SUCCESS' | 'LIVE_EMPTY' | 'LIVE_ERROR';

export interface TwoHourForecastResult {
  status: TwoHourForecastStatus;
  provenance: 'LIVE';
  fetchedAt: string;
  recordCount: number;
  areas: WeatherForecastArea[];
  errorMessage?: string;
}

export interface TwoHourForecastDiagnostics {
  lastRequestAt: string | null;
  lastStatus: TwoHourForecastStatus | 'NOT_YET_CALLED';
  lastRecordCount: number | null;
  lastErrorMessage?: string;
}

const CACHE_KEY = 'twoHourForecast';
const DEFAULT_CACHE_TTL_MS = 5 * 60 * 1000; // no key required, but still avoid hammering a free public API

function resolveCacheTtlMs(): number {
  const raw = Number(process.env.WEATHER_TWO_HOUR_FORECAST_CACHE_TTL_MS);
  return Number.isFinite(raw) && raw > 0 ? raw : DEFAULT_CACHE_TTL_MS;
}

function safeErrorMessage(error: unknown): string {
  if (error instanceof WeatherUpstreamError || error instanceof WeatherTimeoutError || error instanceof WeatherResponseShapeError) {
    return error.message;
  }
  return 'Unexpected error while fetching the 2-hour weather forecast.';
}

export class TwoHourForecastService {
  private readonly cache: TtlCache<TwoHourForecastResult>;
  private diagnostics: TwoHourForecastDiagnostics = { lastRequestAt: null, lastStatus: 'NOT_YET_CALLED', lastRecordCount: null };

  constructor(private readonly client: WeatherClient) {
    this.cache = new TtlCache<TwoHourForecastResult>(resolveCacheTtlMs());
  }

  async getTwoHourForecast(): Promise<TwoHourForecastResult> {
    const cached = this.cache.get(CACHE_KEY);
    if (cached) return cached;

    const requestedAt = new Date().toISOString();

    try {
      const raw = await fetchRawTwoHourForecast(this.client);
      const areas = normaliseTwoHourForecast(raw, requestedAt);

      const result: TwoHourForecastResult = {
        status: areas.length > 0 ? 'LIVE_SUCCESS' : 'LIVE_EMPTY',
        provenance: 'LIVE',
        fetchedAt: requestedAt,
        recordCount: areas.length,
        areas,
      };

      this.cache.set(CACHE_KEY, result);
      this.diagnostics = { lastRequestAt: requestedAt, lastStatus: result.status, lastRecordCount: result.recordCount };
      return result;
    } catch (error) {
      logError('twoHourForecast.service.error', error);
      const errorMessage = safeErrorMessage(error);
      const result: TwoHourForecastResult = {
        status: 'LIVE_ERROR',
        provenance: 'LIVE',
        fetchedAt: requestedAt,
        recordCount: 0,
        areas: [],
        errorMessage,
      };
      this.diagnostics = { lastRequestAt: requestedAt, lastStatus: 'LIVE_ERROR', lastRecordCount: null, lastErrorMessage: errorMessage };
      return result;
    }
  }

  getDiagnosticsSnapshot(): TwoHourForecastDiagnostics {
    return { ...this.diagnostics };
  }
}

export const twoHourForecastService = new TwoHourForecastService(weatherClient);
