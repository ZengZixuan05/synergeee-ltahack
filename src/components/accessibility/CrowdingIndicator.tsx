'use client';

import React from 'react';
import { Users } from 'lucide-react';
import { CrowdingLevel } from '@/types';
import { CROWDING_DESCRIPTIONS } from '@/lib/accessibility';
import { cn } from '@/lib/utils';

interface CrowdingIndicatorProps {
  level: CrowdingLevel;
  showDetails?: boolean;
  size?: 'sm' | 'md';
  className?: string;
}

export function CrowdingIndicator({
  level,
  showDetails = false,
  size = 'md',
  className,
}: CrowdingIndicatorProps) {
  const config = CROWDING_DESCRIPTIONS[level];

  return (
    <div
      role="status"
      aria-label={config.ariaLabel}
      className={cn(
        'inline-flex items-center gap-2 px-2.5 py-1 rounded-lg border font-medium select-none',
        config.colorClass,
        size === 'sm' ? 'text-xs py-0.5 px-2' : 'text-sm',
        className
      )}
    >
      <Users className={cn('flex-shrink-0', size === 'sm' ? 'w-3.5 h-3.5' : 'w-4 h-4')} aria-hidden="true" />
      
      <span className="font-semibold">{config.label}</span>

      {/* Visual 3-bar indicator to avoid relying solely on color */}
      <div className="flex items-center gap-0.5 ml-0.5" aria-hidden="true">
        {[1, 2, 3].map((bar) => {
          const isFilled = bar <= config.barCount;
          return (
            <span
              key={bar}
              className={cn(
                'w-1 rounded-full transition-all',
                size === 'sm' ? 'h-2.5' : 'h-3',
                isFilled
                  ? level === 'low'
                    ? 'bg-emerald-600'
                    : level === 'moderate'
                    ? 'bg-amber-600'
                    : 'bg-red-600'
                  : 'bg-slate-300'
              )}
            />
          );
        })}
      </div>

      {showDetails && (
        <span className="sr-only">({config.ariaLabel})</span>
      )}
    </div>
  );
}
