import { BusRouteStop } from '../../../models/bus';
import { logError } from '../../../utils/logger';
import { busRouteStopSchema } from './schema';

function nonEmpty(value: string | undefined): string | undefined {
  const trimmed = value?.trim();
  return trimmed ? trimmed : undefined;
}

export function normaliseBusRoutes(raw: unknown[], fetchedAt: string): { records: BusRouteStop[]; skippedCount: number } {
  const records: BusRouteStop[] = [];
  let skippedCount = 0;

  raw.forEach((item, index) => {
    const parsed = busRouteStopSchema.safeParse(item);
    if (!parsed.success) {
      skippedCount += 1;
      logError('busRoutes.normalise.skip', parsed.error, { index });
      return;
    }

    const record = parsed.data;
    records.push({
      id: `bus-route-stop:${record.ServiceNo}:${record.Direction}:${record.StopSequence}`,
      source: 'LTA',
      provenance: 'LIVE',
      lastUpdated: fetchedAt,
      serviceNo: record.ServiceNo,
      operator: record.Operator,
      direction: record.Direction,
      stopSequence: record.StopSequence,
      busStopCode: record.BusStopCode,
      distanceKm: record.Distance,
      weekdayFirstBus: nonEmpty(record.WD_FirstBus),
      weekdayLastBus: nonEmpty(record.WD_LastBus),
      saturdayFirstBus: nonEmpty(record.SAT_FirstBus),
      saturdayLastBus: nonEmpty(record.SAT_LastBus),
      sundayFirstBus: nonEmpty(record.SUN_FirstBus),
      sundayLastBus: nonEmpty(record.SUN_LastBus),
    });
  });

  return { records, skippedCount };
}
