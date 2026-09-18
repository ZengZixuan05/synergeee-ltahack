'use client';

import React from 'react';
import Link from 'next/link';
import {
  ArrowRight,
  Clock,
  Footprints,
  AlertTriangle,
  CheckCircle2,
  Accessibility,
  ArrowUpDown,
  Umbrella,
  ShieldCheck,
} from 'lucide-react';
import { RouteOption } from '@/types';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { DemoBadge } from '@/components/alerts/DemoBadge';
import { AccessibilityBadge } from '@/components/accessibility/AccessibilityBadge';

interface RouteComparisonProps {
  usualRoute: RouteOption;
  recommendedRoute: RouteOption;
  onSelectRecommended?: () => void;
  className?: string;
}

export function RouteComparison({
  usualRoute,
  recommendedRoute,
  onSelectRecommended,
  className,
}: RouteComparisonProps) {
  return (
    <div className={`space-y-4 ${className || ''}`}>
      {/* What Changed Summary Card */}
      <div className="bg-white border-2 border-slate-300 rounded-2xl p-4 shadow-xs">
        <div className="flex items-center justify-between gap-2 mb-2">
          <span className="text-xs font-bold uppercase tracking-wider text-[#004b87]">
            Key Trade-off
          </span>
          <DemoBadge size="sm" />
        </div>

        <h2 className="text-lg font-bold text-slate-900 leading-snug mb-2">
          What changed & what it costs you
        </h2>

        <div className="grid grid-cols-2 gap-2 text-center my-3">
          <div className="bg-[#f4f6f9] p-2.5 rounded-xl border border-slate-200 shadow-xs">
            <span className="text-xs text-slate-700 font-semibold block">Additional time</span>
            <span className="text-xl font-black text-amber-700">+7 min</span>
            <span className="text-[11px] text-slate-500 block mt-0.5">Leave at 8:38 AM</span>
          </div>

          <div className="bg-[#f4f6f9] p-2.5 rounded-xl border border-slate-200 shadow-xs">
            <span className="text-xs text-slate-700 font-semibold block">Additional walking</span>
            <span className="text-xl font-black text-amber-700">+80 m</span>
            <span className="text-[11px] text-slate-500 block mt-0.5">Via Exit B linkway</span>
          </div>
        </div>

        <div className="p-3 bg-emerald-50 border border-emerald-300 rounded-xl flex items-start gap-2.5 text-emerald-950">
          <ShieldCheck className="w-5 h-5 text-emerald-700 flex-shrink-0 mt-0.5" aria-hidden="true" />
          <div>
            <p className="text-sm font-bold">Your journey remains 100% step-free</p>
            <p className="text-xs text-emerald-900 mt-0.5">
              Verified working lifts at Bedok Concourse (Lift B) and Outram Park (Lift L2). No stairs required.
            </p>
          </div>
        </div>
      </div>

      {/* Side-by-side or Stacked Comparison Cards */}
      <div className="space-y-3">
        {/* Recommended Route (Option 1) */}
        <Card variant="default" className="border-2 border-[#004b87] bg-white relative shadow-xs">
          <div className="flex items-center justify-between mb-2">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md text-xs font-bold uppercase tracking-wider bg-[#004b87] text-white">
              <CheckCircle2 className="w-3.5 h-3.5" aria-hidden="true" />
              Recommended Route
            </div>
            <span className="text-base font-extrabold text-slate-900">
              61–68 min
            </span>
          </div>

          <div className="flex items-center justify-between text-xs text-slate-600 mb-3 bg-slate-50 p-2 rounded-lg">
            <span>Leave: <strong className="text-slate-900">8:38 AM</strong></span>
            <span>Arrive: <strong className="text-slate-900">9:44–9:53 AM</strong></span>
          </div>

          <div className="grid grid-cols-3 gap-2 text-center text-xs mb-3">
            <div className="p-1.5 bg-slate-50 rounded-lg border border-slate-200">
              <span className="text-[10px] text-slate-500 block uppercase">Walk</span>
              <span className="font-bold text-slate-900">420 m</span>
            </div>
            <div className="p-1.5 bg-slate-50 rounded-lg border border-slate-200">
              <span className="text-[10px] text-slate-500 block uppercase">Transfer</span>
              <span className="font-bold text-slate-900">1</span>
            </div>
            <div className="p-1.5 bg-slate-50 rounded-lg border border-slate-200">
              <span className="text-[10px] text-slate-500 block uppercase">Lifts</span>
              <span className="font-bold text-emerald-700">Verified</span>
            </div>
          </div>

          <div className="flex flex-wrap gap-1.5 mb-3">
            <AccessibilityBadge type="step-free" size="sm" />
            <AccessibilityBadge type="working-lifts" size="sm" />
            <AccessibilityBadge type="mostly-sheltered" size="sm" />
          </div>

          <div className="text-xs text-slate-600 bg-emerald-50/60 p-2 rounded-lg border border-emerald-200">
            <p className="font-medium text-emerald-950">
              ✓ Uses Outram Park Exit B with certified operational lift
            </p>
          </div>
        </Card>

        {/* Usual Route (Affected) */}
        <Card variant="warning" className="border-2 border-amber-300 bg-amber-50/60 opacity-95">
          <div className="flex items-center justify-between mb-2">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md text-xs font-bold uppercase tracking-wider bg-slate-700 text-white">
              Usual Route
            </div>
            <div className="inline-flex items-center gap-1 text-xs font-bold text-amber-900 bg-amber-200 px-2 py-0.5 rounded-md">
              <AlertTriangle className="w-3.5 h-3.5 text-amber-700" />
              Affected
            </div>
          </div>

          <div className="flex items-center justify-between text-xs text-slate-600 mb-3 bg-white/70 p-2 rounded-lg">
            <span>Leave: <strong className="text-slate-900">8:45 AM</strong></span>
            <span>Arrive: <strong className="text-slate-900">9:45–9:53 AM</strong></span>
          </div>

          <div className="grid grid-cols-3 gap-2 text-center text-xs mb-3">
            <div className="p-1.5 bg-white rounded-lg border border-slate-200">
              <span className="text-[10px] text-slate-500 block uppercase">Walk</span>
              <span className="font-bold text-slate-900">340 m</span>
            </div>
            <div className="p-1.5 bg-white rounded-lg border border-slate-200">
              <span className="text-[10px] text-slate-500 block uppercase">Transfer</span>
              <span className="font-bold text-slate-900">1</span>
            </div>
            <div className="p-1.5 bg-white rounded-lg border border-slate-200">
              <span className="text-[10px] text-slate-500 block uppercase">Duration</span>
              <span className="font-bold text-slate-900">54–61 min</span>
            </div>
          </div>

          <div className="p-2.5 bg-red-50 border border-red-300 rounded-lg text-xs text-red-950 flex items-start gap-2">
            <AlertTriangle className="w-4 h-4 text-red-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-bold">Lift unavailable at Exit A</p>
              <p className="text-[11px] text-red-900 mt-0.5">
                Stairs required (2 flights). Violates your step-free preference.
              </p>
            </div>
          </div>
        </Card>
      </div>

      {/* Sticky or Prominent Action Button */}
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
            Use this route
          </Button>
        </Link>
      </div>
    </div>
  );
}
