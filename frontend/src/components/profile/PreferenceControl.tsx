'use client';

import React from 'react';
import { cn } from '@/lib/utils';

interface PreferenceControlProps {
  id: string;
  label: string;
  description?: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
  icon?: React.ReactNode;
  disabled?: boolean;
}

export function PreferenceControl({
  id,
  label,
  description,
  checked,
  onChange,
  icon,
  disabled = false,
}: PreferenceControlProps) {
  return (
    <div className="flex items-center justify-between gap-3 py-3 border-b border-slate-100 last:border-b-0">
      <div className="flex items-start gap-3 min-w-0">
        {icon && (
          <div className="p-2 rounded-xl bg-slate-100 text-slate-700 flex-shrink-0 mt-0.5" aria-hidden="true">
            {icon}
          </div>
        )}
        <div className="min-w-0">
          <label
            htmlFor={id}
            className="text-sm font-bold text-slate-900 block cursor-pointer"
          >
            {label}
          </label>
          {description && (
            <p className="text-xs text-slate-500 mt-0.5 leading-normal">
              {description}
            </p>
          )}
        </div>
      </div>

      {/* Accessible Toggle Button */}
      <button
        type="button"
        id={id}
        role="switch"
        aria-checked={checked}
        disabled={disabled}
        onClick={() => onChange(!checked)}
        className={cn(
          'relative inline-flex h-7 w-12 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus-visible:outline-2',
          checked ? 'bg-[#004b87]' : 'bg-slate-300',
          disabled && 'opacity-50 cursor-not-allowed'
        )}
      >
        <span className="sr-only">Toggle {label}</span>
        <span
          aria-hidden="true"
          className={cn(
            'pointer-events-none inline-block h-6 w-6 transform rounded-full bg-white shadow-sm ring-0 transition duration-200 ease-in-out',
            checked ? 'translate-x-5' : 'translate-x-0'
          )}
        />
      </button>
    </div>
  );
}
