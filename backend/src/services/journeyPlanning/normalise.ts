import { WgsGeometry } from '../../geo/geometry';
import { decodePolyline } from '../../geo/polyline';
import { resolveCanonicalLine } from '../../models/railLine';
import { JourneyItinerary, JourneyLeg } from '../../models/journey';
import { logError } from '../../utils/logger';
import { OneMapResponseShapeError } from '../../onemap/errors';
import { oneMapPtResponseSchema, RawItinerary, RawLeg } from './schema';
import { computeLegDurationRange, itineraryDurationRange } from './uncertainty';

function toIso(epochMs: number): string {
  return new Date(epochMs).toISOString();
}

function legGeometry(leg: RawLeg): WgsGeometry {
  const coordinates = leg.legGeometry ? decodePolyline(leg.legGeometry.points) : [];
  return { type: 'LineString', coordinates };
}

function nonEmpty(value: string | undefined): string | undefined {
  const trimmed = value?.trim();
  return trimmed ? trimmed : undefined;
}

/** Normalises one raw OTP-style leg. Returns null (and logs) for a mode this backend doesn't recognise, rather than guessing — see the OneMapRouting note in models/railLine.ts. */
function normaliseLeg(leg: RawLeg, index: number): JourneyLeg | null {
  const base = {
    startTime: toIso(leg.startTime),
    endTime: toIso(leg.endTime),
    durationSeconds: Math.round((leg.endTime - leg.startTime) / 1000),
    distanceMeters: leg.distance,
    geometry: legGeometry(leg),
  };

  let normalised: JourneyLeg | null;
  switch (leg.mode) {
    case 'WALK':
      normalised = { ...base, mode: 'WALK', fromName: leg.from.name ?? 'Unknown', toName: leg.to.name ?? 'Unknown', durationRangeSeconds: { min: 0, max: 0 } };
      break;

    case 'SUBWAY': {
      const resolvedLine = resolveCanonicalLine(leg.route ?? '', 'OneMapRouting');
      normalised = {
        ...base,
        mode: 'RAIL',
        line: resolvedLine.canonical,
        rawLine: resolvedLine.raw,
        fromStationCode: leg.from.stopCode ?? '',
        fromStationName: leg.from.name ?? 'Unknown',
        toStationCode: leg.to.stopCode ?? '',
        toStationName: leg.to.name ?? 'Unknown',
        intermediateStationCodes: (leg.intermediateStops ?? []).map((s) => s.stopCode).filter((c): c is string => Boolean(c)),
        durationRangeSeconds: { min: 0, max: 0 },
      };
      break;
    }

    case 'BUS':
      normalised = {
        ...base,
        mode: 'BUS',
        serviceNo: nonEmpty(leg.route) ?? 'Unknown',
        fromStopCode: leg.from.stopCode ?? '',
        fromStopName: leg.from.name ?? 'Unknown',
        toStopCode: leg.to.stopCode ?? '',
        toStopName: leg.to.name ?? 'Unknown',
        durationRangeSeconds: { min: 0, max: 0 },
      };
      break;

    default:
      logError('journeyPlanning.normalise.unrecognisedMode', new Error(`Unrecognised leg mode: ${leg.mode}`), { index });
      return null;
  }

  // RAIL's real range depends on live disruption status, set later by
  // enrich.ts — WALK/BUS never gain a `live` field, so their range is final here.
  return { ...normalised, durationRangeSeconds: computeLegDurationRange(normalised) };
}

function normaliseItinerary(itinerary: RawItinerary): JourneyItinerary {
  const legs = itinerary.legs.map(normaliseLeg).filter((l): l is JourneyLeg => l !== null);
  return {
    startTime: toIso(itinerary.startTime),
    endTime: toIso(itinerary.endTime),
    durationSeconds: itinerary.duration,
    walkDistanceMeters: itinerary.walkDistance ?? 0,
    transfers: itinerary.transfers ?? 0,
    fare: itinerary.fare,
    legs,
    // Set by enrich.ts once live LTA data has been cross-referenced.
    hasDisruption: false,
    hasLiftWarning: false,
    hasSevereCrowding: false,
    hasRainExposure: false,
    durationRangeSeconds: itineraryDurationRange({ legs }),
  };
}

export function normaliseJourneyPlan(raw: unknown): JourneyItinerary[] {
  const parsed = oneMapPtResponseSchema.safeParse(raw);
  if (!parsed.success) {
    throw new OneMapResponseShapeError('/api/public/routingsvc/route?routeType=pt');
  }
  return (parsed.data.plan?.itineraries ?? []).map(normaliseItinerary);
}
