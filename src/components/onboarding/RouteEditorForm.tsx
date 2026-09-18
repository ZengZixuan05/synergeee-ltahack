'use client';

import React, { useState } from 'react';
import { ChevronDown, ChevronUp, Check } from 'lucide-react';
import { RegularRoute } from '@/types';
import { Button } from '@/components/ui/Button';
import { RoutePlaceInput } from './RoutePlaceInput';
import { RouteTimeInput } from './RouteTimeInput';
import { DaySelector } from './DaySelector';
import { RouteLegBuilder } from './RouteLegBuilder';

function blankRoute(): RegularRoute {
  return {
    id: crypto.randomUUID(),
    name: '',
    origin: '',
    destination: '',
    timeType: 'depart-at',
    time: '08:00',
    days: ['mon', 'tue', 'wed', 'thu', 'fri'],
    legs: [],
  };
}

interface RouteEditorFormProps {
  initialRoute: RegularRoute | null;
  onSave: (route: RegularRoute) => void;
  onCancel: () => void;
}

export function RouteEditorForm({ initialRoute, onSave, onCancel }: RouteEditorFormProps) {
  const [draft, setDraft] = useState<RegularRoute>(() => initialRoute ?? blankRoute());
  const [legsExpanded, setLegsExpanded] = useState(initialRoute ? initialRoute.legs.length > 0 : false);

  const canSave = Boolean(draft.name.trim() && draft.origin.trim() && draft.destination.trim());

  const handleSave = () => {
    if (!canSave) return;
    onSave({
      ...draft,
      name: draft.name.trim(),
      origin: draft.origin.trim(),
      destination: draft.destination.trim(),
    });
  };

  return (
    <div className="space-y-4 animate-fadeIn">
      <div>
        <label htmlFor="route-name" className="text-xs font-bold uppercase tracking-wider text-slate-700 block mb-1.5">
          Route name
        </label>
        <input
          id="route-name"
          type="text"
          value={draft.name}
          onChange={(e) => setDraft((prev) => ({ ...prev, name: e.target.value }))}
          placeholder="e.g. Commute to work"
          className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-sm font-semibold text-slate-900 outline-none focus:border-[#004b87] focus:ring-1 focus:ring-[#004b87] placeholder:text-slate-400 placeholder:font-normal"
        />
      </div>

      <div className="space-y-2">
        <RoutePlaceInput
          id="route-origin"
          label="From"
          value={draft.origin}
          onChange={(v) => setDraft((prev) => ({ ...prev, origin: v }))}
          dotColorClassName="bg-slate-400"
          placeholder="Starting point"
        />
        <RoutePlaceInput
          id="route-destination"
          label="To"
          value={draft.destination}
          onChange={(v) => setDraft((prev) => ({ ...prev, destination: v }))}
          dotColorClassName="bg-[#004b87]"
          placeholder="Destination"
        />
      </div>

      <RouteTimeInput
        timeType={draft.timeType}
        time={draft.time}
        onTimeTypeChange={(timeType) => setDraft((prev) => ({ ...prev, timeType }))}
        onTimeChange={(time) => setDraft((prev) => ({ ...prev, time }))}
      />

      <DaySelector
        selectedDays={draft.days}
        onChange={(days) => setDraft((prev) => ({ ...prev, days }))}
      />

      <div className="space-y-2">
        <button
          type="button"
          onClick={() => setLegsExpanded((prev) => !prev)}
          className="flex items-center justify-between w-full text-xs font-bold uppercase tracking-wider text-slate-700"
        >
          <span>Route steps (optional)</span>
          {legsExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </button>
        {legsExpanded && (
          <RouteLegBuilder
            legs={draft.legs}
            onChange={(legs) => setDraft((prev) => ({ ...prev, legs }))}
          />
        )}
      </div>

      <div className="flex items-center gap-3 pt-2">
        <Button type="button" variant="outline" size="md" onClick={onCancel} className="flex-1">
          Cancel
        </Button>
        <Button
          type="button"
          variant="primary"
          size="md"
          onClick={handleSave}
          disabled={!canSave}
          leftIcon={<Check className="w-4 h-4" />}
          className="flex-1"
        >
          Save route
        </Button>
      </div>
    </div>
  );
}
