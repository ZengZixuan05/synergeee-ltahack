import { StationCrowdingObservedEvent } from '../../models/transportEvent';
import { resolveCanonicalLine } from '../../models/railLine';
import { resolveCrowdLevel } from '../../models/crowdLevel';
import { logError } from '../../utils/logger';
import { RawPcdRealTimeByLine } from './adapter';
import { pcdRealTimeResponseSchema } from './schema';

export interface NormalisePcdRealTimeResult {
  events: StationCrowdingObservedEvent[];
  /** Count of per-line responses that failed schema validation and were skipped (that line's stations are simply missing from the result, not fabricated). */
  skippedLineCount: number;
}

function buildEventId(stationCode: string, startTime: string): string {
  const slug = `${stationCode}-${startTime}`.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-');
  return `station-crowding-observed:${slug}`;
}

export function normalisePcdRealTime(byLine: RawPcdRealTimeByLine[], fetchedAt: string): NormalisePcdRealTimeResult {
  const events: StationCrowdingObservedEvent[] = [];
  let skippedLineCount = 0;

  for (const { trainLine, raw } of byLine) {
    const parsed = pcdRealTimeResponseSchema.safeParse(raw);
    if (!parsed.success) {
      skippedLineCount += 1;
      logError('pcdRealTime.normalise.skip', parsed.error, { trainLine });
      continue;
    }

    const resolvedLine = resolveCanonicalLine(trainLine, 'StationCrowdDensity');

    for (const item of parsed.data.value) {
      events.push({
        id: buildEventId(item.Station, item.StartTime),
        type: 'STATION_CROWDING_OBSERVED',
        source: 'LTA',
        provenance: 'LIVE',
        lastUpdated: fetchedAt,
        startTime: item.StartTime,
        endTime: item.EndTime,
        stationCode: item.Station,
        line: resolvedLine.canonical,
        rawLine: resolvedLine.raw,
        crowdLevel: resolveCrowdLevel(item.CrowdLevel),
        rawCrowdLevel: item.CrowdLevel,
      });
    }
  }

  return { events, skippedLineCount };
}
