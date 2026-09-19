import { isLtaConfigured, MissingLtaAccountKeyError } from '../../config/env';
import { LtaDataMallClient, ltaDataMallClient } from '../../lta/client';
import { LtaHttpError, LtaNetworkError, LtaResponseShapeError, LtaTimeoutError } from '../../lta/errors';
import { BusLoadObservedEvent, TransportEventProvenance } from '../../models/transportEvent';
import { TtlCache } from '../../utils/ttlCache';
import { logError } from '../../utils/logger';
import { fetchRawBusArrival } from './adapter';
import { normaliseBusArrival } from './normalise';

export type BusArrivalStatus = 'LIVE_SUCCESS' | 'LIVE_EMPTY' | 'LIVE_ERROR';

export interface BusArrivalResult {
  status: BusArrivalStatus;
  provenance: TransportEventProvenance;
  fetchedAt: string;
  busStopCode: string;
  recordCount: number;
  events: BusLoadObservedEvent[];
  errorMessage?: string;
}

/**
 * Unlike every other endpoint's diagnostics, this reflects only the MOST
 * RECENT query (there's no "fetch everything" for a per-bus-stop endpoint,
 * so there's no meaningful aggregate health across every possible stop).
 */
export interface BusArrivalDiagnostics {
  configured: boolean;
  lastRequestAt: string | null;
  lastBusStopCode: string | null;
  lastStatus: BusArrivalStatus | 'NOT_YET_CALLED';
  lastRecordCount: number | null;
  lastErrorMessage?: string;
}

const DEFAULT_CACHE_TTL_MS = 15_000; // guide: BusArrival updates every 20 seconds

function resolveCacheTtlMs(): number {
  const raw = Number(process.env.BUS_ARRIVAL_CACHE_TTL_MS);
  return Number.isFinite(raw) && raw > 0 ? raw : DEFAULT_CACHE_TTL_MS;
}

function safeErrorMessage(error: unknown): string {
  if (
    error instanceof LtaHttpError ||
    error instanceof LtaTimeoutError ||
    error instanceof LtaNetworkError ||
    error instanceof LtaResponseShapeError ||
    error instanceof MissingLtaAccountKeyError
  ) {
    return error.message;
  }
  return 'Unexpected error while fetching LTA BusArrival data.';
}

export class BusArrivalService {
  private readonly cache: TtlCache<BusArrivalResult>;
  private diagnostics: BusArrivalDiagnostics = {
    configured: isLtaConfigured(),
    lastRequestAt: null,
    lastBusStopCode: null,
    lastStatus: 'NOT_YET_CALLED',
    lastRecordCount: null,
  };

  constructor(private readonly client: LtaDataMallClient) {
    this.cache = new TtlCache<BusArrivalResult>(resolveCacheTtlMs());
  }

  async getBusArrival(busStopCode: string, serviceNo?: string): Promise<BusArrivalResult> {
    const cacheKey = `${busStopCode}:${serviceNo ?? ''}`;
    const cached = this.cache.get(cacheKey);
    if (cached) return cached;

    const requestedAt = new Date().toISOString();

    try {
      const raw = await fetchRawBusArrival(this.client, busStopCode, serviceNo);
      const { events } = normaliseBusArrival(raw, busStopCode, requestedAt);

      const result: BusArrivalResult = {
        status: events.length > 0 ? 'LIVE_SUCCESS' : 'LIVE_EMPTY',
        provenance: 'LIVE',
        fetchedAt: requestedAt,
        busStopCode,
        recordCount: events.length,
        events,
      };

      this.cache.set(cacheKey, result);
      this.diagnostics = {
        configured: isLtaConfigured(),
        lastRequestAt: requestedAt,
        lastBusStopCode: busStopCode,
        lastStatus: result.status,
        lastRecordCount: result.recordCount,
      };
      return result;
    } catch (error) {
      logError('busArrival.service.error', error);
      const errorMessage = safeErrorMessage(error);
      const result: BusArrivalResult = {
        status: 'LIVE_ERROR',
        provenance: 'LIVE',
        fetchedAt: requestedAt,
        busStopCode,
        recordCount: 0,
        events: [],
        errorMessage,
      };

      this.diagnostics = {
        configured: isLtaConfigured(),
        lastRequestAt: requestedAt,
        lastBusStopCode: busStopCode,
        lastStatus: 'LIVE_ERROR',
        lastRecordCount: null,
        lastErrorMessage: errorMessage,
      };
      return result;
    }
  }

  getDiagnosticsSnapshot(): BusArrivalDiagnostics {
    return { ...this.diagnostics, configured: isLtaConfigured() };
  }
}

export const busArrivalService = new BusArrivalService(ltaDataMallClient);
