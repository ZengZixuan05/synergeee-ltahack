import { JourneyItinerary, JourneyPlanRecommendation } from '../../models/journey';

// The concrete mechanism behind "produce a revised route, and say why": not
// a full multi-criteria optimiser, just a penalty score over OneMap's own
// ranked itineraries, weighted so a live safety/access issue (disruption,
// lift outage) always outranks a comfort issue (crowding, rain exposure) —
// see the weight gap between the two tiers below — with a plain-language
// reason attached either way.
const DISRUPTION_PENALTY = 1000;
const LIFT_WARNING_PENALTY = 500;
const SEVERE_CROWDING_PENALTY = 100;
const RAIN_EXPOSURE_PENALTY = 10;

function penaltyScore(itinerary: JourneyItinerary): number {
  return (
    (itinerary.hasDisruption ? DISRUPTION_PENALTY : 0) +
    (itinerary.hasLiftWarning ? LIFT_WARNING_PENALTY : 0) +
    (itinerary.hasSevereCrowding ? SEVERE_CROWDING_PENALTY : 0) +
    (itinerary.hasRainExposure ? RAIN_EXPOSURE_PENALTY : 0)
  );
}

/** Plain-language names for whichever of an itinerary's live-condition flags are set, ordered worst-first — reused by service.ts's bus-fallback reasoning too. */
export function describeItineraryIssues(itinerary: JourneyItinerary): string[] {
  const issues: string[] = [];
  if (itinerary.hasDisruption) issues.push('a live service disruption');
  if (itinerary.hasLiftWarning) issues.push('a lift under maintenance');
  if (itinerary.hasSevereCrowding) issues.push('HIGH crowding at a station on it');
  if (itinerary.hasRainExposure) issues.push('a rain-exposed walk right now');
  return issues;
}

export function recommendItinerary(itineraries: JourneyItinerary[]): JourneyPlanRecommendation | undefined {
  if (itineraries.length === 0) return undefined;

  const fastest = itineraries[0]!;
  const fastestScore = penaltyScore(fastest);

  let bestIndex = 0;
  let bestScore = fastestScore;
  for (let index = 1; index < itineraries.length; index += 1) {
    const score = penaltyScore(itineraries[index]!);
    if (score < bestScore) {
      bestIndex = index;
      bestScore = score;
    }
  }

  if (bestIndex === 0) {
    const issues = describeItineraryIssues(fastest);
    if (issues.length === 0) {
      return { index: 0, reason: 'No live disruptions, lift outages, severe crowding, or rain exposure reported on this route right now.' };
    }
    return {
      index: 0,
      reason: `This is still the best option even with ${issues.join(' and ')} on it — every alternative is at least as affected.`,
    };
  }

  const fastestIssues = describeItineraryIssues(fastest);
  const recommendedIssues = describeItineraryIssues(itineraries[bestIndex]!);
  const avoided = fastestIssues.filter((issue) => !recommendedIssues.includes(issue));

  if (avoided.length === 0) {
    // Scores differ (e.g. tied issue types but one is marginally better) without a clean, nameable improvement — keep the reason honest rather than overclaiming.
    return { index: bestIndex, reason: 'A slightly better option than the fastest route, given current live conditions.' };
  }

  return {
    index: bestIndex,
    reason: `The fastest option has ${avoided.join(' and ')} on it; this option avoids ${avoided.length > 1 ? 'those' : 'that'}.`,
  };
}
