import { WgsGeometry } from '../../geo/geometry';
import { decodePolyline } from '../../geo/polyline';
import { resolveCanonicalLine } from '../../models/railLine';
import { JourneyItinerary, JourneyLeg } from '../../models/journey';
import { logError } from '../../utils/logger';
import { OneMapResponseShapeError } from '../../onemap/errors';
import { oneMapPtResponseSchema, RawItinerary, RawLeg } from './schema';

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

  switch (leg.mode) {
    case 'WALK':
      return { ...base, mode: 'WALK', fromName: leg.from.name ?? 'Unknown', toName: leg.to.name ?? 'Unknown' };

    case 'SUBWAY': {
      const resolvedLine = resolveCanonicalLine(leg.route ?? '', 'OneMapRouting');
      return {
        ...base,
        mode: 'RAIL',
        line: resolvedLine.canonical,
        rawLine: resolvedLine.raw,
        fromStationCode: leg.from.stopCode ?? '',
        fromStationName: leg.from.name ?? 'Unknown',
        toStationCode: leg.to.stopCode ?? '',
        toStationName: leg.to.name ?? 'Unknown',
        intermediateStationCodes: (leg.intermediateStops ?? []).map((s) => s.stopCode).filter((c): c is string => Boolean(c)),
      };
    }

    case 'BUS':
      return {
        ...base,
        mode: 'BUS',
        serviceNo: nonEmpty(leg.route) ?? 'Unknown',
        fromStopCode: leg.from.stopCode ?? '',
        fromStopName: leg.from.name ?? 'Unknown',
        toStopCode: leg.to.stopCode ?? '',
        toStopName: leg.to.name ?? 'Unknown',
      };

    default:
      logError('journeyPlanning.normalise.unrecognisedMode', new Error(`Unrecognised leg mode: ${leg.mode}`), { index });
      return null;
  }
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
  };
}

export function normaliseJourneyPlan(raw: unknown): JourneyItinerary[] {
  const parsed = oneMapPtResponseSchema.safeParse(raw);
  if (!parsed.success) {
    throw new OneMapResponseShapeError('/api/public/routingsvc/route?routeType=pt');
  }
  return (parsed.data.plan?.itineraries ?? []).map(normaliseItinerary);
}
