import { isLtaConfigured, MissingLtaAccountKeyError } from '../../config/env';
import { LtaDataMallClient, ltaDataMallClient } from '../../lta/client';
import { LtaHttpError, LtaNetworkError, LtaResponseShapeError, LtaTimeoutError } from '../../lta/errors';
import { TrainServiceAlertEvent, TransportEventProvenance } from '../../models/transportEvent';
import { TtlCache } from '../../utils/ttlCache';
import { logError } from '../../utils/logger';
import { fetchRawTrainServiceAlerts } from './adapter';
import { normaliseTrainServiceAlerts } from './normalise';

export type TrainServiceAlertsStatus = 'LIVE_SUCCESS' | 'LIVE_EMPTY' | 'LIVE_ERROR';

export interface TrainServiceAlertsResult {
  /** LIVE_EMPTY is the common case: no active line disruption right now. `messages` may still be non-empty (general advisories) even then. */
  status: TrainServiceAlertsStatus;
  provenance: TransportEventProvenance;
  fetchedAt: string;
  recordCount: number;
  events: TrainServiceAlertEvent[];
  messages: { content: string; createdDate: string }[];
  errorMessage?: string;
}

export interface TrainServiceAlertsDiagnostics {
  configured: boolean;
  lastRequestAt: string | null;
  lastStatus: TrainServiceAlertsStatus | 'NOT_YET_CALLED';
  lastRecordCount: number | null;
  lastErrorMessage?: string;
}

const CACHE_KEY = 'trainServiceAlerts';
const DEFAULT_CACHE_TTL_MS = 30_000; // shorter than FacilitiesMaintenance's: an active disruption is time-sensitive

function resolveCacheTtlMs(): number {
  const raw = Number(process.env.TRAIN_SERVICE_ALERTS_CACHE_TTL_MS);
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
  return 'Unexpected error while fetching LTA TrainServiceAlerts data.';
}

export class TrainServiceAlertsService {
  private readonly cache: TtlCache<TrainServiceAlertsResult>;
  private diagnostics: TrainServiceAlertsDiagnostics = {
    configured: isLtaConfigured(),
    lastRequestAt: null,
    lastStatus: 'NOT_YET_CALLED',
    lastRecordCount: null,
  };

  constructor(private readonly client: LtaDataMallClient) {
    this.cache = new TtlCache<TrainServiceAlertsResult>(resolveCacheTtlMs());
  }

  async getTrainServiceAlerts(): Promise<TrainServiceAlertsResult> {
    const cached = this.cache.get(CACHE_KEY);
    if (cached) return cached;

    const requestedAt = new Date().toISOString();

    try {
      const raw = await fetchRawTrainServiceAlerts(this.client);
      const { events, messages } = normaliseTrainServiceAlerts(raw, requestedAt);

      const result: TrainServiceAlertsResult = {
        status: events.length > 0 ? 'LIVE_SUCCESS' : 'LIVE_EMPTY',
        provenance: 'LIVE',
        fetchedAt: requestedAt,
        recordCount: events.length,
        events,
        messages,
      };

      this.cache.set(CACHE_KEY, result);
      this.diagnostics = {
        configured: isLtaConfigured(),
        lastRequestAt: requestedAt,
        lastStatus: result.status,
        lastRecordCount: result.recordCount,
      };
      return result;
    } catch (error) {
      logError('trainServiceAlerts.service.error', error);
      const errorMessage = safeErrorMessage(error);
      const result: TrainServiceAlertsResult = {
        status: 'LIVE_ERROR',
        provenance: 'LIVE',
        fetchedAt: requestedAt,
        recordCount: 0,
        events: [],
        messages: [],
        errorMessage,
      };

      this.diagnostics = {
        configured: isLtaConfigured(),
        lastRequestAt: requestedAt,
        lastStatus: 'LIVE_ERROR',
        lastRecordCount: null,
        lastErrorMessage: errorMessage,
      };
      return result;
    }
  }

  getDiagnosticsSnapshot(): TrainServiceAlertsDiagnostics {
    return { ...this.diagnostics, configured: isLtaConfigured() };
  }
}

export const trainServiceAlertsService = new TrainServiceAlertsService(ltaDataMallClient);
