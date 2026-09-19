import { JourneyItinerary, JourneyLeg, LiftWarning, RailJourneyLeg, StationCrowdingSnapshot, WalkJourneyLeg } from '../../models/journey';
import { FacilitiesMaintenanceResult } from '../facilitiesMaintenance/service';
import { TrainServiceAlertsResult } from '../trainServiceAlerts/service';
import { PcdRealTimeResult } from '../pcdRealTime/service';
import { RainfallResult } from '../weather/rainfall/service';
import { computeLegDurationRange, itineraryDurationRange } from './uncertainty';

// Cross-references each RAIL leg's stations against live LTA data this
// backend already collects and caches independently (TrainServiceAlerts,
// FacilitiesMaintenance, PCDRealTime) — no extra LTA calls beyond what those
// services' own in-memory caches already make on their own schedules. This
// is the concrete mechanism behind "responsive to live conditions... and
// say why" — a journey plan is not just OneMap's static timetable-based
// route, it's that route checked against what LTA is reporting right now.

export interface LiveContext {
  alerts: TrainServiceAlertsResult;
  facilities: FacilitiesMaintenanceResult;
  crowding: PcdRealTimeResult;
  rainfall: RainfallResult;
}

// A walk leg counts as "rain-exposed" once it's long enough that a commuter
// would actually get wet on it, and a nearby rain gauge is at or above a
// threshold that data.gov.sg's own rainfall stations report even for light
// drizzle (confirmed live: values well under 1mm for a "5 Minute Total" are
// common during light rain).
const RAIN_EXPOSED_WALK_DISTANCE_METERS = 300;
const RAIN_READING_THRESHOLD_MM = 0.2;
const NEARBY_RAIN_STATION_RADIUS_METERS = 3000;

function haversineMeters(a: [number, number], b: [number, number]): number {
  const [lngA, latA] = a;
  const [lngB, latB] = b;
  const earthRadiusMeters = 6_371_000;
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const dLat = toRad(latB - latA);
  const dLng = toRad(lngB - lngA);
  const sinLat = Math.sin(dLat / 2);
  const sinLng = Math.sin(dLng / 2);
  const h = sinLat * sinLat + Math.cos(toRad(latA)) * Math.cos(toRad(latB)) * sinLng * sinLng;
  return 2 * earthRadiusMeters * Math.asin(Math.sqrt(h));
}

function walkLegMidpoint(leg: WalkJourneyLeg): [number, number] | undefined {
  const coordinates = leg.geometry.type === 'LineString' ? leg.geometry.coordinates : [];
  if (coordinates.length === 0) return undefined;
  return coordinates[Math.floor(coordinates.length / 2)];
}

/** True if any walk leg long enough to matter passes near a rain gauge currently reporting active rain. Distance-based nearest-station matching, since rainfall readings are per-station points, not an area grid. */
function hasNearbyActiveRain(legs: JourneyLeg[], rainfall: RainfallResult): boolean {
  const walkLegs = legs.filter(
    (leg): leg is WalkJourneyLeg => leg.mode === 'WALK' && leg.distanceMeters >= RAIN_EXPOSED_WALK_DISTANCE_METERS
  );
  if (walkLegs.length === 0) return false;

  const activeReadings = rainfall.readings.filter((reading) => reading.valueMm >= RAIN_READING_THRESHOLD_MM);
  if (activeReadings.length === 0) return false;

  return walkLegs.some((leg) => {
    const midpoint = walkLegMidpoint(leg);
    if (!midpoint) return false;
    return activeReadings.some(
      (reading) => haversineMeters(midpoint, [reading.longitude, reading.latitude]) <= NEARBY_RAIN_STATION_RADIUS_METERS
    );
  });
}

function railLegStationCodes(leg: RailJourneyLeg): string[] {
  return [leg.fromStationCode, leg.toStationCode, ...leg.intermediateStationCodes].filter(Boolean);
}

function findDisruptionMessage(leg: RailJourneyLeg, alerts: TrainServiceAlertsResult): string | undefined {
  const stationCodes = railLegStationCodes(leg);
  const affectedSegment = alerts.events.find(
    (event) => event.line !== null && event.line === leg.line && event.affectedStationCodes.some((code) => stationCodes.includes(code))
  );
  if (!affectedSegment) return undefined;

  const latestMessage = alerts.messages[0]?.content;
  const directionNote = affectedSegment.direction ? ` (towards ${affectedSegment.direction})` : '';
  return latestMessage ?? `Service disruption reported on this line${directionNote}.`;
}

function findLiftWarnings(leg: RailJourneyLeg, facilities: FacilitiesMaintenanceResult): LiftWarning[] {
  const stationCodes = railLegStationCodes(leg);
  return facilities.events
    .filter((event) => stationCodes.includes(event.station.stationCode))
    .map((event) => ({
      stationCode: event.station.stationCode,
      stationName: event.station.stationName,
      liftId: event.liftId,
      liftDescription: event.liftDescription,
    }));
}

function findCrowding(leg: RailJourneyLeg, crowding: PcdRealTimeResult): StationCrowdingSnapshot[] {
  const stationCodes = railLegStationCodes(leg);
  return crowding.events
    .filter((event) => stationCodes.includes(event.stationCode))
    .map((event) => ({ stationCode: event.stationCode, crowdLevel: event.crowdLevel }));
}

function enrichRailLeg(leg: RailJourneyLeg, live: LiveContext): RailJourneyLeg {
  const disruptionMessage = findDisruptionMessage(leg, live.alerts);
  const enriched: RailJourneyLeg = {
    ...leg,
    live: {
      disrupted: Boolean(disruptionMessage),
      disruptionMessage,
      liftWarnings: findLiftWarnings(leg, live.facilities),
      crowding: findCrowding(leg, live.crowding),
    },
  };
  // Recompute now that `live.disrupted`/`liftWarnings` are known — normalise.ts
  // could only assume the non-disrupted RAIL variance ratio.
  return { ...enriched, durationRangeSeconds: computeLegDurationRange(enriched) };
}

/** Enriches every RAIL leg in an itinerary and sets its summary flags. WALK/BUS legs pass through unchanged (see models/journey.ts for why bus legs aren't enriched yet). */
export function enrichItinerary(itinerary: JourneyItinerary, live: LiveContext): JourneyItinerary {
  const legs = itinerary.legs.map((leg) => (leg.mode === 'RAIL' ? enrichRailLeg(leg, live) : leg));
  const railLegs = legs.filter((leg): leg is RailJourneyLeg => leg.mode === 'RAIL');

  return {
    ...itinerary,
    legs,
    hasDisruption: railLegs.some((leg) => leg.live?.disrupted),
    hasLiftWarning: railLegs.some((leg) => (leg.live?.liftWarnings.length ?? 0) > 0),
    hasSevereCrowding: railLegs.some((leg) => leg.live?.crowding.some((snapshot) => snapshot.crowdLevel === 'HIGH')),
    hasRainExposure: hasNearbyActiveRain(legs, live.rainfall),
    durationRangeSeconds: itineraryDurationRange({ legs }),
  };
}
