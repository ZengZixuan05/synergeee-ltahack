import { describe, expect, it } from 'vitest';
import { normaliseRainfall } from './normalise';
import { WeatherResponseShapeError } from '../../../weather/errors';

const FETCHED_AT = '2026-09-19T02:00:00.000Z';

// Mirrors a real live /rainfall response (2026-09-19).
const LIVE_RESPONSE = {
  data: {
    stations: [{ id: 'S218', name: 'Bukit Batok Street 34', location: { latitude: 1.36491, longitude: 103.75065 } }],
    readings: [{ timestamp: '2026-09-19T11:40:00+08:00', data: [{ stationId: 'S218', value: 0 }] }],
  },
};

describe('normaliseRainfall', () => {
  it('joins each reading with its station metadata', () => {
    const readings = normaliseRainfall(LIVE_RESPONSE, FETCHED_AT);
    expect(readings).toEqual([
      {
        id: 'rainfall:S218',
        source: 'DataGovSg',
        provenance: 'LIVE',
        lastUpdated: FETCHED_AT,
        stationId: 'S218',
        stationName: 'Bukit Batok Street 34',
        latitude: 1.36491,
        longitude: 103.75065,
        valueMm: 0,
        timestamp: '2026-09-19T11:40:00+08:00',
      },
    ]);
  });

  it('preserves a genuine non-zero rainfall value (it is currently raining) rather than treating zero as the only valid state', () => {
    const raining = {
      data: {
        stations: LIVE_RESPONSE.data.stations,
        readings: [{ timestamp: 't', data: [{ stationId: 'S218', value: 12.4 }] }],
      },
    };
    expect(normaliseRainfall(raining, FETCHED_AT)[0]!.valueMm).toBe(12.4);
  });

  it('returns [] when there are no readings', () => {
    expect(normaliseRainfall({ data: { stations: [], readings: [] } }, FETCHED_AT)).toEqual([]);
  });

  it('skips a reading whose station has no matching metadata, rather than fabricating a name/location', () => {
    const response = { data: { stations: [], readings: LIVE_RESPONSE.data.readings } };
    expect(normaliseRainfall(response, FETCHED_AT)).toEqual([]);
  });

  it('throws WeatherResponseShapeError for a malformed response', () => {
    expect(() => normaliseRainfall(null, FETCHED_AT)).toThrow(WeatherResponseShapeError);
    expect(() => normaliseRainfall({ data: {} }, FETCHED_AT)).toThrow(WeatherResponseShapeError);
  });
});
