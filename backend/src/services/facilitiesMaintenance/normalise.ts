import { LiftMaintenanceEvent } from '../../models/transportEvent';
import { resolveCanonicalLine } from '../../models/railLine';
import { logError } from '../../utils/logger';
import { facilitiesMaintenanceRecordSchema } from './schema';

export interface NormaliseResult {
  events: LiftMaintenanceEvent[];
  /** Count of raw records that failed schema validation and were skipped rather than discarding the whole batch. */
  skippedCount: number;
}

/** LTA sometimes sends `LiftID: ""` for this documented-optional field rather than omitting it entirely (observed live). Treat blank as absent. */
function nonEmpty(value: string | undefined): string | undefined {
  const trimmed = value?.trim();
  return trimmed ? trimmed : undefined;
}

function buildEventId(stationCode: string, liftId: string | undefined, liftDesc: string | undefined, index: number): string {
  const discriminator = liftId ?? liftDesc ?? String(index);
  const slug = discriminator.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-');
  return `lift-maintenance:${stationCode}:${slug}`;
}

/**
 * Validates and normalises raw v2/FacilitiesMaintenance records into
 * JourneyAhead's `LiftMaintenanceEvent` domain model. Individual malformed
 * records are skipped (and safely logged) rather than failing the entire
 * batch — LTA guarantees nothing about a third party never sending a
 * surprising record shape.
 *
 * `fetchedAt` is threaded in by the caller (the service layer) so every
 * event normalised from the same fetch shares one `lastUpdated` timestamp.
 */
export function normaliseFacilitiesMaintenance(raw: unknown[], fetchedAt: string): NormaliseResult {
  const events: LiftMaintenanceEvent[] = [];
  let skippedCount = 0;

  raw.forEach((item, index) => {
    const parsed = facilitiesMaintenanceRecordSchema.safeParse(item);
    if (!parsed.success) {
      skippedCount += 1;
      logError('facilitiesMaintenance.normalise.skip', parsed.error, { index });
      return;
    }

    const record = parsed.data;
    const resolvedLine = resolveCanonicalLine(record.Line, 'FacilitiesMaintenance');
    const liftId = nonEmpty(record.LiftID);
    const liftDescription = nonEmpty(record.LiftDesc);

    events.push({
      id: buildEventId(record.StationCode, liftId, liftDescription, index),
      type: 'LIFT_MAINTENANCE',
      source: 'LTA',
      provenance: 'LIVE',
      station: {
        stationCode: record.StationCode,
        stationName: record.StationName,
        line: resolvedLine.canonical,
        rawLine: resolvedLine.raw,
      },
      lastUpdated: fetchedAt,
      liftId,
      liftDescription,
    });
  });

  return { events, skippedCount };
}
