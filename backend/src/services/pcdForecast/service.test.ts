import { describe, expect, it, vi } from 'vitest';
import { LtaDataMallClient } from '../../lta/client';
import { PcdForecastService } from './service';

const ACCOUNT_KEY = 'do-not-leak-this-key';

function jsonResponse(body: unknown, init: { status?: number } = {}): Response {
  return new Response(JSON.stringify(body), { status: init.status ?? 200, headers: { 'content-type': 'application/json' } });
}

function makeService(fetchImpl: ReturnType<typeof vi.fn>): PcdForecastService {
  const client = new LtaDataMallClient({ accountKey: ACCOUNT_KEY, fetchImpl });
  return new PcdForecastService(client);
}

describe('PcdForecastService', () => {
  it('returns LIVE_EMPTY when every line reports no stations', async () => {
    const fetchImpl = vi.fn().mockImplementation(() => Promise.resolve(jsonResponse({ value: [] })));
    const result = await makeService(fetchImpl).getStationCrowdingForecast();
    expect(result.status).toBe('LIVE_EMPTY');
    expect(result.records).toEqual([]);
  });

  it('returns LIVE_ERROR on failure, never falling back to demo data', async () => {
    const fetchImpl = vi.fn().mockResolvedValue(jsonResponse({}, { status: 500 }));
    const result = await makeService(fetchImpl).getStationCrowdingForecast();
    expect(result.status).toBe('LIVE_ERROR');
    expect(result.provenance).toBe('LIVE');
  });

  it('caches a successful result', async () => {
    const fetchImpl = vi.fn().mockImplementation(() => Promise.resolve(jsonResponse({ value: [] })));
    const service = makeService(fetchImpl);
    await service.getStationCrowdingForecast();
    const callsAfterFirst = fetchImpl.mock.calls.length;
    await service.getStationCrowdingForecast();
    expect(fetchImpl.mock.calls.length).toBe(callsAfterFirst);
  });

  it('never lets the AccountKey leak', async () => {
    const fetchImpl = vi.fn().mockImplementation(() => Promise.resolve(jsonResponse({ value: [] })));
    const result = await makeService(fetchImpl).getStationCrowdingForecast();
    expect(JSON.stringify(result)).not.toContain(ACCOUNT_KEY);
  });
});
