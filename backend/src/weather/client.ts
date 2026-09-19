import { logSafe } from '../utils/logger';
import { WeatherTimeoutError, WeatherUpstreamError } from './errors';

// ---------------------------------------------------------------------------
// Reusable client for data.gov.sg's real-time weather APIs
// (https://api-open.data.gov.sg/v2/real-time/api/*) — confirmed live
// 2026-09-19. A third independent third-party integration alongside LTA
// DataMall (src/lta/) and OneMap (src/onemap/): different auth (none needed
// at all — these are public, keyless endpoints per the challenge brief's
// UsefulWebsites.txt), different base URL, different error types.
// ---------------------------------------------------------------------------

const DEFAULT_BASE_URL = 'https://api-open.data.gov.sg/v2/real-time/api';
const DEFAULT_TIMEOUT_MS = 8000;

export interface WeatherClientOptions {
  baseUrl?: string;
  fetchImpl?: typeof fetch;
  timeoutMs?: number;
}

export class WeatherClient {
  private readonly baseUrl: string;
  private readonly fetchImpl: typeof fetch;
  private readonly timeoutMs: number;

  constructor(options: WeatherClientOptions = {}) {
    this.baseUrl = options.baseUrl ?? process.env.WEATHER_BASE_URL ?? DEFAULT_BASE_URL;
    this.fetchImpl = options.fetchImpl ?? fetch;
    this.timeoutMs = options.timeoutMs ?? DEFAULT_TIMEOUT_MS;
  }

  /** GETs one of data.gov.sg's real-time weather endpoints (e.g. "two-hr-forecast", "rainfall") and returns the parsed JSON body, untyped. */
  async get(endpoint: string): Promise<unknown> {
    const url = `${this.baseUrl.replace(/\/$/, '')}/${endpoint.replace(/^\//, '')}`;
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), this.timeoutMs);
    const startedAt = Date.now();

    try {
      const response = await this.fetchImpl(url, { signal: controller.signal });

      logSafe('weather.request', { endpoint, status: response.status, durationMs: Date.now() - startedAt });

      if (!response.ok) {
        throw new WeatherUpstreamError(`data.gov.sg weather request to ${endpoint} failed (HTTP ${response.status})`);
      }
      return await response.json();
    } catch (error) {
      if (error instanceof WeatherUpstreamError) throw error;
      if (error instanceof Error && error.name === 'AbortError') {
        throw new WeatherTimeoutError(endpoint);
      }
      throw new WeatherUpstreamError(
        `data.gov.sg weather request to ${endpoint} failed: ${error instanceof Error ? error.message : 'network error'}`
      );
    } finally {
      clearTimeout(timeout);
    }
  }
}

export const weatherClient = new WeatherClient();
