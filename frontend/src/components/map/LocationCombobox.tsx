'use client';

import React, { useEffect, useId, useRef, useState } from 'react';
import { Loader2, LocateFixed, MapPin, SearchX, TriangleAlert, X } from 'lucide-react';
import { Place } from '@/types/place';
import { usePlaceSearch } from '@/hooks/usePlaceSearch';
import { cn } from '@/lib/utils';

interface LocationComboboxProps {
  id: string;
  label: string;
  placeholder?: string;
  dotColorClassName?: string;
  /** Free-text shown in the field — may not correspond to a verified Place (e.g. a legacy saved-route name). */
  inputValue: string;
  /** The verified, geocoded selection backing `inputValue`, or null if it's unverified/free text. */
  selectedPlace: Place | null;
  onInputValueChange: (value: string) => void;
  onSelect: (place: Place) => void;
  onClear: () => void;
  showUseCurrentLocation?: boolean;
  onUseCurrentLocation?: () => void;
  locatingCurrentLocation?: boolean;
}

export function LocationCombobox({
  id,
  label,
  placeholder,
  dotColorClassName = 'bg-slate-400',
  inputValue,
  selectedPlace,
  onInputValueChange,
  onSelect,
  onClear,
  showUseCurrentLocation = false,
  onUseCurrentLocation,
  locatingCurrentLocation = false,
}: LocationComboboxProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [rawActiveIndex, setActiveIndex] = useState(-1);
  const containerRef = useRef<HTMLDivElement>(null);
  const listboxId = useId();

  const { results, status, errorMessage } = usePlaceSearch(isOpen ? inputValue : '');

  // Clamp rather than reset-via-effect: keeps the highlighted option in
  // bounds as the result set changes, without a dedicated effect.
  const activeIndex = Math.min(rawActiveIndex, results.length - 1);

  // Close on outside click.
  useEffect(() => {
    if (!isOpen) return;
    const handlePointerDown = (event: PointerEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('pointerdown', handlePointerDown);
    return () => document.removeEventListener('pointerdown', handlePointerDown);
  }, [isOpen]);

  const handleSelect = (place: Place) => {
    onSelect(place);
    setIsOpen(false);
    setActiveIndex(-1);
  };

  const handleKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (!isOpen && (event.key === 'ArrowDown' || event.key === 'ArrowUp')) {
      setIsOpen(true);
      return;
    }
    if (!isOpen) return;

    if (event.key === 'ArrowDown') {
      event.preventDefault();
      setActiveIndex((prev) => Math.min(prev + 1, results.length - 1));
    } else if (event.key === 'ArrowUp') {
      event.preventDefault();
      setActiveIndex((prev) => Math.max(prev - 1, 0));
    } else if (event.key === 'Enter') {
      if (activeIndex >= 0 && results[activeIndex]) {
        event.preventDefault();
        handleSelect(results[activeIndex]);
      }
    } else if (event.key === 'Escape') {
      setIsOpen(false);
    }
  };

  const showPanel = isOpen && inputValue.trim().length >= 2;
  const activeOptionId = activeIndex >= 0 ? `${listboxId}-option-${activeIndex}` : undefined;

  return (
    <div ref={containerRef} className="relative">
      <div
        className={cn(
          'flex items-center gap-2.5 p-2.5 rounded-xl border border-slate-200 bg-slate-50',
          'focus-within:border-[#004b87] focus-within:ring-1 focus-within:ring-[#004b87]'
        )}
      >
        <div className={cn('w-2.5 h-2.5 rounded-full flex-shrink-0', dotColorClassName)} />
        <div className="flex-1 min-w-0">
          <label htmlFor={id} className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block">
            {label}
          </label>
          <input
            id={id}
            type="text"
            role="combobox"
            aria-expanded={showPanel}
            aria-controls={listboxId}
            aria-autocomplete="list"
            aria-activedescendant={activeOptionId}
            autoComplete="off"
            value={inputValue}
            placeholder={placeholder}
            onChange={(e) => {
              onInputValueChange(e.target.value);
              setIsOpen(true);
            }}
            onFocus={() => setIsOpen(true)}
            onKeyDown={handleKeyDown}
            className="w-full bg-transparent text-sm font-semibold text-slate-900 border-none outline-none p-0 placeholder:text-slate-400 placeholder:font-normal"
          />
        </div>
        {selectedPlace && (
          <span
            className="hidden sm:inline-flex items-center gap-1 text-[10px] font-bold text-[#00847f] shrink-0"
            title="Verified location"
          >
            <MapPin className="w-3 h-3" aria-hidden="true" />
            Verified
          </span>
        )}
        {inputValue.length > 0 && (
          <button
            type="button"
            aria-label={`Clear ${label.toLowerCase()}`}
            onClick={() => {
              onClear();
              setIsOpen(false);
            }}
            className="shrink-0 p-1.5 -m-1.5 rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-200/70 min-w-[28px] min-h-[28px] flex items-center justify-center"
          >
            <X className="w-3.5 h-3.5" aria-hidden="true" />
          </button>
        )}
        {showUseCurrentLocation && (
          <button
            type="button"
            aria-label="Use current location"
            onClick={onUseCurrentLocation}
            disabled={locatingCurrentLocation}
            className="shrink-0 p-1.5 -m-1.5 rounded-full text-[#004b87] hover:bg-[#e6eef5] min-w-[28px] min-h-[28px] flex items-center justify-center disabled:opacity-50"
          >
            {locatingCurrentLocation ? (
              <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" />
            ) : (
              <LocateFixed className="w-4 h-4" aria-hidden="true" />
            )}
          </button>
        )}
      </div>

      {showPanel && (
        <div
          id={listboxId}
          role="listbox"
          aria-label={`${label} search results`}
          className="absolute z-30 mt-1.5 w-full max-h-64 overflow-y-auto rounded-xl border border-slate-200 bg-white shadow-lg py-1"
        >
          {status === 'loading' && (
            <div className="flex items-center gap-2 px-3 py-3 text-xs font-medium text-slate-500">
              <Loader2 className="w-3.5 h-3.5 animate-spin" aria-hidden="true" />
              Searching Singapore locations…
            </div>
          )}

          {status === 'error' && (
            <div className="flex items-start gap-2 px-3 py-3 text-xs font-medium text-red-700">
              <TriangleAlert className="w-3.5 h-3.5 mt-0.5 shrink-0" aria-hidden="true" />
              <span>{errorMessage}</span>
            </div>
          )}

          {status === 'empty' && (
            <div className="flex items-center gap-2 px-3 py-3 text-xs font-medium text-slate-500">
              <SearchX className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
              No results for &ldquo;{inputValue.trim()}&rdquo;
            </div>
          )}

          {status === 'success' &&
            results.map((place, index) => (
              <button
                key={place.id}
                id={`${listboxId}-option-${index}`}
                role="option"
                aria-selected={index === activeIndex}
                type="button"
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => handleSelect(place)}
                onMouseEnter={() => setActiveIndex(index)}
                className={cn(
                  'w-full text-left px-3 py-2.5 flex items-start gap-2.5 min-h-[44px]',
                  index === activeIndex ? 'bg-[#f0f5fa]' : 'bg-white'
                )}
              >
                <MapPin className="w-4 h-4 text-[#004b87] mt-0.5 shrink-0" aria-hidden="true" />
                <span className="min-w-0">
                  <span className="block text-sm font-semibold text-slate-900 truncate">{place.label}</span>
                  <span className="block text-xs text-slate-500 truncate">{place.address}</span>
                </span>
              </button>
            ))}
        </div>
      )}
    </div>
  );
}
