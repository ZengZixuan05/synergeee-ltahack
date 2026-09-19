'use client';

import React, { useState } from 'react';
import { ChevronLeft, ChevronRight, X, Check } from 'lucide-react';
import { SavedJourney } from '@/types/journey';
import { formatISODate } from '@/lib/schedule';
import { Button } from '@/components/ui/Button';
import { JourneyDetailsStep } from './JourneyDetailsStep';
import { ScheduleStep } from './ScheduleStep';
import { RouteStep } from './RouteStep';
import { ReviewStep } from './ReviewStep';

interface JourneyEditorProps {
  initialJourney: SavedJourney | null;
  onSave: (journey: SavedJourney) => void;
  onCancel: () => void;
}

function makeId(): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) return crypto.randomUUID();
  return `journey-${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

function blankJourney(): SavedJourney {
  const today = formatISODate(new Date());
  return {
    id: makeId(),
    name: '',
    origin: '',
    destination: '',
    schedule: { frequency: 'once', date: today, time: { type: 'depart-at', value: '08:00' } },
    route: [],
    monitoringEnabled: true,
    createdAt: today,
  };
}

const STEP_LABELS = ['Journey', 'Schedule', 'Usual route', 'Review'];

export function JourneyEditor({ initialJourney, onSave, onCancel }: JourneyEditorProps) {
  const [step, setStep] = useState<number>(1);
  const [draft, setDraft] = useState<SavedJourney>(() => initialJourney ?? blankJourney());

  const canContinueFromStep1 = Boolean(draft.name.trim() && draft.origin.trim() && draft.destination.trim());

  const handleBack = () => setStep((s) => Math.max(1, s - 1));
  const handleNext = () => setStep((s) => Math.min(4, s + 1));
  const handleSave = () => {
    onSave({ ...draft, name: draft.name.trim(), origin: draft.origin.trim(), destination: draft.destination.trim() });
  };

  return (
    <div className="space-y-5">
      <div className="space-y-2">
        <div className="flex items-center justify-between text-xs font-bold text-slate-500 uppercase tracking-wider">
          <span>Step {step} of 4</span>
          <div className="flex items-center gap-2">
            <span className="text-[#004b87]">{STEP_LABELS[step - 1]}</span>
            <button type="button" onClick={onCancel} aria-label="Cancel editing journey" className="p-1 -mr-1 text-slate-400 hover:text-slate-700">
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
        <div className="w-full h-1.5 bg-slate-200 rounded-full overflow-hidden">
          <div className="h-full bg-[#004b87] transition-all duration-300 rounded-full" style={{ width: `${(step / 4) * 100}%` }} />
        </div>
      </div>

      {step === 1 && (
        <JourneyDetailsStep
          name={draft.name}
          origin={draft.origin}
          destination={draft.destination}
          onChangeName={(name) => setDraft((prev) => ({ ...prev, name }))}
          onChangeOrigin={(origin) => setDraft((prev) => ({ ...prev, origin }))}
          onChangeDestination={(destination) => setDraft((prev) => ({ ...prev, destination }))}
        />
      )}

      {step === 2 && (
        <ScheduleStep schedule={draft.schedule} onChange={(schedule) => setDraft((prev) => ({ ...prev, schedule }))} />
      )}

      {step === 3 && (
        <RouteStep
          origin={draft.origin}
          destination={draft.destination}
          route={draft.route}
          onChange={(route) => setDraft((prev) => ({ ...prev, route }))}
        />
      )}

      {step === 4 && (
        <ReviewStep
          journey={draft}
          onToggleMonitoring={(monitoringEnabled) => setDraft((prev) => ({ ...prev, monitoringEnabled }))}
        />
      )}

      <div className="pt-2 border-t border-slate-200 flex items-center gap-3">
        {step > 1 && (
          <Button type="button" variant="outline" size="lg" onClick={handleBack} leftIcon={<ChevronLeft className="w-4 h-4" />} className="py-3 px-4">
            Back
          </Button>
        )}
        {step < 4 ? (
          <Button
            type="button"
            variant="primary"
            size="lg"
            fullWidth
            onClick={handleNext}
            disabled={step === 1 && !canContinueFromStep1}
            rightIcon={<ChevronRight className="w-4 h-4" />}
            className="py-3"
          >
            Continue
          </Button>
        ) : (
          <Button type="button" variant="primary" size="lg" fullWidth onClick={handleSave} leftIcon={<Check className="w-4 h-4" />} className="py-3">
            Save journey
          </Button>
        )}
      </div>
    </div>
  );
}
