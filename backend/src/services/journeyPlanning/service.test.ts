import { beforeAll, describe, expect, it, vi } from 'vitest';
import { OneMapClient } from '../../onemap/client';
import type { JourneyPlanningService as JourneyPlanningServiceType } from './service';

const FETCHED_AT = '2026-09-19T02:00:00.000Z';

vi.mock('../facilitiesMaintenance/service', () => ({
  facilitiesMaintenanceService: {
    getFacilitiesMaintenance: vi.fn().mockResolvedValue({
      status: 'LIVE_EMPTY',
      provenance: 'LIVE',
      fetchedAt: FETCHED_AT,
      recordCount: 0,
      skippedRecordCount: 0,
      events: [],
    }),
  },
}));

vi.mock('../trainServiceAlerts/service', () => ({
  trainServiceAlertsService: {
    getTrainServiceAlerts: vi.fn().mockResolvedValue({
      status: 'LIVE_EMPTY',
      provenance: 'LIVE',
      fetchedAt: FETCHED_AT,
      recordCount: 0,
      events: [],
      messages: [],
    }),
  },
}));

vi.mock('../pcdRealTime/service', () => ({
  pcdRealTimeService: {
    getStationCrowding: vi.fn().mockResolvedValue({
      status: 'LIVE_EMPTY',
      provenance: 'LIVE',
      fetchedAt: FETCHED_AT,
      recordCount: 0,
      skippedLineCount: 0,
      events: [],
    }),
  },
}));

let JourneyPlanningService: typeof JourneyPlanningServiceType;
beforeAll(async () => {
  ({ JourneyPlanningService } = await import('./service'));
});

function jsonResponse(body: unknown, init: { status?: number } = {}): Response {
  return new Response(JSON.stringify(body), { status: init.status ?? 200, headers: { 'content-type': 'application/json' } });
}

const ONE_ITINERARY_RESPONSE = {
  plan: {
    itineraries: [
      {
        duration: 100,
        startTime: 1,
        endTime: 2,
        legs: [
          {
            startTime: 1,
            endTime: 2,
            distance: 100,
            mode: 'WALK',
            from: { name: 'A', lon: 103.8, lat: 1.3 },
            to: { name: 'B', lon: 103.81, lat: 1.31 },
          },
        ],
      },
    ],
  },
};

function makeService(fetchImpl: ReturnType<typeof vi.fn>) {
  process.env.ONEMAP_API_KEY = 'test-onemap-key';
  const client = new OneMapClient({ fetchImpl });
  return new JourneyPlanningService(client);
}

const BASE_PARAMS = { start: '1.3,103.8', end: '1.31,103.81', date: '01-01-2026', time: '09:00:00' };

describe('JourneyPlanningService', () => {
  it('returns LIVE_SUCCESS with a normalised itinerary and a recommendation', async () => {
    const fetchImpl = vi.fn().mockResolvedValue(jsonResponse(ONE_ITINERARY_RESPONSE));
    const result = await makeService(fetchImpl).planJourney(BASE_PARAMS);

    expect(result.status).toBe('LIVE_SUCCESS');
    expect(result.provenance).toBe('LIVE');
    expect(result.itineraries).toHaveLength(1);
    expect(result.recommendation).toEqual({ index: 0, reason: 'No live disruptions or lift outages reported on this route right now.' });
  });

  it('returns LIVE_EMPTY when OneMap finds no itinerary', async () => {
    const fetchImpl = vi.fn().mockResolvedValue(jsonResponse({ plan: { itineraries: [] } }));
    const result = await makeService(fetchImpl).planJourney(BASE_PARAMS);
    expect(result.status).toBe('LIVE_EMPTY');
    expect(result.itineraries).toEqual([]);
    expect(result.recommendation).toBeUndefined();
  });

  it('returns LIVE_ERROR (never falling back to demo data) when OneMap responds with an HTTP error', async () => {
    const fetchImpl = vi.fn().mockResolvedValue(jsonResponse({}, { status: 404 }));
    const result = await makeService(fetchImpl).planJourney(BASE_PARAMS);
    expect(result.status).toBe('LIVE_ERROR');
    expect(result.provenance).toBe('LIVE');
    expect(result.errorMessage).toContain('HTTP 404');
  });

  it('echoes back the parsed from/to coordinates even on error', async () => {
    const fetchImpl = vi.fn().mockResolvedValue(jsonResponse({}, { status: 500 }));
    const result = await makeService(fetchImpl).planJourney(BASE_PARAMS);
    expect(result.from).toEqual({ latitude: 1.3, longitude: 103.8 });
    expect(result.to).toEqual({ latitude: 1.31, longitude: 103.81 });
  });

  it('caches a successful result for identical params', async () => {
    const fetchImpl = vi.fn().mockResolvedValue(jsonResponse(ONE_ITINERARY_RESPONSE));
    const service = makeService(fetchImpl);
    await service.planJourney(BASE_PARAMS);
    await service.planJourney(BASE_PARAMS);
    expect(fetchImpl).toHaveBeenCalledTimes(1);
  });

  it('does not cache errors, so a subsequent identical request retries', async () => {
    const fetchImpl = vi.fn().mockResolvedValue(jsonResponse({}, { status: 500 }));
    const service = makeService(fetchImpl);
    await service.planJourney(BASE_PARAMS);
    await service.planJourney(BASE_PARAMS);
    expect(fetchImpl).toHaveBeenCalledTimes(2);
  });

  it('reports configured=true fresh on every diagnostics read, not just at construction', async () => {
    const fetchImpl = vi.fn().mockResolvedValue(jsonResponse(ONE_ITINERARY_RESPONSE));
    const service = makeService(fetchImpl);
    expect(service.getDiagnosticsSnapshot().configured).toBe(true);
    await service.planJourney(BASE_PARAMS);
    expect(service.getDiagnosticsSnapshot().lastStatus).toBe('LIVE_SUCCESS');
  });

  it('never lets the OneMap key leak into the result', async () => {
    const fetchImpl = vi.fn().mockResolvedValue(jsonResponse(ONE_ITINERARY_RESPONSE));
    const result = await makeService(fetchImpl).planJourney(BASE_PARAMS);
    expect(JSON.stringify(result)).not.toContain('test-onemap-key');
  });
});
