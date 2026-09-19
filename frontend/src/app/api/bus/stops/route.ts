import { NextResponse } from 'next/server';
import { BackendUnavailableError, fetchBusStops } from '@/lib/backend.server';

export async function GET() {
  try {
    const data = await fetchBusStops();
    return NextResponse.json(data);
  } catch (error) {
    if (error instanceof BackendUnavailableError) {
      console.error('Transport backend unavailable:', error.message);
      return NextResponse.json({ error: 'backend_unavailable', message: error.message }, { status: 502 });
    }
    console.error('Unexpected error proxying bus stops:', error);
    return NextResponse.json({ error: 'unknown_error' }, { status: 500 });
  }
}
