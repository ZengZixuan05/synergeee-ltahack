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
