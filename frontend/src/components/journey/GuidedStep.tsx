'use client';

import React from 'react';
import {
  ArrowRight,
  ArrowLeft,
  Map,
  Footprints,
  Train,
  ArrowUpDown,
  AlertTriangle,
  CheckCircle2,
  Umbrella,
  Compass,
  CornerDownRight,
} from 'lucide-react';
import { JourneyStep } from '@/types';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { CrowdingIndicator } from '@/components/accessibility/CrowdingIndicator';
import { AccessibilityBadge } from '@/components/accessibility/AccessibilityBadge';

interface GuidedStepProps {
  step: JourneyStep;
  currentStepIndex: number;
  totalSteps: number;
  onNext: () => void;
  onBack: () => void;
  onToggleMap?: () => void;
  isMapOpen?: boolean;
}

export function GuidedStep({
  step,
  currentStepIndex,
  totalSteps,
  onNext,
  onBack,
  onToggleMap,
  isMapOpen = false,
}: GuidedStepProps) {
  const isFirstStep = currentStepIndex === 0;
  const isLastStep = currentStepIndex === totalSteps - 1;

  // Icon corresponding to step mode
  const getModeIcon = () => {
    switch (step.mode) {
      case 'walk':
        return <Footprints className="w-8 h-8 text-[#00847f]" />;
      case 'rail':
        return <Train className="w-8 h-8 text-[#009640]" />;
      case 'lift':
        return <ArrowUpDown className="w-8 h-8 text-[#004b87]" />;
      default:
        return <Compass className="w-8 h-8 text-slate-700" />;
    }
  };

  return (
    <div className="space-y-4">
      {/* Progress Bar & Step Counter */}
      <div className="space-y-1.5">
        <div className="flex items-center justify-between text-xs font-bold text-slate-700">
          <span className="uppercase tracking-wider text-[#004b87]">
            Step {currentStepIndex + 1} of {totalSteps}
          </span>
          <span className="text-slate-500">
            {Math.round(((currentStepIndex + 1) / totalSteps) * 100)}% completed
          </span>
        </div>

        {/* Progress track */}
        <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
          <div
            className="bg-[#004b87] h-full transition-all duration-300 rounded-full"
            style={{ width: `${((currentStepIndex + 1) / totalSteps) * 100}%` }}
          />
        </div>
      </div>

      {/* Main Single Instruction Card */}
      <Card variant="default" className="border-2 border-slate-300 p-5 shadow-xs space-y-4 bg-white">
        {/* Visual Directional Header / Mode Icon */}
        <div className="flex items-center justify-between">
          <div className="w-14 h-14 rounded-2xl bg-[#f0f5fa] border border-[#b8d2eb] flex items-center justify-center flex-shrink-0">
            {getModeIcon()}
          </div>

          <div className="flex flex-wrap gap-1.5 justify-end">
            {step.isSheltered && (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold bg-indigo-50 text-indigo-900 border border-indigo-200">
                <Umbrella className="w-3.5 h-3.5 text-indigo-700" />
                Sheltered
              </span>
            )}
            {step.crowding && (
              <CrowdingIndicator level={step.crowding} size="sm" />
            )}
          </div>
        </div>

        {/* Primary Instruction */}
        <div>
          <h2 className="text-2xl font-black text-slate-950 leading-tight">
            {step.instruction}
          </h2>
          {step.subInstruction && (
            <p className="text-base font-semibold text-slate-700 mt-1.5 leading-relaxed">
              {step.subInstruction}
            </p>
          )}
        </div>

        {/* Specific Outage / Lift Warning (e.g. Lift A vs Lift B) */}
        {step.warningAlert && (
          <div className="p-3.5 rounded-xl bg-amber-50 border-2 border-amber-400 text-amber-950 space-y-1.5">
            <div className="flex items-center gap-2 text-sm font-black text-amber-900">
              <AlertTriangle className="w-5 h-5 text-amber-700 flex-shrink-0" />
              <span>{step.warningAlert.title}</span>
            </div>
            <p className="text-xs font-semibold leading-relaxed">
              {step.warningAlert.message}
            </p>
            {step.warningAlert.recommendation && (
              <div className="pt-1.5 border-t border-amber-200 text-xs font-bold text-emerald-900 flex items-center gap-1">
                <CheckCircle2 className="w-4 h-4 text-emerald-700 flex-shrink-0" />
                <span>{step.warningAlert.recommendation}</span>
              </div>
            )}
          </div>
        )}

        {/* Working Lift Confirmed Badge */}
        {step.confirmedStatus && (
          <div className="p-2.5 rounded-xl bg-emerald-50 border border-emerald-300 text-emerald-950 flex items-center gap-2 text-xs font-bold">
            <CheckCircle2 className="w-4 h-4 text-emerald-700 flex-shrink-0" />
            <span>{step.confirmedStatus}</span>
          </div>
        )}

        {/* Step Detail / Distance / Estimated Time */}
        {(step.distanceMeters || step.estimatedMinutes || step.stopsCount) && (
          <div className="flex items-center gap-4 text-xs font-bold text-slate-700 pt-3 border-t border-slate-200">
            {step.distanceMeters && (
              <span className="flex items-center gap-1">
                <Footprints className="w-4 h-4 text-slate-500" />
                {step.distanceMeters} m
              </span>
            )}
            {step.estimatedMinutes && (
              <span>About {step.estimatedMinutes} min</span>
            )}
            {step.stopsCount && (
              <span>{step.stopsCount} stops ({step.platform || 'Platform'})</span>
            )}
          </div>
        )}

        {step.detail && (
          <p className="text-xs text-slate-600 bg-slate-50 p-2.5 rounded-xl border border-slate-200 leading-relaxed">
            {step.detail}
          </p>
        )}
      </Card>

      {/* Navigation Controls (One-handed ergonomics) */}
      <div className="pt-2 space-y-2.5">
        {/* Dominant Primary Next Button */}
        <Button
          variant="primary"
          size="lg"
          fullWidth
          onClick={onNext}
          rightIcon={!isLastStep ? <ArrowRight className="w-5 h-5" /> : <CheckCircle2 className="w-5 h-5" />}
          className="py-4 text-lg font-bold shadow-xs"
        >
          {isLastStep ? 'Finish Journey' : 'Next'}
        </Button>

        {/* Secondary controls: Back & View Map */}
        <div className="grid grid-cols-2 gap-2">
          <Button
            variant="outline"
            size="md"
            onClick={onBack}
            disabled={isFirstStep}
            leftIcon={<ArrowLeft className="w-4 h-4" />}
            className="text-slate-800"
          >
            Back
          </Button>

          <Button
            variant="outline"
            size="md"
            onClick={onToggleMap}
            leftIcon={<Map className="w-4 h-4 text-slate-600" />}
            className="text-slate-800"
          >
            {isMapOpen ? 'Hide Map' : 'View Map'}
          </Button>
        </div>
      </div>
    </div>
  );
}
