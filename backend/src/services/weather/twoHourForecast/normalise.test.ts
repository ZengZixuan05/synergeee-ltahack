import { describe, expect, it } from 'vitest';
import { normaliseTwoHourForecast } from './normalise';
import { WeatherResponseShapeError } from '../../../weather/errors';

const FETCHED_AT = '2026-09-19T02:00:00.000Z';

// Mirrors a real live /two-hr-forecast response (2026-09-19).
const LIVE_RESPONSE = {
  data: {
    area_metadata: [
      { name: 'Bedok', label_location: { latitude: 1.321, longitude: 103.924 } },
      { name: 'Ang Mo Kio', label_location: { latitude: 1.375, longitude: 103.839 } },
    ],
    items: [
      {
        valid_period: { start: '2026-09-19T11:30:00+08:00', end: '2026-09-19T13:30:00+08:00' },
        forecasts: [
          { area: 'Bedok', forecast: 'Cloudy' },
          { area: 'Ang Mo Kio', forecast: 'Heavy Thundery Showers' },
        ],
      },
    ],
  },
};

describe('normaliseTwoHourForecast', () => {
  it('joins each forecast entry with its area coordinates', () => {
    const areas = normaliseTwoHourForecast(LIVE_RESPONSE, FETCHED_AT);
    expect(areas).toHaveLength(2);
    const bedok = areas.find((a) => a.area === 'Bedok')!;
    expect(bedok).toMatchObject({ forecast: 'Cloudy', isRaining: false, latitude: 1.321, longitude: 103.924 });
  });

  it('classifies "Heavy Thundery Showers" as raining, and "Cloudy" as not', () => {
    const areas = normaliseTwoHourForecast(LIVE_RESPONSE, FETCHED_AT);
    expect(areas.find((a) => a.area === 'Ang Mo Kio')!.isRaining).toBe(true);
    expect(areas.find((a) => a.area === 'Bedok')!.isRaining).toBe(false);
  });

  it('classifies every documented rain/shower forecast text as raining', () => {
    const rainTexts = ['Light Rain', 'Moderate Rain', 'Heavy Rain', 'Passing Showers', 'Light Showers', 'Showers', 'Heavy Showers', 'Thundery Showers'];
    for (const forecast of rainTexts) {
      const response = { data: { ...LIVE_RESPONSE.data, items: [{ ...LIVE_RESPONSE.data.items[0], forecasts: [{ area: 'Bedok', forecast }] }] } };
      const [area] = normaliseTwoHourForecast(response, FETCHED_AT);
      expect(area!.isRaining, `expected "${forecast}" to be classified as raining`).toBe(true);
    }
  });

  it('classifies non-rain forecast text as not raining', () => {
    const nonRainTexts = ['Fair', 'Fair and Warm', 'Partly Cloudy', 'Hazy', 'Windy', 'Mist', 'Fog'];
    for (const forecast of nonRainTexts) {
      const response = { data: { ...LIVE_RESPONSE.data, items: [{ ...LIVE_RESPONSE.data.items[0], forecasts: [{ area: 'Bedok', forecast }] }] } };
      const [area] = normaliseTwoHourForecast(response, FETCHED_AT);
      expect(area!.isRaining, `expected "${forecast}" to be classified as not raining`).toBe(false);
    }
  });

  it('returns [] when there are no items (treated as no forecast, not an error)', () => {
    expect(normaliseTwoHourForecast({ data: { area_metadata: [], items: [] } }, FETCHED_AT)).toEqual([]);
  });

  it('skips a forecast entry whose area has no matching metadata, rather than fabricating a location', () => {
    const response = { data: { area_metadata: [], items: LIVE_RESPONSE.data.items } };
    expect(normaliseTwoHourForecast(response, FETCHED_AT)).toEqual([]);
  });

  it('throws WeatherResponseShapeError for a malformed response', () => {
    expect(() => normaliseTwoHourForecast(null, FETCHED_AT)).toThrow(WeatherResponseShapeError);
    expect(() => normaliseTwoHourForecast({ data: {} }, FETCHED_AT)).toThrow(WeatherResponseShapeError);
  });
});
