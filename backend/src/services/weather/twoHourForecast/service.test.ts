import { describe, expect, it, vi } from 'vitest';
import { WeatherClient } from '../../../weather/client';
import { TwoHourForecastService } from './service';

function jsonResponse(body: unknown, init: { status?: number } = {}): Response {
  return new Response(JSON.stringify(body), { status: init.status ?? 200, headers: { 'content-type': 'application/json' } });
}

const ONE_AREA_RESPONSE = {
  data: {
    area_metadata: [{ name: 'Bedok', label_location: { latitude: 1.321, longitude: 103.924 } }],
    items: [{ valid_period: { start: 't1', end: 't2' }, forecasts: [{ area: 'Bedok', forecast: 'Cloudy' }] }],
  },
};

function makeService(fetchImpl: ReturnType<typeof vi.fn>): TwoHourForecastService {
  return new TwoHourForecastService(new WeatherClient({ fetchImpl }));
}

describe('TwoHourForecastService', () => {
  it('returns LIVE_SUCCESS with normalised areas', async () => {
    const fetchImpl = vi.fn().mockResolvedValue(jsonResponse(ONE_AREA_RESPONSE));
    const result = await makeService(fetchImpl).getTwoHourForecast();
    expect(result.status).toBe('LIVE_SUCCESS');
    expect(result.provenance).toBe('LIVE');
    expect(result.areas).toHaveLength(1);
  });

  it('returns LIVE_EMPTY when there is no current item', async () => {
    const fetchImpl = vi.fn().mockResolvedValue(jsonResponse({ data: { area_metadata: [], items: [] } }));
    const result = await makeService(fetchImpl).getTwoHourForecast();
    expect(result.status).toBe('LIVE_EMPTY');
  });

  it('returns LIVE_ERROR on an upstream HTTP error, never falling back to demo data', async () => {
    const fetchImpl = vi.fn().mockResolvedValue(jsonResponse({}, { status: 500 }));
    const result = await makeService(fetchImpl).getTwoHourForecast();
    expect(result.status).toBe('LIVE_ERROR');
    expect(result.provenance).toBe('LIVE');
  });

  it('caches a successful result', async () => {
    const fetchImpl = vi.fn().mockResolvedValue(jsonResponse(ONE_AREA_RESPONSE));
    const service = makeService(fetchImpl);
    await service.getTwoHourForecast();
    await service.getTwoHourForecast();
    expect(fetchImpl).toHaveBeenCalledTimes(1);
  });

  it('does not cache errors', async () => {
    const fetchImpl = vi.fn().mockResolvedValue(jsonResponse({}, { status: 500 }));
    const service = makeService(fetchImpl);
    await service.getTwoHourForecast();
    await service.getTwoHourForecast();
    expect(fetchImpl).toHaveBeenCalledTimes(2);
  });
});
