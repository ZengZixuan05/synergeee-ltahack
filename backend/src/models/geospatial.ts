import { WgsGeometry } from '../geo/geometry';

// ---------------------------------------------------------------------------
// Geospatial reference models (GeospatialWholeIsland layers).
//
// These are deliberately NOT part of the `TransportEvent` union in
// transportEvent.ts: they're static reference geometry (a station's
// footprint, an exit point, a covered walkway segment), not time-bound
// occurrences. All three share `source`/`provenance`/`lastUpdated` with
// TransportEvent for consistency, but are their own model family.
//
// IMPORTANT — none of these layers carry an LTA station code (e.g. "NE12").
// TrainStation only has a descriptive name (`STN_NAM_DE`, e.g. "HOUGANG MRT
// STATION") and sometimes an `ATTACHEMEN` filename that happens to embed a
// code (e.g. "NE14_HGN STN.zip") — but that field is inconsistently present
// (often null) and is a filename, not a documented station-code field.
// TrainStationExit only has `stn_name` (same free-text convention, but a
// DIFFERENT field name/casing than TrainStation's `STN_NAM_DE` — another
// cross-endpoint inconsistency, confirmed live). Joining these to
// FacilitiesMaintenance/TrainServiceAlerts `StationCode` values by name
// matching would require inventing a fuzzy-matching heuristic the source
// data doesn't support, so this milestone does not attempt it — see
// backend/docs/LTA_INTEGRATION.md.
// ---------------------------------------------------------------------------

interface GeospatialRecordBase {
  id: string;
  source: 'LTA';
  provenance: 'LIVE';
  lastUpdated: string;
}

export interface TrainStationFootprint extends GeospatialRecordBase {
  /** STN_NAM_DE, e.g. "HOUGANG MRT STATION". Absent if the source record didn't include it. */
  name?: string;
  /** TYP_CD_DES as reported, e.g. "MRT" or "LRT" — preserved verbatim, not narrowed to an enum since it isn't documented anywhere. */
  stationType?: string;
  /** ATTACHEMEN verbatim, if present — source data only; see the module-level note above about why this isn't parsed into a station code. */
  attachmentReference?: string;
  geometry: WgsGeometry;
}

export interface TrainStationExitPoint extends GeospatialRecordBase {
  /** stn_name, e.g. "MACPHERSON MRT STATION". */
  stationName?: string;
  /** exit_code, e.g. "Exit A". */
  exitCode?: string;
  geometry: WgsGeometry;
}

export interface CoveredLinkwaySegment extends GeospatialRecordBase {
  /** OBJECTID as reported — the only attribute this layer carries. */
  objectId?: number;
  geometry: WgsGeometry;
}
