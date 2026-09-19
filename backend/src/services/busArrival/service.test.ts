import { describe, expect, it, vi } from 'vitest';
import { LtaDataMallClient } from '../../lta/client';
import { BusArrivalService } from './service';

const ACCOUNT_KEY = 'do-not-leak-this-key';

function jsonResponse(body: unknown, init: { status?: number } = {}): Response {
  return new Response(JSON.stringify(body), { status: init.status ?? 200, headers: { 'content-type': 'application/json' } });
}

function makeService(fetchImpl: ReturnType<typeof vi.fn>): BusArrivalService {
  const client = new LtaDataMallClient({ accountKey: ACCOUNT_KEY, fetchImpl });
  return new BusArrivalService(client);
}

const ONE_BUS_RESPONSE = {
  Services: [{ ServiceNo: '15', Operator: 'GAS', NextBus: { EstimatedArrival: '2026-09-19T10:00:00+08:00', Load: 'SEA' } }],
};

describe('BusArrivalService', () => {
  it('passes busStopCode and serviceNo through as query params', async () => {
    const fetchImpl = vi.fn().mockResolvedValue(jsonResponse(ONE_BUS_RESPONSE));
    await makeService(fetchImpl).getBusArrival('83139', '15');

    const url = new URL(fetchImpl.mock.calls[0]![0] as string);
    expect(url.searchParams.get('BusStopCode')).toBe('83139');
    expect(url.searchParams.get('ServiceNo')).toBe('15');
  });

  it('returns LIVE_SUCCESS with events for a stop that has buses arriving', async () => {
    const fetchImpl = vi.fn().mockResolvedValue(jsonResponse(ONE_BUS_RESPONSE));
    const result = await makeService(fetchImpl).getBusArrival('83139');
    expect(result.status).toBe('LIVE_SUCCESS');
    expect(result.busStopCode).toBe('83139');
    expect(result.recordCount).toBe(1);
  });

  it('returns LIVE_EMPTY when no buses are currently in service at this stop', async () => {
    const fetchImpl = vi.fn().mockResolvedValue(jsonResponse({ Services: [] }));
    const result = await makeService(fetchImpl).getBusArrival('83139');
    expect(result.status).toBe('LIVE_EMPTY');
  });

  it('returns LIVE_ERROR on an LTA HTTP error, never falling back to demo data', async () => {
    const fetchImpl = vi.fn().mockResolvedValue(jsonResponse({}, { status: 500 }));
    const result = await makeService(fetchImpl).getBusArrival('83139');
    expect(result.status).toBe('LIVE_ERROR');
    expect(result.provenance).toBe('LIVE');
  });

  it('caches per (busStopCode, serviceNo) combination separately', async () => {
    const fetchImpl = vi.fn().mockResolvedValue(jsonResponse(ONE_BUS_RESPONSE));
    const service = makeService(fetchImpl);

    await service.getBusArrival('83139');
    await service.getBusArrival('83139'); // same key -> cached
    await service.getBusArrival('83139', '15'); // different key -> fresh fetch

    expect(fetchImpl).toHaveBeenCalledTimes(2);
  });

  it('tracks lastBusStopCode in diagnostics from the most recent request', async () => {
    const fetchImpl = vi.fn().mockResolvedValue(jsonResponse(ONE_BUS_RESPONSE));
    const service = makeService(fetchImpl);
    await service.getBusArrival('83139');
    expect(service.getDiagnosticsSnapshot().lastBusStopCode).toBe('83139');
  });

  it('never lets the AccountKey leak', async () => {
    const fetchImpl = vi.fn().mockResolvedValue(jsonResponse(ONE_BUS_RESPONSE));
    const result = await makeService(fetchImpl).getBusArrival('83139');
    expect(JSON.stringify(result)).not.toContain(ACCOUNT_KEY);
  });
});
