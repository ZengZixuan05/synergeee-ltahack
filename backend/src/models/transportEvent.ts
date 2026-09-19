import { CanonicalStationRef } from './station';
import { CanonicalRailLine } from './railLine';
import { CrowdLevel } from './crowdLevel';

// ---------------------------------------------------------------------------
// JourneyAhead domain model for transport events.
//
// Every LTA integration normalises into this shape (or a future member of
// the `TransportEvent` union) rather than exposing its own raw response
// structure to the rest of the backend or to the frontend. Keep the union
// discriminated on `type` so new event kinds can be added without weakening
// the ones that already exist.
//
// `station: CanonicalStationRef` deliberately lives on each member, not on
// the shared base: FacilitiesMaintenance's lift events each affect exactly
// one station, but TrainServiceAlerts (confirmed live 2026-09-19) reports
// one disruption per *line segment*, which can span several stations at
// once (e.g. `Stations: "NE9,NE8,NE7,NE6"`) — forcing that into a single
// `CanonicalStationRef` would either drop stations or fabricate one
// "primary" station the source doesn't designate.
//
// IMPORTANT — crowding: PCDRealTime (real-time station crowding),
// PCDForecast (forecast station crowding), and BusArrival's per-bus `Load`
// (not implemented) are three different concepts that must never collapse
// into one context-free "crowding" field. PCDRealTime is modelled below as
// `StationCrowdingObservedEvent` (one real occurrence: a station's crowd
// level over a specific interval — fits this file's event shape naturally).
// PCDForecast is NOT a `TransportEvent` member — flattening its per-day,
// per-station, per-30-minute-interval structure into one event per interval
// would explode into tens of thousands of records per fetch across all
// lines; it is modelled instead as `StationCrowdingForecast`, one record per
// (station, date) holding its full interval list — see
// models/stationCrowdingForecast.ts. BusArrival's `Load` should get its own
// type (e.g. `BusLoadObservedEvent`) when that endpoint is implemented.
// ---------------------------------------------------------------------------

export type TransportEventSource = 'LTA';

/**
 * LIVE = derived from an actual LTA DataMall response just fetched (possibly
 * served from the short-lived cache, but never fabricated). DEMO is reserved
 * for the frontend's labelled demo scenarios and is never produced by this
 * backend's live integrations — see AGENTS.md "LIVE VS DEMO": a live error
 * must never silently become a demo event.
 */
export type TransportEventProvenance = 'LIVE' | 'DEMO';

interface TransportEventBase {
  /** Stable id for this event, derived deterministically from source fields. */
  id: string;
  source: TransportEventSource;
  provenance: TransportEventProvenance;
  /** ISO 8601 timestamps, only when the source actually provides them. Never inferred. */
  startTime?: string;
  endTime?: string;
  /** When JourneyAhead observed/fetched this event (ISO 8601). */
  lastUpdated: string;
}

export type LiftEventType = 'LIFT_MAINTENANCE';

/**
 * Normalised form of an LTA `v2/FacilitiesMaintenance` record. LTA reports
 * this as an ad hoc lift maintenance entry — we preserve that framing
 * (`LIFT_MAINTENANCE`) rather than asserting a full "outage" (unplanned
 * failure) that the source data doesn't actually distinguish from scheduled
 * maintenance. Functionally it still means the lift is unavailable.
 */
export interface LiftMaintenanceEvent extends TransportEventBase {
  type: LiftEventType;
  station: CanonicalStationRef;
  /** LTA LiftID, e.g. "B1L01". Optional per the guide. */
  liftId?: string;
  /**
   * LTA LiftDesc verbatim, e.g. "Exit B Street level - Concourse". This is
   * preserved as source data only — JourneyAhead does not infer an exact
   * station-exit relationship from it unless a real exit/GIS join backs
   * that up (see TrainStationExit in a later milestone).
   */
  liftDescription?: string;
}

/**
 * Normalised form of one `TrainServiceAlerts` `AffectedSegments` entry. Only
 * created for segments LTA is actively reporting as disrupted — a
 * disruption-free response has zero `AffectedSegments` and so produces zero
 * of these (see LIVE_EMPTY in the service). LTA's general advisory
 * `Message` entries are a separate, line-independent concept (see
 * `TrainServiceAlertsResult.messages` in services/trainServiceAlerts) and
 * are not modelled as `TransportEvent`s.
 */
export interface TrainServiceAlertEvent extends TransportEventBase {
  type: 'TRAIN_SERVICE_ALERT';
  /** Resolved canonical line, or null if the raw code wasn't recognised — never guessed. */
  line: CanonicalRailLine | null;
  /** The line code exactly as reported by LTA. */
  rawLine: string;
  /** e.g. "HarbourFront", or "Both". LTA does not constrain this to a fixed enum (station names vary), so it's kept as free text. */
  direction?: string;
  /** Station codes from the comma-separated `Stations` field, split but otherwise unparsed (LTA gives no per-station name here). */
  affectedStationCodes: string[];
  /** Raw `FreePublicBus` value verbatim — LTA documents this as either a station-code list OR the literal string "Free bus service island wide", so it is not force-parsed into an array. */
  freePublicBus?: string;
  /** Raw `FreeMRTShuttle` value verbatim, for the same reason as `freePublicBus`. */
  freeMrtShuttle?: string;
  /** e.g. "HarbourFront", or "Both". */
  mrtShuttleDirection?: string;
}

/**
 * Normalised form of one PCDRealTime record — a real-time observation of
 * ONE station's crowd level over a short interval (`startTime`/`endTime` on
 * the base carry that interval). This is real-time STATION crowding only;
 * see the module-level note above for why PCDForecast (a per-day time
 * series, modelled separately as `StationCrowdingForecast` — see
 * models/stationCrowdingForecast.ts) and BusArrival's per-bus `Load` are
 * deliberately not the same shape or field.
 */
export interface StationCrowdingObservedEvent extends TransportEventBase {
  type: 'STATION_CROWDING_OBSERVED';
  stationCode: string;
  /** Resolved from the `TrainLine` this observation was queried under (PCDRealTime requires it as a request parameter) — not guessed from the station code. */
  line: CanonicalRailLine | null;
  rawLine: string;
  crowdLevel: CrowdLevel;
  /** LTA's raw `l`/`m`/`h`/`NA` value, preserved verbatim alongside the resolved `crowdLevel`. */
  rawCrowdLevel: string;
}

// Add new members here as later phases land (BusLoadObservedEvent, ...).
export type TransportEvent = LiftMaintenanceEvent | TrainServiceAlertEvent | StationCrowdingObservedEvent;
