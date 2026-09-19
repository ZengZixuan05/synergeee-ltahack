import { isOneMapConfigured, OneMapClient, oneMapClient } from '../../onemap/client';
import { OneMapConfigError, OneMapResponseShapeError, OneMapTimeoutError, OneMapUpstreamError } from '../../onemap/errors';
import { JourneyPlanResult, JourneyPlanStatus } from '../../models/journey';
import { TtlCache } from '../../utils/ttlCache';
import { logError } from '../../utils/logger';
import { facilitiesMaintenanceService } from '../facilitiesMaintenance/service';
import { trainServiceAlertsService } from '../trainServiceAlerts/service';
import { pcdRealTimeService } from '../pcdRealTime/service';
import { fetchRawJourneyPlan, PlanJourneyParams } from './adapter';
import { normaliseJourneyPlan } from './normalise';
import { enrichItinerary } from './enrich';
import { recommendItinerary } from './recommend';

export interface JourneyPlanDiagnostics {
  configured: boolean;
  lastRequestAt: string | null;
  lastStatus: JourneyPlanStatus | 'NOT_YET_CALLED';
  lastItineraryCount: number | null;
  lastErrorMessage?: string;
}

const DEFAULT_CACHE_TTL_MS = 60_000; // journey plans depend on live LTA data, so kept short — same order as FacilitiesMaintenance

function resolveCacheTtlMs(): number {
  const raw = Number(process.env.JOURNEY_PLAN_CACHE_TTL_MS);
  return Number.isFinite(raw) && raw > 0 ? raw : DEFAULT_CACHE_TTL_MS;
}

function safeErrorMessage(error: unknown): string {
  if (
    error instanceof OneMapConfigError ||
    error instanceof OneMapUpstreamError ||
    error instanceof OneMapTimeoutError ||
    error instanceof OneMapResponseShapeError
  ) {
    return error.message;
  }
  return 'Unexpected error while planning this journey.';
}

function parseLatLng(value: string): { latitude: number; longitude: number } {
  const [lat, lng] = value.split(',').map(Number);
  return { latitude: lat ?? NaN, longitude: lng ?? NaN };
}

export class JourneyPlanningService {
  private readonly cache: TtlCache<JourneyPlanResult>;
  private diagnostics: JourneyPlanDiagnostics = {
    configured: isOneMapConfigured(),
    lastRequestAt: null,
    lastStatus: 'NOT_YET_CALLED',
    lastItineraryCount: null,
  };

  constructor(private readonly client: OneMapClient) {
    this.cache = new TtlCache<JourneyPlanResult>(resolveCacheTtlMs());
  }

  async planJourney(params: PlanJourneyParams): Promise<JourneyPlanResult> {
    const cacheKey = JSON.stringify(params);
    const cached = this.cache.get(cacheKey);
    if (cached) return cached;

    const requestedAt = new Date().toISOString();
    const from = parseLatLng(params.start);
    const to = parseLatLng(params.end);

    try {
      const raw = await fetchRawJourneyPlan(this.client, params);
      const rawItineraries = normaliseJourneyPlan(raw);

      // One shared fetch of each live dataset per plan request (each is
      // independently cached, so this doesn't add extra LTA calls beyond
      // what those services already make on their own schedules).
      const [alerts, facilities, crowding] = await Promise.all([
        trainServiceAlertsService.getTrainServiceAlerts(),
        facilitiesMaintenanceService.getFacilitiesMaintenance(),
        pcdRealTimeService.getStationCrowding(),
      ]);
      const itineraries = rawItineraries.map((itinerary) => enrichItinerary(itinerary, { alerts, facilities, crowding }));

      const result: JourneyPlanResult = {
        status: itineraries.length > 0 ? 'LIVE_SUCCESS' : 'LIVE_EMPTY',
        provenance: 'LIVE',
        fetchedAt: requestedAt,
        from,
        to,
        itineraries,
        recommendation: recommendItinerary(itineraries),
      };

      this.cache.set(cacheKey, result);
      this.diagnostics = {
        configured: isOneMapConfigured(),
        lastRequestAt: requestedAt,
        lastStatus: result.status,
        lastItineraryCount: itineraries.length,
      };
      return result;
    } catch (error) {
      logError('journeyPlanning.service.error', error);
      const errorMessage = safeErrorMessage(error);
      const result: JourneyPlanResult = {
        status: 'LIVE_ERROR',
        provenance: 'LIVE',
        fetchedAt: requestedAt,
        from,
        to,
        itineraries: [],
        errorMessage,
      };

      this.diagnostics = {
        configured: isOneMapConfigured(),
        lastRequestAt: requestedAt,
        lastStatus: 'LIVE_ERROR',
        lastItineraryCount: null,
        lastErrorMessage: errorMessage,
      };
      return result;
    }
  }

  getDiagnosticsSnapshot(): JourneyPlanDiagnostics {
    return { ...this.diagnostics, configured: isOneMapConfigured() };
  }
}

export const journeyPlanningService = new JourneyPlanningService(oneMapClient);
