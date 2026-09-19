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
}

export async function fetchRawJourneyPlan(client: OneMapClient, params: PlanJourneyParams): Promise<unknown> {
  return client.route({
    routeType: 'pt',
    mode: 'TRANSIT',
    start: params.start,
    end: params.end,
    date: params.date,
    time: params.time,
    maxWalkDistance: params.maxWalkDistance,
    numItineraries: params.numItineraries,
  });
}
