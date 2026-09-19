import { StationCrowdingForecast } from '../../models/stationCrowdingForecast';
import { resolveCanonicalLine } from '../../models/railLine';
import { resolveCrowdLevel } from '../../models/crowdLevel';
import { logError } from '../../utils/logger';
import { RawPcdForecastByLine } from './adapter';
import { pcdForecastResponseSchema } from './schema';

export interface NormalisePcdForecastResult {
  records: StationCrowdingForecast[];
  skippedLineCount: number;
}

function buildRecordId(stationCode: string, date: string): string {
  const slug = `${stationCode}-${date}`.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-');
  return `station-crowding-forecast:${slug}`;
}

export function normalisePcdForecast(byLine: RawPcdForecastByLine[], fetchedAt: string): NormalisePcdForecastResult {
  const records: StationCrowdingForecast[] = [];
  let skippedLineCount = 0;

  for (const { trainLine, raw } of byLine) {
    const parsed = pcdForecastResponseSchema.safeParse(raw);
    if (!parsed.success) {
      skippedLineCount += 1;
      logError('pcdForecast.normalise.skip', parsed.error, { trainLine });
      continue;
    }

    const resolvedLine = resolveCanonicalLine(trainLine, 'StationCrowdDensity');

    for (const dateEntry of parsed.data.value) {
      for (const station of dateEntry.Stations) {
        records.push({
          id: buildRecordId(station.Station, dateEntry.Date),
          source: 'LTA',
          provenance: 'LIVE',
          lastUpdated: fetchedAt,
          stationCode: station.Station,
          line: resolvedLine.canonical,
          rawLine: resolvedLine.raw,
          date: dateEntry.Date,
          intervals: station.Interval.map((interval) => ({
            start: interval.Start,
            crowdLevel: resolveCrowdLevel(interval.CrowdLevel),
            rawCrowdLevel: interval.CrowdLevel,
          })),
        });
      }
    }
  }

  return { records, skippedLineCount };
}
