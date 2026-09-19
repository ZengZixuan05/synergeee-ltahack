'use client';

import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { CheckCircle2, Home } from 'lucide-react';
import { useDemoMode } from '@/features/demo/useDemoMode';
import { PageHeader } from '@/components/layout/PageHeader';
import { GuidedStep } from '@/components/journey/GuidedStep';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';

export default function GuidedJourneyPage() {
  const router = useRouter();
  const { currentJourney } = useDemoMode();

  const activeRoute =
    currentJourney?.isAffected && currentJourney.recommendedRoute ? currentJourney.recommendedRoute : currentJourney?.normalRoute;
  const steps = activeRoute?.steps ?? [];
  const totalSteps = steps.length;

  const [activeIndex, setActiveIndex] = useState(0);
  const stepEls = useRef<(HTMLElement | null)[]>([]);

  const registerRef = useCallback((index: number, el: HTMLElement | null) => {
    stepEls.current[index] = el;
  }, []);

  // Track which step is most in view to drive the progress indicator. No
  // click-to-advance: the commuter simply scrolls through the steps.
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
        if (visible) {
          const idx = Number((visible.target as HTMLElement).dataset.stepIndex);
          if (Number.isNaN(idx) === false) setActiveIndex(idx);
        }
      },

      { rootMargin: '-45% 0px -45% 0px', threshold: [0, 0.25, 0.5, 1] }
    );

    stepEls.current.forEach((el) => el && observer.observe(el));
    return () => observer.disconnect();
  }, [totalSteps]);

  const progressPct = totalSteps > 0 ? Math.round(((activeIndex + 1) / totalSteps) * 100) : 0;

  if (!currentJourney || !activeRoute || totalSteps === 0) {
    return (
      <div className="flex-1 flex flex-col pb-8">
        <PageHeader title="Guided Navigation" showBack={true} onBack={() => router.push('/')} />
        <div className="p-4">
          <Card variant="default" className="p-4 text-sm text-slate-600">
            Save a regular route from your profile to get step-by-step guidance here.
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col pb-8">
      <PageHeader
        title="Guided Navigation"
        subtitle={`To ${currentJourney.destinationName}`}
        showBack={true}
        onBack={() => router.push('/journey/compare')}
      />

      {/* Sticky progress: tracks the step currently in view as you scroll */}
      <div className="sticky top-0 z-20 bg-white/95 backdrop-blur border-b border-slate-200 px-4 py-2.5 space-y-1.5">
        <div className="flex items-center justify-between text-xs font-bold text-slate-700">
          <span className="uppercase tracking-wider text-[#004b87]">Step {activeIndex + 1} of {totalSteps}</span>
          <span className="text-slate-500">{progressPct}% completed</span>
        </div>
        <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
          <div className="bg-[#004b87] h-full transition-all duration-300 rounded-full" style={{ width: `${progressPct}%` }} />
        </div>
      </div>

      <div className="p-4 space-y-4">
        {/* All steps stacked; scroll to move between them (no Next button) */}
        {steps.map((step, index) => (
          <GuidedStep
            key={step.id}
            step={step}
            stepIndex={index}
            totalSteps={totalSteps}
            registerRef={registerRef}
            isActive={index === activeIndex}
          />
        ))}

        {/* Completion card sits at the end of the scroll, after the last step */}
        <Card variant="default" className="border-2 border-emerald-400 bg-emerald-50/70 p-6 text-center space-y-4">
          <div className="w-16 h-16 mx-auto rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center">
            <CheckCircle2 className="w-10 h-10 stroke-[2.5]" />
          </div>
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-800">Journey Completed</span>
            <h2 className="text-2xl font-black text-slate-900 mt-1">You have arrived at {currentJourney.destinationName}</h2>
          </div>
          <div className="p-3 bg-white rounded-xl border border-emerald-200 text-xs text-slate-700 space-y-1">
            <div className="flex justify-between font-medium">
              <span>Arrival time:</span>
              <strong className="text-emerald-800">{activeRoute.arrivalTime}</strong>
            </div>
            <div className="flex justify-between font-medium">
              <span>Target arrival:</span>
              <strong>{currentJourney.targetArrivalTime}</strong>
            </div>
            {activeRoute.metrics.isStepFree && (
              <div className="flex justify-between font-medium">
                <span>Route status:</span>
                <strong className="text-emerald-700">100% Step-free maintained</strong>
              </div>
            )}
          </div>
          <Button variant="primary" size="lg" fullWidth onClick={() => router.push('/')} leftIcon={<Home className="w-5 h-5" />} className="py-3.5">
            Back to Home
          </Button>
        </Card>
      </div>
    </div>
  );
}
