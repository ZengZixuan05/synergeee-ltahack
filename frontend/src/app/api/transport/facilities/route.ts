import { NextResponse } from 'next/server';
import { BackendUnavailableError, fetchFacilitiesMaintenance } from '@/lib/backend.server';

// Server-side proxy to the standalone transport backend. The browser only
// ever talks to this route, mirroring the OneMap /api/places/search pattern.
// Requires a running Node server (npm run dev / next start).
export async function GET() {
  try {
    const data = await fetchFacilitiesMaintenance();
    return NextResponse.json(data);
  } catch (error) {
    if (error instanceof BackendUnavailableError) {
      console.error('Transport backend unavailable:', error.message);
      return NextResponse.json({ error: 'backend_unavailable', message: error.message }, { status: 502 });
    }
    console.error('Unexpected error proxying facilities:', error);
    return NextResponse.json({ error: 'unknown_error' }, { status: 500 });
  }
}
