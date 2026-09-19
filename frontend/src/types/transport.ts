// Frontend-side transport types mirroring the backend public shapes
// (backend/src/models/transportEvent.ts). Provider-agnostic; the browser
// never sees the raw LTA envelope. Kept minimal: only fields the UI uses.

export type TransportProvenance = 'LIVE' | 'DEMO';

export type TransportStatus = 'LIVE_SUCCESS' | 'LIVE_EMPTY' | 'LIVE_ERROR';

export interface StationRef {
  stationCode: string;
  stationName: string;
  line: string | null;
  rawLine: string;
}

export interface LiftMaintenanceEvent {
  id: string;
  type: 'LIFT_MAINTENANCE';
  source: 'LTA';
  provenance: TransportProvenance;
  station: StationRef;
  lastUpdated: string;
  liftId?: string;
  liftDescription?: string;
}

export interface FacilitiesResponse {
  status: TransportStatus;
  provenance: TransportProvenance;
  fetchedAt: string;
  recordCount: number;
  skippedRecordCount?: number;
  events: LiftMaintenanceEvent[];
  errorMessage?: string;
}

export type CrowdLevel = 'LOW' | 'MODERATE' | 'HIGH' | 'UNKNOWN';

export interface TrainServiceAlertEvent {
  id: string;
  type: 'TRAIN_SERVICE_ALERT';
  source: 'LTA';
  provenance: TransportProvenance;
  startTime?: string;
  endTime?: string;
  lastUpdated: string;
  line: string | null;
  rawLine: string;
  direction?: string;
  affectedStationCodes: string[];
  freePublicBus?: string;
  freeMrtShuttle?: string;
  mrtShuttleDirection?: string;
}

export interface TrainServiceAlertsResponse {
  status: TransportStatus;
  provenance: TransportProvenance;
  fetchedAt: string;
  recordCount: number;
  events: TrainServiceAlertEvent[];
  messages: { content: string; createdDate: string }[];
  errorMessage?: string;
}

export interface StationCrowdingObservedEvent {
  id: string;
  type: 'STATION_CROWDING_OBSERVED';
  source: 'LTA';
  provenance: TransportProvenance;
  lastUpdated: string;
  stationCode: string;
  line: string | null;
  rawLine: string;
  crowdLevel: CrowdLevel;
  rawCrowdLevel: string;
}

export interface StationCrowdingRealTimeResponse {
  status: TransportStatus;
  provenance: TransportProvenance;
  fetchedAt: string;
  recordCount: number;
  skippedLineCount: number;
  events: StationCrowdingObservedEvent[];
  errorMessage?: string;
}

export interface StationCrowdingForecastInterval {
  start: string;
  crowdLevel: CrowdLevel;
  rawCrowdLevel: string;
}

export interface StationCrowdingForecast {
  id: string;
  source: 'LTA';
  provenance: 'LIVE';
  stationCode: string;
  line: string | null;
  rawLine: string;
  date: string;
  intervals: StationCrowdingForecastInterval[];
  lastUpdated: string;
}

export interface StationCrowdingForecastResponse {
  status: TransportStatus;
  provenance: TransportProvenance;
  fetchedAt: string;
  recordCount: number;
  skippedLineCount: number;
  records: StationCrowdingForecast[];
  errorMessage?: string;
}
