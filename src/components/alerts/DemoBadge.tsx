'use client';

import React from 'react';
import { AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface DemoBadgeProps {
  label?: string;
  className?: string;
  size?: 'sm' | 'md';
}

export function DemoBadge({
  label = 'DEMO SCENARIO',
  className,
  size = 'md',
}: DemoBadgeProps) {
  return (
    <span
      role="note"
      aria-label="Simulation note: This is sample demonstration data"
      className={cn(
        'inline-flex items-center gap-1 font-bold uppercase tracking-wider rounded-md bg-amber-100 text-amber-950 border border-amber-400 select-none',
        size === 'sm' ? 'text-[10px] px-1.5 py-0.5' : 'text-xs px-2 py-0.5',
        className
      )}
    >
      <AlertCircle className={cn(size === 'sm' ? 'w-3 h-3' : 'w-3.5 h-3.5', 'text-amber-700 flex-shrink-0')} aria-hidden="true" />
      <span>{label}</span>
    </span>
  );
}
