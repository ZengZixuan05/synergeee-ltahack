'use client';

import React from 'react';
import { CheckCircle2, AlertTriangle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface JourneyStatusProps {
  isAffected: boolean;
  text?: string;
  className?: string;
}

export function JourneyStatus({
  isAffected,
  text,
  className,
}: JourneyStatusProps) {
  if (isAffected) {
    return (
      <div
        className={cn(
          'inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-900 border border-amber-300',
          className
        )}
      >
        <AlertTriangle className="w-4 h-4 text-amber-700 flex-shrink-0" aria-hidden="true" />
        <span>{text || 'Your journey tomorrow has changed'}</span>
      </div>
    );
  }

  return (
    <div
      className={cn(
        'inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-900 border border-emerald-300',
        className
      )}
    >
      <CheckCircle2 className="w-4 h-4 text-emerald-700 flex-shrink-0" aria-hidden="true" />
      <span>{text || 'Your journey is ready'}</span>
    </div>
  );
}
