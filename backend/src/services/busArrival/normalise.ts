import { BusLoadObservedEvent } from '../../models/transportEvent';
import { resolveBusLoad } from '../../models/busLoad';
import { busArrivalResponseSchema, BusArrivalServiceEntry, NextBusEntry } from './schema';
import { LtaResponseShapeError } from '../../lta/errors';

export interface NormaliseBusArrivalResult {
  events: BusLoadObservedEvent[];
}

function nonEmpty(value: string | undefined): string | undefined {
  const trimmed = value?.trim();
  return trimmed ? trimmed : undefined;
}

function toNumber(value: string | undefined): number | undefined {
  if (!value) return undefined;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : undefined;
}

function toBoolean(value: string | number | undefined): boolean | undefined {
  if (value === undefined || value === '') return undefined;
  return String(value) === '1';
}

/** A blank NextBus2/NextBus3 slot (per the guide, sent when fewer than 3 buses are on the road) has no EstimatedArrival — treated as "no bus", not a malformed record. */
function isRealBus(nextBus: NextBusEntry | undefined): nextBus is NextBusEntry {
  return Boolean(nextBus && nonEmpty(nextBus.EstimatedArrival));
}

function normaliseNextBus(
  service: BusArrivalServiceEntry,
  nextBus: NextBusEntry,
  visitLabel: string,
  busStopCode: string,
  fetchedAt: string
): BusLoadObservedEvent {
  const feature = nextBus.Feature;
  return {
    id: `bus-load-observed:${busStopCode}:${service.ServiceNo}:${visitLabel}:${nextBus.EstimatedArrival}`,
    type: 'BUS_LOAD_OBSERVED',
    source: 'LTA',
    provenance: 'LIVE',
    lastUpdated: fetchedAt,
    busStopCode,
    serviceNo: service.ServiceNo,
    operator: service.Operator,
    visitNumber: toNumber(String(nextBus.VisitNumber ?? '')),
    originCode: nonEmpty(nextBus.OriginCode),
    destinationCode: nonEmpty(nextBus.DestinationCode),
    estimatedArrival: nonEmpty(nextBus.EstimatedArrival),
    latitude: toNumber(nextBus.Latitude),
    longitude: toNumber(nextBus.Longitude),
    monitored: toBoolean(nextBus.Monitored),
    load: resolveBusLoad(nextBus.Load),
    rawLoad: nextBus.Load ?? '',
    wheelchairAccessible: feature === undefined ? undefined : feature === 'WAB',
    vehicleType: nonEmpty(nextBus.Type),
  };
}

/**
 * Validates and normalises a raw `v3/BusArrival` response for one bus stop
 * into one `BusLoadObservedEvent` per real upcoming bus (NextBus/2/3 slots
 * with no EstimatedArrival are skipped as "no bus", not errors).
 */
export function normaliseBusArrival(raw: unknown, busStopCode: string, fetchedAt: string): NormaliseBusArrivalResult {
  const parsed = busArrivalResponseSchema.safeParse(raw);
  if (!parsed.success) {
    throw new LtaResponseShapeError('/v3/BusArrival');
  }

  const events: BusLoadObservedEvent[] = [];
  for (const service of parsed.data.Services) {
    const slots: [string, NextBusEntry | undefined][] = [
      ['1', service.NextBus],
      ['2', service.NextBus2],
      ['3', service.NextBus3],
    ];
    for (const [label, nextBus] of slots) {
      if (isRealBus(nextBus)) {
        events.push(normaliseNextBus(service, nextBus, label, busStopCode, fetchedAt));
      }
    }
  }

  return { events };
}
