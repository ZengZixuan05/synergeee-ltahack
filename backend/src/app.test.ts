import { beforeAll, describe, expect, it, vi } from 'vitest';
import request from 'supertest';
import type { createApp as CreateApp } from './app';

const baseDiagnostics = {
  configured: true,
  lastRequestAt: '2026-09-19T02:00:00.000Z',
  lastStatus: 'LIVE_SUCCESS',
  lastRecordCount: 1,
};

vi.mock('./services/facilitiesMaintenance/service', () => ({
  facilitiesMaintenanceService: {
    getFacilitiesMaintenance: vi.fn().mockResolvedValue({
      status: 'LIVE_SUCCESS',
      provenance: 'LIVE',
      fetchedAt: '2026-09-19T02:00:00.000Z',
      recordCount: 1,
      skippedRecordCount: 0,
      events: [
        {
          id: 'lift-maintenance:ne12:b1l01',
          type: 'LIFT_MAINTENANCE',
          source: 'LTA',
          provenance: 'LIVE',
          lastUpdated: '2026-09-19T02:00:00.000Z',
          liftId: 'B1L01',
          liftDescription: 'Exit B',
          station: { stationCode: 'NE12', stationName: 'Serangoon', line: 'NEL', rawLine: 'NEL' },
        },
      ],
    }),
    getDiagnosticsSnapshot: vi.fn().mockReturnValue(baseDiagnostics),
  },
}));

vi.mock('./services/geospatial/trainStation/service', () => ({
  trainStationService: {
    getLayer: vi.fn().mockResolvedValue({ status: 'LIVE_SUCCESS', provenance: 'LIVE', fetchedAt: 't', recordCount: 1, skippedRecordCount: 0, records: [{ id: 'TrainStation:0', source: 'LTA', provenance: 'LIVE', lastUpdated: 't', name: 'X', geometry: { type: 'Point', coordinates: [103.8, 1.3] } }] }),
    getDiagnosticsSnapshot: vi.fn().mockReturnValue(baseDiagnostics),
  },
}));

vi.mock('./services/geospatial/trainStationExit/service', () => ({
  trainStationExitService: {
    getLayer: vi.fn().mockResolvedValue({ status: 'LIVE_SUCCESS', provenance: 'LIVE', fetchedAt: 't', recordCount: 1, skippedRecordCount: 0, records: [] }),
    getDiagnosticsSnapshot: vi.fn().mockReturnValue(baseDiagnostics),
  },
}));

vi.mock('./services/geospatial/coveredLinkWay/service', () => ({
  coveredLinkWayService: {
    getLayer: vi.fn().mockResolvedValue({ status: 'LIVE_SUCCESS', provenance: 'LIVE', fetchedAt: 't', recordCount: 1, skippedRecordCount: 0, records: [] }),
    getDiagnosticsSnapshot: vi.fn().mockReturnValue(baseDiagnostics),
  },
}));

vi.mock('./services/trainServiceAlerts/service', () => ({
  trainServiceAlertsService: {
    getTrainServiceAlerts: vi.fn().mockResolvedValue({ status: 'LIVE_EMPTY', provenance: 'LIVE', fetchedAt: 't', recordCount: 0, events: [], messages: [] }),
    getDiagnosticsSnapshot: vi.fn().mockReturnValue(baseDiagnostics),
  },
}));

vi.mock('./services/pcdRealTime/service', () => ({
  pcdRealTimeService: {
    getStationCrowding: vi.fn().mockResolvedValue({ status: 'LIVE_SUCCESS', provenance: 'LIVE', fetchedAt: 't', recordCount: 1, skippedLineCount: 0, events: [] }),
    getDiagnosticsSnapshot: vi.fn().mockReturnValue(baseDiagnostics),
  },
}));

vi.mock('./services/pcdForecast/service', () => ({
  pcdForecastService: {
    getStationCrowdingForecast: vi.fn().mockResolvedValue({ status: 'LIVE_SUCCESS', provenance: 'LIVE', fetchedAt: 't', recordCount: 1, skippedLineCount: 0, records: [] }),
    getDiagnosticsSnapshot: vi.fn().mockReturnValue(baseDiagnostics),
  },
}));

vi.mock('./services/busReference/busStops/service', () => ({
  busStopsService: {
    getLayer: vi.fn().mockResolvedValue({ status: 'LIVE_SUCCESS', provenance: 'LIVE', fetchedAt: 't', recordCount: 1, skippedRecordCount: 0, records: [] }),
    getDiagnosticsSnapshot: vi.fn().mockReturnValue(baseDiagnostics),
  },
}));

vi.mock('./services/busReference/busServices/service', () => ({
  busServicesService: {
    getLayer: vi.fn().mockResolvedValue({ status: 'LIVE_SUCCESS', provenance: 'LIVE', fetchedAt: 't', recordCount: 1, skippedRecordCount: 0, records: [] }),
    getDiagnosticsSnapshot: vi.fn().mockReturnValue(baseDiagnostics),
  },
}));

vi.mock('./services/busReference/busRoutes/service', () => ({
  busRoutesService: {
    getLayer: vi.fn().mockResolvedValue({ status: 'LIVE_SUCCESS', provenance: 'LIVE', fetchedAt: 't', recordCount: 1, skippedRecordCount: 0, records: [] }),
    getDiagnosticsSnapshot: vi.fn().mockReturnValue(baseDiagnostics),
  },
}));

vi.mock('./services/busArrival/service', () => ({
  busArrivalService: {
    getBusArrival: vi.fn().mockResolvedValue({ status: 'LIVE_SUCCESS', provenance: 'LIVE', fetchedAt: 't', busStopCode: '83139', recordCount: 1, events: [] }),
    getDiagnosticsSnapshot: vi.fn().mockReturnValue({ ...baseDiagnostics, lastBusStopCode: '83139' }),
  },
}));

vi.mock('./services/journeyPlanning/service', () => ({
  journeyPlanningService: {
    planJourney: vi.fn().mockResolvedValue({
      status: 'LIVE_SUCCESS',
      provenance: 'LIVE',
      fetchedAt: 't',
      from: { latitude: 1.3, longitude: 103.8 },
      to: { latitude: 1.31, longitude: 103.81 },
      itineraries: [
        {
          startTime: 't1',
          endTime: 't2',
          durationSeconds: 100,
          walkDistanceMeters: 0,
          transfers: 0,
          legs: [],
          hasDisruption: false,
          hasLiftWarning: false,
        },
      ],
      recommendation: { index: 0, reason: 'No live disruptions or lift outages reported on this route right now.' },
    }),
    getDiagnosticsSnapshot: vi.fn().mockReturnValue({ configured: true, lastRequestAt: 't', lastStatus: 'LIVE_SUCCESS', lastItineraryCount: 1 }),
  },
}));

// Imported after the mocks (via beforeAll, so no top-level await) so every
// route module picks up its mocked service rather than the real singleton
// (which would otherwise make real LTA/S3 network calls during tests).
let createApp: typeof CreateApp;

beforeAll(async () => {
  ({ createApp } = await import('./app'));
});

describe('GET /health', () => {
  it('returns 200 without depending on LTA', async () => {
    const response = await request(createApp()).get('/health');
    expect(response.status).toBe(200);
    expect(response.body).toEqual({ status: 'ok' });
  });
});

describe('GET /api/transport/facilities', () => {
  it('returns the normalised facilities payload, never a raw LTA envelope', async () => {
    const response = await request(createApp()).get('/api/transport/facilities');

    expect(response.status).toBe(200);
    expect(response.body.status).toBe('LIVE_SUCCESS');
    expect(response.body.events[0].type).toBe('LIFT_MAINTENANCE');
    expect(response.body).not.toHaveProperty('odata.metadata');
    expect(JSON.stringify(response.body)).not.toMatch(/accountkey/i);
  });
});

describe('GET /api/transport/train-service-alerts', () => {
  it('returns the normalised alerts payload', async () => {
    const response = await request(createApp()).get('/api/transport/train-service-alerts');
    expect(response.status).toBe(200);
    expect(response.body.status).toBe('LIVE_EMPTY');
  });
});

describe('GET /api/transport/station-crowding/real-time and /forecast', () => {
  it('are two separate endpoints, never merged into one crowding response', async () => {
    const realtime = await request(createApp()).get('/api/transport/station-crowding/real-time');
    const forecast = await request(createApp()).get('/api/transport/station-crowding/forecast');
    expect(realtime.status).toBe(200);
    expect(forecast.status).toBe(200);
    expect(realtime.body).toHaveProperty('events');
    expect(forecast.body).toHaveProperty('records');
  });
});

describe('GET /api/geo/*', () => {
  it('exposes train-stations, train-station-exits, and covered-linkways', async () => {
    const stations = await request(createApp()).get('/api/geo/train-stations');
    const exits = await request(createApp()).get('/api/geo/train-station-exits');
    const linkways = await request(createApp()).get('/api/geo/covered-linkways');

    expect(stations.status).toBe(200);
    expect(stations.body.records[0].geometry.type).toBe('Point');
    expect(exits.status).toBe(200);
    expect(linkways.status).toBe(200);
  });
});

describe('GET /api/bus/*', () => {
  it('exposes stops, services, and routes as reference data', async () => {
    const stops = await request(createApp()).get('/api/bus/stops');
    const services = await request(createApp()).get('/api/bus/services');
    const routes = await request(createApp()).get('/api/bus/routes');

    expect(stops.status).toBe(200);
    expect(services.status).toBe(200);
    expect(routes.status).toBe(200);
  });

  it('requires busStopCode for arrival and never calls LTA without it', async () => {
    const missing = await request(createApp()).get('/api/bus/arrival');
    expect(missing.status).toBe(400);

    const withStop = await request(createApp()).get('/api/bus/arrival?busStopCode=83139');
    expect(withStop.status).toBe(200);
    expect(withStop.body.busStopCode).toBe('83139');
  });
});

describe('GET /api/journey/plan', () => {
  it('requires from/to as "lat,lng" and never calls OneMap without them', async () => {
    const missing = await request(createApp()).get('/api/journey/plan');
    expect(missing.status).toBe(400);

    const badFormat = await request(createApp()).get('/api/journey/plan?from=notlatlng&to=1.3,103.8');
    expect(badFormat.status).toBe(400);
  });

  it('returns a normalised multi-modal plan with a recommendation', async () => {
    const response = await request(createApp()).get('/api/journey/plan?from=1.3,103.8&to=1.31,103.81');
    expect(response.status).toBe(200);
    expect(response.body.status).toBe('LIVE_SUCCESS');
    expect(response.body.recommendation).toBeTruthy();
    expect(JSON.stringify(response.body)).not.toMatch(/onemap.*key/i);
  });
});

describe('GET /api/lta/status', () => {
  it('exposes diagnostics for every implemented endpoint without any secret values', async () => {
    const response = await request(createApp()).get('/api/lta/status');

    expect(response.status).toBe(200);
    expect(Object.keys(response.body.endpoints).sort()).toEqual(
      [
        'coveredLinkWay',
        'facilitiesMaintenance',
        'pcdForecast',
        'pcdRealTime',
        'trainServiceAlerts',
        'trainStation',
        'trainStationExit',
        'busStops',
        'busServices',
        'busRoutes',
        'busArrival',
        'journeyPlanning',
      ].sort()
    );
    expect(JSON.stringify(response.body)).not.toMatch(/accountkey/i);
  });
});
