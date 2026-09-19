// data.gov.sg real-time weather data — a third, independent data source
// (see src/weather/client.ts). Deliberately not a `TransportEvent`: this is
// environmental observation data from NEA, not something LTA reports, and
// not a JourneyAhead-computed occurrence.

interface WeatherRecordBase {
  id: string;
  source: 'DataGovSg';
  provenance: 'LIVE';
  lastUpdated: string;
}

/**
 * The documented forecast text vocabulary (data.gov.sg's 24-hour forecast
 * OpenAPI spec, provided in the challenge brief) includes both "Rain" and
 * "Showers" variants (e.g. "Light Rain", "Passing Showers", "Heavy Thundery
 * Showers"). `isRaining` is a plain-text classification against that
 * documented vocabulary — checking for "rain"/"shower" — not an invented
 * judgement call about weather severity.
 */
export interface WeatherForecastArea extends WeatherRecordBase {
  area: string;
  forecast: string;
  isRaining: boolean;
  latitude: number;
  longitude: number;
  validFrom: string;
  validTo: string;
}

export interface RainfallReading extends WeatherRecordBase {
  stationId: string;
  stationName: string;
  latitude: number;
  longitude: number;
  /** Millimetres, as data.gov.sg reports it (readingUnit confirmed live: "mm"). */
  valueMm: number;
  timestamp: string;
}
