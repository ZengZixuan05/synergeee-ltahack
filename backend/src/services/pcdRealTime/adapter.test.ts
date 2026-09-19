import { describe, expect, it, vi } from 'vitest';
import { LtaDataMallClient } from '../../lta/client';
import { PCD_TRAIN_LINE_CODES } from '../../models/railLine';
import { fetchAllPcdRealTime } from './adapter';

function jsonResponse(body: unknown): Response {
  return new Response(JSON.stringify(body), { status: 200, headers: { 'content-type': 'application/json' } });
}

describe('fetchAllPcdRealTime', () => {
  it('queries every known PCD TrainLine code exactly once, tagging each result with the line it was queried under', async () => {
    const fetchImpl = vi.fn().mockImplementation(() => Promise.resolve(jsonResponse({ value: [] })));
    const client = new LtaDataMallClient({ accountKey: 'test-key', fetchImpl });

    const results = await fetchAllPcdRealTime(client);

    expect(results).toHaveLength(PCD_TRAIN_LINE_CODES.length);
    expect(results.map((r) => r.trainLine)).toEqual([...PCD_TRAIN_LINE_CODES]);
    for (const call of fetchImpl.mock.calls) {
      const url = new URL(call[0] as string);
      expect(PCD_TRAIN_LINE_CODES).toContain(url.searchParams.get('TrainLine'));
    }
  });

  it('fetches one line at a time (sequentially), never more than one request in flight — confirmed live: concurrent requests reliably 500 from LTA', async () => {
    let inFlight = 0;
    let maxInFlight = 0;

    const fetchImpl = vi.fn().mockImplementation(async () => {
      inFlight += 1;
      maxInFlight = Math.max(maxInFlight, inFlight);
      await new Promise((resolve) => setTimeout(resolve, 1));
      inFlight -= 1;
      return jsonResponse({ value: [] });
    });
    const client = new LtaDataMallClient({ accountKey: 'test-key', fetchImpl });

    await fetchAllPcdRealTime(client);

    expect(maxInFlight).toBe(1);
    expect(fetchImpl).toHaveBeenCalledTimes(PCD_TRAIN_LINE_CODES.length);
  });
});
