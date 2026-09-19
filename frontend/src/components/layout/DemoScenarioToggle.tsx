'use client';

import React from 'react';
import { useDemoMode } from '@/features/demo/DemoContext';
import { cn } from '@/lib/utils';
import { ShieldAlert, ShieldCheck } from 'lucide-react';

export function DemoScenarioToggle() {
  const { isDisrupted, setIsDisrupted } = useDemoMode();

  return (
    <div
      role="region"
      aria-label="Development simulation control"
      className="bg-slate-200/90 p-1 rounded-xl flex items-center border border-slate-300"
    >
      <button
        type="button"
        role="radio"
        aria-checked={!isDisrupted}
        onClick={() => setIsDisrupted(false)}
        className={cn(
          'flex-1 flex items-center justify-center gap-1.5 py-1.5 px-3 rounded-lg text-xs font-bold transition-all min-h-[38px] select-none focus-visible:outline-2',
          !isDisrupted
            ? 'bg-white text-slate-900 shadow-sm border border-slate-300'
            : 'text-slate-600 hover:text-slate-900'
        )}
      >
        <ShieldCheck className={cn('w-3.5 h-3.5', !isDisrupted ? 'text-emerald-600' : 'text-slate-400')} />
        <span>Normal</span>
      </button>

      <button
        type="button"
        role="radio"
        aria-checked={isDisrupted}
        onClick={() => setIsDisrupted(true)}
        className={cn(
          'flex-1 flex items-center justify-center gap-1.5 py-1.5 px-3 rounded-lg text-xs font-bold transition-all min-h-[38px] select-none focus-visible:outline-2',
          isDisrupted
            ? 'bg-amber-100 text-amber-950 shadow-sm border border-amber-400'
            : 'text-slate-600 hover:text-slate-900'
        )}
      >
        <ShieldAlert className={cn('w-3.5 h-3.5', isDisrupted ? 'text-amber-700' : 'text-slate-400')} />
        <span>Demo disruption</span>
      </button>
    </div>
  );
}
