'use client';

import React, { useState } from 'react';
import { Sparkles } from 'lucide-react';
import { useDemoMode } from '@/features/demo/useDemoMode';
import { JourneyCard } from '@/components/journey/JourneyCard';
import { NoSavedJourneyCard } from '@/components/journey/NoSavedJourneyCard';
import { DemoScenarioToggle } from '@/components/layout/DemoScenarioToggle';
import { VoiceAssistantButton } from '@/components/assistant/VoiceAssistantButton';
import { VoiceAssistantSheet } from '@/components/assistant/VoiceAssistantSheet';
import { LiveLiftStatus } from '@/components/alerts/LiveLiftStatus';
import { TrainServiceAlerts } from '@/components/alerts/TrainServiceAlerts';
import { WeatherWidget } from '@/components/weather/WeatherWidget';

export default function HomePage() {
  const { commuter, currentJourney, isDisrupted } = useDemoMode();
  const [isVoiceSheetOpen, setIsVoiceSheetOpen] = useState(false);

  return (
    <div className="flex-1 flex flex-col px-4 pt-4 pb-6 space-y-5">
      {/* Simulation / Demo Switcher Banner */}
      <section aria-label="Prototype Mode Switcher">
        <div className="flex items-center justify-between mb-1.5">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
            Prototype Scenario
          </span>
          <span className="text-[10px] text-slate-500 font-medium">
            Toggle to test proactive alerts
          </span>
        </div>
        <DemoScenarioToggle />
      </section>

      {/* Greeting & Commuter Badge */}
      <header className="flex items-start justify-between gap-3 pt-1">
        <div>
          <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-wide bg-teal-50 text-[#00847f] border border-teal-200 mb-1.5">
            <Sparkles className="w-3 h-3 text-[#00847f]" aria-hidden="true" />
            <span>PERSONALISED FOR YOU</span>
          </div>

          <h1 className="text-2xl font-black text-slate-900 tracking-tight">
            Good evening, {commuter.name}
          </h1>
          <p className="text-xs text-slate-500 font-medium mt-0.5">
            Proactive updates for your regular routes
          </p>
        </div>
      </header>

      {/* Primary Hero Section: Next Journey Card */}
      <section aria-label="Next Journey">
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-xs font-bold uppercase tracking-wider text-slate-600">
            Next Journey
          </h2>
          {currentJourney && (
            <span className="text-[11px] font-medium text-slate-600">
              {currentJourney.recurrence}
            </span>
          )}
        </div>

        {currentJourney ? <JourneyCard journey={currentJourney} /> : <NoSavedJourneyCard />}
      </section>

      <section aria-label="Live lift availability" className="pt-2">
        <LiveLiftStatus />
      </section>

      <section className="pt-2">
        <WeatherWidget />
      </section>

      {/* Secondary Section: General Transport Updates (Lower Priority) */}
      <section className="pt-2">
        <TrainServiceAlerts />
      </section>

      {/* Floating Voice Assistant Action */}
      <VoiceAssistantButton onClick={() => setIsVoiceSheetOpen(true)} />

      {/* Voice Assistant Bottom Sheet Modal */}
      <VoiceAssistantSheet
        isOpen={isVoiceSheetOpen}
        onClose={() => setIsVoiceSheetOpen(false)}
        isDisrupted={isDisrupted}
      />
    </div>
  );
}
