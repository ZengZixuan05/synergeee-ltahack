// SERVER-ONLY adapter for the standalone JourneyAhead backend (Express, :8081).
// Never import from a Client Component. Used only by Next.js Route Handlers
// (src/app/api/transport/*), mirroring the OneMap proxy pattern: the browser
// talks to our own /api routes, which server-side proxy to the backend.

import { FacilitiesResponse, TrainServiceAlertsResponse, StationCrowdingRealTimeResponse, StationCrowdingForecastResponse } from '@/types/transport';
import { JourneyPlanResult } from '@/types/journeyPlan';
import { BusReferenceLayer, BusStopReference, BusServiceReference, BusArrivalResponse } from '@/types/bus';
import { WeatherForecastResponse, WeatherRainfallResponse } from '@/types/weather';

const BACKEND_BASE_URL = process.env.BACKEND_BASE_URL || 'http://localhost:8081';
const REQUEST_TIMEOUT_MS = 8000;

export class BackendUnavailableError extends Error {}

/**
 * Generic GET against the backend. The backend returns LIVE_ERROR as a 200
 * with a status field (not an HTTP 5xx), so a reachable backend always
 * yields its normal response shape. Only an unreachable/timed-out backend
 * throws BackendUnavailableError.
 */
async function backendGet<T>(path: string): Promise<T> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  try {
    const response = await fetch(BACKEND_BASE_URL + path, {
      signal: controller.signal,
      headers: { Accept: 'application/json' },
    });

    if (response.ok === false) {
      throw new BackendUnavailableError('Backend returned HTTP ' + response.status);
    }

    return (await response.json()) as T;
  } catch (error) {
    if (error instanceof BackendUnavailableError) throw error;
    throw new BackendUnavailableError('Could not reach the transport backend.');
  } finally {
    clearTimeout(timeout);
  }
}

export async function fetchFacilitiesMaintenance(): Promise<FacilitiesResponse> {
  return backendGet<FacilitiesResponse>('/api/transport/facilities');
}

export async function fetchTrainServiceAlerts(): Promise<TrainServiceAlertsResponse> {
  return backendGet<TrainServiceAlertsResponse>('/api/transport/train-service-alerts');
}

export async function fetchStationCrowdingRealTime(): Promise<StationCrowdingRealTimeResponse> {
  return backendGet<StationCrowdingRealTimeResponse>('/api/transport/station-crowding/real-time');
}

export async function fetchStationCrowdingForecast(): Promise<StationCrowdingForecastResponse> {
  return backendGet<StationCrowdingForecastResponse>('/api/transport/station-crowding/forecast');
}

interface JourneyPlanParams {
  from: string; // "lat,lng"
  to: string; // "lat,lng"
  date?: string;
  time?: string;
  maxWalkDistance?: string;
  numItineraries?: string;
}

export async function fetchJourneyPlan(params: JourneyPlanParams): Promise<JourneyPlanResult> {
  const query = new URLSearchParams();
  query.set('from', params.from);
  query.set('to', params.to);
  if (params.date) query.set('date', params.date);
  if (params.time) query.set('time', params.time);
  if (params.maxWalkDistance) query.set('maxWalkDistance', params.maxWalkDistance);
  if (params.numItineraries) query.set('numItineraries', params.numItineraries);
  return backendGet<JourneyPlanResult>('/api/journey/plan?' + query.toString());
}

export async function fetchBusStops(): Promise<BusReferenceLayer<BusStopReference>> {
  return backendGet<BusReferenceLayer<BusStopReference>>('/api/bus/stops');
}

export async function fetchBusServices(): Promise<BusReferenceLayer<BusServiceReference>> {
  return backendGet<BusReferenceLayer<BusServiceReference>>('/api/bus/services');
}

export async function fetchBusArrival(busStopCode: string, serviceNo?: string): Promise<BusArrivalResponse> {
  const query = new URLSearchParams({ busStopCode });
  if (serviceNo) query.set('serviceNo', serviceNo);
  return backendGet<BusArrivalResponse>('/api/bus/arrival?' + query.toString());
}

export async function fetchWeatherForecast(): Promise<WeatherForecastResponse> {
  return backendGet<WeatherForecastResponse>('/api/weather/forecast');
}

export async function fetchWeatherRainfall(): Promise<WeatherRainfallResponse> {
  return backendGet<WeatherRainfallResponse>('/api/weather/rainfall');
}
