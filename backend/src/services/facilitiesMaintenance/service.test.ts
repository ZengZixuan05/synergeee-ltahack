import { describe, expect, it, vi } from 'vitest';
import { LtaDataMallClient } from '../../lta/client';
import { FacilitiesMaintenanceService } from './service';

const ACCOUNT_KEY = 'do-not-leak-this-key';

function jsonResponse(body: unknown, init: { status?: number } = {}): Response {
  return new Response(JSON.stringify(body), {
    status: init.status ?? 200,
    headers: { 'content-type': 'application/json' },
  });
}

function makeService(fetchImpl: ReturnType<typeof vi.fn>): FacilitiesMaintenanceService {
  const client = new LtaDataMallClient({ accountKey: ACCOUNT_KEY, fetchImpl });
  return new FacilitiesMaintenanceService(client);
}

describe('FacilitiesMaintenanceService', () => {
  it('returns LIVE_SUCCESS with normalised events for a valid non-empty response', async () => {
    const fetchImpl = vi.fn().mockResolvedValue(
      jsonResponse({
        value: [{ Line: 'NEL', StationCode: 'NE12', StationName: 'Serangoon', LiftID: 'B1L01', LiftDesc: 'Exit B' }],
      })
    );
    const service = makeService(fetchImpl);

    const result = await service.getFacilitiesMaintenance();

    expect(result.status).toBe('LIVE_SUCCESS');
    expect(result.provenance).toBe('LIVE');
    expect(result.recordCount).toBe(1);
    expect(result.events[0]!.type).toBe('LIFT_MAINTENANCE');
  });

  it('returns LIVE_EMPTY (not an error) when LTA reports zero lifts under maintenance', async () => {
    const fetchImpl = vi.fn().mockResolvedValue(jsonResponse({ value: [] }));
    const service = makeService(fetchImpl);

    const result = await service.getFacilitiesMaintenance();

    expect(result.status).toBe('LIVE_EMPTY');
    expect(result.events).toEqual([]);
    expect(result.errorMessage).toBeUndefined();
  });

  it('returns LIVE_ERROR (never silently falling back to demo data) when LTA responds with an HTTP error', async () => {
    const fetchImpl = vi.fn().mockResolvedValue(jsonResponse({}, { status: 500 }));
    const service = makeService(fetchImpl);

    const result = await service.getFacilitiesMaintenance();

    expect(result.status).toBe('LIVE_ERROR');
    expect(result.provenance).toBe('LIVE');
    expect(result.events).toEqual([]);
    expect(result.errorMessage).toContain('HTTP 500');
  });

  it('caches a successful result so a second call within the TTL does not re-hit LTA', async () => {
    const fetchImpl = vi.fn().mockResolvedValue(jsonResponse({ value: [] }));
    const service = makeService(fetchImpl);

    await service.getFacilitiesMaintenance();
    await service.getFacilitiesMaintenance();

    expect(fetchImpl).toHaveBeenCalledTimes(1);
  });

  it('does not cache errors, so a subsequent call retries LTA', async () => {
    const fetchImpl = vi.fn().mockResolvedValue(jsonResponse({}, { status: 503 }));
    const service = makeService(fetchImpl);

    await service.getFacilitiesMaintenance();
    await service.getFacilitiesMaintenance();

    expect(fetchImpl).toHaveBeenCalledTimes(2);
  });

  it('updates the diagnostics snapshot after a call without needing another LTA request', async () => {
    const fetchImpl = vi.fn().mockResolvedValue(jsonResponse({ value: [] }));
    const service = makeService(fetchImpl);

    await service.getFacilitiesMaintenance();
    const snapshot = service.getDiagnosticsSnapshot();

    expect(snapshot.lastStatus).toBe('LIVE_EMPTY');
    expect(snapshot.lastRequestAt).not.toBeNull();
    expect(fetchImpl).toHaveBeenCalledTimes(1);
  });

  it('reports NOT_YET_CALLED diagnostics before any request has been made', () => {
    const service = makeService(vi.fn());
    expect(service.getDiagnosticsSnapshot().lastStatus).toBe('NOT_YET_CALLED');
  });

  it('never lets the configured AccountKey appear anywhere in the result, including on error', async () => {
    const fetchImplOk = vi.fn().mockResolvedValue(jsonResponse({ value: [] }));
    const resultOk = await makeService(fetchImplOk).getFacilitiesMaintenance();
    expect(JSON.stringify(resultOk)).not.toContain(ACCOUNT_KEY);

    const fetchImplErr = vi.fn().mockResolvedValue(jsonResponse({}, { status: 401 }));
    const resultErr = await makeService(fetchImplErr).getFacilitiesMaintenance();
    expect(JSON.stringify(resultErr)).not.toContain(ACCOUNT_KEY);
  });
});
