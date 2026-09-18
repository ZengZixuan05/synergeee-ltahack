import { Place } from '@/types/place';

// ---------------------------------------------------------------------------
// Server-only OneMap adapter.
//
// This module must never be imported from a Client Component — it reads
// secret credentials from process.env and calls OneMap directly. It is only
// ever used from Next.js Route Handlers (src/app/api/places/*), which run on
// the server and proxy normalised results to the browser.
//
// Authentication (per https://www.onemap.gov.sg/apidocs/authentication,
// verified September 2026):
//   POST /api/auth/post/getToken  { email, password } -> { access_token, expiry_timestamp }
//   Token is valid for 3 days and does not auto-renew; callers must
//   re-authenticate once it expires. We cache it in module scope and refresh
//   a little before it actually expires.
//
// Some OneMap accounts are instead issued a long-lived static API token
// (ONEMAP_API_KEY) from the OneMap "Register"/Account Settings flow, which
// can be used directly as the Authorization header without the getToken
// exchange. If present, we prefer it and skip the login flow entirely.
// ---------------------------------------------------------------------------

const ONEMAP_BASE_URL = process.env.ONEMAP_BASE_URL || 'https://www.onemap.gov.sg';
const TOKEN_REFRESH_MARGIN_MS = 5 * 60 * 1000; // refresh 5 min before expiry

interface CachedToken {
  token: string;
  expiresAtMs: number;
}

let cachedToken: CachedToken | null = null;
let pendingTokenRequest: Promise<string> | null = null;

function hasStaticApiKey(): boolean {
  return Boolean(process.env.ONEMAP_API_KEY);
}

async function fetchNewToken(): Promise<CachedToken> {
  const email = process.env.ONEMAP_API_EMAIL;
  const password = process.env.ONEMAP_API_PASSWORD;

  if (!email || !password) {
    throw new OneMapConfigError(
      'OneMap is not configured: set ONEMAP_API_KEY, or both ONEMAP_API_EMAIL and ONEMAP_API_PASSWORD, in .env.local.'
    );
  }

  const response = await fetch(`${ONEMAP_BASE_URL}/api/auth/post/getToken`, {
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

/** Returns a valid Authorization token for OneMap, minting/refreshing it as needed. */
async function getAuthToken(): Promise<string> {
  if (hasStaticApiKey()) {
    return process.env.ONEMAP_API_KEY as string;
  }

  const now = Date.now();
  if (cachedToken && cachedToken.expiresAtMs - TOKEN_REFRESH_MARGIN_MS > now) {
    return cachedToken.token;
  }

  // Coalesce concurrent refreshes into a single in-flight request.
  if (!pendingTokenRequest) {
    pendingTokenRequest = fetchNewToken()
      .then((token) => {
        cachedToken = token;
        return token.token;
      })
      .finally(() => {
        pendingTokenRequest = null;
      });
  }

  return pendingTokenRequest;
}

export class OneMapConfigError extends Error {}
export class OneMapUpstreamError extends Error {}

interface OneMapSearchResult {
  SEARCHVAL: string;
  BLK_NO?: string;
  ROAD_NAME?: string;
  BUILDING?: string;
  ADDRESS: string;
  POSTAL?: string;
  X: string;
  Y: string;
  LATITUDE: string;
  LONGITUDE: string;
}

interface OneMapSearchResponse {
  found: number;
  totalNumPages: number;
  pageNum: number;
  results: OneMapSearchResult[];
  error?: string;
}

function normalise(result: OneMapSearchResult, index: number): Place {
  return {
    id: `onemap:${result.POSTAL || result.ADDRESS}:${index}`,
    label: result.BUILDING && result.BUILDING !== 'NIL' ? result.BUILDING : result.SEARCHVAL,
    address: result.ADDRESS,
    latitude: Number(result.LATITUDE),
    longitude: Number(result.LONGITUDE),
    source: 'onemap',
  };
}

/**
 * Searches OneMap for Singapore places/addresses matching `query`, retrying
 * once on a 401 in case the cached token was invalidated server-side.
 */
export async function searchOneMapPlaces(query: string): Promise<Place[]> {
  const doSearch = async (): Promise<Response> => {
    const token = await getAuthToken();
    const url = new URL('/api/common/elastic/search', ONEMAP_BASE_URL);
    url.searchParams.set('searchVal', query);
    url.searchParams.set('returnGeom', 'Y');
    url.searchParams.set('getAddrDetails', 'Y');
    url.searchParams.set('pageNum', '1');

    return fetch(url.toString(), {
      headers: { Authorization: token },
    });
  };

  let response = await doSearch();

  if (response.status === 401 && !hasStaticApiKey()) {
    cachedToken = null; // force a fresh token and retry once
    response = await doSearch();
  }

  if (response.status === 429) {
    throw new OneMapUpstreamError('OneMap rate limit exceeded, please try again shortly.');
  }

  if (!response.ok) {
    throw new OneMapUpstreamError(`OneMap search failed (HTTP ${response.status})`);
  }

  const data = (await response.json()) as OneMapSearchResponse;

  return (data.results || [])
    .filter((r) => Number.isFinite(Number(r.LATITUDE)) && Number.isFinite(Number(r.LONGITUDE)))
    .map(normalise);
}
