'use client';

import React, { Suspense, useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { Clock, Search, Route, Pencil, Info, WifiOff, Radio } from 'lucide-react';
import { useDemoMode } from '@/features/demo/useDemoMode';
import { useAuth } from '@/features/auth/useAuth';
import { PageHeader } from '@/components/layout/PageHeader';
import { MapView } from '@/components/map/MapView';
import { LocationCombobox } from '@/components/map/LocationCombobox';
import { Button } from '@/components/ui/Button';
import { DemoBadge } from '@/components/alerts/DemoBadge';
import { Card } from '@/components/ui/Card';
import { SavedJourney } from '@/types/journey';
import { Place } from '@/types/place';
import { formatISODate } from '@/lib/schedule';
import { useJourneyPlan } from '@/hooks/useJourneyPlan';
import { JourneyItineraryCard } from '@/components/journey/JourneyItineraryCard';
import { transportModesToOneMapMode, maxContinuousWalkToMeters } from '@/lib/journeyPreferences';
import { pickPreferredIndex } from '@/lib/itineraryRanking';

type TimeMode = 'arrive-by' | 'leave-now' | 'depart-at';

const TIME_MODE_LABEL: Record<TimeMode, string> = {
  'arrive-by': 'Arrive by',
  'depart-at': 'Depart at',
  'leave-now': 'Leave now',
};

// Formats an ISO date (YYYY-MM-DD) + 24h time (HH:mm) into a compact display
// string, e.g. "10:00 AM, Mon 24 Feb". Returns null if either part is unset,
// since neither field is pre-filled and both must be chosen explicitly.
function formatDateTime(dateISO: string, timeValue: string): string | null {
  if (dateISO === '' || timeValue === '') return null;
  const [h, m] = timeValue.split(':').map(Number);
  if (Number.isNaN(h) || Number.isNaN(m)) return null;

  const date = new Date(dateISO + 'T00:00:00');
  date.setHours(h, m);

  const timeLabel = date.toLocaleTimeString('en-SG', { hour: 'numeric', minute: '2-digit' });
  const dateLabel = date.toLocaleDateString('en-SG', { weekday: 'short', day: 'numeric', month: 'short' });
  return timeLabel + ', ' + dateLabel;
}

function placeFromParams(label: string | null, lat: string | null, lng: string | null): Place | null {
  if (!label || !lat || !lng) return null;
  const latitude = Number(lat);
  const longitude = Number(lng);
  if (Number.isNaN(latitude) || Number.isNaN(longitude)) return null;
  return { id: `deep-link:${lat},${lng}`, label, address: label, latitude, longitude, source: 'manual' };
}

function DirectionsPageContent() {
  const { isDisrupted, commuter } = useDemoMode();
  const { profile } = useAuth();
  const searchParams = useSearchParams();
  const preferredMode = transportModesToOneMapMode(commuter.preferences.transportModes);
  const preferredMaxWalkDistance = maxContinuousWalkToMeters(commuter.preferences.maxContinuousWalk);

  const deepLinkedOriginPlace = placeFromParams(
    searchParams.get('originLabel'),
    searchParams.get('originLat'),
    searchParams.get('originLng')
  );
  const deepLinkedDestinationPlace = placeFromParams(
    searchParams.get('destLabel'),
    searchParams.get('destLat'),
    searchParams.get('destLng')
  );
  const deepLinkedTimeType = searchParams.get('timeType');
  const deepLinkedTimeValue = searchParams.get('timeValue');

  // No hardcoded demo defaults — a fresh visit (not arriving from a saved
  // journey's "View journey" link) starts blank, and a real saved journey's
  // exact geocoded location is used when it did.
  const [originText, setOriginText] = useState(deepLinkedOriginPlace?.label ?? searchParams.get('originLabel') ?? '');
  const [originPlace, setOriginPlace] = useState<Place | null>(deepLinkedOriginPlace);
  const [destinationText, setDestinationText] = useState(
    deepLinkedDestinationPlace?.label ?? searchParams.get('destLabel') ?? ''
  );
  const [destinationPlace, setDestinationPlace] = useState<Place | null>(deepLinkedDestinationPlace);

  const [timeMode, setTimeMode] = useState<TimeMode>(
    deepLinkedTimeType === 'depart-at' || deepLinkedTimeType === 'arrive-by' ? deepLinkedTimeType : 'leave-now'
  );
  // Date/time are never pre-filled — the commuter must choose them explicitly
  // once they pick 'Depart at' or 'Arrive by' — except when deep-linked from
  // a saved journey that already has its own time preference.
  const [targetDate, setTargetDate] = useState(deepLinkedTimeValue ? formatISODate(new Date()) : '');
  const [targetTimeValue, setTargetTimeValue] = useState(deepLinkedTimeValue ?? '');
  const [isPlanned, setIsPlanned] = useState(() => Boolean(deepLinkedOriginPlace && deepLinkedDestinationPlace));

  const [locatingCurrentLocation, setLocatingCurrentLocation] = useState(false);
  const [locationError, setLocationError] = useState<string | null>(null);

  const [selectedItineraryIndex, setSelectedItineraryIndex] = useState(0);
  const { result: planResult, status: planStatus, errorMessage: planErrorMessage, plan } = useJourneyPlan();

  // Default to whichever itinerary the backend recommends (the one that
  // avoids a live disruption/lift outage, when one exists) rather than
  // always the fastest option — this is what lets "View alternative route"
  // land on the actual alternative instead of the affected route.
  useEffect(() => {
    const applyRecommendedIndex = () => {
      if (planResult) {
        setSelectedItineraryIndex(pickPreferredIndex(planResult.itineraries, planResult.recommendation, commuter.preferences));
      }
    };
    applyRecommendedIndex();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [planResult]);

  const savedRoutes = profile?.regularRoutes ?? [];

  // Deep-linked in from a saved journey's "View journey" button with both
  // ends already geocoded — plan it immediately instead of waiting for the
  // commuter to press the button again.
  useEffect(() => {
    if (deepLinkedOriginPlace && deepLinkedDestinationPlace) {
      // No `date` here — a saved journey's schedule time applies to "today"
      // each time it's viewed, so the backend's own today-default is used
      // (matching useSavedJourneyRoute). Building an explicit date requires
      // the backend's "MM-DD-YYYY" format, not `formatISODate`'s "YYYY-MM-DD"
      // — passing the wrong format here previously made OneMap silently
      // return no routes.
      const time = deepLinkedTimeValue ? `${deepLinkedTimeValue}:00` : undefined;
      plan({
        from: deepLinkedOriginPlace,
        to: deepLinkedDestinationPlace,
        time,
        arriveBy: deepLinkedTimeType === 'arrive-by',
        mode: preferredMode,
        maxWalkDistance: preferredMaxWalkDistance,
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleApplyRoute = (route: SavedJourney) => {
    setOriginText(route.origin);
    setOriginPlace(route.originPlace ?? null);
    setDestinationText(route.destination);
    setDestinationPlace(route.destinationPlace ?? null);
    setTimeMode(route.schedule.time.type);
    if (route.schedule.time.value) {
      setTargetTimeValue(route.schedule.time.value);
      setTargetDate(formatISODate(new Date()));
    }
    setIsPlanned(false);
  };

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
        setOriginPlace(place);
        setOriginText(place.label);
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

  const needsDateTime = timeMode === 'depart-at' || timeMode === 'arrive-by';
  const hasDateTime = targetDate !== '' && targetTimeValue !== '';
  const hasSelectedPlaces = originPlace !== null && destinationPlace !== null;
  const canPlanJourney =
    originText.trim().length > 0 &&
    destinationText.trim().length > 0 &&
    hasSelectedPlaces &&
    (needsDateTime === false || hasDateTime);

  const plannedSummary = formatDateTime(targetDate, targetTimeValue);

  const handlePlanJourney = () => {
    if (!originPlace || !destinationPlace) return;
    setIsPlanned(true);
    setSelectedItineraryIndex(0);

    let date: string | undefined;
    let time: string | undefined;
    if (needsDateTime && hasDateTime) {
      const [year, month, day] = targetDate.split('-');
      date = `${month}-${day}-${year}`;
      time = `${targetTimeValue}:00`;
    }

    plan({
      from: { latitude: originPlace.latitude, longitude: originPlace.longitude },
      to: { latitude: destinationPlace.latitude, longitude: destinationPlace.longitude },
      date,
      time,
      arriveBy: timeMode === 'arrive-by',
      mode: preferredMode,
      maxWalkDistance: preferredMaxWalkDistance,
    });
  };

  return (
    <div className="flex-1 flex flex-col pb-6">
      <PageHeader
        title="Directions & Planner"
        subtitle="Step-free & sheltered route finder"
        rightAction={isDisrupted ? <DemoBadge size="sm" /> : undefined}
      />

      <div className="p-4 space-y-4">
        {isPlanned ? (
          <Card variant="default" className="border border-slate-200 p-3.5 bg-white">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="text-sm font-bold text-slate-900 truncate">
                  {originText} <span className="text-slate-400">&rarr;</span> {destinationText}
                </p>
                <p className="text-xs font-medium text-slate-500 mt-0.5">
                  {timeMode === 'leave-now' ? TIME_MODE_LABEL[timeMode] : TIME_MODE_LABEL[timeMode] + ' ' + (plannedSummary ?? '')}
                </p>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsPlanned(false)}
                leftIcon={<Pencil className="w-3.5 h-3.5" />}
              >
                Edit
              </Button>
            </div>
          </Card>
        ) : (
          <>

            {savedRoutes.length > 0 && (
              <section aria-label="Your regular routes" className="space-y-1.5">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 block px-0.5">
                  Your regular routes
                </span>
                <div className="flex items-center gap-2 overflow-x-auto pb-1 -mx-0.5 px-0.5">
                  {savedRoutes.map((route) => (
                    <button
                      key={route.id}
                      type="button"
                      onClick={() => handleApplyRoute(route)}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-slate-200 bg-white text-xs font-bold text-slate-700 whitespace-nowrap hover:border-[#004b87] hover:text-[#004b87] transition-colors shrink-0"
                    >
                      <Route className="w-3.5 h-3.5 text-[#004b87]" />
                      {route.name}
                    </button>
                  ))}
                </div>
              </section>
            )}

            <Card variant="default" className="border border-slate-200 p-4 space-y-3 bg-white overflow-visible">
              <div className="space-y-2">
                <LocationCombobox
                  id="from-location"
                  label="From"
                  placeholder="Search for a starting point"
                  dotColorClassName="bg-slate-400"
                  inputValue={originText}
                  selectedPlace={originPlace}
                  onInputValueChange={(value) => {
                    setOriginText(value);
                    setOriginPlace(null);
                  }}
                  onSelect={(place) => {
                    setOriginPlace(place);
                    setOriginText(place.label);
                  }}
                  onClear={() => {
                    setOriginText('');
                    setOriginPlace(null);
                  }}
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
                {originText.trim().length > 0 && destinationText.trim().length > 0 && !hasSelectedPlaces && (
                  <p className="flex items-start gap-1.5 text-[11px] font-medium text-amber-700 px-1">
                    <Info className="w-3.5 h-3.5 mt-0.5 shrink-0" aria-hidden="true" />
                    Pick a suggestion from the search results for both fields to plan a real route.
                  </p>
                )}

                <LocationCombobox
                  id="to-location"
                  label="To"
                  placeholder="Search for a destination"
                  dotColorClassName="bg-[#004b87]"
                  inputValue={destinationText}
                  selectedPlace={destinationPlace}
                  onInputValueChange={(value) => {
                    setDestinationText(value);
                    setDestinationPlace(null);
                  }}
                  onSelect={(place) => {
                    setDestinationPlace(place);
                    setDestinationText(place.label);
                  }}
                  onClear={() => {
                    setDestinationText('');
                    setDestinationPlace(null);
                  }}
                />
              </div>

              {/* Time Selector */}
              <div className="space-y-2 pt-1">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 block">
                  Time preference
                </span>
                <div
                  role="radiogroup"
                  aria-label="Departure or arrival timing"
                  className="grid grid-cols-3 gap-1.5 p-1 bg-slate-100 rounded-xl"
                >
                  <button
                    type="button"
                    role="radio"
                    aria-checked={timeMode === 'leave-now'}
                    onClick={() => setTimeMode('leave-now')}
                    className={'py-1.5 text-xs font-bold rounded-lg transition-all min-h-[38px] ' + (timeMode === 'leave-now' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900')}
                  >
                    Leave now
                  </button>
                  <button
                    type="button"
                    role="radio"
                    aria-checked={timeMode === 'depart-at'}
                    onClick={() => setTimeMode('depart-at')}
                    className={'py-1.5 text-xs font-bold rounded-lg transition-all min-h-[38px] ' + (timeMode === 'depart-at' ? 'bg-white text-[#004b87] shadow-xs' : 'text-slate-600 hover:text-slate-900')}
                  >
                    Depart at
                  </button>
                  <button
                    type="button"
                    role="radio"
                    aria-checked={timeMode === 'arrive-by'}
                    onClick={() => setTimeMode('arrive-by')}
                    className={'py-1.5 text-xs font-bold rounded-lg transition-all min-h-[38px] ' + (timeMode === 'arrive-by' ? 'bg-white text-[#004b87] shadow-xs' : 'text-slate-600 hover:text-slate-900')}
                  >
                    Arrive by
                  </button>
                </div>

                {needsDateTime && (
                  <div className="space-y-1.5 p-2.5 bg-[#f0f5fa] rounded-xl border border-[#b8d2eb]">
                    <span className="text-xs font-bold text-[#004b87] block">
                      {TIME_MODE_LABEL[timeMode]}
                    </span>
                    <div className="flex gap-2">
                      <input
                        type="date"
                        value={targetDate}
                        onChange={(e) => setTargetDate(e.target.value)}
                        aria-label="Date"
                        min={formatISODate(new Date())}
                        className="flex-1 px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white text-sm font-semibold text-slate-900 outline-none focus:border-[#004b87] focus:ring-1 focus:ring-[#004b87]"
                      />
                      <input
                        type="time"
                        value={targetTimeValue}
                        onChange={(e) => setTargetTimeValue(e.target.value)}
                        aria-label="Time"
                        className="w-28 px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white text-sm font-semibold text-slate-900 outline-none focus:border-[#004b87] focus:ring-1 focus:ring-[#004b87]"
                      />
                    </div>
                    {hasDateTime === false && (
                      <p className="text-[11px] font-medium text-[#004b87]/80 px-0.5">
                        Choose a date and time to plan around it.
                      </p>
                    )}
                  </div>
                )}
              </div>

              <Button
                variant="primary"
                size="md"
                fullWidth
                disabled={canPlanJourney === false}
                onClick={handlePlanJourney}
                rightIcon={<Search className="w-4 h-4" />}
              >
                Plan journey
              </Button>
            </Card>
          </>
        )}

        <section aria-label="Route map">
          <MapView
            origin={originPlace}
            destination={destinationPlace}
            itinerary={planResult?.itineraries[selectedItineraryIndex] ?? null}
            heightClass={isPlanned ? 'h-[52vh] min-h-[320px]' : 'h-52'}
          />
        </section>

        {isPlanned && (planStatus === 'idle' || planStatus === 'loading') && (
          <Card variant="default" className="border border-slate-200 p-4 bg-white">
            <div className="flex items-start gap-3">
              <div className="w-9 h-9 rounded-full bg-[#f0f5fa] flex items-center justify-center shrink-0">
                <Clock className="w-4.5 h-4.5 text-[#004b87] animate-pulse" aria-hidden="true" />
              </div>
              <div>
                <p className="text-sm font-bold text-slate-900">Planning your route&hellip;</p>
                <p className="text-xs text-slate-500 font-medium mt-0.5">Checking live LTA &amp; OneMap routing data.</p>
              </div>
            </div>
          </Card>
        )}

        {isPlanned && planStatus === 'error' && (
          <Card variant="default" className="border border-slate-200 p-4 bg-white">
            <div className="flex items-start gap-3">
              <WifiOff className="w-4.5 h-4.5 text-slate-500 shrink-0 mt-0.5" aria-hidden="true" />
              <div>
                <p className="text-sm font-bold text-slate-900">Couldn&apos;t plan this route</p>
                <p className="text-xs text-slate-500 font-medium mt-0.5">
                  {planErrorMessage || 'Route planning is temporarily unavailable.'}
                </p>
              </div>
            </div>
          </Card>
        )}

        {isPlanned && planStatus === 'empty' && (
          <Card variant="default" className="border border-slate-200 p-4 bg-white">
            <p className="text-sm font-bold text-slate-900">No route found</p>
            <p className="text-xs text-slate-500 font-medium mt-0.5">
              OneMap couldn&apos;t find a public transport route between these two points for the selected time.
            </p>
          </Card>
        )}

        {isPlanned && planStatus === 'success' && planResult && (
          <div className="space-y-2">
            {planResult.itineraries.length > 1 && (
              <div className="flex items-center gap-2 overflow-x-auto pb-1 -mx-0.5 px-0.5">
                {planResult.itineraries.map((itinerary, index) => (
                  <button
                    key={index}
                    type="button"
                    onClick={() => setSelectedItineraryIndex(index)}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-xs font-bold whitespace-nowrap transition-colors shrink-0 min-h-[36px] ${
                      selectedItineraryIndex === index
                        ? 'border-[#004b87] bg-[#f0f5fa] text-[#004b87]'
                        : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300'
                    }`}
                  >
                    {index === planResult.recommendation?.index && <Radio className="w-3 h-3" aria-hidden="true" />}
                    Option {index + 1}
                  </button>
                ))}
              </div>
            )}

            {planResult.itineraries[selectedItineraryIndex] && (
              <JourneyItineraryCard
                itinerary={planResult.itineraries[selectedItineraryIndex]}
                isRecommended={selectedItineraryIndex === planResult.recommendation?.index}
                recommendationReason={planResult.recommendation?.reason}
              />
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default function DirectionsPage() {
  return (
    <Suspense fallback={null}>
      <DirectionsPageContent />
    </Suspense>
  );
}
