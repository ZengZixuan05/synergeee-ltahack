'use client';

import React from 'react';
import { Type } from 'lucide-react';
import { TextSize } from '@/types';
import { TEXT_SIZE_OPTIONS } from '@/lib/constants';
import { TEXT_SIZE_DESCRIPTIONS } from '@/lib/accessibility';
import { cn } from '@/lib/utils';

interface TextSizeControlProps {
  currentSize: TextSize;
  onChange: (size: TextSize) => void;
  className?: string;
}

export function TextSizeControl({
  currentSize,
  onChange,
  className,
}: TextSizeControlProps) {
  return (
    <div className={cn('space-y-2 py-2', className)}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-sm font-bold text-slate-900">
          <Type className="w-4 h-4 text-slate-600" aria-hidden="true" />
          <span>Text Size</span>
        </div>
        <span className="text-xs font-semibold text-[#d42426] uppercase">
          Active: {currentSize}
        </span>
      </div>

      <p className="text-xs text-slate-500">
        {TEXT_SIZE_DESCRIPTIONS[currentSize]}
      </p>

      {/* Accessible 3-way Segmented Button */}
      <div
        role="radiogroup"
        aria-label="Text size options"
        className="grid grid-cols-3 gap-1.5 p-1 bg-slate-100 rounded-xl border border-slate-200"
      >
        {TEXT_SIZE_OPTIONS.map((option) => {
          const isSelected = currentSize === option.id;
          return (
            <button
              key={option.id}
              type="button"
              role="radio"
              aria-checked={isSelected}
              onClick={() => onChange(option.id as TextSize)}
              className={cn(
                'py-2 px-1 text-center rounded-lg transition-all text-xs font-bold min-h-[44px] flex flex-col items-center justify-center focus-visible:outline-2',
                isSelected
                  ? 'bg-white text-[#d42426] shadow-sm border border-slate-200/80 font-black'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
              )}
            >
              <span
                className={cn(
                  'block leading-none mb-1 font-serif',
                  option.id === 'standard' && 'text-sm',
                  option.id === 'large' && 'text-base font-bold',
                  option.id === 'xlarge' && 'text-lg font-black'
                )}
              >
                A
              </span>
              <span className="truncate">{option.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
