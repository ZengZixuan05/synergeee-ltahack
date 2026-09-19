import { NextRequest, NextResponse } from 'next/server';
import { BackendUnavailableError, fetchBusArrival } from '@/lib/backend.server';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const busStopCode = searchParams.get('busStopCode')?.trim();

  if (!busStopCode) {
    return NextResponse.json({ error: 'Query parameter "busStopCode" is required.' }, { status: 400 });
  }

  try {
    const data = await fetchBusArrival(busStopCode, searchParams.get('serviceNo')?.trim() || undefined);
    return NextResponse.json(data);
  } catch (error) {
    if (error instanceof BackendUnavailableError) {
      console.error('Transport backend unavailable:', error.message);
      return NextResponse.json({ error: 'backend_unavailable', message: error.message }, { status: 502 });
    }
    console.error('Unexpected error proxying bus arrival:', error);
    return NextResponse.json({ error: 'unknown_error' }, { status: 500 });
  }
}
