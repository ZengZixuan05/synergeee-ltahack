import { BusStopReference } from '../../../models/bus';
import { logError } from '../../../utils/logger';
import { busStopSchema } from './schema';

function nonEmpty(value: string | undefined): string | undefined {
  const trimmed = value?.trim();
  return trimmed ? trimmed : undefined;
}

export function normaliseBusStops(raw: unknown[], fetchedAt: string): { records: BusStopReference[]; skippedCount: number } {
  const records: BusStopReference[] = [];
  let skippedCount = 0;

  raw.forEach((item, index) => {
    const parsed = busStopSchema.safeParse(item);
    if (!parsed.success) {
      skippedCount += 1;
      logError('busStops.normalise.skip', parsed.error, { index });
      return;
    }

    const record = parsed.data;
    records.push({
      id: `bus-stop:${record.BusStopCode}`,
      source: 'LTA',
      provenance: 'LIVE',
      lastUpdated: fetchedAt,
      busStopCode: record.BusStopCode,
      roadName: nonEmpty(record.RoadName),
      description: nonEmpty(record.Description),
      latitude: record.Latitude,
      longitude: record.Longitude,
    });
  });

  return { records, skippedCount };
}
