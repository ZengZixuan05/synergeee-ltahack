import { CanonicalRailLine } from './railLine';

// ---------------------------------------------------------------------------
// Canonical station foundation.
//
// This is deliberately small: a stable shape that FacilitiesMaintenance,
// TrainServiceAlerts, PCDRealTime/Forecast, the TrainStation/TrainStationExit
// GIS layers, and journey route legs can all describe a station with, so
// they can be joined later on `stationCode`. It is a type contract, not a
// bundled dataset — JourneyAhead does not ship its own copy of the official
// station list here. Building a full station registry (interchanges, exits,
// GIS geometry) is out of scope for this milestone; do that when the
// GeospatialWholeIsland (TrainStation/TrainStationExit) integrations land.
// ---------------------------------------------------------------------------

export interface CanonicalStationRef {
  /** LTA station code, e.g. "NE12". Preserved verbatim — this is the join key. */
  stationCode: string;
  /** Station name as reported by the source, if available. */
  stationName?: string;
  /** Resolved canonical line, or null if the source's line code wasn't recognised. */
  line: CanonicalRailLine | null;
  /** The line code exactly as reported by the source, for display/debugging. */
  rawLine: string;
}
