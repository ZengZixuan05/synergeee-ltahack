// Frontend-side mirror of the backend's bus reference/arrival models
// (backend/src/models/bus.ts, backend/src/services/busReference/layerService.ts).

export type ReferenceLayerStatus = 'LIVE_SUCCESS' | 'LIVE_EMPTY' | 'LIVE_ERROR';

export interface BusReferenceLayer<T> {
  status: ReferenceLayerStatus;
  provenance: 'LIVE';
  fetchedAt: string;
  recordCount: number;
  skippedRecordCount: number;
  records: T[];
  errorMessage?: string;
}

interface BusReferenceBase {
  id: string;
  source: 'LTA';
  provenance: 'LIVE';
  lastUpdated: string;
}

export interface BusStopReference extends BusReferenceBase {
  busStopCode: string;
  roadName?: string;
  description?: string;
  latitude: number;
  longitude: number;
}

export interface BusServiceReference extends BusReferenceBase {
  serviceNo: string;
  operator: string;
  direction: number;
  category?: string;
  originCode?: string;
  destinationCode?: string;
  amPeakFreq?: string;
  amOffpeakFreq?: string;
  pmPeakFreq?: string;
  pmOffpeakFreq?: string;
  loopDescription?: string;
}

export type BusLoadLevel = 'SEATS_AVAILABLE' | 'STANDING_AVAILABLE' | 'LIMITED_STANDING' | 'UNKNOWN';

export interface BusLoadObservedEvent {
  id: string;
  type: 'BUS_LOAD_OBSERVED';
  source: 'LTA';
  provenance: 'LIVE' | 'DEMO';
  lastUpdated: string;
  busStopCode: string;
  serviceNo: string;
  operator: string;
  visitNumber?: number;
  originCode?: string;
  destinationCode?: string;
  estimatedArrival?: string;
  latitude?: number;
  longitude?: number;
  monitored?: boolean;
  load: BusLoadLevel;
  rawLoad: string;
  wheelchairAccessible?: boolean;
  vehicleType?: string;
}

export type BusArrivalStatus = 'LIVE_SUCCESS' | 'LIVE_EMPTY' | 'LIVE_ERROR';

export interface BusArrivalResponse {
  status: BusArrivalStatus;
  provenance: 'LIVE' | 'DEMO';
  fetchedAt: string;
  busStopCode: string;
  recordCount: number;
  events: BusLoadObservedEvent[];
  errorMessage?: string;
}
