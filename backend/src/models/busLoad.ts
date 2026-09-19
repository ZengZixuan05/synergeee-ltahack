// BusArrival's `Load` — occupancy of ONE particular arriving bus. Kept
// entirely separate from `CrowdLevel` (station crowding) per the
// crowding-distinction note in transportEvent.ts: these are different
// concepts with different source vocabularies and must never share a type
// or a field name.
export type BusLoadLevel = 'SEATS_AVAILABLE' | 'STANDING_AVAILABLE' | 'LIMITED_STANDING' | 'UNKNOWN';

/** Maps LTA's `SEA`/`SDA`/`LSD` Load codes (guide section 2.1) to a canonical value. Unrecognised/empty input maps to UNKNOWN rather than being guessed. */
export function resolveBusLoad(raw: string | undefined): BusLoadLevel {
  switch (raw) {
    case 'SEA':
      return 'SEATS_AVAILABLE';
    case 'SDA':
      return 'STANDING_AVAILABLE';
    case 'LSD':
      return 'LIMITED_STANDING';
    default:
      return 'UNKNOWN';
  }
}
