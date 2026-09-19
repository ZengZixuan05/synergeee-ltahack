import { WeatherForecastArea } from '../../../models/weather';
import { twoHourForecastResponseSchema } from './schema';
import { WeatherResponseShapeError } from '../../../weather/errors';

const RAIN_PATTERN = /rain|shower/i;

/** Classifies against the documented forecast-text vocabulary (data.gov.sg's 24hr forecast OpenAPI spec) — not an invented judgement call, see models/weather.ts. */
function isRaining(forecastText: string): boolean {
  return RAIN_PATTERN.test(forecastText);
}

function buildId(area: string): string {
  const slug = area.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-');
  return `weather-forecast:${slug}`;
}

/**
 * Validates and normalises a raw /two-hr-forecast response into one
 * WeatherForecastArea per named area, using the CURRENT item only (the
 * endpoint returns one at a time in practice). Returns [] for a
 * malformed/empty response rather than throwing — a missing weather
 * forecast is treated as "no data right now", not fatal, since nothing
 * downstream depends solely on this succeeding.
 */
export function normaliseTwoHourForecast(raw: unknown, fetchedAt: string): WeatherForecastArea[] {
  const parsed = twoHourForecastResponseSchema.safeParse(raw);
  if (!parsed.success) {
    throw new WeatherResponseShapeError('two-hr-forecast');
  }

  const { area_metadata, items } = parsed.data.data;
  const currentItem = items[0];
  if (!currentItem) return [];

  const locationByArea = new Map(area_metadata.map((a) => [a.name, a.label_location]));

  return currentItem.forecasts
    .map((entry) => {
      const location = locationByArea.get(entry.area);
      if (!location) return null; // no coordinates for this area name — skip rather than fabricate a location
      return {
        id: buildId(entry.area),
        source: 'DataGovSg' as const,
        provenance: 'LIVE' as const,
        lastUpdated: fetchedAt,
        area: entry.area,
        forecast: entry.forecast,
        isRaining: isRaining(entry.forecast),
        latitude: location.latitude,
        longitude: location.longitude,
        validFrom: currentItem.valid_period.start,
        validTo: currentItem.valid_period.end,
      };
    })
    .filter((v): v is WeatherForecastArea => v !== null);
}
