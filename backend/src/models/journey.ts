import { WgsGeometry } from '../geo/geometry';
import { CanonicalRailLine } from './railLine';
import { CrowdLevel } from './crowdLevel';

// ---------------------------------------------------------------------------
// Journey planning domain model.
//
// A JourneyItinerary is OneMap's `pt` routing response (confirmed live
// 2026-09-19 to be OpenTripPlanner-shaped) normalised into JourneyAhead's own
// shape, with each RAIL leg then enriched against live LTA data this backend
// already collects (TrainServiceAlerts, FacilitiesMaintenance, PCDRealTime) —
// see services/journeyPlanning/enrich.ts. This join is possible specifically
// because OneMap's `stopCode` values are the same LTA station/bus-stop codes
// used everywhere else in this backend (confirmed live: "EW5" for Bedok,
// "06029" for a real bus stop) — no fuzzy matching required, unlike the
// GeospatialWholeIsland layers (see models/geospatial.ts).
//
// This is deliberately not a `TransportEvent` — a journey is a computed plan
// a commuter asked for, not an observed occurrence.
// ---------------------------------------------------------------------------

interface JourneyLegBase {
  /** ISO 8601. */
  startTime: string;
  endTime: string;
  durationSeconds: number;
  distanceMeters: number;
  /** LineString, WGS84 — decoded from OneMap's encoded polyline (src/geo/polyline.ts). */
  geometry: WgsGeometry;
}

export interface WalkJourneyLeg extends JourneyLegBase {
  mode: 'WALK';
  fromName: string;
  toName: string;
}

export interface StationCrowdingSnapshot {
  stationCode: string;
  crowdLevel: CrowdLevel;
}

export interface LiftWarning {
  stationCode: string;
  stationName?: string;
  liftId?: string;
  liftDescription?: string;
}

/**
 * Live annotations for a RAIL leg, populated by enrich.ts. Optional on the
 * leg itself: a leg normalised straight from OneMap (before enrichment) has
 * no `live` field yet, rather than a fabricated "all clear" one.
 */
export interface RailLegLiveStatus {
  disrupted: boolean;
  /** Plain-language reason, built from a live TrainServiceAlerts entry — only present when `disrupted` is true. */
  disruptionMessage?: string;
  /** Any FacilitiesMaintenance lift currently down at a station this leg passes through (from/to/intermediate). */
  liftWarnings: LiftWarning[];
  /** Real-time crowd level at each station this leg passes through, where available. */
  crowding: StationCrowdingSnapshot[];
}

export interface RailJourneyLeg extends JourneyLegBase {
  mode: 'RAIL';
  line: CanonicalRailLine | null;
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
  // No live enrichment yet — see known limitations in
  // backend/docs/LTA_INTEGRATION.md: BusArrival is a per-stop live query,
  // and calling it for every bus leg of every itinerary on every plan
  // request was judged too expensive for this milestone.
}

export type JourneyLeg = WalkJourneyLeg | RailJourneyLeg | BusJourneyLeg;

export interface JourneyItinerary {
  startTime: string;
  endTime: string;
  durationSeconds: number;
  walkDistanceMeters: number;
  transfers: number;
  /** SGD, as OneMap reports it (a string, e.g. "3.02") — preserved verbatim, not parsed to a number, since currency arithmetic on a float is exactly the kind of subtle bug this project avoids. */
  fare?: string;
  legs: JourneyLeg[];
  /** true if any RAIL leg in this itinerary is currently disrupted per live TrainServiceAlerts data. */
  hasDisruption: boolean;
  /** true if any RAIL leg's from/to/intermediate station currently has a lift under maintenance. */
  hasLiftWarning: boolean;
}

export type JourneyPlanStatus = 'LIVE_SUCCESS' | 'LIVE_EMPTY' | 'LIVE_ERROR';

export interface JourneyPlanRecommendation {
  /** Index into `itineraries`. */
  index: number;
  /** Plain-language reason this itinerary was recommended over the others — the "why" the spec asks for, not just a status flag. */
  reason: string;
}

export interface JourneyPlanResult {
  status: JourneyPlanStatus;
  provenance: 'LIVE';
  fetchedAt: string;
  from: { latitude: number; longitude: number };
  to: { latitude: number; longitude: number };
  /** Ordered as OneMap returned them (its own ranking), each enriched with live LTA data independently. */
  itineraries: JourneyItinerary[];
  /** Absent when `itineraries` is empty. */
  recommendation?: JourneyPlanRecommendation;
  errorMessage?: string;
}
