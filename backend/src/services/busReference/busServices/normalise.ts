import { BusServiceReference } from '../../../models/bus';
import { logError } from '../../../utils/logger';
import { busServiceSchema } from './schema';

function nonEmpty(value: string | undefined): string | undefined {
  const trimmed = value?.trim();
  return trimmed ? trimmed : undefined;
}

export function normaliseBusServices(
  raw: unknown[],
  fetchedAt: string
): { records: BusServiceReference[]; skippedCount: number } {
  const records: BusServiceReference[] = [];
  let skippedCount = 0;

  raw.forEach((item, index) => {
    const parsed = busServiceSchema.safeParse(item);
    if (!parsed.success) {
      skippedCount += 1;
      logError('busServices.normalise.skip', parsed.error, { index });
      return;
    }

    const record = parsed.data;
    records.push({
      // ServiceNo alone isn't unique — live data confirmed the same ServiceNo appears once per Direction.
      id: `bus-service:${record.ServiceNo}:${record.Direction}`,
      source: 'LTA',
      provenance: 'LIVE',
      lastUpdated: fetchedAt,
      serviceNo: record.ServiceNo,
      operator: record.Operator,
      direction: record.Direction,
      category: nonEmpty(record.Category),
      originCode: nonEmpty(record.OriginCode),
      destinationCode: nonEmpty(record.DestinationCode),
      amPeakFreq: nonEmpty(record.AM_Peak_Freq),
      amOffpeakFreq: nonEmpty(record.AM_Offpeak_Freq),
      pmPeakFreq: nonEmpty(record.PM_Peak_Freq),
      pmOffpeakFreq: nonEmpty(record.PM_Offpeak_Freq),
      loopDescription: nonEmpty(record.LoopDesc),
    });
  });

  return { records, skippedCount };
}
