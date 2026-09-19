import { NextRequest, NextResponse } from 'next/server';
import { BackendUnavailableError, fetchJourneyPlan } from '@/lib/backend.server';

// Server-side proxy to the standalone journey-planning backend. Mirrors the
// facilities proxy pattern; from/to are required and passed straight through.
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const from = searchParams.get('from');
  const to = searchParams.get('to');

  if (!from) {
    return NextResponse.json({ error: 'Query parameter "from" is required and must be "lat,lng".' }, { status: 400 });
  }
  if (!to) {
    return NextResponse.json({ error: 'Query parameter "to" is required and must be "lat,lng".' }, { status: 400 });
  }

  try {
    const data = await fetchJourneyPlan({
      from,
      to,
      date: searchParams.get('date') ?? undefined,
      time: searchParams.get('time') ?? undefined,
      maxWalkDistance: searchParams.get('maxWalkDistance') ?? undefined,
      numItineraries: searchParams.get('numItineraries') ?? undefined,
    });
    return NextResponse.json(data);
  } catch (error) {
    if (error instanceof BackendUnavailableError) {
      console.error('Transport backend unavailable:', error.message);
      return NextResponse.json({ error: 'backend_unavailable', message: error.message }, { status: 502 });
    }
    console.error('Unexpected error proxying journey plan:', error);
    return NextResponse.json({ error: 'unknown_error' }, { status: 500 });
  }
}
