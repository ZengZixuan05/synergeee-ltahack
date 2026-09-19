'use client';

import React from 'react';
import Link from 'next/link';
import { ArrowRight, AlertTriangle, ShieldCheck, CheckCircle, Radio } from 'lucide-react';
import { Journey } from '@/types';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { CrowdingIndicator } from '@/components/accessibility/CrowdingIndicator';
import { AccessibilityBadge } from '@/components/accessibility/AccessibilityBadge';

interface JourneyCardProps {
  journey: Journey;
  onSelect?: () => void;
  className?: string;
}

function buildDirectionsHref(journey: Journey): string {
  const params = new URLSearchParams();
  params.set('originLabel', journey.originName);
  params.set('destLabel', journey.destinationName);
  if (journey.originPlace) {
    params.set('originLat', String(journey.originPlace.latitude));
    params.set('originLng', String(journey.originPlace.longitude));
  }
  if (journey.destinationPlace) {
    params.set('destLat', String(journey.destinationPlace.latitude));
    params.set('destLng', String(journey.destinationPlace.longitude));
  }
  if (journey.scheduleTimeType && journey.scheduleTimeValue) {
    params.set('timeType', journey.scheduleTimeType);
    params.set('timeValue', journey.scheduleTimeValue);
  }
  return `/directions?${params.toString()}`;
}

export function JourneyCard({ journey, onSelect, className }: JourneyCardProps) {
  const isAffected = journey.isAffected;
  const hasAlternative = Boolean(isAffected && journey.recommendedRoute);
  const activeRoute = hasAlternative ? journey.recommendedRoute! : journey.normalRoute;
  const directionsHref = buildDirectionsHref(journey);

  return (
    <Card
      variant={isAffected ? 'warning' : 'elevated'}
      className={`border-2 transition-all relative overflow-hidden bg-white ${
        isAffected
          ? 'border-amber-400 shadow-xs'
          : 'border-slate-200 hover:border-slate-300'
      } ${className || ''}`}
    >
      {/* Top Banner / Indicator */}
      <div className="flex items-center justify-between gap-2 mb-3 flex-wrap">
        <div className="flex items-center gap-1.5 flex-wrap">
          {isAffected ? (
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-950 border border-amber-300">
              <AlertTriangle className="w-3.5 h-3.5 text-amber-700" aria-hidden="true" />
              <span>Your usual route is affected right now</span>
            </div>
          ) : (
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-900 border border-emerald-300">
              <CheckCircle className="w-3.5 h-3.5 text-emerald-700" aria-hidden="true" />
              <span>Your journey is ready</span>
            </div>
          )}
        </div>

        {isAffected && (
          <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider rounded-md bg-emerald-100 text-emerald-900 border border-emerald-400 px-1.5 py-0.5">
            <Radio className="w-3 h-3 text-emerald-700" aria-hidden="true" />
            LIVE · LTA
          </span>
        )}
      </div>

      {/* Title & Schedule */}
      <div className="mb-3">
        <h2 className="text-xl font-bold text-slate-900 leading-tight">
          {journey.title}
        </h2>
        <p className="text-xs font-semibold text-slate-600 mt-0.5">
          {journey.recurrence} · Arrive by{' '}
          <span className="text-slate-900 font-bold">{journey.targetArrivalTime}</span>
        </p>
      </div>

      {/* Origin & Destination */}
      <div className="bg-[#f4f6f9] rounded-xl p-3 border border-slate-200 mb-3 space-y-2">
        <div className="flex items-start gap-2.5">
          <div className="w-2.5 h-2.5 rounded-full bg-slate-400 mt-1.5 flex-shrink-0" />
          <div className="min-w-0">
            <span className="text-[11px] uppercase tracking-wide text-slate-500 font-medium">Origin</span>
            <p className="text-sm font-semibold text-slate-800 truncate">
              {journey.originName}
            </p>
          </div>
        </div>

        <div className="ml-1 pl-2.5 border-l-2 border-dashed border-slate-300 h-2" />

        <div className="flex items-start gap-2.5">
          <div className="w-2.5 h-2.5 rounded-full bg-[#004b87] mt-1.5 flex-shrink-0" />
          <div className="min-w-0">
            <span className="text-[11px] uppercase tracking-wide text-[#004b87] font-semibold">Destination</span>
            <p className="text-sm font-semibold text-slate-900 truncate">
              {journey.destinationName}
            </p>
          </div>
        </div>
      </div>

      {/* Disruption Context & Actionable Advice */}
      {isAffected && (
        <div className="rounded-xl bg-amber-50 border border-amber-300 p-3 mb-4 space-y-2">
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-amber-900">
              What&apos;s wrong
            </span>
            <p className="text-xs font-medium text-amber-950 mt-0.5 leading-relaxed">
              {journey.affectedReason}
            </p>
          </div>

          <div className="pt-2 border-t border-amber-200">
            <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-900 flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-700" />
              {hasAlternative ? 'Recommended alternative' : 'No alternative available'}
            </span>
            <p className="text-sm font-bold text-slate-900 mt-0.5">
              {journey.recommendedAction}
            </p>
          </div>
        </div>
      )}

      {/* Times & Key Differential Badges */}
      <div className="grid grid-cols-2 gap-2 mb-3">
        <div className="bg-white rounded-xl p-2.5 border border-slate-200 shadow-2xs">
          <span className="text-[11px] text-slate-500 font-medium block">
            {hasAlternative ? 'Alternative departure' : 'Estimated departure'}
          </span>
          <span className={`text-base font-bold ${hasAlternative ? 'text-[#004b87]' : 'text-slate-900'}`}>
            {activeRoute.departureTime}
          </span>
        </div>

        <div className="bg-white rounded-xl p-2.5 border border-slate-200 shadow-2xs">
          <span className="text-[11px] text-slate-500 font-medium block">
            Expected arrival
          </span>
          <span className="text-base font-bold text-slate-900">
            {activeRoute.arrivalTime}
          </span>
        </div>
      </div>

      {/* Route Attributes / Badges */}
      <div className="flex flex-wrap gap-1.5 items-center mb-4">
        {activeRoute.metrics.isStepFree && <AccessibilityBadge type="step-free" size="sm" />}
        {activeRoute.metrics.hasWorkingLifts && <AccessibilityBadge type="working-lifts" size="sm" />}
        {activeRoute.metrics.isMostlySheltered && <AccessibilityBadge type="mostly-sheltered" size="sm" />}
        <CrowdingIndicator level={activeRoute.metrics.crowding} size="sm" />
      </div>

      {/* Primary CTA */}
      <div className="pt-1">
        <Link href={directionsHref} className="block w-full" onClick={onSelect}>
          <Button
            variant="primary"
            size={isAffected ? 'lg' : 'md'}
            fullWidth
            rightIcon={<ArrowRight className={isAffected ? 'w-5 h-5' : 'w-4 h-4'} />}
            aria-label={hasAlternative ? 'View the recommended alternative route' : 'View journey details'}
          >
            {hasAlternative ? 'View alternative route' : 'View journey'}
          </Button>
        </Link>
      </div>
    </Card>
  );
}
