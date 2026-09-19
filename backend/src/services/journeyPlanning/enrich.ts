import { JourneyItinerary, LiftWarning, RailJourneyLeg, StationCrowdingSnapshot } from '../../models/journey';
import { FacilitiesMaintenanceResult } from '../facilitiesMaintenance/service';
import { TrainServiceAlertsResult } from '../trainServiceAlerts/service';
import { PcdRealTimeResult } from '../pcdRealTime/service';

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
  return {
    ...leg,
    live: {
      disrupted: Boolean(disruptionMessage),
      disruptionMessage,
      liftWarnings: findLiftWarnings(leg, live.facilities),
      crowding: findCrowding(leg, live.crowding),
    },
  };
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
  };
}
