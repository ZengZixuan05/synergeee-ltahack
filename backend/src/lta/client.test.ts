import { describe, expect, it, vi } from 'vitest';
import { LtaDataMallClient } from './client';
import { LtaHttpError, LtaTimeoutError, LtaResponseShapeError } from './errors';

function jsonResponse(body: unknown, init: { status?: number } = {}): Response {
  return new Response(JSON.stringify(body), {
    status: init.status ?? 200,
    headers: { 'content-type': 'application/json' },
  });
}

describe('LtaDataMallClient.get', () => {
  it('sends the AccountKey header and returns the parsed JSON body on success', async () => {
    const fetchImpl = vi.fn().mockResolvedValue(jsonResponse({ value: [{ foo: 'bar' }] }));
    const client = new LtaDataMallClient({ accountKey: 'test-key', fetchImpl });

    const body = await client.get('/v2/FacilitiesMaintenance');

    expect(body).toEqual({ value: [{ foo: 'bar' }] });
    const [, requestInit] = fetchImpl.mock.calls[0]!;
    expect(requestInit.headers).toMatchObject({ AccountKey: 'test-key', accept: 'application/json' });
  });

  it('throws LtaHttpError on a non-2xx response, without leaking the account key in the error', async () => {
    const fetchImpl = vi.fn().mockResolvedValue(jsonResponse({}, { status: 401 }));
    const client = new LtaDataMallClient({ accountKey: 'super-secret-key', fetchImpl });

    await expect(client.get('/v2/FacilitiesMaintenance')).rejects.toBeInstanceOf(LtaHttpError);
    try {
      await client.get('/v2/FacilitiesMaintenance');
    } catch (error) {
      expect(String((error as Error).message)).not.toContain('super-secret-key');
      expect((error as LtaHttpError).status).toBe(401);
    }
  });

  it('throws LtaTimeoutError when the request is aborted for taking too long', async () => {
    const fetchImpl = vi.fn().mockImplementation((_url: string, init: RequestInit) => {
      return new Promise((_resolve, reject) => {
        init.signal?.addEventListener('abort', () => {
          const err = new Error('aborted');
          err.name = 'AbortError';
          reject(err);
        });
      });
    });
    const client = new LtaDataMallClient({ accountKey: 'test-key', fetchImpl, timeoutMs: 10 });

    await expect(client.get('/v2/FacilitiesMaintenance')).rejects.toBeInstanceOf(LtaTimeoutError);
  });

  it('throws a config error when no AccountKey is available anywhere', async () => {
    const originalKey = process.env.LTA_ACCOUNT_KEY;
    delete process.env.LTA_ACCOUNT_KEY;
    try {
      const fetchImpl = vi.fn();
      const client = new LtaDataMallClient({ fetchImpl });
      await expect(client.get('/v2/FacilitiesMaintenance')).rejects.toThrow(/LTA_ACCOUNT_KEY is not set/);
      expect(fetchImpl).not.toHaveBeenCalled();
    } finally {
      if (originalKey !== undefined) process.env.LTA_ACCOUNT_KEY = originalKey;
    }
  });
});

describe('LtaDataMallClient.getAllPages', () => {
  it('follows $skip pagination until a short page is returned', async () => {
    const page0 = { value: Array.from({ length: 2 }, (_, i) => ({ id: i })) };
    const page1 = { value: Array.from({ length: 1 }, (_, i) => ({ id: 2 + i })) };
    const fetchImpl = vi
      .fn()
      .mockResolvedValueOnce(jsonResponse(page0))
      .mockResolvedValueOnce(jsonResponse(page1));

    const client = new LtaDataMallClient({ accountKey: 'test-key', fetchImpl });
    const results = await client.getAllPages('/v2/FacilitiesMaintenance', { pageSize: 2 });

    expect(results).toHaveLength(3);
    expect(fetchImpl).toHaveBeenCalledTimes(2);

    const secondCallUrl = new URL(fetchImpl.mock.calls[1]![0] as string);
    expect(secondCallUrl.searchParams.get('$skip')).toBe('2');
  });

  it('stops at maxPages as a safety cap even if every page is full', async () => {
    const fullPage = { value: Array.from({ length: 2 }, (_, i) => ({ id: i })) };
    const fetchImpl = vi.fn().mockImplementation(() => Promise.resolve(jsonResponse(fullPage)));

    const client = new LtaDataMallClient({ accountKey: 'test-key', fetchImpl });
    const results = await client.getAllPages('/v2/FacilitiesMaintenance', { pageSize: 2, maxPages: 3 });

    expect(fetchImpl).toHaveBeenCalledTimes(3);
    expect(results).toHaveLength(6);
  });

  it('throws LtaResponseShapeError when the expected array field is missing', async () => {
    const fetchImpl = vi.fn().mockResolvedValue(jsonResponse({ notValue: [] }));
    const client = new LtaDataMallClient({ accountKey: 'test-key', fetchImpl });

    await expect(client.getAllPages('/v2/FacilitiesMaintenance')).rejects.toBeInstanceOf(LtaResponseShapeError);
  });
});
