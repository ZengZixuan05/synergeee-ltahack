import { getLtaAccountKey, getLtaBaseUrl } from '../config/env';
import { redactHeaders, logSafe } from '../utils/logger';
import { LtaHttpError, LtaNetworkError, LtaResponseShapeError, LtaTimeoutError } from './errors';

// ---------------------------------------------------------------------------
// Reusable LTA DataMall client.
//
// Per the LTA DataMall API User Guide (v6.8, "1. MAKING API CALLS"):
//   - Auth is a single request header literally named `AccountKey`.
//   - Responses are JSON by default (the optional `accept` header can force
//     XML; we always request JSON).
//   - Most endpoints cap each response at 500 records and support paging via
//     a `$skip` query parameter (documented exceptions: Bus Arrival, Train
//     Service Alerts, Passenger Volume, Taxi Stands — those are not paged
//     the same way and callers should use `get()` directly instead of
//     `getAllPages()` for them).
//
// This client only knows about transport (auth, timeouts, HTTP/network
// errors, pagination, safe logging). It has no knowledge of what any given
// endpoint's fields mean — that belongs to each endpoint's adapter/schema.
// ---------------------------------------------------------------------------

const DEFAULT_TIMEOUT_MS = 8000;
const DEFAULT_PAGE_SIZE = 500;
const DEFAULT_MAX_PAGES = 20; // safety cap so a misbehaving endpoint can't loop forever

export interface LtaClientOptions {
  baseUrl?: string;
  /** Overrides the AccountKey read from env — intended for tests only. */
  accountKey?: string;
  timeoutMs?: number;
  fetchImpl?: typeof fetch;
}

export interface LtaGetOptions {
  params?: Record<string, string | number | undefined>;
  timeoutMs?: number;
}

export interface LtaPageOptions extends LtaGetOptions {
  pageSize?: number;
  maxPages?: number;
  /** Name of the array field in the response envelope. Defaults to "value" (the standard LTA OData shape). */
  arrayField?: string;
}

/** Shape shared by paginated LTA OData-style responses: `{ "odata.metadata": ..., value: [...] }`. */
type LtaEnvelope = Record<string, unknown>;

export class LtaDataMallClient {
  private readonly baseUrl: string;
  private readonly accountKeyOverride?: string;
  private readonly timeoutMs: number;
  private readonly fetchImpl: typeof fetch;

  constructor(options: LtaClientOptions = {}) {
    this.baseUrl = options.baseUrl ?? getLtaBaseUrl();
    this.accountKeyOverride = options.accountKey;
    this.timeoutMs = options.timeoutMs ?? DEFAULT_TIMEOUT_MS;
    this.fetchImpl = options.fetchImpl ?? fetch;
  }

  /** Performs a single GET request against `path` and returns the parsed JSON body, untyped. */
  async get(path: string, options: LtaGetOptions = {}): Promise<unknown> {
    const accountKey = this.accountKeyOverride ?? getLtaAccountKey();
    // Plain string concatenation, not `new URL(path, base)`: a `path` with a
    // leading slash would otherwise resolve relative to the origin and
    // silently drop `/ltaodataservice` from the base URL.
    const url = new URL(`${this.baseUrl.replace(/\/$/, '')}/${path.replace(/^\//, '')}`);
    for (const [key, value] of Object.entries(options.params ?? {})) {
      if (value !== undefined) url.searchParams.set(key, String(value));
    }

    const headers = { AccountKey: accountKey, accept: 'application/json' };
    const timeoutMs = options.timeoutMs ?? this.timeoutMs;
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), timeoutMs);
    const startedAt = Date.now();

    try {
      const response = await this.fetchImpl(url.toString(), {
        method: 'GET',
        headers,
        signal: controller.signal,
      });

      logSafe('lta.request', {
        path,
        status: response.status,
        durationMs: Date.now() - startedAt,
        headers: redactHeaders(headers),
      });

      if (!response.ok) {
        throw new LtaHttpError(response.status, path);
      }

      return await response.json();
    } catch (error) {
      if (error instanceof LtaHttpError) throw error;
      if (error instanceof Error && error.name === 'AbortError') {
        throw new LtaTimeoutError(path);
      }
      throw new LtaNetworkError(path, error);
    } finally {
      clearTimeout(timeout);
    }
  }

  /**
   * Repeatedly GETs `path`, following the `$skip`-based pagination documented
   * for most LTA DataMall endpoints, and concatenates each page's array
   * field (default: "value") into a single list. Stops once a page returns
   * fewer than `pageSize` records, or after `maxPages` as a safety cap.
   *
   * Do not use this for endpoints the guide documents as unpaginated
   * exceptions (Bus Arrival, Train Service Alerts, Passenger Volume, Taxi
   * Stands) — call `get()` directly for those instead.
   */
  async getAllPages(path: string, options: LtaPageOptions = {}): Promise<unknown[]> {
    const pageSize = options.pageSize ?? DEFAULT_PAGE_SIZE;
    const maxPages = options.maxPages ?? DEFAULT_MAX_PAGES;
    const arrayField = options.arrayField ?? 'value';

    const results: unknown[] = [];

    for (let page = 0; page < maxPages; page += 1) {
      const skip = page * pageSize;
      const body = (await this.get(path, {
        params: { ...options.params, $skip: skip || undefined },
        timeoutMs: options.timeoutMs,
      })) as LtaEnvelope;

      const items = body?.[arrayField];
      if (!Array.isArray(items)) {
        throw new LtaResponseShapeError(path);
      }

      results.push(...items);

      if (items.length < pageSize) break;
    }

    return results;
  }
}

/** Shared client instance for production use. Tests should construct their own with a mock `fetchImpl`. */
export const ltaDataMallClient = new LtaDataMallClient();
