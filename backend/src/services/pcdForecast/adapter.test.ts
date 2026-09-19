import { describe, expect, it, vi } from 'vitest';
import { LtaDataMallClient } from '../../lta/client';
import { PCD_TRAIN_LINE_CODES } from '../../models/railLine';
import { fetchAllPcdForecast } from './adapter';

function jsonResponse(body: unknown): Response {
  return new Response(JSON.stringify(body), { status: 200, headers: { 'content-type': 'application/json' } });
}

describe('fetchAllPcdForecast', () => {
  it('queries every known PCD TrainLine code sequentially, one request in flight at a time', async () => {
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

    const results = await fetchAllPcdForecast(client);

    expect(results).toHaveLength(PCD_TRAIN_LINE_CODES.length);
    expect(maxInFlight).toBe(1);
  });
});
