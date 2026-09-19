'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { CheckCircle2, Home, MapPin, ArrowRight, ShieldCheck, Heart } from 'lucide-react';
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
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [isMapOpen, setIsMapOpen] = useState(false);
  const [isJourneyComplete, setIsJourneyComplete] = useState(false);

  const steps = recommendedRoute.steps;
  const currentStep = steps[currentStepIndex];

  const handleNext = () => {
    if (currentStepIndex < steps.length - 1) {
      setCurrentStepIndex((prev) => prev + 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else {
      setIsJourneyComplete(true);
    }
  };

  const handleBack = () => {
    if (currentStepIndex > 0) {
      setCurrentStepIndex((prev) => prev - 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  return (
    <div className="flex-1 flex flex-col pb-8">
      <PageHeader
        title="Guided Navigation"
        subtitle="To Singapore General Hospital (SGH)"
        showBack={true}
        onBack={() => router.push('/journey/compare')}
        rightAction={isDisrupted ? <DemoBadge size="sm" /> : undefined}
      />

      <div className="p-4 space-y-4">
        {/* Toggleable Map View for Situational Awareness */}
        {isMapOpen && (
          <div className="animate-fadeIn">
            <MapPlaceholder heightClass="h-44" showAffectedDetour={isDisrupted} />
          </div>
        )}

        {/* Guided Step or Completion View */}
        {!isJourneyComplete ? (
          <GuidedStep
            step={currentStep}
            currentStepIndex={currentStepIndex}
            totalSteps={steps.length}
            onNext={handleNext}
            onBack={handleBack}
            onToggleMap={() => setIsMapOpen(!isMapOpen)}
            isMapOpen={isMapOpen}
          />
        ) : (
          <Card variant="default" className="border-2 border-emerald-400 bg-emerald-50/70 p-6 text-center space-y-4 animate-fadeIn">
            <div className="w-16 h-16 mx-auto rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center">
              <CheckCircle2 className="w-10 h-10 stroke-[2.5]" />
            </div>

            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-emerald-800">
                Journey Completed
              </span>
              <h2 className="text-2xl font-black text-slate-900 mt-1">
                You have arrived at SGH
              </h2>
              <p className="text-sm font-semibold text-slate-700 mt-1">
                Specialist Outpatient Clinic 4A · Level 2
              </p>
            </div>

            <div className="p-3 bg-white rounded-xl border border-emerald-200 text-xs text-slate-700 space-y-1">
              <div className="flex justify-between font-medium">
                <span>Arrival time:</span>
                <strong className="text-emerald-800">9:48 AM</strong>
              </div>
              <div className="flex justify-between font-medium">
                <span>Appointment:</span>
                <strong>10:00 AM (12 min early)</strong>
              </div>
              <div className="flex justify-between font-medium">
                <span>Route status:</span>
                <strong className="text-emerald-700">100% Step-free maintained</strong>
              </div>
            </div>

            <Button
              variant="primary"
              size="lg"
              fullWidth
              onClick={() => router.push('/')}
              leftIcon={<Home className="w-5 h-5" />}
              className="py-3.5"
            >
              Back to Home
            </Button>
          </Card>
        )}
      </div>
    </div>
  );
}
