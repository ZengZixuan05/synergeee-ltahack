import { DurationRangeSeconds, JourneyItinerary, JourneyLeg } from '../../models/journey';

// Heuristic timing-uncertainty band per leg, expressed as a fraction of that
// leg's own durationSeconds. This is an engineering estimate, not a fitted
// statistic — LTA/OneMap expose no historical-reliability feed this backend
// could calibrate against. Ratios reflect ordinary real-world variance
// between mode types (a scheduled train is more punctual than pedestrian
// pace or bus headway), widened further when live LTA data says this leg is
// currently disrupted or has a lift under maintenance — an itinerary with a
// disruption on it is not just "slower", it is *less predictably* slow.
const WALK_VARIANCE_RATIO = 0.08;
const RAIL_VARIANCE_RATIO = 0.05;
const RAIL_DISRUPTED_VARIANCE_RATIO = 0.2;
const BUS_VARIANCE_RATIO = 0.2;

function varianceRatioForLeg(leg: JourneyLeg): number {
  switch (leg.mode) {
    case 'WALK':
      return WALK_VARIANCE_RATIO;
    case 'BUS':
      return BUS_VARIANCE_RATIO;
    case 'RAIL':
      return leg.live?.disrupted || (leg.live?.liftWarnings.length ?? 0) > 0 ? RAIL_DISRUPTED_VARIANCE_RATIO : RAIL_VARIANCE_RATIO;
  }
}

export function computeLegDurationRange(leg: JourneyLeg): DurationRangeSeconds {
  const variance = Math.round(leg.durationSeconds * varianceRatioForLeg(leg));
  return { min: Math.max(0, leg.durationSeconds - variance), max: leg.durationSeconds + variance };
}

/** Sums each leg's own uncertainty band into one itinerary-level range — the bands aren't independent (weather/crowding affect a whole trip together), but summing worst-cases is the honest, non-overconfident direction to round in. */
export function sumDurationRange(legs: JourneyLeg[]): DurationRangeSeconds {
  return legs.reduce(
    (total, leg) => ({
      min: total.min + leg.durationRangeSeconds.min,
      max: total.max + leg.durationRangeSeconds.max,
    }),
    { min: 0, max: 0 }
  );
}

export function itineraryDurationRange(itinerary: Pick<JourneyItinerary, 'legs'>): DurationRangeSeconds {
  return sumDurationRange(itinerary.legs);
}
