'use client';

import React from 'react';

interface RoutePlaceInputProps {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  dotColorClassName?: string;
  placeholder?: string;
}

export function RoutePlaceInput({
  id,
  label,
  value,
  onChange,
  dotColorClassName = 'bg-slate-400',
  placeholder,
}: RoutePlaceInputProps) {
  return (
    <div className="flex items-center gap-2.5 p-2.5 rounded-xl border border-slate-200 bg-slate-50 focus-within:border-[#004b87] focus-within:ring-1 focus-within:ring-[#004b87]">
      <div className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${dotColorClassName}`} />
      <div className="flex-1 min-w-0">
        <label htmlFor={id} className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block">
          {label}
        </label>
        <input
          id={id}
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className="w-full bg-transparent text-sm font-semibold text-slate-900 border-none outline-none p-0 placeholder:text-slate-400 placeholder:font-normal"
        />
      </div>
    </div>
  );
}
