'use client';

import React from 'react';
import { PlaceInput } from './PlaceInput';

interface JourneyDetailsStepProps {
  name: string;
  origin: string;
  destination: string;
  onChangeName: (name: string) => void;
  onChangeOrigin: (origin: string) => void;
  onChangeDestination: (destination: string) => void;
}

export function JourneyDetailsStep({
  name,
  origin,
  destination,
  onChangeName,
  onChangeOrigin,
  onChangeDestination,
}: JourneyDetailsStepProps) {
  return (
    <div className="space-y-4 animate-fadeIn">
      <div>
        <h1 className="text-xl font-black text-slate-900 tracking-tight">Journey</h1>
        <p className="text-xs text-slate-500 mt-1">Where are you going?</p>
      </div>

      <div>
        <label htmlFor="journey-name" className="text-xs font-bold uppercase tracking-wider text-slate-700 block mb-1.5">
          Journey name
        </label>
        <input
          id="journey-name"
          type="text"
          value={name}
          onChange={(e) => onChangeName(e.target.value)}
          placeholder="e.g. SGH Appointment"
          className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-sm font-semibold text-slate-900 outline-none focus:border-[#004b87] focus:ring-1 focus:ring-[#004b87] placeholder:text-slate-400 placeholder:font-normal"
        />
      </div>

      <div className="space-y-2">
        <PlaceInput
          id="journey-origin"
          label="From"
          value={origin}
          onChange={onChangeOrigin}
          dotColorClassName="bg-slate-400"
          placeholder="Starting point"
        />
        <PlaceInput
          id="journey-destination"
          label="To"
          value={destination}
          onChange={onChangeDestination}
          dotColorClassName="bg-[#004b87]"
          placeholder="Destination"
        />
      </div>
    </div>
  );
}
