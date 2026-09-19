// Static bus reference data (BusStops, BusServices, BusRoutes) — deliberately
// NOT part of the `TransportEvent` union, same reasoning as the geospatial
// reference models: this is schedule/reference geometry, not a time-bound
// occurrence. Only BusArrival (a live per-bus-stop query) is event-shaped —
// see `BusLoadObservedEvent` in transportEvent.ts.

interface BusReferenceBase {
  id: string;
  source: 'LTA';
  provenance: 'LIVE';
  lastUpdated: string;
}

export interface BusStopReference extends BusReferenceBase {
  busStopCode: string;
  roadName?: string;
  /** Landmark description, if any (e.g. "Hotel Grand Pacific"). */
  description?: string;
  latitude: number;
  longitude: number;
}

export interface BusServiceReference extends BusReferenceBase {
  serviceNo: string;
  operator: string;
  /** 1 or 2; loop services only have 1. */
  direction: number;
  /** e.g. TRUNK, EXPRESS, FEEDER — preserved verbatim, not narrowed to an enum since the guide's list isn't exhaustive-guaranteed. */
  category?: string;
  originCode?: string;
  destinationCode?: string;
  /** Dispatch frequency ranges in minutes, e.g. "14-17" — kept as the raw range string, not split into min/max, since LTA documents it as a single display value. */
  amPeakFreq?: string;
  amOffpeakFreq?: string;
  pmPeakFreq?: string;
  pmOffpeakFreq?: string;
  /** Where the service loops, if it's a loop service. */
  loopDescription?: string;
}

export interface BusRouteStop extends BusReferenceBase {
  serviceNo: string;
  operator: string;
  direction: number;
  /** The i-th bus stop for this route/direction. */
  stopSequence: number;
  busStopCode: string;
  distanceKm?: number;
  /** Scheduled first/last bus times as LTA reports them (24h "HHmm" strings, e.g. "0500") — not parsed into a time type since the guide doesn't document timezone/format guarantees beyond the sample. */
  weekdayFirstBus?: string;
  weekdayLastBus?: string;
  saturdayFirstBus?: string;
  saturdayLastBus?: string;
  sundayFirstBus?: string;
  sundayLastBus?: string;
}
