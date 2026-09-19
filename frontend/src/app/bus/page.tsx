'use client';

import React, { useMemo, useState } from 'react';
import { Search, MapPin, LocateFixed, Loader2, WifiOff } from 'lucide-react';
import { PageHeader } from '@/components/layout/PageHeader';
import { Card } from '@/components/ui/Card';
import { useBusStops } from '@/hooks/useBusStops';
import { useCurrentPosition } from '@/hooks/useCurrentPosition';
import { BusStopReference } from '@/types/bus';
import { haversineDistanceMeters } from '@/lib/geo';
import { formatDistance } from '@/lib/utils';
import { BusStopArrivals } from '@/components/bus/BusStopArrivals';

function stopLabel(stop: BusStopReference): string {
  return stop.description || stop.roadName || stop.busStopCode;
}

export default function BusServicesPage() {
  const { stops, status: stopsStatus, errorMessage: stopsErrorMessage } = useBusStops();
  const [query, setQuery] = useState('');
  const [selectedStop, setSelectedStop] = useState<BusStopReference | null>(null);
  const { position, status: locationStatus, requestLocation } = useCurrentPosition();

  const trimmedQuery = query.trim().toLowerCase();

  const searchResults = useMemo(() => {
    if (!trimmedQuery) return [];
    return stops
      .filter(
        (stop) =>
          stop.busStopCode.includes(trimmedQuery) ||
          stop.description?.toLowerCase().includes(trimmedQuery) ||
          stop.roadName?.toLowerCase().includes(trimmedQuery)
      )
      .slice(0, 20);
  }, [stops, trimmedQuery]);

  const nearbyStops = useMemo(() => {
    if (!position || stops.length === 0) return [];
    return stops
      .map((stop) => ({ stop, distanceMeters: haversineDistanceMeters(position, stop) }))
      .sort((a, b) => a.distanceMeters - b.distanceMeters)
      .slice(0, 8);
  }, [stops, position]);

  if (selectedStop) {
    return (
      <div className="flex-1 flex flex-col pb-6">
        <PageHeader
          title={stopLabel(selectedStop)}
          subtitle={`Stop ${selectedStop.busStopCode}${selectedStop.roadName ? ` · ${selectedStop.roadName}` : ''}`}
          showBack
          onBack={() => setSelectedStop(null)}
        />
        <div className="p-4">
          <BusStopArrivals busStopCode={selectedStop.busStopCode} />
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col pb-6">
      <PageHeader title="Bus Services" subtitle="Check live bus timings near you" />

      <div className="p-4 space-y-4">
        <div className="flex items-center gap-2 px-3 py-2.5 rounded-xl border border-slate-200 bg-slate-50 focus-within:border-[#004b87] focus-within:ring-1 focus-within:ring-[#004b87]">
          <Search className="w-4 h-4 text-slate-400 shrink-0" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search bus stop by name, road, or code"
            className="w-full bg-transparent text-sm font-semibold text-slate-900 outline-none placeholder:text-slate-400 placeholder:font-normal"
          />
        </div>

        {stopsStatus === 'error' && (
          <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 flex items-start gap-2 text-xs text-slate-600">
            <WifiOff className="w-4 h-4 text-slate-500 flex-shrink-0 mt-0.5" aria-hidden="true" />
            <span>{stopsErrorMessage || 'Live bus stop data is unavailable right now.'}</span>
          </div>
        )}

        {trimmedQuery ? (
          <section aria-label="Search results" className="space-y-1.5">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 block px-0.5">
              {stopsStatus === 'loading' ? 'Searching…' : `${searchResults.length} result${searchResults.length === 1 ? '' : 's'}`}
            </span>
            <div className="space-y-2">
              {searchResults.map((stop) => (
                <button key={stop.busStopCode} type="button" onClick={() => setSelectedStop(stop)} className="w-full text-left">
                  <Card variant="default" className="p-3 flex items-center justify-between gap-2 bg-white hover:border-[#004b87] transition-colors">
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-slate-900 truncate">{stopLabel(stop)}</p>
                      <p className="text-[11px] text-slate-500">{stop.roadName}</p>
                    </div>
                    <span className="text-[10px] font-bold text-slate-500 shrink-0">{stop.busStopCode}</span>
                  </Card>
                </button>
              ))}
              {stopsStatus === 'success' && searchResults.length === 0 && (
                <p className="text-xs text-slate-500 px-1">No bus stops match &ldquo;{query.trim()}&rdquo;.</p>
              )}
            </div>
          </section>
        ) : (
          <section aria-label="Bus stops near you" className="space-y-1.5">
            <div className="flex items-center justify-between px-0.5">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Near you</span>
              {locationStatus !== 'success' && (
                <button
                  type="button"
                  onClick={requestLocation}
                  className="inline-flex items-center gap-1 text-[11px] font-bold text-[#004b87]"
                >
                  {locationStatus === 'loading' ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" aria-hidden="true" />
                  ) : (
                    <LocateFixed className="w-3.5 h-3.5" aria-hidden="true" />
                  )}
                  Enable location
                </button>
              )}
            </div>

            {locationStatus === 'error' && (
              <p className="text-xs text-slate-500 px-1">
                Location isn&apos;t available &mdash; search for a bus stop by name, road, or code instead.
              </p>
            )}

            {(locationStatus === 'idle' || locationStatus === 'loading') && (
              <div className="rounded-xl border border-slate-200 bg-white p-3 text-xs text-slate-500">Finding stops near you&hellip;</div>
            )}

            {locationStatus === 'success' && stopsStatus === 'loading' && (
              <div className="rounded-xl border border-slate-200 bg-white p-3 text-xs text-slate-500">Loading live bus stops&hellip;</div>
            )}

            {locationStatus === 'success' && stopsStatus === 'success' && (
              <div className="space-y-2">
                {nearbyStops.map(({ stop, distanceMeters }) => (
                  <button key={stop.busStopCode} type="button" onClick={() => setSelectedStop(stop)} className="w-full text-left">
                    <Card variant="default" className="p-3 flex items-center justify-between gap-2 bg-white hover:border-[#004b87] transition-colors">
                      <div className="flex items-start gap-2 min-w-0">
                        <MapPin className="w-4 h-4 text-[#004b87] mt-0.5 shrink-0" aria-hidden="true" />
                        <div className="min-w-0">
                          <p className="text-sm font-semibold text-slate-900 truncate">{stopLabel(stop)}</p>
                          <p className="text-[11px] text-slate-500">{stop.roadName}</p>
                        </div>
                      </div>
                      <span className="text-[11px] font-bold text-slate-600 shrink-0">{formatDistance(Math.round(distanceMeters))}</span>
                    </Card>
                  </button>
                ))}
              </div>
            )}
          </section>
        )}
      </div>
    </div>
  );
}
