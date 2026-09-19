import { ContinuousWalkDistance, TransportMode } from '@/types';

/**
 * Converts the commuter's chosen transport modes into OneMap's own `mode`
 * vocabulary ('TRANSIT' | 'BUS' | 'RAIL', see backend/src/onemap/client.ts).
 * Only rail/bus map onto anything OneMap's `pt` routing understands —
 * 'walking'/'cycling' aren't valid `pt` modes, so they're ignored here
 * rather than guessed at. Excluding one of rail/bus (but not both) is the
 * only case with a real lever; anything else falls back to the default
 * multi-modal search.
 */
export function transportModesToOneMapMode(modes: TransportMode[]): 'TRANSIT' | 'BUS' | 'RAIL' {
  const hasRail = modes.includes('rail');
  const hasBus = modes.includes('bus');
  if (hasRail && !hasBus) return 'RAIL';
  if (hasBus && !hasRail) return 'BUS';
  return 'TRANSIT';
}

/** Converts the commuter's max-continuous-walk preference into OneMap's `maxWalkDistance` (meters). `'no-preference'` omits the constraint entirely. */
export function maxContinuousWalkToMeters(value: ContinuousWalkDistance): number | undefined {
  switch (value) {
    case '200m':
      return 200;
    case '400m':
      return 400;
    case '600m':
      return 600;
    case 'no-preference':
    default:
      return undefined;
  }
}
