'use client';

import React, { useState } from 'react';
import { Sparkles, Bell } from 'lucide-react';
import { useDemoMode } from '@/features/demo/useDemoMode';
import { JourneyCard } from '@/components/journey/JourneyCard';
import { AlertCard } from '@/components/alerts/AlertCard';
import { DemoScenarioToggle } from '@/components/layout/DemoScenarioToggle';
import { VoiceAssistantButton } from '@/components/assistant/VoiceAssistantButton';
import { VoiceAssistantSheet } from '@/components/assistant/VoiceAssistantSheet';
import { SAMPLE_TRANSPORT_ALERTS } from '@/fixtures/alerts';
import { LiveLiftStatus } from '@/components/alerts/LiveLiftStatus';

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
          <span className="text-[11px] font-medium text-slate-600">
            Alternate Monday Routine
          </span>
        </div>

        <JourneyCard journey={currentJourney} />
      </section>

      <section aria-label="Live lift availability" className="pt-2">
        <LiveLiftStatus />
      </section>

      {/* Secondary Section: General Transport Updates (Lower Priority) */}
      <section aria-label="Transport updates" className="space-y-2 pt-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <Bell className="w-4 h-4 text-slate-500" aria-hidden="true" />
            <h2 className="text-sm font-bold text-slate-900">
              Transport updates
            </h2>
          </div>
          <span className="text-[11px] text-slate-500 font-medium">
            General network status
          </span>
        </div>

        <p className="text-xs text-slate-500 leading-normal">
          Network-wide advisories for Singapore public transport. These do not affect your step-free route.
        </p>

        <div className="space-y-2 pt-1">
          {SAMPLE_TRANSPORT_ALERTS.map((alert) => (
            <AlertCard key={alert.id} alert={alert} />
          ))}
        </div>
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
