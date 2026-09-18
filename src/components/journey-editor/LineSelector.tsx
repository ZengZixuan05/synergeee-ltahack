'use client';

import React from 'react';
import { Check } from 'lucide-react';
import { MRT_LINES, MrtLineCode } from '@/fixtures/stations';

interface LineSelectorProps {
  label: string;
  value: MrtLineCode | null;
  onChange: (line: MrtLineCode) => void;
  options?: MrtLineCode[]; // restrict to lines available at the chosen station(s)
  suggested?: MrtLineCode[]; // "smart" suggestion from shared board/alight lines
}

export function LineSelector({ label, value, onChange, options, suggested }: LineSelectorProps) {
  const lines = options ? MRT_LINES.filter((l) => options.includes(l.code)) : MRT_LINES;

  return (
    <div>
      <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block mb-1">{label}</label>
      <div className="space-y-1.5" role="radiogroup" aria-label={label}>
        {lines.map((line) => {
          const checked = value === line.code;
          const isSuggested = suggested?.includes(line.code);
          return (
            <button
              key={line.code}
              type="button"
              role="radio"
              aria-checked={checked}
              onClick={() => onChange(line.code)}
              className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl border text-left transition-all min-h-[44px] ${
                checked ? 'border-[#004b87] bg-[#f0f5fa]' : 'border-slate-200 bg-white hover:border-slate-300'
              }`}
            >
              <span className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: line.color }} />
              <span className="flex-1 min-w-0">
                <span className="text-xs font-bold text-slate-500">{line.code}</span>
                <span className="block text-sm font-semibold text-slate-900 truncate">{line.name}</span>
              </span>
              {isSuggested && !checked && (
                <span className="text-[10px] font-bold text-[#00847f] shrink-0">Suggested</span>
              )}
              {checked && <Check className="w-4 h-4 text-[#004b87] shrink-0" />}
            </button>
          );
        })}
        {lines.length === 0 && (
          <p className="text-xs text-slate-400 px-1">Pick a boarding station first.</p>
        )}
      </div>
    </div>
  );
}
