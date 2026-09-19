import { TrainServiceAlertEvent } from '../../models/transportEvent';
import { resolveCanonicalLine } from '../../models/railLine';
import { LtaResponseShapeError } from '../../lta/errors';
import { AffectedSegment, TrainServiceAlertMessage, trainServiceAlertsResponseSchema } from './schema';

export interface NormaliseTrainServiceAlertsResult {
  events: TrainServiceAlertEvent[];
  /** General advisory notices (e.g. planned works) — not tied to a specific line/station, so not modelled as TransportEvents. See models/transportEvent.ts. */
  messages: { content: string; createdDate: string }[];
}

function nonEmpty(value: string | undefined): string | undefined {
  const trimmed = value?.trim();
  return trimmed ? trimmed : undefined;
}

function buildEventId(segment: AffectedSegment, stationCodes: string[], index: number): string {
  const discriminator = [segment.Line, ...stationCodes].join('-') || String(index);
  const slug = discriminator.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-');
  return `train-service-alert:${slug}`;
}

function normaliseSegment(segment: AffectedSegment, fetchedAt: string, index: number): TrainServiceAlertEvent {
  const resolvedLine = resolveCanonicalLine(segment.Line, 'TrainServiceAlerts');
  const affectedStationCodes = (segment.Stations ?? '')
    .split(',')
    .map((code) => code.trim())
    .filter(Boolean);

  return {
    id: buildEventId(segment, affectedStationCodes, index),
    type: 'TRAIN_SERVICE_ALERT',
    source: 'LTA',
    provenance: 'LIVE',
    lastUpdated: fetchedAt,
    line: resolvedLine.canonical,
    rawLine: resolvedLine.raw,
    direction: nonEmpty(segment.Direction),
    affectedStationCodes,
    freePublicBus: nonEmpty(segment.FreePublicBus),
    freeMrtShuttle: nonEmpty(segment.FreeMRTShuttle),
    mrtShuttleDirection: nonEmpty(segment.MRTShuttleDirection),
  };
}

function normaliseMessage(message: TrainServiceAlertMessage): { content: string; createdDate: string } {
  return { content: message.Content, createdDate: message.CreatedDate };
}

/**
 * Validates and normalises a raw `/TrainServiceAlerts` response. Unlike
 * FacilitiesMaintenance's per-record tolerance, a malformed entry anywhere
 * in the (typically 0-2 item) `AffectedSegments` array fails the whole
 * response rather than silently dropping one segment of an active
 * disruption — for a "what's currently wrong with the network" snapshot,
 * silently under-reporting is worse than surfacing LIVE_ERROR.
 */
export function normaliseTrainServiceAlerts(raw: unknown, fetchedAt: string): NormaliseTrainServiceAlertsResult {
  const parsed = trainServiceAlertsResponseSchema.safeParse(raw);
  if (!parsed.success) {
    throw new LtaResponseShapeError('/TrainServiceAlerts');
  }

  const { AffectedSegments, Message } = parsed.data.value;
  return {
    events: AffectedSegments.map((segment, index) => normaliseSegment(segment, fetchedAt, index)),
    messages: Message.map(normaliseMessage),
  };
}
