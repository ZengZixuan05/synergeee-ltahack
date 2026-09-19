'use client';

import React from 'react';
import { Footprints, Train, ArrowUpDown, AlertTriangle, CheckCircle2, Umbrella, Compass } from 'lucide-react';
import { JourneyStep } from '@/types';
import { Card } from '@/components/ui/Card';
import { CrowdingIndicator } from '@/components/accessibility/CrowdingIndicator';

interface GuidedStepProps {
  step: JourneyStep;
  stepIndex: number;
  totalSteps: number;
  /** Called with the step DOM node so the page can observe which step is in view. */
  registerRef?: (index: number, el: HTMLElement | null) => void;
  /** Whether this step is the one currently in the viewport (drives the active ring). */
  isActive?: boolean;
}

export function GuidedStep({ step, stepIndex, totalSteps, registerRef, isActive = false }: GuidedStepProps) {
  const isLastStep = stepIndex === totalSteps - 1;

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
    <section
      ref={(el) => registerRef?.(stepIndex, el)}
      data-step-index={stepIndex}
      aria-label={`Step ${stepIndex + 1} of ${totalSteps}: ${step.instruction}`}
      className="scroll-mt-28"
    >
      <Card variant="default" className={'p-5 shadow-xs space-y-4 bg-white border-2 transition-colors ' + (isActive ? 'border-[#004b87]' : 'border-slate-300')}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-14 h-14 rounded-2xl bg-[#f0f5fa] border border-[#b8d2eb] flex items-center justify-center flex-shrink-0">
              {getModeIcon()}
            </div>
            <span className="inline-flex items-center justify-center min-w-[2rem] h-8 px-2 rounded-full bg-[#004b87] text-white text-sm font-black">
              {stepIndex + 1}
            </span>
          </div>
          <div className="flex flex-wrap gap-1.5 justify-end">
            {step.isSheltered && (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold bg-indigo-50 text-indigo-900 border border-indigo-200">
                <Umbrella className="w-3.5 h-3.5 text-indigo-700" />
                Sheltered
              </span>
            )}
            {step.crowding && <CrowdingIndicator level={step.crowding} size="sm" />}
          </div>
        </div>

        <div>
          <h2 className="text-2xl font-black text-slate-950 leading-tight">{step.instruction}</h2>
          {step.subInstruction && (
            <p className="text-base font-semibold text-slate-700 mt-1.5 leading-relaxed">{step.subInstruction}</p>
          )}
        </div>

        {step.warningAlert && (
          <div className="p-3.5 rounded-xl bg-amber-50 border-2 border-amber-400 text-amber-950 space-y-1.5">
            <div className="flex items-center gap-2 text-sm font-black text-amber-900">
              <AlertTriangle className="w-5 h-5 text-amber-700 flex-shrink-0" />
              <span>{step.warningAlert.title}</span>
            </div>
            <p className="text-xs font-semibold leading-relaxed">{step.warningAlert.message}</p>
            {step.warningAlert.recommendation && (
              <div className="pt-1.5 border-t border-amber-200 text-xs font-bold text-emerald-900 flex items-center gap-1">
                <CheckCircle2 className="w-4 h-4 text-emerald-700 flex-shrink-0" />
                <span>{step.warningAlert.recommendation}</span>
              </div>
            )}
          </div>
        )}

        {step.confirmedStatus && (
          <div className="p-2.5 rounded-xl bg-emerald-50 border border-emerald-300 text-emerald-950 flex items-center gap-2 text-xs font-bold">
            <CheckCircle2 className="w-4 h-4 text-emerald-700 flex-shrink-0" />
            <span>{step.confirmedStatus}</span>
          </div>
        )}

        {(step.distanceMeters || step.estimatedMinutes || step.stopsCount) && (
          <div className="flex items-center gap-4 text-xs font-bold text-slate-700 pt-3 border-t border-slate-200">
            {step.distanceMeters && (
              <span className="flex items-center gap-1"><Footprints className="w-4 h-4 text-slate-500" />{step.distanceMeters} m</span>
            )}
            {step.estimatedMinutes && <span>About {step.estimatedMinutes} min</span>}
            {step.stopsCount && <span>{step.stopsCount} stops ({step.platform || 'Platform'})</span>}
          </div>
        )}

        {step.detail && (
          <p className="text-xs text-slate-600 bg-slate-50 p-2.5 rounded-xl border border-slate-200 leading-relaxed">{step.detail}</p>
        )}

        {isLastStep === false && (
          <p className="text-center text-[11px] font-semibold uppercase tracking-wider text-slate-400 pt-1">
            Scroll down for the next step
          </p>
        )}
      </Card>
    </section>
  );
}
