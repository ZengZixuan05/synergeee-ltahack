'use client';

import React from 'react';
import {
  Accessibility,
  ArrowUpDown,
  Umbrella,
  Footprints,
  AlertTriangle,
  CheckCircle2,
} from 'lucide-react';
import { cn } from '@/lib/utils';

export type AccessibilityType =
  | 'step-free'
  | 'working-lifts'
  | 'mostly-sheltered'
  | 'low-walking'
  | 'few-transfers'
  | 'lift-unavailable'
  | 'stairs-required';

interface AccessibilityBadgeProps {
  type: AccessibilityType;
  label?: string;
  size?: 'sm' | 'md';
  className?: string;
}

export function AccessibilityBadge({
  type,
  label,
  size = 'md',
  className,
}: AccessibilityBadgeProps) {
  const configs: Record<
    AccessibilityType,
    {
      defaultLabel: string;
      icon: React.ElementType;
      styles: string;
      status: 'positive' | 'warning' | 'neutral';
    }
  > = {
    'step-free': {
      defaultLabel: 'Step-free',
      icon: Accessibility,
      styles: 'bg-emerald-50 text-emerald-800 border-emerald-300',
      status: 'positive',
    },
    'working-lifts': {
      defaultLabel: 'Working lifts',
      icon: ArrowUpDown,
      styles: 'bg-teal-50 text-[#00847f] border-teal-300',
      status: 'positive',
    },
    'mostly-sheltered': {
      defaultLabel: 'Mostly sheltered',
      icon: Umbrella,
      styles: 'bg-blue-50 text-blue-800 border-blue-200',
      status: 'positive',
    },
    'low-walking': {
      defaultLabel: 'Low walking',
      icon: Footprints,
      styles: 'bg-slate-100 text-slate-800 border-slate-300',
      status: 'neutral',
    },
    'few-transfers': {
      defaultLabel: '1 transfer',
      icon: CheckCircle2,
      styles: 'bg-slate-100 text-slate-800 border-slate-300',
      status: 'neutral',
    },
    'lift-unavailable': {
      defaultLabel: 'Lift unavailable',
      icon: AlertTriangle,
      styles: 'bg-red-50 text-red-800 border-red-300 font-bold',
      status: 'warning',
    },
    'stairs-required': {
      defaultLabel: 'Stairs required',
      icon: AlertTriangle,
      styles: 'bg-red-50 text-red-800 border-red-300 font-bold',
      status: 'warning',
    },
  };

  const config = configs[type];
  const Icon = config.icon;
  const displayLabel = label || config.defaultLabel;

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-lg border font-medium select-none',
        config.styles,
        size === 'sm' ? 'text-xs px-2 py-0.5' : 'text-xs md:text-sm px-2.5 py-1',
        className
      )}
    >
      <Icon className={cn('flex-shrink-0', size === 'sm' ? 'w-3.5 h-3.5' : 'w-4 h-4')} aria-hidden="true" />
      <span>{displayLabel}</span>
    </span>
  );
}
