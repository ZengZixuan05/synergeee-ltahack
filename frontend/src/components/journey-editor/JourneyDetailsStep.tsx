'use client';

import React, { useState } from 'react';
import { Info } from 'lucide-react';
import { LocationCombobox } from '@/components/map/LocationCombobox';
import { Place } from '@/types/place';

interface JourneyDetailsStepProps {
  name: string;
  origin: string;
  originPlace: Place | null;
  destination: string;
  destinationPlace: Place | null;
  onChangeName: (name: string) => void;
  onChangeOrigin: (origin: string, place: Place | null) => void;
  onChangeDestination: (destination: string, place: Place | null) => void;
}

export function JourneyDetailsStep({
  name,
  origin,
  originPlace,
  destination,
  destinationPlace,
  onChangeName,
  onChangeOrigin,
  onChangeDestination,
}: JourneyDetailsStepProps) {
  const [locatingCurrentLocation, setLocatingCurrentLocation] = useState(false);
  const [locationError, setLocationError] = useState<string | null>(null);

  const handleUseCurrentLocation = () => {
    if (navigator.geolocation === undefined) {
      setLocationError('Location services are not available on this device.');
      return;
    }

    setLocationError(null);
    setLocatingCurrentLocation(true);

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const place: Place = {
          id: 'device-current-location',
          label: 'Current location',
          address: 'Current location (device GPS)',
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          source: 'device-location',
        };
        onChangeOrigin(place.label, place);
        setLocatingCurrentLocation(false);
      },
      (error) => {
        setLocatingCurrentLocation(false);
        setLocationError(
          error.code === error.PERMISSION_DENIED
            ? 'Location permission was denied. You can still search for your starting point.'
            : 'Could not determine your current location. You can still search for your starting point.'
        );
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

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
        <LocationCombobox
          id="journey-origin"
          label="From"
          placeholder="Search for a starting point"
          dotColorClassName="bg-slate-400"
          inputValue={origin}
          selectedPlace={originPlace}
          onInputValueChange={(value) => onChangeOrigin(value, null)}
          onSelect={(place) => onChangeOrigin(place.label, place)}
          onClear={() => onChangeOrigin('', null)}
          showUseCurrentLocation
          onUseCurrentLocation={handleUseCurrentLocation}
          locatingCurrentLocation={locatingCurrentLocation}
        />
        {locationError && (
          <p className="flex items-start gap-1.5 text-[11px] font-medium text-amber-700 px-1">
            <Info className="w-3.5 h-3.5 mt-0.5 shrink-0" aria-hidden="true" />
            {locationError}
          </p>
        )}

        <LocationCombobox
          id="journey-destination"
          label="To"
          placeholder="Search for a destination"
          dotColorClassName="bg-[#004b87]"
          inputValue={destination}
          selectedPlace={destinationPlace}
          onInputValueChange={(value) => onChangeDestination(value, null)}
          onSelect={(place) => onChangeDestination(place.label, place)}
          onClear={() => onChangeDestination('', null)}
        />

        {(origin.trim().length > 0 && !originPlace) || (destination.trim().length > 0 && !destinationPlace) ? (
          <p className="flex items-start gap-1.5 text-[11px] font-medium text-amber-700 px-1">
            <Info className="w-3.5 h-3.5 mt-0.5 shrink-0" aria-hidden="true" />
            Pick a suggestion from the search results so we know the exact location for live routing and directions.
          </p>
        ) : null}
      </div>
    </div>
  );
}
