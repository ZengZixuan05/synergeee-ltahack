import { JourneyItinerary, JourneyPlanRecommendation } from '@/types/journeyPlan';
import { CommuterPreferences } from '@/types';

const CROWD_SCORE: Record<string, number> = { LOW: 0, UNKNOWN: 0, MODERATE: 1, HIGH: 2 };

/** Worst crowd-level score across every RAIL leg's live station crowding on this itinerary. */
function crowdingScore(itinerary: JourneyItinerary): number {
  let worst = 0;
  for (const leg of itinerary.legs) {
    if (leg.mode !== 'RAIL' || !leg.live) continue;
    for (const snapshot of leg.live.crowding) {
      worst = Math.max(worst, CROWD_SCORE[snapshot.crowdLevel] ?? 0);
    }
  }
  return worst;
}

/**
 * Picks which itinerary to auto-select, applying the commuter's
 * "prefer fewer transfers"/"avoid high crowding" preferences as a secondary
 * ranking — but ONLY when the backend's own disruption-avoidance
 * recommendation isn't already dictating a specific itinerary for safety
 * reasons (see recommend.ts: any reason other than "no live disruptions"
 * means a specific option was chosen to route around a real problem, which
 * a comfort preference must never override).
 */
export function pickPreferredIndex(
  itineraries: JourneyItinerary[],
  recommendation: JourneyPlanRecommendation | undefined,
  preferences: Pick<CommuterPreferences, 'preferFewerTransfers' | 'avoidHighCrowding'>
): number {
  const fallbackIndex = recommendation?.index ?? 0;
  if (itineraries.length <= 1) return fallbackIndex;
  if (!preferences.preferFewerTransfers && !preferences.avoidHighCrowding) return fallbackIndex;

  const recommended = itineraries[fallbackIndex];
  // If the backend's own pick still has a live disruption/lift warning (it
  // routed around what it could, but every option has an issue), that's a
  // safety-relevant choice a comfort preference must never override.
  if (!recommended || recommended.hasDisruption || recommended.hasLiftWarning) return fallbackIndex;

  // Otherwise re-rank only among the itineraries that are equally "clean" —
  // a preference can pick among safe options, never promote a disrupted one.
  const cleanIndexes = [...itineraries.keys()].filter((i) => !itineraries[i]!.hasDisruption && !itineraries[i]!.hasLiftWarning);

  const ranked = cleanIndexes.sort((a, b) => {
    if (preferences.avoidHighCrowding) {
      const crowdDiff = crowdingScore(itineraries[a]!) - crowdingScore(itineraries[b]!);
      if (crowdDiff !== 0) return crowdDiff;
    }
    if (preferences.preferFewerTransfers) {
      const transferDiff = itineraries[a]!.transfers - itineraries[b]!.transfers;
      if (transferDiff !== 0) return transferDiff;
    }
    return 0;
  });

  return ranked[0] ?? fallbackIndex;
}
