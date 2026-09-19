import { describe, expect, it, vi } from 'vitest';
import { WeatherClient } from '../../../weather/client';
import { RainfallService } from './service';

function jsonResponse(body: unknown, init: { status?: number } = {}): Response {
  return new Response(JSON.stringify(body), { status: init.status ?? 200, headers: { 'content-type': 'application/json' } });
}

const ONE_READING_RESPONSE = {
  data: {
    stations: [{ id: 'S218', name: 'Bukit Batok Street 34', location: { latitude: 1.36491, longitude: 103.75065 } }],
    readings: [{ timestamp: 't', data: [{ stationId: 'S218', value: 0 }] }],
  },
};

function makeService(fetchImpl: ReturnType<typeof vi.fn>): RainfallService {
  return new RainfallService(new WeatherClient({ fetchImpl }));
}

describe('RainfallService', () => {
  it('returns LIVE_SUCCESS with normalised readings (a reading of 0mm is still a successful result, not empty)', async () => {
    const fetchImpl = vi.fn().mockResolvedValue(jsonResponse(ONE_READING_RESPONSE));
    const result = await makeService(fetchImpl).getRainfall();
    expect(result.status).toBe('LIVE_SUCCESS');
    expect(result.readings).toHaveLength(1);
    expect(result.readings[0]!.valueMm).toBe(0);
  });

  it('returns LIVE_EMPTY when there are no readings at all', async () => {
    const fetchImpl = vi.fn().mockResolvedValue(jsonResponse({ data: { stations: [], readings: [] } }));
    const result = await makeService(fetchImpl).getRainfall();
    expect(result.status).toBe('LIVE_EMPTY');
  });

  it('returns LIVE_ERROR on an upstream HTTP error, never falling back to demo data', async () => {
    const fetchImpl = vi.fn().mockResolvedValue(jsonResponse({}, { status: 500 }));
    const result = await makeService(fetchImpl).getRainfall();
    expect(result.status).toBe('LIVE_ERROR');
    expect(result.provenance).toBe('LIVE');
  });

  it('caches a successful result', async () => {
    const fetchImpl = vi.fn().mockResolvedValue(jsonResponse(ONE_READING_RESPONSE));
    const service = makeService(fetchImpl);
    await service.getRainfall();
    await service.getRainfall();
    expect(fetchImpl).toHaveBeenCalledTimes(1);
  });

  it('does not cache errors', async () => {
    const fetchImpl = vi.fn().mockResolvedValue(jsonResponse({}, { status: 500 }));
    const service = makeService(fetchImpl);
    await service.getRainfall();
    await service.getRainfall();
    expect(fetchImpl).toHaveBeenCalledTimes(2);
  });
});
