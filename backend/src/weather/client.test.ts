import { describe, expect, it, vi } from 'vitest';
import { WeatherClient } from './client';
import { WeatherTimeoutError, WeatherUpstreamError } from './errors';

function jsonResponse(body: unknown, init: { status?: number } = {}): Response {
  return new Response(JSON.stringify(body), { status: init.status ?? 200, headers: { 'content-type': 'application/json' } });
}

describe('WeatherClient.get', () => {
  it('requires no auth header at all — data.gov.sg\'s real-time weather APIs are public', async () => {
    const fetchImpl = vi.fn().mockResolvedValue(jsonResponse({ data: {} }));
    const client = new WeatherClient({ fetchImpl });

    await client.get('two-hr-forecast');

    const [, init] = fetchImpl.mock.calls[0]!;
    expect(init?.headers).toBeUndefined();
  });

  it('builds the URL from baseUrl + endpoint', async () => {
    const fetchImpl = vi.fn().mockResolvedValue(jsonResponse({ data: {} }));
    const client = new WeatherClient({ fetchImpl, baseUrl: 'https://example.com/v2/real-time/api' });

    await client.get('rainfall');

    expect(fetchImpl.mock.calls[0]![0]).toBe('https://example.com/v2/real-time/api/rainfall');
  });

  it('throws WeatherUpstreamError on a non-2xx response', async () => {
    const fetchImpl = vi.fn().mockResolvedValue(jsonResponse({}, { status: 500 }));
    const client = new WeatherClient({ fetchImpl });

    await expect(client.get('rainfall')).rejects.toBeInstanceOf(WeatherUpstreamError);
  });

  it('throws WeatherTimeoutError when the request is aborted for taking too long', async () => {
    const fetchImpl = vi.fn().mockImplementation((_url: string, init: RequestInit) => {
      return new Promise((_resolve, reject) => {
        init.signal?.addEventListener('abort', () => {
          const err = new Error('aborted');
          err.name = 'AbortError';
          reject(err);
        });
      });
    });
    const client = new WeatherClient({ fetchImpl, timeoutMs: 10 });

    await expect(client.get('rainfall')).rejects.toBeInstanceOf(WeatherTimeoutError);
  });
});
