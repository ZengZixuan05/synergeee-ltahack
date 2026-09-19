import { logError, logSafe, redactHeaders } from '../utils/logger';
import { OneMapConfigError, OneMapTimeoutError, OneMapUpstreamError } from './errors';

// ---------------------------------------------------------------------------
// Reusable OneMap client, for the routing service specifically
// (https://www.onemap.gov.sg/apidocs/routing — confirmed live 2026-09-19).
// This is a second, independent third-party integration alongside LTA
// DataMall — separate auth, separate base URL, separate error types — not
// layered on top of LtaDataMallClient.
//
// Auth mirrors frontend/src/lib/onemap.server.ts (same account, same two
// supported methods): a long-lived static ONEMAP_API_KEY if present,
// otherwise POST /api/auth/post/getToken with ONEMAP_API_EMAIL/PASSWORD,
// caching the resulting token (valid ~3 days) and refreshing before expiry.
// This backend has its own instance of that logic rather than importing
// from frontend/ — the two are independent services (see MONOREPO.md).
//
// Confirmed live: GET /api/public/routingsvc/route?routeType=pt returns an
// OpenTripPlanner-shaped response (plan.itineraries[].legs[], with fields
// like numItineraries/elevationMetadata that are OTP's own vocabulary) —
// this client only fetches and returns that raw JSON; interpreting it is
// services/journeyPlanning's job.
// ---------------------------------------------------------------------------

const DEFAULT_TIMEOUT_MS = 10_000;
const TOKEN_REFRESH_MARGIN_MS = 5 * 60 * 1000;

/** Whether OneMap credentials are present, without revealing them. Safe to log/expose. */
export function isOneMapConfigured(): boolean {
  return Boolean(process.env.ONEMAP_API_KEY || (process.env.ONEMAP_API_EMAIL && process.env.ONEMAP_API_PASSWORD));
}

export type RouteType = 'walk' | 'drive' | 'cycle' | 'pt';

export interface RouteParams {
  /** "lat,lng" */
  start: string;
  /** "lat,lng" */
  end: string;
  routeType: RouteType;
  /** Required for routeType "pt": "MM-DD-YYYY". */
  date?: string;
  /** Required for routeType "pt": "HH:mm:ss". */
  time?: string;
  mode?: 'TRANSIT' | 'BUS' | 'RAIL';
  maxWalkDistance?: number;
  numItineraries?: number;
}

interface CachedToken {
  token: string;
  expiresAtMs: number;
}

export interface OneMapClientOptions {
  baseUrl?: string;
  fetchImpl?: typeof fetch;
  timeoutMs?: number;
}

export class OneMapClient {
  private readonly baseUrl: string;
  private readonly fetchImpl: typeof fetch;
  private readonly timeoutMs: number;
  private cachedToken: CachedToken | null = null;
  private pendingTokenRequest: Promise<string> | null = null;

  constructor(options: OneMapClientOptions = {}) {
    this.baseUrl = options.baseUrl ?? process.env.ONEMAP_BASE_URL ?? 'https://www.onemap.gov.sg';
    this.fetchImpl = options.fetchImpl ?? fetch;
    this.timeoutMs = options.timeoutMs ?? DEFAULT_TIMEOUT_MS;
  }

  private hasStaticApiKey(): boolean {
    return Boolean(process.env.ONEMAP_API_KEY);
  }

  private async fetchNewToken(): Promise<CachedToken> {
    const email = process.env.ONEMAP_API_EMAIL;
    const password = process.env.ONEMAP_API_PASSWORD;
    if (!email || !password) throw new OneMapConfigError();

    const response = await this.fetchImpl(`${this.baseUrl}/api/auth/post/getToken`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });
    if (!response.ok) {
      throw new OneMapUpstreamError(`OneMap authentication failed (HTTP ${response.status})`);
    }
    const data = (await response.json()) as { access_token?: string; expiry_timestamp?: string };
    if (!data.access_token) {
      throw new OneMapUpstreamError('OneMap authentication response did not include an access_token');
    }
    const expirySeconds = Number(data.expiry_timestamp);
    const expiresAtMs = Number.isFinite(expirySeconds) ? expirySeconds * 1000 : Date.now() + 60 * 60 * 1000;
    return { token: data.access_token, expiresAtMs };
  }

  private async getAuthToken(): Promise<string> {
    if (this.hasStaticApiKey()) return process.env.ONEMAP_API_KEY as string;

    const now = Date.now();
    if (this.cachedToken && this.cachedToken.expiresAtMs - TOKEN_REFRESH_MARGIN_MS > now) {
      return this.cachedToken.token;
    }
    if (!this.pendingTokenRequest) {
      this.pendingTokenRequest = this.fetchNewToken()
        .then((token) => {
          this.cachedToken = token;
          return token.token;
        })
        .finally(() => {
          this.pendingTokenRequest = null;
        });
    }
    return this.pendingTokenRequest;
  }

  /** Calls the OneMap routing service and returns the parsed JSON body, untyped — validation belongs to the caller. */
  async route(params: RouteParams): Promise<unknown> {
    if (!isOneMapConfigured()) {
      throw new OneMapConfigError();
    }

    const token = await this.getAuthToken();
    const url = new URL('/api/public/routingsvc/route', this.baseUrl);
    url.searchParams.set('start', params.start);
    url.searchParams.set('end', params.end);
    url.searchParams.set('routeType', params.routeType);
    if (params.date) url.searchParams.set('date', params.date);
    if (params.time) url.searchParams.set('time', params.time);
    if (params.mode) url.searchParams.set('mode', params.mode);
    if (params.maxWalkDistance !== undefined) url.searchParams.set('maxWalkDistance', String(params.maxWalkDistance));
    if (params.numItineraries !== undefined) url.searchParams.set('numItineraries', String(params.numItineraries));

    const headers = { Authorization: token };
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), this.timeoutMs);
    const startedAt = Date.now();

    try {
      const response = await this.fetchImpl(url.toString(), { headers, signal: controller.signal });

      logSafe('onemap.route.request', {
        routeType: params.routeType,
        status: response.status,
        durationMs: Date.now() - startedAt,
        headers: redactHeaders(headers),
      });

      if (response.status === 429) {
        throw new OneMapUpstreamError('OneMap rate limit exceeded, please try again shortly.');
      }
      if (!response.ok) {
        throw new OneMapUpstreamError(`OneMap routing request failed (HTTP ${response.status})`);
      }
      return await response.json();
    } catch (error) {
      if (error instanceof OneMapUpstreamError) throw error;
      if (error instanceof Error && error.name === 'AbortError') {
        throw new OneMapTimeoutError('/api/public/routingsvc/route');
      }
      logError('onemap.route.error', error);
      throw new OneMapUpstreamError(
        `OneMap routing request failed: ${error instanceof Error ? error.message : 'network error'}`
      );
    } finally {
      clearTimeout(timeout);
    }
  }
}

export const oneMapClient = new OneMapClient();
