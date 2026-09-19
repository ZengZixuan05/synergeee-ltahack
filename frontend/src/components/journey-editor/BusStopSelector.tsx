'use client';

import React, { useMemo, useState } from 'react';
import { Search } from 'lucide-react';
import { useBusStops } from '@/hooks/useBusStops';
import { BusStopReference } from '@/types/bus';

interface BusStopSelectorProps {
  id: string;
  label: string;
  value: BusStopReference | null;
  onChange: (stop: BusStopReference | null) => void;
  placeholder?: string;
}

function stopLabel(stop: BusStopReference): string {
  return stop.description || stop.roadName || stop.busStopCode;
}

export function BusStopSelector({ id, label, value, onChange, placeholder }: BusStopSelectorProps) {
  const [query, setQuery] = useState(value ? stopLabel(value) : '');
  const [isOpen, setIsOpen] = useState(false);
  const { stops, status } = useBusStops();

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return stops.slice(0, 8);
    return stops
      .filter(
        (stop) =>
          stop.busStopCode.includes(q) ||
          stop.description?.toLowerCase().includes(q) ||
          stop.roadName?.toLowerCase().includes(q)
      )
      .slice(0, 8);
  }, [stops, query]);

  return (
    <div className="relative">
      <label htmlFor={id} className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block mb-1">
        {label}
      </label>
      <div className="flex items-center gap-2 px-3 py-2.5 rounded-xl border border-slate-200 bg-slate-50 focus-within:border-[#004b87] focus-within:ring-1 focus-within:ring-[#004b87]">
        <Search className="w-4 h-4 text-slate-400 shrink-0" />
        <input
          id={id}
          type="text"
          role="combobox"
          aria-expanded={isOpen}
          aria-autocomplete="list"
          aria-controls={`${id}-listbox`}
          value={query}
          placeholder={placeholder ?? 'Search bus stop'}
          onChange={(e) => {
            setQuery(e.target.value);
            setIsOpen(true);
            if (!e.target.value) onChange(null);
          }}
          onFocus={() => setIsOpen(true)}
          onBlur={() => setIsOpen(false)}
          className="w-full bg-transparent text-sm font-semibold text-slate-900 outline-none placeholder:text-slate-400 placeholder:font-normal"
        />
      </div>

      {isOpen && status === 'loading' && (
        <p className="text-[11px] text-slate-400 mt-1 px-1">Loading live bus stops&hellip;</p>
      )}

      {isOpen && results.length > 0 && (
        <ul
          id={`${id}-listbox`}
          role="listbox"
          aria-label={`${label} results`}
          className="absolute z-10 mt-1 w-full max-h-56 overflow-y-auto bg-white border border-slate-200 rounded-xl shadow-modal py-1"
        >
          {results.map((stop) => (
            <li key={stop.busStopCode}>
              <button
                type="button"
                role="option"
                aria-selected={value?.busStopCode === stop.busStopCode}
                onMouseDown={(e) => {
                  e.preventDefault();
                  onChange(stop);
                  setQuery(stopLabel(stop));
                  setIsOpen(false);
                }}
                className="w-full text-left px-3 py-2 hover:bg-slate-50 flex items-center justify-between gap-2 min-h-[44px]"
              >
                <span className="text-sm font-semibold text-slate-900 truncate">{stopLabel(stop)}</span>
                <span className="text-[10px] font-bold text-slate-500 shrink-0">{stop.busStopCode}</span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
