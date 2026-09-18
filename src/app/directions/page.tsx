'use client';

import React, { useState } from 'react';
import {
  MapPin,
  Clock,
  ArrowRight,
  Search,
  Filter,
  Navigation,
  Sparkles,
  AlertCircle,
  Route,
} from 'lucide-react';
import { useDemoMode } from '@/features/demo/useDemoMode';
import { useAuth } from '@/features/auth/useAuth';
import { PageHeader } from '@/components/layout/PageHeader';
import { MapPlaceholder } from '@/components/map/MapPlaceholder';
import { RouteCard } from '@/components/journey/RouteCard';
import { Button } from '@/components/ui/Button';
import { DemoBadge } from '@/components/alerts/DemoBadge';
import { Card } from '@/components/ui/Card';
import { RegularRoute } from '@/types';
import { formatTimeForDisplay } from '@/lib/utils';

export default function DirectionsPage() {
  const { usualRoute, recommendedRoute, isDisrupted } = useDemoMode();
  const { profile } = useAuth();

  const [fromLocation, setFromLocation] = useState('Sky Eden @ Bedok');
  const [toLocation, setToLocation] = useState('Singapore General Hospital');
  const [timeMode, setTimeMode] = useState<'arrive-by' | 'leave-now' | 'depart-at'>('arrive-by');
  const [targetTime, setTargetTime] = useState('10:00 AM');
  const [isPlanned, setIsPlanned] = useState(true);

  const savedRoutes = profile?.regularRoutes ?? [];

  const handleApplyRoute = (route: RegularRoute) => {
    setFromLocation(route.origin);
    setToLocation(route.destination);
    setTimeMode(route.timeType);
    if (route.time) {
      setTargetTime(formatTimeForDisplay(route.time));
    }
  };

  return (
    <div className="flex-1 flex flex-col pb-6">
      <PageHeader
        title="Directions & Planner"
        subtitle="Step-free & sheltered route finder"
        rightAction={isDisrupted ? <DemoBadge size="sm" /> : undefined}
      />

      <div className="p-4 space-y-4">
        {/* Regular Routes Quick Fill */}
        {savedRoutes.length > 0 && (
          <section aria-label="Your regular routes" className="space-y-1.5">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 block px-0.5">
              Your regular routes
            </span>
            <div className="flex items-center gap-2 overflow-x-auto pb-1 -mx-0.5 px-0.5">
              {savedRoutes.map((route) => (
                <button
                  key={route.id}
                  type="button"
                  onClick={() => handleApplyRoute(route)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-slate-200 bg-white text-xs font-bold text-slate-700 whitespace-nowrap hover:border-[#004b87] hover:text-[#004b87] transition-colors shrink-0"
                >
                  <Route className="w-3.5 h-3.5 text-[#004b87]" />
                  {route.name}
                </button>
              ))}
            </div>
          </section>
        )}

        {/* Journey Planner Search Form */}
        <Card variant="default" className="border border-slate-200 p-4 space-y-3 bg-white">
          <div className="space-y-2">
            {/* From Input */}
            <div className="flex items-center gap-2.5 p-2.5 rounded-xl border border-slate-200 bg-slate-50 focus-within:border-[#004b87] focus-within:ring-1 focus-within:ring-[#004b87]">
              <div className="w-2.5 h-2.5 rounded-full bg-slate-400 flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <label htmlFor="from-location" className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block">
                  From
                </label>
                <input
                  id="from-location"
                  type="text"
                  value={fromLocation}
                  onChange={(e) => setFromLocation(e.target.value)}
                  className="w-full bg-transparent text-sm font-semibold text-slate-900 border-none outline-none p-0"
                  aria-label="Origin location"
                />
              </div>
            </div>

            {/* To Input */}
            <div className="flex items-center gap-2.5 p-2.5 rounded-xl border border-slate-200 bg-slate-50 focus-within:border-[#004b87] focus-within:ring-1 focus-within:ring-[#004b87]">
              <div className="w-2.5 h-2.5 rounded-full bg-[#004b87] flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <label htmlFor="to-location" className="text-[10px] font-bold uppercase tracking-wider text-[#004b87] block">
                  To
                </label>
                <input
                  id="to-location"
                  type="text"
                  value={toLocation}
                  onChange={(e) => setToLocation(e.target.value)}
                  className="w-full bg-transparent text-sm font-semibold text-slate-900 border-none outline-none p-0"
                  aria-label="Destination location"
                />
              </div>
            </div>
          </div>

          {/* Time Selector */}
          <div className="space-y-1.5 pt-1">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 block">
              Time preference
            </span>
            <div
              role="radiogroup"
              aria-label="Departure or arrival timing"
              className="grid grid-cols-3 gap-1.5 p-1 bg-slate-100 rounded-xl"
            >
              <button
                type="button"
                role="radio"
                aria-checked={timeMode === 'leave-now'}
                onClick={() => setTimeMode('leave-now')}
                className={`py-1.5 text-xs font-bold rounded-lg transition-all min-h-[38px] ${
                  timeMode === 'leave-now'
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Leave now
              </button>
              <button
                type="button"
                role="radio"
                aria-checked={timeMode === 'depart-at'}
                onClick={() => setTimeMode('depart-at')}
                className={`py-1.5 text-xs font-bold rounded-lg transition-all min-h-[38px] ${
                  timeMode === 'depart-at'
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Depart at
              </button>
              <button
                type="button"
                role="radio"
                aria-checked={timeMode === 'arrive-by'}
                onClick={() => setTimeMode('arrive-by')}
                className={`py-1.5 text-xs font-bold rounded-lg transition-all min-h-[38px] ${
                  timeMode === 'arrive-by'
                    ? 'bg-white text-[#004b87] shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Arrive by
              </button>
            </div>

            {timeMode === 'arrive-by' && (
              <div className="flex items-center justify-between text-xs px-2 py-1 bg-[#f0f5fa] rounded-lg text-slate-700">
                <span className="font-medium">Target arrival:</span>
                <span className="font-bold text-[#004b87]">{targetTime} (Monday)</span>
              </div>
            )}
          </div>

          <Button
            variant="primary"
            size="md"
            fullWidth
            onClick={() => setIsPlanned(true)}
            rightIcon={<Search className="w-4 h-4" />}
          >
            Plan journey
          </Button>
        </Card>

        {/* Map Preview Area Placeholder */}
        <section aria-label="Route map preview">
          <MapPlaceholder showAffectedDetour={isDisrupted} />
        </section>

        {/* Route Results Section */}
        {isPlanned && (
          <section aria-label="Route options" className="space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-sm font-bold text-slate-900">
                  Route Results
                </h2>
                <p className="text-[11px] text-slate-500 font-medium">
                  {isDisrupted
                    ? '1 alternative route recommended due to lift maintenance'
                    : '2 routes evaluated for step-free travel'}
                </p>
              </div>

              {isDisrupted && <DemoBadge size="sm" />}
            </div>

            {/* Route Option 1: Recommended */}
            <RouteCard
              route={recommendedRoute}
              isSelected={true}
              showComparisonLink={true}
            />

            {/* Route Option 2: Usual Route (Affected if demo disruption active) */}
            <RouteCard
              route={usualRoute}
              isSelected={false}
              showComparisonLink={true}
            />
          </section>
        )}
      </div>
    </div>
  );
}
