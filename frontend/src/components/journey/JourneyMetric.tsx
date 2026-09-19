'use client';

import React from 'react';
import { Clock, Footprints, ShieldCheck, ArrowRight } from 'lucide-react';
import { cn } from '@/lib/utils';

interface JourneyMetricProps {
  label: string;
  value: string;
  type?: 'neutral' | 'delta-positive' | 'delta-warning' | 'verified';
  className?: string;
}

export function JourneyMetric({
  label,
  value,
  type = 'neutral',
  className,
}: JourneyMetricProps) {
  const getStyles = () => {
    switch (type) {
      case 'delta-warning':
        return 'bg-amber-50 text-amber-950 border-amber-300 font-bold';
      case 'delta-positive':
        return 'bg-emerald-50 text-emerald-950 border-emerald-300 font-bold';
      case 'verified':
        return 'bg-blue-50 text-blue-950 border-blue-300 font-bold';
      case 'neutral':
      default:
        return 'bg-slate-100 text-slate-800 border-slate-200';
    }
  };

  return (
    <div
      className={cn(
        'inline-flex flex-col px-3 py-1.5 rounded-xl border text-center select-none',
        getStyles(),
        className
      )}
    >
      <span className="text-[11px] uppercase tracking-wider text-slate-600 font-medium">
        {label}
      </span>
      <span className="text-sm font-bold text-slate-900 mt-0.5">
        {value}
      </span>
    </div>
  );
}
