'use client';

import React from 'react';
import { ArrowRight, ShieldCheck, Bell } from 'lucide-react';
import { SavedJourney } from '@/types/journey';
import { describeSchedule } from '@/lib/schedule';
import { Card } from '@/components/ui/Card';
import { legIcon, legTitle } from './RouteTimeline';

interface ReviewStepProps {
  journey: SavedJourney;
  onToggleMonitoring: (enabled: boolean) => void;
}

export function ReviewStep({ journey, onToggleMonitoring }: ReviewStepProps) {
  return (
    <div className="space-y-4 animate-fadeIn">
      <div>
        <div className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 uppercase tracking-wider">
          <ShieldCheck className="w-4 h-4" />
          <span>Review</span>
        </div>
        <h1 className="text-xl font-black text-slate-900 tracking-tight mt-0.5">
          {journey.name || 'Untitled journey'}
        </h1>
        <p className="text-xs text-slate-500 mt-1 flex items-center gap-1.5">
          <span className="truncate">{journey.origin || 'Starting point'}</span>
          <ArrowRight className="w-3 h-3 shrink-0" />
          <span className="truncate">{journey.destination || 'Destination'}</span>
        </p>
      </div>

      <Card variant="default" className="border border-slate-200 bg-white p-4 space-y-1.5">
        <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Schedule</span>
        <p className="text-sm font-bold text-slate-900">{describeSchedule(journey.schedule)}</p>
      </Card>

      <Card variant="default" className="border border-slate-200 bg-white p-4 space-y-2">
        <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Usual route</span>
        {journey.route.length === 0 ? (
          <p className="text-xs text-slate-500">Not set — GoAble will suggest routes once live routing is connected.</p>
        ) : (
          <ol className="space-y-1.5">
            {journey.route.map((leg) => (
              <li key={leg.id} className="flex items-center gap-2 text-sm font-semibold text-slate-800">
                {legIcon(leg)}
                <span className="truncate">{legTitle(leg)}</span>
              </li>
            ))}
          </ol>
        )}
      </Card>

      <Card variant="default" className="border border-slate-200 bg-white p-4">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-[#f0f5fa] text-[#004b87]">
              <Bell className="w-4 h-4" />
            </div>
            <div>
              <p className="text-sm font-bold text-slate-900">Monitoring</p>
              <p className="text-xs text-slate-500">Check this journey for changes</p>
            </div>
          </div>
          <button
            type="button"
            role="switch"
            aria-checked={journey.monitoringEnabled}
            onClick={() => onToggleMonitoring(!journey.monitoringEnabled)}
            className={`relative inline-flex h-7 w-12 shrink-0 items-center rounded-full transition-colors focus-visible:outline-2 focus-visible:outline-[#004b87] ${
              journey.monitoringEnabled ? 'bg-[#004b87]' : 'bg-slate-300'
            }`}
          >
            <span
              className={`inline-block h-5 w-5 transform rounded-full bg-white shadow transition-transform ${
                journey.monitoringEnabled ? 'translate-x-6' : 'translate-x-1'
              }`}
            />
          </button>
        </div>
      </Card>
    </div>
  );
}
