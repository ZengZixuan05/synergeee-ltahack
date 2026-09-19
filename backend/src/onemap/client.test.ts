import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { isOneMapConfigured, OneMapClient } from './client';
import { OneMapConfigError, OneMapTimeoutError, OneMapUpstreamError } from './errors';

function jsonResponse(body: unknown, init: { status?: number } = {}): Response {
  return new Response(JSON.stringify(body), { status: init.status ?? 200, headers: { 'content-type': 'application/json' } });
}

const ORIGINAL_ENV = {
  ONEMAP_API_KEY: process.env.ONEMAP_API_KEY,
  ONEMAP_API_EMAIL: process.env.ONEMAP_API_EMAIL,
  ONEMAP_API_PASSWORD: process.env.ONEMAP_API_PASSWORD,
};

function clearOneMapEnv() {
  delete process.env.ONEMAP_API_KEY;
  delete process.env.ONEMAP_API_EMAIL;
  delete process.env.ONEMAP_API_PASSWORD;
}

afterEach(() => {
  process.env.ONEMAP_API_KEY = ORIGINAL_ENV.ONEMAP_API_KEY;
  process.env.ONEMAP_API_EMAIL = ORIGINAL_ENV.ONEMAP_API_EMAIL;
  process.env.ONEMAP_API_PASSWORD = ORIGINAL_ENV.ONEMAP_API_PASSWORD;
});

beforeEach(() => {
  clearOneMapEnv();
});

describe('isOneMapConfigured', () => {
  it('is true with a static key, true with an email+password pair, false with neither', () => {
    expect(isOneMapConfigured()).toBe(false);
    process.env.ONEMAP_API_KEY = 'test-key';
    expect(isOneMapConfigured()).toBe(true);
    delete process.env.ONEMAP_API_KEY;
    process.env.ONEMAP_API_EMAIL = 'a@b.com';
    process.env.ONEMAP_API_PASSWORD = 'pw';
    expect(isOneMapConfigured()).toBe(true);
  });
});

describe('OneMapClient.route', () => {
  it('uses the static API key directly as the Authorization header, without a token exchange', async () => {
    process.env.ONEMAP_API_KEY = 'static-test-key';
    const fetchImpl = vi.fn().mockResolvedValue(jsonResponse({ plan: { itineraries: [] } }));
    const client = new OneMapClient({ fetchImpl });

    await client.route({ start: '1.3,103.8', end: '1.4,103.9', routeType: 'pt', date: '01-01-2026', time: '09:00:00' });

    expect(fetchImpl).toHaveBeenCalledTimes(1);
    const [, init] = fetchImpl.mock.calls[0]!;
    expect((init.headers as Record<string, string>).Authorization).toBe('static-test-key');
  });

  it('exchanges email+password for a token, then reuses the cached token on a second call', async () => {
    process.env.ONEMAP_API_EMAIL = 'a@b.com';
    process.env.ONEMAP_API_PASSWORD = 'pw';
    const fetchImpl = vi
      .fn()
      .mockResolvedValueOnce(jsonResponse({ access_token: 'minted-token', expiry_timestamp: String(Date.now() / 1000 + 3600) }))
      .mockResolvedValueOnce(jsonResponse({ plan: { itineraries: [] } }))
      .mockResolvedValueOnce(jsonResponse({ plan: { itineraries: [] } }));
    const client = new OneMapClient({ fetchImpl });

    await client.route({ start: '1.3,103.8', end: '1.4,103.9', routeType: 'pt', date: '01-01-2026', time: '09:00:00' });
    await client.route({ start: '1.3,103.8', end: '1.4,103.9', routeType: 'pt', date: '01-01-2026', time: '09:00:00' });

    // 1 token exchange + 2 route calls, not 2 token exchanges.
    expect(fetchImpl).toHaveBeenCalledTimes(3);
    const [, routeInit] = fetchImpl.mock.calls[1]!;
    expect((routeInit.headers as Record<string, string>).Authorization).toBe('minted-token');
  });

  it('throws OneMapConfigError when neither auth method is configured, without making a request', async () => {
    const fetchImpl = vi.fn();
    const client = new OneMapClient({ fetchImpl });

    await expect(
      client.route({ start: '1.3,103.8', end: '1.4,103.9', routeType: 'pt', date: '01-01-2026', time: '09:00:00' })
    ).rejects.toBeInstanceOf(OneMapConfigError);
    expect(fetchImpl).not.toHaveBeenCalled();
  });

  it('throws OneMapUpstreamError on a non-2xx response, without leaking the key', async () => {
    process.env.ONEMAP_API_KEY = 'super-secret-onemap-key';
    const fetchImpl = vi.fn().mockResolvedValue(jsonResponse({}, { status: 404 }));
    const client = new OneMapClient({ fetchImpl });

    try {
      await client.route({ start: '1.3,103.8', end: '1.3,103.8', routeType: 'pt', date: '01-01-2026', time: '09:00:00' });
      expect.unreachable();
    } catch (error) {
      expect(error).toBeInstanceOf(OneMapUpstreamError);
      expect(String((error as Error).message)).not.toContain('super-secret-onemap-key');
    }
  });

  it('throws OneMapTimeoutError when the request is aborted for taking too long', async () => {
    process.env.ONEMAP_API_KEY = 'test-key';
    const fetchImpl = vi.fn().mockImplementation((_url: string, init: RequestInit) => {
      return new Promise((_resolve, reject) => {
        init.signal?.addEventListener('abort', () => {
          const err = new Error('aborted');
          err.name = 'AbortError';
          reject(err);
        });
      });
    });
    const client = new OneMapClient({ fetchImpl, timeoutMs: 10 });

    await expect(
      client.route({ start: '1.3,103.8', end: '1.4,103.9', routeType: 'pt', date: '01-01-2026', time: '09:00:00' })
    ).rejects.toBeInstanceOf(OneMapTimeoutError);
  });

  it('passes routeType/mode/date/time/maxWalkDistance/numItineraries through as query params', async () => {
    process.env.ONEMAP_API_KEY = 'test-key';
    const fetchImpl = vi.fn().mockResolvedValue(jsonResponse({ plan: { itineraries: [] } }));
    const client = new OneMapClient({ fetchImpl });

    await client.route({
      start: '1.3,103.8',
      end: '1.4,103.9',
      routeType: 'pt',
      date: '01-01-2026',
      time: '09:00:00',
      mode: 'TRANSIT',
      maxWalkDistance: 1000,
      numItineraries: 3,
    });

    const url = new URL(fetchImpl.mock.calls[0]![0] as string);
    expect(url.searchParams.get('routeType')).toBe('pt');
    expect(url.searchParams.get('mode')).toBe('TRANSIT');
    expect(url.searchParams.get('maxWalkDistance')).toBe('1000');
    expect(url.searchParams.get('numItineraries')).toBe('3');
  });
});
