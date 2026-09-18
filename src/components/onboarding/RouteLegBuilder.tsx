'use client';

import React, { useState } from 'react';
import { Footprints, Train, Bus, ArrowUpDown, Plus, X } from 'lucide-react';
import { RegularRouteLeg, RegularRouteLegMode } from '@/types';

interface RouteLegBuilderProps {
  legs: RegularRouteLeg[];
  onChange: (legs: RegularRouteLeg[]) => void;
}

const MODE_OPTIONS: { value: RegularRouteLegMode; label: string; icon: React.ReactNode }[] = [
  { value: 'walk', label: 'Walk', icon: <Footprints className="w-4 h-4 text-[#00847f]" /> },
  { value: 'rail', label: 'Rail', icon: <Train className="w-4 h-4 text-[#009640]" /> },
  { value: 'bus', label: 'Bus', icon: <Bus className="w-4 h-4 text-amber-600" /> },
  { value: 'transfer', label: 'Transfer', icon: <ArrowUpDown className="w-4 h-4 text-[#004b87]" /> },
];

function modeIcon(mode: RegularRouteLegMode) {
  return MODE_OPTIONS.find((m) => m.value === mode)?.icon;
}

export function RouteLegBuilder({ legs, onChange }: RouteLegBuilderProps) {
  const [draftMode, setDraftMode] = useState<RegularRouteLegMode>('walk');
  const [draftDescription, setDraftDescription] = useState('');

  const removeLeg = (id: string) => {
    onChange(legs.filter((leg) => leg.id !== id));
  };

  const addLeg = () => {
    if (!draftDescription.trim()) return;
    const newLeg: RegularRouteLeg = {
      id: crypto.randomUUID(),
      mode: draftMode,
      description: draftDescription.trim(),
    };
    onChange([...legs, newLeg]);
    setDraftDescription('');
  };

  return (
    <div className="space-y-2.5">
      {legs.length > 0 && (
        <div className="space-y-1.5">
          {legs.map((leg, index) => (
            <div
              key={leg.id}
              className="flex items-center gap-2.5 p-2.5 rounded-xl border border-slate-200 bg-white"
            >
              <span className="text-[10px] font-bold text-slate-400 w-4 shrink-0">{index + 1}</span>
              <div className="p-1.5 rounded-lg bg-slate-50 border border-slate-100 shrink-0">
                {modeIcon(leg.mode)}
              </div>
              <p className="flex-1 text-xs font-semibold text-slate-800 min-w-0 truncate">
                {leg.description}
              </p>
              <button
                type="button"
                onClick={() => removeLeg(leg.id)}
                aria-label="Remove step"
                className="p-1 text-slate-400 hover:text-red-600 shrink-0"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}
        </div>
      )}

      <div className="flex items-center gap-2">
        <div className="grid grid-cols-4 gap-1 p-1 bg-slate-100 rounded-xl shrink-0">
          {MODE_OPTIONS.map((option) => (
            <button
              key={option.value}
              type="button"
              aria-pressed={draftMode === option.value}
              onClick={() => setDraftMode(option.value)}
              className={`p-2 rounded-lg flex items-center justify-center min-h-[36px] min-w-[36px] transition-all ${
                draftMode === option.value ? 'bg-white shadow-xs' : 'hover:bg-white/60'
              }`}
              title={option.label}
            >
              {option.icon}
            </button>
          ))}
        </div>
        <input
          type="text"
          value={draftDescription}
          onChange={(e) => setDraftDescription(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault();
              addLeg();
            }
          }}
          placeholder="e.g. Take East West Line to Outram Park"
          className="flex-1 min-w-0 px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 text-xs font-medium text-slate-900 outline-none focus:border-[#004b87] focus:ring-1 focus:ring-[#004b87] placeholder:text-slate-400"
        />
        <button
          type="button"
          onClick={addLeg}
          disabled={!draftDescription.trim()}
          aria-label="Add step"
          className="p-2 rounded-xl bg-[#004b87] text-white shrink-0 disabled:opacity-40 disabled:cursor-not-allowed"
        >
          <Plus className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
