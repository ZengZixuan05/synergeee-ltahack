// Frontend-side mirror of the backend's weather models (backend/src/models/weather.ts).
// Weather is a third data source, always 'LIVE' — never demo-flagged.

interface WeatherRecordBase {
  id: string;
  source: 'DataGovSg';
  provenance: 'LIVE';
  lastUpdated: string;
}

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
  valueMm: number;
  timestamp: string;
}

export type WeatherStatus = 'LIVE_SUCCESS' | 'LIVE_EMPTY' | 'LIVE_ERROR';

export interface WeatherForecastResponse {
  status: WeatherStatus;
  provenance: 'LIVE';
  fetchedAt: string;
  recordCount: number;
  areas: WeatherForecastArea[];
  errorMessage?: string;
}

export interface WeatherRainfallResponse {
  status: WeatherStatus;
  provenance: 'LIVE';
  fetchedAt: string;
  recordCount: number;
  readings: RainfallReading[];
  errorMessage?: string;
}
