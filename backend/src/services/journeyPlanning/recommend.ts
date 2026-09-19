import { JourneyItinerary, JourneyPlanRecommendation } from '../../models/journey';

// The concrete mechanism behind "produce a revised route, and say why" for
// this milestone: not a full multi-criteria optimiser, just a pick between
// OneMap's own ranked itineraries, preferring the first one with no live
// disruption or lift warning on it, with a plain-language reason attached
// either way.
export function recommendItinerary(itineraries: JourneyItinerary[]): JourneyPlanRecommendation | undefined {
  if (itineraries.length === 0) return undefined;

  const cleanIndex = itineraries.findIndex((itinerary) => !itinerary.hasDisruption && !itinerary.hasLiftWarning);

  if (cleanIndex === 0) {
    return { index: 0, reason: 'No live disruptions or lift outages reported on this route right now.' };
  }

  if (cleanIndex === -1) {
    return {
      index: 0,
      reason: 'Every option currently has a live disruption or lift outage on it; showing the fastest option regardless.',
    };
  }

  const fastest = itineraries[0]!;
  const issues: string[] = [];
  if (fastest.hasDisruption) issues.push('a live service disruption');
  if (fastest.hasLiftWarning) issues.push('a lift under maintenance');

  return {
    index: cleanIndex,
    reason: `The fastest option has ${issues.join(' and ')} on it; this option avoids both.`,
  };
}
