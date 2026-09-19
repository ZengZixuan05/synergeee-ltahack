import { OneMapClient } from '../../onemap/client';

export interface PlanJourneyParams {
  /** "lat,lng" */
  start: string;
  /** "lat,lng" */
  end: string;
  /** "MM-DD-YYYY" */
  date: string;
  /** "HH:mm:ss" */
  time: string;
  maxWalkDistance?: number;
  numItineraries?: number;
  /**
   * Defaults to 'TRANSIT' (multi-modal). Callers can request 'BUS' or 'RAIL'
   * directly (e.g. from a commuter's transport-mode preference); 'BUS' is
   * also used internally by the journey-planning service as a fallback when
   * every TRANSIT itinerary has a live rail disruption or lift outage on it
   * (see service.ts) — but only when the caller didn't already request a
   * specific single mode (see withBusFallback's own guard).
   */
  mode?: 'TRANSIT' | 'BUS' | 'RAIL';
}

export async function fetchRawJourneyPlan(client: OneMapClient, params: PlanJourneyParams): Promise<unknown> {
  return client.route({
    routeType: 'pt',
    mode: params.mode ?? 'TRANSIT',
    start: params.start,
    end: params.end,
    date: params.date,
    time: params.time,
    maxWalkDistance: params.maxWalkDistance,
    numItineraries: params.numItineraries,
  });
}
