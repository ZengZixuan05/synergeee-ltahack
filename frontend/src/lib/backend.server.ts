// SERVER-ONLY adapter for the standalone JourneyAhead backend (Express, :8081).
// Never import from a Client Component. Used only by Next.js Route Handlers
// (src/app/api/transport/*), mirroring the OneMap proxy pattern: the browser
// talks to our own /api routes, which server-side proxy to the backend.

import { FacilitiesResponse } from '@/types/transport';

const BACKEND_BASE_URL = process.env.BACKEND_BASE_URL || 'http://localhost:8081';
const REQUEST_TIMEOUT_MS = 8000;

export class BackendUnavailableError extends Error {}

/**
 * Fetches normalised lift-maintenance events from the backend. The backend
 * returns LIVE_ERROR as a 200 with a status field (not an HTTP 5xx), so a
 * reachable backend always yields a FacilitiesResponse we can pass through.
 * Only an unreachable/timed-out backend throws BackendUnavailableError.
 */
export async function fetchFacilitiesMaintenance(): Promise<FacilitiesResponse> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  try {
    const response = await fetch(BACKEND_BASE_URL + '/api/transport/facilities', {
      signal: controller.signal,
      headers: { Accept: 'application/json' },
    });

    if (response.ok === false) {
      throw new BackendUnavailableError('Backend returned HTTP ' + response.status);
    }

    return (await response.json()) as FacilitiesResponse;
  } catch (error) {
    if (error instanceof BackendUnavailableError) throw error;
    throw new BackendUnavailableError('Could not reach the transport backend.');
  } finally {
    clearTimeout(timeout);
  }
}
