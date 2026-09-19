import { describe, expect, it, vi } from 'vitest';
import { LtaDataMallClient } from '../../lta/client';
import { TrainServiceAlertsService } from './service';

const ACCOUNT_KEY = 'do-not-leak-this-key';

function jsonResponse(body: unknown, init: { status?: number } = {}): Response {
  return new Response(JSON.stringify(body), { status: init.status ?? 200, headers: { 'content-type': 'application/json' } });
}

function makeService(fetchImpl: ReturnType<typeof vi.fn>): TrainServiceAlertsService {
  const client = new LtaDataMallClient({ accountKey: ACCOUNT_KEY, fetchImpl });
  return new TrainServiceAlertsService(client);
}

describe('TrainServiceAlertsService', () => {
  it('returns LIVE_EMPTY (the common case) when there is no active disruption', async () => {
    const fetchImpl = vi.fn().mockResolvedValue(jsonResponse({ value: { Status: 1, AffectedSegments: [], Message: [] } }));
    const result = await makeService(fetchImpl).getTrainServiceAlerts();

    expect(result.status).toBe('LIVE_EMPTY');
    expect(result.provenance).toBe('LIVE');
    expect(result.events).toEqual([]);
  });

  it('returns LIVE_SUCCESS with events when a disruption is active', async () => {
    const fetchImpl = vi.fn().mockResolvedValue(
      jsonResponse({ value: { Status: 2, AffectedSegments: [{ Line: 'NEL', Stations: 'NE1' }], Message: [] } })
    );
    const result = await makeService(fetchImpl).getTrainServiceAlerts();

    expect(result.status).toBe('LIVE_SUCCESS');
    expect(result.recordCount).toBe(1);
  });

  it('returns LIVE_ERROR on an LTA HTTP error, never falling back to demo data', async () => {
    const fetchImpl = vi.fn().mockResolvedValue(jsonResponse({}, { status: 500 }));
    const result = await makeService(fetchImpl).getTrainServiceAlerts();

    expect(result.status).toBe('LIVE_ERROR');
    expect(result.provenance).toBe('LIVE');
    expect(result.errorMessage).toContain('HTTP 500');
  });

  it('caches a successful result so a second call does not re-hit LTA', async () => {
    const fetchImpl = vi.fn().mockResolvedValue(jsonResponse({ value: { Status: 1, AffectedSegments: [], Message: [] } }));
    const service = makeService(fetchImpl);

    await service.getTrainServiceAlerts();
    await service.getTrainServiceAlerts();

    expect(fetchImpl).toHaveBeenCalledTimes(1);
  });

  it('never lets the AccountKey leak, including on error', async () => {
    const fetchImpl = vi.fn().mockResolvedValue(jsonResponse({}, { status: 401 }));
    const result = await makeService(fetchImpl).getTrainServiceAlerts();
    expect(JSON.stringify(result)).not.toContain(ACCOUNT_KEY);
  });
});
