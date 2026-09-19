'use client';

import React, { useMemo, useState } from 'react';
import { Search } from 'lucide-react';
import { MrtStation, MrtLineCode, searchStations, findLine } from '@/fixtures/stations';

interface StationSelectorProps {
  id: string;
  label: string;
  value: MrtStation | null;
  onChange: (station: MrtStation | null) => void;
  filterLine?: MrtLineCode;
  placeholder?: string;
}

export function StationSelector({ id, label, value, onChange, filterLine, placeholder }: StationSelectorProps) {
  const [query, setQuery] = useState(value?.name ?? '');
  const [isOpen, setIsOpen] = useState(false);

  const results = useMemo(() => {
    const matches = searchStations(query, 8);
    return filterLine ? matches.filter((s) => s.codes.some((c) => c.line === filterLine)) : matches;
  }, [query, filterLine]);

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
          placeholder={placeholder ?? 'Search station'}
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

      {isOpen && results.length > 0 && (
        <ul
          id={`${id}-listbox`}
          role="listbox"
          aria-label={`${label} results`}
          className="absolute z-10 mt-1 w-full max-h-56 overflow-y-auto bg-white border border-slate-200 rounded-xl shadow-modal py-1"
        >
          {results.map((station) => (
            <li key={station.id}>
              <button
                type="button"
                role="option"
                aria-selected={value?.id === station.id}
                onMouseDown={(e) => {
                  e.preventDefault();
                  onChange(station);
                  setQuery(station.name);
                  setIsOpen(false);
                }}
                className="w-full text-left px-3 py-2 hover:bg-slate-50 flex items-center justify-between gap-2 min-h-[44px]"
              >
                <span className="text-sm font-semibold text-slate-900">{station.name}</span>
                <span className="flex items-center gap-1 shrink-0">
                  {station.codes.map((c) => {
                    const line = findLine(c.line);
                    return (
                      <span
                        key={c.code}
                        className="text-[10px] font-bold px-1.5 py-0.5 rounded"
                        style={{ backgroundColor: `${line?.color}1a`, color: line?.color }}
                      >
                        {c.code}
                      </span>
                    );
                  })}
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
