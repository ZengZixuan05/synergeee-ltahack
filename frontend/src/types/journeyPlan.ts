// Frontend-side mirror of the backend's journey-planning domain model
// (backend/src/models/journey.ts). Kept field-for-field identical since the
// browser consumes this shape directly via /api/journey/plan.

export type WgsGeometry =
  | { type: 'Point'; coordinates: [number, number] }
  | { type: 'MultiPoint'; coordinates: [number, number][] }
  | { type: 'LineString'; coordinates: [number, number][] }
  | { type: 'MultiLineString'; coordinates: [number, number][][] }
  | { type: 'Polygon'; coordinates: [number, number][][] }
  | { type: 'MultiPolygon'; coordinates: [number, number][][][] };

interface JourneyLegBase {
  startTime: string;
  endTime: string;
  durationSeconds: number;
  distanceMeters: number;
  geometry: WgsGeometry;
}

export interface WalkJourneyLeg extends JourneyLegBase {
  mode: 'WALK';
  fromName: string;
  toName: string;
}

export interface StationCrowdingSnapshot {
  stationCode: string;
  crowdLevel: 'LOW' | 'MODERATE' | 'HIGH' | 'UNKNOWN';
}

export interface LiftWarning {
  stationCode: string;
  stationName?: string;
  liftId?: string;
  liftDescription?: string;
}

export interface RailLegLiveStatus {
  disrupted: boolean;
  disruptionMessage?: string;
  liftWarnings: LiftWarning[];
  crowding: StationCrowdingSnapshot[];
}

export interface RailJourneyLeg extends JourneyLegBase {
  mode: 'RAIL';
  line: string | null;
  rawLine: string;
  fromStationCode: string;
  fromStationName: string;
  toStationCode: string;
  toStationName: string;
  intermediateStationCodes: string[];
  live?: RailLegLiveStatus;
}

export interface BusJourneyLeg extends JourneyLegBase {
  mode: 'BUS';
  serviceNo: string;
  fromStopCode: string;
  fromStopName: string;
  toStopCode: string;
  toStopName: string;
}

export type JourneyLeg = WalkJourneyLeg | RailJourneyLeg | BusJourneyLeg;

export interface JourneyItinerary {
  startTime: string;
  endTime: string;
  durationSeconds: number;
  walkDistanceMeters: number;
  transfers: number;
  fare?: string;
  legs: JourneyLeg[];
  hasDisruption: boolean;
  hasLiftWarning: boolean;
}

export type JourneyPlanStatus = 'LIVE_SUCCESS' | 'LIVE_EMPTY' | 'LIVE_ERROR';

export interface JourneyPlanRecommendation {
  index: number;
  reason: string;
}

export interface JourneyPlanResult {
  status: JourneyPlanStatus;
  provenance: 'LIVE';
  fetchedAt: string;
  from: { latitude: number; longitude: number };
  to: { latitude: number; longitude: number };
  itineraries: JourneyItinerary[];
  recommendation?: JourneyPlanRecommendation;
  errorMessage?: string;
}
