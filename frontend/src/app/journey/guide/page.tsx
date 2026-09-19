'use client';

import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { CheckCircle2, Home, Map } from 'lucide-react';
import { useDemoMode } from '@/features/demo/useDemoMode';
import { PageHeader } from '@/components/layout/PageHeader';
import { GuidedStep } from '@/components/journey/GuidedStep';
import { MapPlaceholder } from '@/components/map/MapPlaceholder';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { DemoBadge } from '@/components/alerts/DemoBadge';

export default function GuidedJourneyPage() {
  const router = useRouter();
  const { recommendedRoute, isDisrupted } = useDemoMode();
  const steps = recommendedRoute.steps;
  const totalSteps = steps.length;

  const [activeIndex, setActiveIndex] = useState(0);
  const [isMapOpen, setIsMapOpen] = useState(false);
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

  const progressPct = Math.round(((activeIndex + 1) / totalSteps) * 100);


  return (
    <div className="flex-1 flex flex-col pb-8">
      <PageHeader
        title="Guided Navigation"
        subtitle="To Singapore General Hospital (SGH)"
        showBack={true}
        onBack={() => router.push('/journey/compare')}
        rightAction={isDisrupted ? <DemoBadge size="sm" /> : undefined}
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
        <div className="flex justify-end">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsMapOpen((v) => v === false)}
            leftIcon={<Map className="w-4 h-4 text-slate-600" />}
            className="text-slate-800"
          >{isMapOpen ? 'Hide map' : 'View map'}</Button>
        </div>

        {isMapOpen && (
          <div className="animate-fadeIn">
            <MapPlaceholder heightClass="h-44" showAffectedDetour={isDisrupted} />
          </div>
        )}

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
            <h2 className="text-2xl font-black text-slate-900 mt-1">You have arrived at SGH</h2>
            <p className="text-sm font-semibold text-slate-700 mt-1">Specialist Outpatient Clinic 4A · Level 2</p>
          </div>
          <div className="p-3 bg-white rounded-xl border border-emerald-200 text-xs text-slate-700 space-y-1">
            <div className="flex justify-between font-medium"><span>Arrival time:</span><strong className="text-emerald-800">9:48 AM</strong></div>
            <div className="flex justify-between font-medium"><span>Appointment:</span><strong>10:00 AM (12 min early)</strong></div>
            <div className="flex justify-between font-medium"><span>Route status:</span><strong className="text-emerald-700">100% Step-free maintained</strong></div>
          </div>
          <Button variant="primary" size="lg" fullWidth onClick={() => router.push('/')} leftIcon={<Home className="w-5 h-5" />} className="py-3.5">Back to Home</Button>
        </Card>
      </div>
    </div>
  );
}
