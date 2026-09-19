import { describe, expect, it, vi } from 'vitest';
import { LtaDataMallClient } from '../../lta/client';
import { PCD_TRAIN_LINE_CODES } from '../../models/railLine';
import { PcdRealTimeService } from './service';

const ACCOUNT_KEY = 'do-not-leak-this-key';

function jsonResponse(body: unknown, init: { status?: number } = {}): Response {
  return new Response(JSON.stringify(body), { status: init.status ?? 200, headers: { 'content-type': 'application/json' } });
}

function makeService(fetchImpl: ReturnType<typeof vi.fn>): PcdRealTimeService {
  const client = new LtaDataMallClient({ accountKey: ACCOUNT_KEY, fetchImpl });
  return new PcdRealTimeService(client);
}

describe('PcdRealTimeService', () => {
  it('aggregates across all lines into one LIVE_SUCCESS result', async () => {
    const fetchImpl = vi.fn().mockImplementation((url: string) => {
      const line = new URL(url).searchParams.get('TrainLine');
      return Promise.resolve(jsonResponse({ value: [{ Station: `${line}-1`, StartTime: 't1', EndTime: 't2', CrowdLevel: 'l' }] }));
    });

    const result = await makeService(fetchImpl).getStationCrowding();

    expect(result.status).toBe('LIVE_SUCCESS');
    expect(result.recordCount).toBe(PCD_TRAIN_LINE_CODES.length);
  });

  it('returns LIVE_ERROR when any line request fails outright, never falling back to demo data', async () => {
    const fetchImpl = vi.fn().mockResolvedValue(jsonResponse({}, { status: 500 }));
    const result = await makeService(fetchImpl).getStationCrowding();

    expect(result.status).toBe('LIVE_ERROR');
    expect(result.provenance).toBe('LIVE');
    expect(result.events).toEqual([]);
  });

  it('caches a successful result so a second call does not re-fetch every line again', async () => {
    const fetchImpl = vi.fn().mockImplementation(() => Promise.resolve(jsonResponse({ value: [] })));
    const service = makeService(fetchImpl);

    await service.getStationCrowding();
    const callsAfterFirst = fetchImpl.mock.calls.length;
    await service.getStationCrowding();

    expect(fetchImpl.mock.calls.length).toBe(callsAfterFirst);
  });

  it('never lets the AccountKey leak', async () => {
    const fetchImpl = vi.fn().mockImplementation(() => Promise.resolve(jsonResponse({ value: [] })));
    const result = await makeService(fetchImpl).getStationCrowding();
    expect(JSON.stringify(result)).not.toContain(ACCOUNT_KEY);
  });
});
