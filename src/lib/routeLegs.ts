import { RouteLeg } from '@/types/journey';

/**
 * Minimal per-mode completeness check used before a leg can be added/saved.
 * "Usual route" is entirely optional, so these are the only fields a leg
 * must have — everything else may be left blank.
 */
export function isLegComplete(leg: RouteLeg): boolean {
  switch (leg.mode) {
    case 'walk':
      return leg.to.trim().length > 0;
    case 'rail':
      return Boolean(leg.boardStationCode && leg.alightStationCode);
    case 'bus':
      return Boolean(leg.serviceNumber && leg.serviceNumber.trim().length > 0);
    case 'transfer':
      return true;
    default:
      return false;
  }
}

export function moveLegUp(legs: RouteLeg[], id: string): RouteLeg[] {
  const index = legs.findIndex((l) => l.id === id);
  if (index <= 0) return legs;
  const next = [...legs];
  [next[index - 1], next[index]] = [next[index], next[index - 1]];
  return next;
}

export function moveLegDown(legs: RouteLeg[], id: string): RouteLeg[] {
  const index = legs.findIndex((l) => l.id === id);
  if (index === -1 || index >= legs.length - 1) return legs;
  const next = [...legs];
  [next[index], next[index + 1]] = [next[index + 1], next[index]];
  return next;
}

export function removeLeg(legs: RouteLeg[], id: string): RouteLeg[] {
  return legs.filter((l) => l.id !== id);
}

export function replaceLeg(legs: RouteLeg[], id: string, updated: RouteLeg): RouteLeg[] {
  return legs.map((l) => (l.id === id ? updated : l));
}

/**
 * Form assistance only (not real routing): true when two consecutive rail
 * legs sit at the same station but on different lines, so the route
 * timeline can render an automatic "Transfer" connector without the user
 * having to add one manually.
 */
export function isAutoTransfer(prev: RouteLeg, next: RouteLeg): boolean {
  if (prev.mode !== 'rail' || next.mode !== 'rail') return false;
  return prev.alightStationName === next.boardStationName && prev.lineCode !== next.lineCode;
}
