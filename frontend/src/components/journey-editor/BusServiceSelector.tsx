'use client';

import React, { useMemo, useState } from 'react';
import { Search } from 'lucide-react';
import { BusService, searchBusServices } from '@/fixtures/bus-services';

interface BusServiceSelectorProps {
  id: string;
  label: string;
  value: string;
  onChange: (serviceNumber: string) => void;
}

export function BusServiceSelector({ id, label, value, onChange }: BusServiceSelectorProps) {
  const [query, setQuery] = useState(value);
  const [isOpen, setIsOpen] = useState(false);

  const results = useMemo<BusService[]>(() => searchBusServices(query, 8), [query]);

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
          placeholder="e.g. 14"
          onChange={(e) => {
            setQuery(e.target.value);
            onChange(e.target.value);
            setIsOpen(true);
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
          {results.map((service) => (
            <li key={service.number}>
              <button
                type="button"
                role="option"
                aria-selected={value === service.number}
                onMouseDown={(e) => {
                  e.preventDefault();
                  onChange(service.number);
                  setQuery(service.number);
                  setIsOpen(false);
                }}
                className="w-full text-left px-3 py-2 hover:bg-slate-50 flex items-center gap-2.5 min-h-[44px]"
              >
                <span className="text-xs font-black text-white bg-[#004b87] rounded px-1.5 py-0.5 shrink-0">
                  Bus {service.number}
                </span>
                <span className="text-xs text-slate-500 truncate">{service.description}</span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
