// Shared by PCDRealTime and PCDForecast only (see the crowding-distinction
// note in transportEvent.ts) — never by BusArrival's per-bus `Load`, which
// is a different concept with its own value vocabulary and, when
// implemented, its own type.
export type CrowdLevel = 'LOW' | 'MODERATE' | 'HIGH' | 'UNKNOWN';

/** Maps LTA's `l`/`m`/`h`/`NA` CrowdLevel codes (guide section 2.24) to a canonical value. Unrecognised input maps to UNKNOWN rather than being guessed. */
export function resolveCrowdLevel(raw: string): CrowdLevel {
  switch (raw.trim().toLowerCase()) {
    case 'l':
      return 'LOW';
    case 'm':
      return 'MODERATE';
    case 'h':
      return 'HIGH';
    default:
      return 'UNKNOWN';
  }
}
