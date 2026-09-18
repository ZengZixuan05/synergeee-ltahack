import { NextRequest, NextResponse } from 'next/server';
import { OneMapConfigError, OneMapUpstreamError, searchOneMapPlaces } from '@/lib/onemap.server';

// Server-side proxy: keeps OneMap credentials out of the browser entirely.
// The client only ever talks to this route and receives normalised Place[].
//
// NOTE: this route requires a running Node server (e.g. `npm run dev` or
// `next start`). It is not available when the app is built with
// `output: 'export'` for static hosting — see README "Known limitations".
export async function GET(request: NextRequest) {
  const query = request.nextUrl.searchParams.get('q')?.trim();

  if (!query || query.length < 2) {
    return NextResponse.json({ results: [] });
  }

  try {
    const results = await searchOneMapPlaces(query);
    return NextResponse.json({ results });
  } catch (error) {
    if (error instanceof OneMapConfigError) {
      console.error('OneMap config error:', error.message);
      return NextResponse.json({ error: 'not_configured', message: error.message }, { status: 503 });
    }
    if (error instanceof OneMapUpstreamError) {
      console.error('OneMap upstream error:', error.message);
      return NextResponse.json({ error: 'upstream_error', message: error.message }, { status: 502 });
    }
    console.error('Unexpected error while searching OneMap:', error);
    return NextResponse.json({ error: 'unknown_error' }, { status: 500 });
  }
}
