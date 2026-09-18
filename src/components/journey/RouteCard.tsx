'use client';

import React from 'react';
import Link from 'next/link';
import { ArrowRight, Clock, Footprints, AlertTriangle, CheckCircle2, ChevronRight } from 'lucide-react';
import { RouteOption } from '@/types';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { CrowdingIndicator } from '@/components/accessibility/CrowdingIndicator';
import { AccessibilityBadge } from '@/components/accessibility/AccessibilityBadge';
import { cn } from '@/lib/utils';

interface RouteCardProps {
  route: RouteOption;
  isSelected?: boolean;
  onSelect?: () => void;
  showComparisonLink?: boolean;
  className?: string;
}

export function RouteCard({
  route,
  isSelected = false,
  onSelect,
  showComparisonLink = true,
  className,
}: RouteCardProps) {
  const isRecommended = route.badgeType === 'recommended';
  const isAffected = route.badgeType === 'affected';

  return (
    <Card
      variant={isAffected ? 'warning' : isRecommended ? 'highlight' : 'default'}
      className={cn(
        'relative transition-all',
        isRecommended && 'border-2 border-[#d42426]/60 shadow-sm',
        isAffected && 'border-2 border-amber-400 bg-amber-50/50',
        isSelected && 'ring-2 ring-[#d42426]',
        className
      )}
    >
      {/* Top Header Badge */}
      <div className="flex items-center justify-between gap-2 mb-2">
        <div className="flex items-center gap-2">
          {isRecommended && (
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md text-xs font-bold uppercase tracking-wider bg-[#d42426] text-white">
              <CheckCircle2 className="w-3.5 h-3.5" aria-hidden="true" />
              Recommended
            </span>
          )}

          {route.badgeType === 'usual' && (
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md text-xs font-bold uppercase tracking-wider bg-slate-800 text-white">
              Usual route
            </span>
          )}

          {isAffected && (
            <div className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md text-xs font-bold uppercase tracking-wider bg-amber-200 text-amber-950 border border-amber-400">
              <AlertTriangle className="w-3.5 h-3.5 text-amber-700" aria-hidden="true" />
              Affected
            </div>
          )}
        </div>

        <div className="text-right">
          <span className="text-base font-extrabold text-slate-900">
            {route.metrics.durationRange || `${route.metrics.durationMinutes} min`}
          </span>
        </div>
      </div>

      {/* Disruption Alert inside Card (when affected) */}
      {isAffected && route.affectedReason && (
        <div className="mb-3 p-2.5 rounded-xl bg-amber-100/90 border border-amber-300 text-xs text-amber-950 flex items-start gap-2">
          <AlertTriangle className="w-4 h-4 text-amber-700 flex-shrink-0 mt-0.5" aria-hidden="true" />
          <div>
            <p className="font-bold">{route.affectedReason}</p>
            <p className="text-[11px] text-amber-900 mt-0.5">
              Exit A lift out of service. Use recommended alternative for step-free travel.
            </p>
          </div>
        </div>
      )}

      {/* Schedule times */}
      <div className="flex items-center justify-between text-xs font-semibold text-slate-700 mb-3 bg-slate-50 p-2 rounded-lg border border-slate-200">
        <div>
          <span className="text-slate-500 font-normal">Leave: </span>
          <span className="text-slate-900 font-bold">{route.departureTime}</span>
        </div>
        <div>
          <span className="text-slate-500 font-normal">Arrive: </span>
          <span className="text-slate-900 font-bold">{route.arrivalTime}</span>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-3 gap-1.5 text-center text-xs mb-3">
        <div className="bg-white p-1.5 rounded-lg border border-slate-200">
          <span className="text-[10px] text-slate-500 block uppercase">Walking</span>
          <span className="font-bold text-slate-800">{route.metrics.walkingDistanceMeters} m</span>
        </div>
        <div className="bg-white p-1.5 rounded-lg border border-slate-200">
          <span className="text-[10px] text-slate-500 block uppercase">Transfers</span>
          <span className="font-bold text-slate-800">{route.metrics.transfersCount}</span>
        </div>
        <div className="bg-white p-1.5 rounded-lg border border-slate-200 flex flex-col justify-center">
          <span className="text-[10px] text-slate-500 block uppercase">Shelter</span>
          <span className="font-bold text-slate-800">Mostly</span>
        </div>
      </div>

      {/* Accessibility & Crowding Badges */}
      <div className="flex flex-wrap gap-1.5 items-center mb-3">
        {route.metrics.isStepFree ? (
          <AccessibilityBadge type="step-free" size="sm" />
        ) : (
          <AccessibilityBadge type="stairs-required" size="sm" />
        )}

        {route.metrics.hasWorkingLifts ? (
          <AccessibilityBadge type="working-lifts" size="sm" />
        ) : (
          <AccessibilityBadge type="lift-unavailable" size="sm" />
        )}

        <CrowdingIndicator level={route.metrics.crowding} size="sm" />
      </div>

      {/* Action CTA */}
      <div className="pt-1 flex gap-2">
        {isRecommended ? (
          <Link href="/journey/compare" className="w-full">
            <Button
              variant="primary"
              size="sm"
              fullWidth
              rightIcon={<ArrowRight className="w-4 h-4" />}
            >
              Compare & start route
            </Button>
          </Link>
        ) : isAffected ? (
          <Link href="/journey/compare" className="w-full">
            <Button
              variant="outline"
              size="sm"
              fullWidth
              rightIcon={<ChevronRight className="w-4 h-4" />}
            >
              See why this is affected
            </Button>
          </Link>
        ) : (
          <Link href="/journey/guide" className="w-full">
            <Button
              variant="outline"
              size="sm"
              fullWidth
              rightIcon={<ArrowRight className="w-4 h-4" />}
            >
              View route steps
            </Button>
          </Link>
        )}
      </div>
    </Card>
  );
}
