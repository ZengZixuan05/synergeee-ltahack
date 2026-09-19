'use client';

import React from 'react';
import Link from 'next/link';
import {
  ArrowRight,
  Clock,
  Footprints,
  AlertTriangle,
  CheckCircle2,
  ShieldCheck,
} from 'lucide-react';
import { RouteOption } from '@/types';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { DemoBadge } from '@/components/alerts/DemoBadge';
import { AccessibilityBadge } from '@/components/accessibility/AccessibilityBadge';
import { calculateRouteDiff } from '@/features/journeys/helpers';

interface RouteComparisonProps {
  usualRoute: RouteOption;
  recommendedRoute: RouteOption;
  /** Plain-language reason this route was recommended, from the live backend's recommendation.reason — not invented copy. */
  recommendedWhy?: string;
  onSelectRecommended?: () => void;
  className?: string;
  /** Shows the amber "DEMO SCENARIO" badge — only when this comparison is actually built from fixture data, never for a live one. */
  isDemo?: boolean;
}

export function RouteComparison({
  usualRoute,
  recommendedRoute,
  recommendedWhy,
  onSelectRecommended,
  className,
  isDemo = false,
}: RouteComparisonProps) {
  const diff = calculateRouteDiff(usualRoute, recommendedRoute);
  const why = recommendedWhy ?? diff.summaryMessage;

  return (
    <div className={`space-y-4 ${className || ''}`}>
      {/* Framing header: names what is being compared, so the numbers below have a clear subject */}
      <div className="flex items-start justify-between gap-3">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-[#004b87] block">
            We found a better option
          </span>
          <h2 className="text-lg font-bold text-slate-900 leading-snug mt-0.5">
            Recommended route vs your usual route
          </h2>
        </div>
        {isDemo && <DemoBadge size="sm" />}
      </div>

      <div className="space-y-3">
        {/* Recommended Route — the trade-off now lives INSIDE this card, so +min/+m clearly belong to it */}
        <Card variant="highlight" className="relative">
          <div className="flex items-center justify-between mb-3">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md text-xs font-bold uppercase tracking-wider bg-[#004b87] text-white">
              <CheckCircle2 className="w-3.5 h-3.5" aria-hidden="true" />
              Recommended Route
            </div>
            <span className="text-base font-extrabold text-slate-900">
              {recommendedRoute.metrics.durationRange ?? `${recommendedRoute.metrics.durationMinutes} min`}
            </span>
          </div>

          {/* Trade-off block, explicitly attributed to choosing THIS route over the usual one */}
          <div className="rounded-xl border border-amber-300 bg-amber-50/70 p-3 mb-3">
            <p className="text-xs font-bold uppercase tracking-wider text-amber-800 mb-2">
              Trade-off vs your usual route
            </p>
            <div className="grid grid-cols-2 gap-2 text-center">
              <div className="bg-white p-2.5 rounded-xl border border-amber-200">
                <span className="inline-flex items-center gap-1 text-xs text-slate-700 font-semibold">
                  <Clock className="w-3.5 h-3.5 text-amber-700" aria-hidden="true" />
                  Extra time
                </span>
                <span className="text-xl font-black text-amber-700 block">
                  {diff.timeDeltaMinutes > 0 ? `+${diff.timeDeltaMinutes} min` : diff.timeDeltaFormatted}
                </span>
                <span className="text-[11px] text-slate-500 block mt-0.5">
                  Leave at {recommendedRoute.departureTime}
                </span>
              </div>

              <div className="bg-white p-2.5 rounded-xl border border-amber-200">
                <span className="inline-flex items-center gap-1 text-xs text-slate-700 font-semibold">
                  <Footprints className="w-3.5 h-3.5 text-amber-700" aria-hidden="true" />
                  Extra walking
                </span>
                <span className="text-xl font-black text-amber-700 block">
                  {diff.walkingDeltaMeters > 0 ? `+${diff.walkingDeltaMeters} m` : `${diff.walkingDeltaMeters} m`}
                </span>
              </div>
            </div>
          </div>

          {/* The payoff for that trade-off, still part of the recommended card */}
          {(diff.stepFreeMaintained || diff.workingLiftsMaintained || diff.shelteredMaintained) && (
            <div className="p-3 bg-emerald-50 border border-emerald-300 rounded-xl flex items-start gap-2.5 text-emerald-950 mb-3">
              <ShieldCheck className="w-5 h-5 text-emerald-700 flex-shrink-0 mt-0.5" aria-hidden="true" />
              <div>
                <p className="text-sm font-bold">{diff.summaryMessage}</p>
                {usualRoute.affectedReason && (
                  <p className="text-xs text-emerald-900 mt-0.5">Avoids: {usualRoute.affectedReason}</p>
                )}
              </div>
            </div>
          )}

          <div className="flex items-center justify-between text-xs text-slate-600 mb-3 bg-slate-50 p-2 rounded-lg">
            <span>Leave: <strong className="text-slate-900">{recommendedRoute.departureTime}</strong></span>
            <span>Arrive: <strong className="text-slate-900">{recommendedRoute.arrivalTime}</strong></span>
          </div>

          <div className="grid grid-cols-3 gap-2 text-center text-xs mb-3">
            <div className="p-1.5 bg-slate-50 rounded-lg border border-slate-200">
              <span className="text-[10px] text-slate-500 block uppercase">Walk</span>
              <span className="font-bold text-slate-900">{recommendedRoute.metrics.walkingDistanceMeters} m</span>
            </div>
            <div className="p-1.5 bg-slate-50 rounded-lg border border-slate-200">
              <span className="text-[10px] text-slate-500 block uppercase">Transfer</span>
              <span className="font-bold text-slate-900">{recommendedRoute.metrics.transfersCount}</span>
            </div>
            <div className="p-1.5 bg-slate-50 rounded-lg border border-slate-200">
              <span className="text-[10px] text-slate-500 block uppercase">Lifts</span>
              <span className={recommendedRoute.metrics.hasWorkingLifts ? 'font-bold text-emerald-700' : 'font-bold text-amber-700'}>
                {recommendedRoute.metrics.hasWorkingLifts ? 'Verified' : 'Warning'}
              </span>
            </div>
          </div>

          <div className="flex flex-wrap gap-1.5 mb-3">
            {recommendedRoute.metrics.isStepFree && <AccessibilityBadge type="step-free" size="sm" />}
            {recommendedRoute.metrics.hasWorkingLifts && <AccessibilityBadge type="working-lifts" size="sm" />}
            {recommendedRoute.metrics.isMostlySheltered && <AccessibilityBadge type="mostly-sheltered" size="sm" />}
          </div>

          <div className="text-xs text-slate-600 bg-emerald-50/60 p-2 rounded-lg border border-emerald-200">
            <p className="font-medium text-emerald-950">&#10003; {why}</p>
          </div>
        </Card>

        {/* Usual Route (Affected) — the baseline the trade-off is measured against */}
        <Card variant="warning" className="opacity-95">
          <div className="flex items-center justify-between mb-2">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md text-xs font-bold uppercase tracking-wider bg-slate-700 text-white">
              Usual Route
            </div>
            {usualRoute.affectedReason && (
              <div className="inline-flex items-center gap-1 text-xs font-bold text-amber-900 bg-amber-200 px-2 py-0.5 rounded-md">
                <AlertTriangle className="w-3.5 h-3.5 text-amber-700" />
                Affected
              </div>
            )}
          </div>

          <div className="flex items-center justify-between text-xs text-slate-600 mb-3 bg-white/70 p-2 rounded-lg">
            <span>Leave: <strong className="text-slate-900">{usualRoute.departureTime}</strong></span>
            <span>Arrive: <strong className="text-slate-900">{usualRoute.arrivalTime}</strong></span>
          </div>

          <div className="grid grid-cols-3 gap-2 text-center text-xs mb-3">
            <div className="p-1.5 bg-white rounded-lg border border-slate-200">
              <span className="text-[10px] text-slate-500 block uppercase">Walk</span>
              <span className="font-bold text-slate-900">{usualRoute.metrics.walkingDistanceMeters} m</span>
            </div>
            <div className="p-1.5 bg-white rounded-lg border border-slate-200">
              <span className="text-[10px] text-slate-500 block uppercase">Transfer</span>
              <span className="font-bold text-slate-900">{usualRoute.metrics.transfersCount}</span>
            </div>
            <div className="p-1.5 bg-white rounded-lg border border-slate-200">
              <span className="text-[10px] text-slate-500 block uppercase">Duration</span>
              <span className="font-bold text-slate-900">{usualRoute.metrics.durationRange ?? `${usualRoute.metrics.durationMinutes} min`}</span>
            </div>
          </div>

          {usualRoute.affectedReason && (
            <div className="p-2.5 bg-red-50 border border-red-300 rounded-lg text-xs text-red-950 flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 text-red-600 flex-shrink-0 mt-0.5" />
              <p className="font-bold">{usualRoute.affectedReason}</p>
            </div>
          )}
        </Card>
      </div>

      {/* Prominent Action Button */}
      <div className="pt-2 sticky bottom-20 z-20">
        <Link href="/journey/guide" className="block w-full">
          <Button
            variant="primary"
            size="lg"
            fullWidth
            rightIcon={<ArrowRight className="w-5 h-5" />}
            aria-label="Use recommended route and start guided journey"
            className="shadow-sm py-3.5 text-base"
          >
            Use recommended route
          </Button>
        </Link>
      </div>
    </div>
  );
}
