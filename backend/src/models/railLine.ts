// ---------------------------------------------------------------------------
// Canonical rail-line foundation.
//
// The LTA DataMall API User Guide (v6.8) documents different line-code
// vocabularies for different endpoints. Two are confirmed in the guide today:
//
//   TrainServiceAlerts (section 2.11) line codes:
//     EWL, NSL, NEL, CCL, DTL, TEL, BPL, STL (Sengkang LRT), PTL (Punggol LRT)
//     — and it explicitly folds extensions into their parent line: "EWL (for
//     East West Line AND Changi Extension)" and "CCL (for Circle Line AND
//     Circle Line Extension)".
//
//   Station Crowd Density Real Time / Forecast (sections 2.24-2.25) line
//   codes: CCL, CEL (Circle Line Extension), CGL (Changi Extension), DTL,
//   EWL, NEL, NSL, BPL, SLRT (Sengkang LRT), PLRT (Punggol LRT), TEL
//     — here the extensions ARE split out as their own codes, and the LRT
//     lines use a different abbreviation (SLRT/PLRT vs STL/PTL).
//
// If JourneyAhead let either vocabulary become "the" rail-line identity,
// joining data across these two endpoints (or FacilitiesMaintenance, whose
// `Line` field is not documented against either list) would silently break
// or double-count. Instead, every endpoint adapter must translate its raw
// line code through `resolveCanonicalLine()` before it reaches domain code.
//
// This module intentionally does NOT attempt to resolve the EWL/CGL or
// CCL/CEL ambiguity when a source only reports the folded-in code (e.g.
// TrainServiceAlerts saying "EWL" while the affected station is actually on
// the Changi Extension) — that would require inventing a distinction the
// source data doesn't provide, which AGENTS.md and the hackathon brief both
// forbid. Callers that need that finer distinction should key off the
// affected station code instead, once a station-to-extension lookup exists.
// ---------------------------------------------------------------------------

/** JourneyAhead's own stable rail-line identifiers. Add new lines here only. */
export const CANONICAL_RAIL_LINES = [
  'NSL', // North South Line
  'EWL', // East West Line (TrainServiceAlerts also folds the Changi Extension into this)
  'CGL', // Changi Extension (Expo, Changi Airport) — distinct only where the source separates it
  'NEL', // North East Line
  'CCL', // Circle Line (TrainServiceAlerts also folds the Circle Line Extension into this)
  'CEL', // Circle Line Extension (BayFront, Marina Bay) — distinct only where the source separates it
  'DTL', // Downtown Line
  'TEL', // Thomson-East Coast Line
  'BPL', // Bukit Panjang LRT
  'SKL', // Sengkang LRT (TrainServiceAlerts: STL, Station Crowd Density: SLRT)
  'PGL', // Punggol LRT (TrainServiceAlerts: PTL, Station Crowd Density: PLRT)
] as const;

export type CanonicalRailLine = (typeof CANONICAL_RAIL_LINES)[number];

export function isCanonicalRailLine(value: string): value is CanonicalRailLine {
  return (CANONICAL_RAIL_LINES as readonly string[]).includes(value);
}

/** Which LTA endpoint vocabulary a raw line code was read from. */
export type RailLineCodeSource = 'TrainServiceAlerts' | 'StationCrowdDensity' | 'FacilitiesMaintenance';

const TRAIN_SERVICE_ALERTS_TO_CANONICAL: Record<string, CanonicalRailLine> = {
  NSL: 'NSL',
  EWL: 'EWL',
  NEL: 'NEL',
  CCL: 'CCL',
  DTL: 'DTL',
  TEL: 'TEL',
  BPL: 'BPL',
  STL: 'SKL',
  PTL: 'PGL',
};

const STATION_CROWD_DENSITY_TO_CANONICAL: Record<string, CanonicalRailLine> = {
  NSL: 'NSL',
  EWL: 'EWL',
  CGL: 'CGL',
  NEL: 'NEL',
  CCL: 'CCL',
  CEL: 'CEL',
  DTL: 'DTL',
  TEL: 'TEL',
  BPL: 'BPL',
  SLRT: 'SKL',
  PLRT: 'PGL',
};

/**
 * The exact `TrainLine` codes PCDRealTime/PCDForecast accept as a request
 * parameter (guide sections 2.24-2.25) — both require it and return only
 * that line's stations per call, so fetching network-wide crowding means
 * calling once per code here. Order matches the guide's own listing.
 */
export const PCD_TRAIN_LINE_CODES = [
  'CCL',
  'CEL',
  'CGL',
  'DTL',
  'EWL',
  'NEL',
  'NSL',
  'BPL',
  'SLRT',
  'PLRT',
  'TEL',
] as const;

// FacilitiesMaintenance's `Line` field is not documented against either
// vocabulary above — the guide only shows a single example ("NEL"). Until a
// live sample proves otherwise, we accept both known vocabularies for it
// rather than guessing which one it follows.
//
// BPLRT is a third, undocumented variant observed directly in a live
// v2/FacilitiesMaintenance response during this integration's verification
// (2026-09-19) — neither TrainServiceAlerts' "BPL" nor a guide example. It
// is recorded here because it was actually seen, not guessed.
const FACILITIES_MAINTENANCE_TO_CANONICAL: Record<string, CanonicalRailLine> = {
  ...TRAIN_SERVICE_ALERTS_TO_CANONICAL,
  ...STATION_CROWD_DENSITY_TO_CANONICAL,
  BPLRT: 'BPL',
};

const TABLES_BY_SOURCE: Record<RailLineCodeSource, Record<string, CanonicalRailLine>> = {
  TrainServiceAlerts: TRAIN_SERVICE_ALERTS_TO_CANONICAL,
  StationCrowdDensity: STATION_CROWD_DENSITY_TO_CANONICAL,
  FacilitiesMaintenance: FACILITIES_MAINTENANCE_TO_CANONICAL,
};

export interface ResolvedRailLine {
  /** JourneyAhead's canonical line, or null if the raw code is unrecognised. Never guessed. */
  canonical: CanonicalRailLine | null;
  /** The exact code as reported by LTA, preserved verbatim regardless of resolution. */
  raw: string;
  source: RailLineCodeSource;
}

/**
 * Translates a raw LTA line code into JourneyAhead's canonical rail-line
 * identity. Returns `canonical: null` (never a guess) when the code isn't in
 * the known vocabulary for that source — callers should keep the raw code
 * for display/debugging in that case rather than dropping the record.
 */
export function resolveCanonicalLine(rawCode: string, source: RailLineCodeSource): ResolvedRailLine {
  const table = TABLES_BY_SOURCE[source];
  const canonical = table[rawCode.trim().toUpperCase()] ?? null;
  return { canonical, raw: rawCode, source };
}
