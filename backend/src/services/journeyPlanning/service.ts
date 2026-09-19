import { isOneMapConfigured, OneMapClient, oneMapClient } from '../../onemap/client';
import { OneMapConfigError, OneMapResponseShapeError, OneMapTimeoutError, OneMapUpstreamError } from '../../onemap/errors';
import { JourneyItinerary, JourneyPlanRecommendation, JourneyPlanResult, JourneyPlanStatus } from '../../models/journey';
import { TtlCache } from '../../utils/ttlCache';
import { logError } from '../../utils/logger';
import { facilitiesMaintenanceService } from '../facilitiesMaintenance/service';
import { trainServiceAlertsService } from '../trainServiceAlerts/service';
import { pcdRealTimeService } from '../pcdRealTime/service';
import { rainfallService } from '../weather/rainfall/service';
import { fetchRawJourneyPlan, PlanJourneyParams } from './adapter';
import { normaliseJourneyPlan } from './normalise';
import { enrichItinerary, LiveContext } from './enrich';
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

  /** Fetches OneMap's raw itineraries for the given params/mode and enriches each against the (shared, already-fetched) live LTA context. */
  private async fetchAndEnrich(params: PlanJourneyParams, live: LiveContext): Promise<JourneyItinerary[]> {
    const raw = await fetchRawJourneyPlan(this.client, params);
    return normaliseJourneyPlan(raw).map((itinerary) => enrichItinerary(itinerary, live));
  }

  /**
   * When every TRANSIT itinerary (or none at all) avoids the live rail
   * disruption/lift outage, asks OneMap for a genuine bus-only door-to-door
   * itinerary instead of leaving the commuter with "no alternative avoids
   * it" — a route around the problem the routing engine itself can find,
   * rather than this backend guessing which station to detour via (there is
   * no reliable live station-code/line/coordinate table to build that on).
   * Never lets a failure here turn an otherwise-working result into an
   * error: a missing bus alternative just means no fallback was added.
   */
  private async withBusFallback(
    params: PlanJourneyParams,
    live: LiveContext,
    itineraries: JourneyItinerary[],
    recommendation: JourneyPlanRecommendation | undefined
  ): Promise<{ itineraries: JourneyItinerary[]; recommendation: JourneyPlanRecommendation | undefined }> {
    // A caller who explicitly asked for a specific single mode (e.g. a
    // commuter's "rail only" transport-mode preference) gets exactly that —
    // this fallback only kicks in for the default multi-modal search, where
    // swapping to a different mode is a reasonable thing to do on the
    // commuter's behalf without being asked.
    if (params.mode && params.mode !== 'TRANSIT') return { itineraries, recommendation };

    const recommended = recommendation ? itineraries[recommendation.index] : undefined;
    const stillAffected = itineraries.length === 0 || Boolean(recommended?.hasDisruption || recommended?.hasLiftWarning);
    if (!stillAffected) return { itineraries, recommendation };

    try {
      const busItineraries = await this.fetchAndEnrich({ ...params, mode: 'BUS' }, live);
      if (busItineraries.length === 0) return { itineraries, recommendation };

      const busRecommendation = recommendItinerary(busItineraries);
      const bestBus: JourneyItinerary = { ...busItineraries[busRecommendation?.index ?? 0]!, source: 'BUS_FALLBACK' };

      const reason =
        itineraries.length === 0
          ? 'No public transport route was found for this trip right now; showing a bus-based alternative instead.'
          : (() => {
              const issues: string[] = [];
              if (recommended!.hasDisruption) issues.push('a live service disruption');
              if (recommended!.hasLiftWarning) issues.push('a lift under maintenance');
              return `Every rail option currently has ${issues.join(' and ')} on it; showing a bus-based alternative that avoids it.`;
            })();

      const combined = [...itineraries, bestBus];
      return { itineraries: combined, recommendation: { index: combined.length - 1, reason } };
    } catch (error) {
      logError('journeyPlanning.busFallback.error', error);
      return { itineraries, recommendation };
    }
  }

  async planJourney(params: PlanJourneyParams): Promise<JourneyPlanResult> {
    const cacheKey = JSON.stringify(params);
    const cached = this.cache.get(cacheKey);
    if (cached) return cached;

    const requestedAt = new Date().toISOString();
    const from = parseLatLng(params.start);
    const to = parseLatLng(params.end);

    try {
      // One shared fetch of each live dataset per plan request (each is
      // independently cached, so this doesn't add extra LTA calls beyond
      // what those services already make on their own schedules) — reused
      // for both the TRANSIT fetch and a possible BUS fallback fetch below.
      const [alerts, facilities, crowding, rainfall] = await Promise.all([
        trainServiceAlertsService.getTrainServiceAlerts(),
        facilitiesMaintenanceService.getFacilitiesMaintenance(),
        pcdRealTimeService.getStationCrowding(),
        rainfallService.getRainfall(),
      ]);
      const live: LiveContext = { alerts, facilities, crowding, rainfall };

      const transitItineraries = await this.fetchAndEnrich(params, live);
      const transitRecommendation = recommendItinerary(transitItineraries);

      const { itineraries, recommendation } = await this.withBusFallback(
        params,
        live,
        transitItineraries,
        transitRecommendation
      );

      const result: JourneyPlanResult = {
        status: itineraries.length > 0 ? 'LIVE_SUCCESS' : 'LIVE_EMPTY',
        provenance: 'LIVE',
        fetchedAt: requestedAt,
        from,
        to,
        itineraries,
        recommendation,
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
