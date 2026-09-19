import { CanonicalRailLine } from './railLine';
import { CrowdLevel } from './crowdLevel';

// Deliberately not a `TransportEvent` member — see the crowding note in
// transportEvent.ts. One record per (station, date), holding that whole
// day's 30-minute interval forecast, rather than one record per interval
// (which would multiply into tens of thousands of rows per fetch).

export interface StationCrowdingForecastInterval {
  /** ISO 8601 start of this 30-minute interval. */
  start: string;
  crowdLevel: CrowdLevel;
  rawCrowdLevel: string;
}

export interface StationCrowdingForecast {
  id: string;
  source: 'LTA';
  provenance: 'LIVE';
  stationCode: string;
  /** Resolved from the `TrainLine` this forecast was queried under. */
  line: CanonicalRailLine | null;
  rawLine: string;
  /** ISO 8601 date this forecast covers, as reported by LTA. */
  date: string;
  intervals: StationCrowdingForecastInterval[];
  lastUpdated: string;
}
