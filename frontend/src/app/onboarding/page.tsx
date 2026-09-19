'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Zap,
  Footprints,
  Umbrella,
  Shuffle,
  Users,
  Check,
  ChevronRight,
  ChevronLeft,
  Accessibility,
  ArrowRight,
  ShieldCheck,
  Sparkles,
  Sliders,
  Type,
  Globe,
  Route,
  Plus,
} from 'lucide-react';
import { useAuth } from '@/features/auth/useAuth';
import { OnboardingFormState } from '@/types/auth';
import { SavedJourney } from '@/types/journey';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { JourneySummaryCard } from '@/components/journey-editor/JourneySummaryCard';
import { JourneyEditor } from '@/components/journey-editor/JourneyEditor';

export default function OnboardingPage() {
  const router = useRouter();
  const { user, completeOnboarding } = useAuth();

  const [currentStep, setCurrentStep] = useState<number>(1);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Step 5 (Regular Routes) local UI state
  const [routeEditorView, setRouteEditorView] = useState<'list' | 'form'>('list');
  const [editingRouteId, setEditingRouteId] = useState<string | null>(null);

  // Form State
  const [formData, setFormData] = useState<OnboardingFormState>({
    priorities: {
      faster: false,
      lessWalking: true,
      sheltered: true,
      fewerTransfers: true,
      lessCrowded: false,
    },
    accessibility: {
      avoidStairs: true,
      requireWorkingLifts: true,
      wheelchairMode: false,
    },
    walking: {
      walkingPace: 'slow',
      maxContinuousWalk: '400m',
    },
    display: {
      textSize: 'large',
      language: 'en',
    },
    regularRoutes: [],
  });

  const handleNext = () => {
    if (currentStep < 6) {
      if (currentStep === 5) {
        setRouteEditorView('list');
        setEditingRouteId(null);
      }
      setCurrentStep((prev) => prev + 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handleSaveRoute = (route: SavedJourney) => {
    setFormData((prev) => {
      const exists = prev.regularRoutes.some((r) => r.id === route.id);
      return {
        ...prev,
        regularRoutes: exists
          ? prev.regularRoutes.map((r) => (r.id === route.id ? route : r))
          : [...prev.regularRoutes, route],
      };
    });
    setRouteEditorView('list');
    setEditingRouteId(null);
  };

  const handleRemoveRoute = (id: string) => {
    setFormData((prev) => ({
      ...prev,
      regularRoutes: prev.regularRoutes.filter((r) => r.id !== id),
    }));
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep((prev) => prev - 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handleComplete = async () => {
    setIsSubmitting(true);
    try {
      await completeOnboarding(formData);
      router.push('/');
    } catch (err) {
      console.error('Failed to save onboarding preferences:', err);
      setIsSubmitting(false);
    }
  };

  const updateTextSize = (size: 'standard' | 'large' | 'xlarge') => {
    setFormData((prev) => ({
      ...prev,
      display: { ...prev.display, textSize: size },
    }));
    // Live update document attribute
    if (typeof document !== 'undefined') {
      document.documentElement.setAttribute('data-text-size', size);
    }
  };

  return (
    <div className="flex-1 flex flex-col px-4 py-6 max-w-md mx-auto w-full">
      {/* Onboarding Header */}
      <div className="space-y-2 mb-5">
        <div className="flex items-center justify-between text-xs font-bold text-slate-500 uppercase tracking-wider">
          <span>Step {currentStep} of 6</span>
          <span className="text-[#004b87]">
            {currentStep === 1 && 'Journey Priorities'}
            {currentStep === 2 && 'Accessibility'}
            {currentStep === 3 && 'Walking'}
            {currentStep === 4 && 'Display & Language'}
            {currentStep === 5 && 'Regular Routes'}
            {currentStep === 6 && 'Summary'}
          </span>
        </div>

        {/* Progress Bar */}
        <div className="w-full h-1.5 bg-slate-200 rounded-full overflow-hidden">
          <div
            className="h-full bg-[#004b87] transition-all duration-300 rounded-full"
            style={{ width: `${(currentStep / 6) * 100}%` }}
          />
        </div>
      </div>

      {/* Step Content */}
      <div className="flex-1 flex flex-col justify-between space-y-6">
        {/* STEP 1: JOURNEY PRIORITIES */}
        {currentStep === 1 && (
          <div className="space-y-4 animate-fadeIn">
            <div>
              <h1 className="text-xl font-black text-slate-900 tracking-tight">
                What matters to you?
              </h1>
              <p className="text-xs text-slate-500 mt-1">
                Select your travel priorities so JourneyAheadSG can recommend the best transit options.
              </p>
            </div>

            <div className="space-y-2.5">
              {[
                {
                  id: 'faster',
                  label: 'Faster journeys',
                  description: 'Prioritise shortest travel time',
                  icon: <Zap className="w-5 h-5 text-amber-500" />,
                  checked: formData.priorities.faster,
                },
                {
                  id: 'lessWalking',
                  label: 'Less walking',
                  description: 'Minimise walking distance between stations',
                  icon: <Footprints className="w-5 h-5 text-[#00847f]" />,
                  checked: formData.priorities.lessWalking,
                },
                {
                  id: 'sheltered',
                  label: 'More sheltered',
                  description: 'Maximise covered walkways against sun and rain',
                  icon: <Umbrella className="w-5 h-5 text-blue-500" />,
                  checked: formData.priorities.sheltered,
                },
                {
                  id: 'fewerTransfers',
                  label: 'Fewer transfers',
                  description: 'Prefer direct routes without line interchanges',
                  icon: <Shuffle className="w-5 h-5 text-indigo-500" />,
                  checked: formData.priorities.fewerTransfers,
                },
                {
                  id: 'lessCrowded',
                  label: 'Less crowded',
                  description: 'Avoid peak congestion trains and buses',
                  icon: <Users className="w-5 h-5 text-teal-600" />,
                  checked: formData.priorities.lessCrowded,
                },
              ].map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() =>
                    setFormData((prev) => ({
                      ...prev,
                      priorities: {
                        ...prev.priorities,
                        [item.id]: !prev.priorities[item.id as keyof typeof prev.priorities],
                      },
                    }))
                  }
                  className={`w-full p-3.5 rounded-xl border text-left flex items-center justify-between transition-all min-h-[52px] ${
                    item.checked
                      ? 'border-[#004b87] bg-[#f0f5fa] shadow-xs'
                      : 'border-slate-200 bg-white hover:border-slate-300'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-slate-50 border border-slate-100 shrink-0">
                      {item.icon}
                    </div>
                    <div>
                      <p className="text-sm font-bold text-slate-900 leading-snug">
                        {item.label}
                      </p>
                      <p className="text-xs text-slate-500 font-medium leading-snug">
                        {item.description}
                      </p>
                    </div>
                  </div>
                  <div
                    className={`w-5 h-5 rounded-md flex items-center justify-center shrink-0 border transition-colors ${
                      item.checked
                        ? 'bg-[#004b87] border-[#004b87] text-white'
                        : 'border-slate-300 bg-white'
                    }`}
                  >
                    {item.checked && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* STEP 2: ACCESSIBILITY */}
        {currentStep === 2 && (
          <div className="space-y-4 animate-fadeIn">
            <div>
              <div className="inline-flex items-center gap-1 text-[11px] font-bold text-[#00847f] uppercase tracking-wider">
                <Accessibility className="w-3.5 h-3.5" />
                <span>Optional Accessibility</span>
              </div>
              <h1 className="text-xl font-black text-slate-900 tracking-tight mt-0.5">
                Barrier-free requirements
              </h1>
              <p className="text-xs text-slate-500 mt-1">
                JourneyAheadSG guarantees 100% step-free routing when these options are enabled.
              </p>
            </div>

            <div className="space-y-2.5">
              {[
                {
                  key: 'avoidStairs',
                  label: 'Avoid stairs',
                  description: 'Strictly route via ramps, lifts, and level paths',
                  checked: formData.accessibility.avoidStairs,
                },
                {
                  key: 'requireWorkingLifts',
                  label: 'Require working lifts',
                  description: 'Alert and reroute in advance if station lift is out of order',
                  checked: formData.accessibility.requireWorkingLifts,
                },
                {
                  key: 'wheelchairMode',
                  label: 'Wheelchair accessible',
                  description: 'Prioritise wide fare gates and wheelchair bay boarding',
                  checked: formData.accessibility.wheelchairMode,
                },
              ].map((item) => (
                <button
                  key={item.key}
                  type="button"
                  onClick={() =>
                    setFormData((prev) => ({
                      ...prev,
                      accessibility: {
                        ...prev.accessibility,
                        [item.key]: !prev.accessibility[item.key as keyof typeof prev.accessibility],
                      },
                    }))
                  }
                  className={`w-full p-4 rounded-xl border text-left flex items-center justify-between transition-all min-h-[56px] ${
                    item.checked
                      ? 'border-[#00847f] bg-teal-50/50 shadow-xs'
                      : 'border-slate-200 bg-white hover:border-slate-300'
                  }`}
                >
                  <div className="pr-2">
                    <p className="text-sm font-bold text-slate-900">
                      {item.label}
                    </p>
                    <p className="text-xs text-slate-500 mt-0.5 leading-snug">
                      {item.description}
                    </p>
                  </div>
                  <div
                    className={`w-5 h-5 rounded-md flex items-center justify-center shrink-0 border transition-colors ${
                      item.checked
                        ? 'bg-[#00847f] border-[#00847f] text-white'
                        : 'border-slate-300 bg-white'
                    }`}
                  >
                    {item.checked && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* STEP 3: WALKING */}
        {currentStep === 3 && (
          <div className="space-y-5 animate-fadeIn">
            <div>
              <h1 className="text-xl font-black text-slate-900 tracking-tight">
                Walking preferences
              </h1>
              <p className="text-xs text-slate-500 mt-1">
                Customize journey estimates to match your natural walking pace.
              </p>
            </div>

            {/* Walking Pace */}
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-700 block">
                Walking pace
              </label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { value: 'slow', label: 'Slow', sub: '~3 km/h' },
                  { value: 'standard', label: 'Standard', sub: '~4 km/h' },
                  { value: 'fast', label: 'Fast', sub: '~5 km/h' },
                ].map((item) => (
                  <button
                    key={item.value}
                    type="button"
                    onClick={() =>
                      setFormData((prev) => ({
                        ...prev,
                        walking: {
                          ...prev.walking,
                          walkingPace: item.value as 'slow' | 'standard' | 'fast',
                        },
                      }))
                    }
                    className={`p-3 rounded-xl border text-center transition-all min-h-[50px] ${
                      formData.walking.walkingPace === item.value
                        ? 'border-[#004b87] bg-[#f0f5fa] text-[#004b87] font-bold shadow-xs'
                        : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300'
                    }`}
                  >
                    <p className="text-sm font-bold">{item.label}</p>
                    <p className="text-[11px] text-slate-500">{item.sub}</p>
                  </button>
                ))}
              </div>
            </div>

            {/* Maximum Continuous Walk */}
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-700 block">
                Maximum comfortable continuous walk
              </label>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { value: '200m', label: '200 metres', sub: 'Short stroll' },
                  { value: '400m', label: '400 metres', sub: 'Moderate (~5 min)' },
                  { value: '600m', label: '600 metres', sub: 'Standard' },
                  { value: 'no-preference', label: 'No preference', sub: 'Any distance' },
                ].map((item) => (
                  <button
                    key={item.value}
                    type="button"
                    onClick={() =>
                      setFormData((prev) => ({
                        ...prev,
                        walking: {
                          ...prev.walking,
                          maxContinuousWalk: item.value as any,
                        },
                      }))
                    }
                    className={`p-3 rounded-xl border text-left transition-all min-h-[54px] ${
                      formData.walking.maxContinuousWalk === item.value
                        ? 'border-[#004b87] bg-[#f0f5fa] text-[#004b87] font-bold shadow-xs'
                        : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300'
                    }`}
                  >
                    <p className="text-xs font-bold">{item.label}</p>
                    <p className="text-[11px] text-slate-500">{item.sub}</p>
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* STEP 4: DISPLAY & LANGUAGE */}
        {currentStep === 4 && (
          <div className="space-y-5 animate-fadeIn">
            <div>
              <h1 className="text-xl font-black text-slate-900 tracking-tight">
                Display & Language
              </h1>
              <p className="text-xs text-slate-500 mt-1">
                Customize reading comfort and preferred language.
              </p>
            </div>

            {/* Text Size */}
            <div className="space-y-2">
              <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-slate-700">
                <Type className="w-4 h-4 text-[#004b87]" />
                <span>Text size</span>
              </div>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { value: 'standard', label: 'Standard', preview: '16px' },
                  { value: 'large', label: 'Large', preview: '18.5px' },
                  { value: 'xlarge', label: 'Extra Large', preview: '21px' },
                ].map((item) => (
                  <button
                    key={item.value}
                    type="button"
                    onClick={() => updateTextSize(item.value as any)}
                    className={`p-3 rounded-xl border text-center transition-all min-h-[50px] ${
                      formData.display.textSize === item.value
                        ? 'border-[#004b87] bg-[#f0f5fa] text-[#004b87] font-bold shadow-xs'
                        : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300'
                    }`}
                  >
                    <p className="text-sm font-bold">{item.label}</p>
                    <p className="text-[11px] text-slate-500">{item.preview}</p>
                  </button>
                ))}
              </div>
            </div>

            {/* Language */}
            <div className="space-y-2">
              <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-slate-700">
                <Globe className="w-4 h-4 text-[#004b87]" />
                <span>Language</span>
              </div>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { code: 'en', label: 'English', local: 'Default' },
                  { code: 'zh', label: '中文', local: 'Chinese' },
                  { code: 'ms', label: 'Bahasa Melayu', local: 'Malay' },
                  { code: 'ta', label: 'தமிழ்', local: 'Tamil' },
                ].map((item) => (
                  <button
                    key={item.code}
                    type="button"
                    onClick={() =>
                      setFormData((prev) => ({
                        ...prev,
                        display: { ...prev.display, language: item.code as any },
                      }))
                    }
                    className={`p-3 rounded-xl border text-left transition-all min-h-[50px] ${
                      formData.display.language === item.code
                        ? 'border-[#004b87] bg-[#f0f5fa] text-[#004b87] font-bold shadow-xs'
                        : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300'
                    }`}
                  >
                    <p className="text-xs font-bold">{item.label}</p>
                    <p className="text-[11px] text-slate-500">{item.local}</p>
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* STEP 5: REGULAR ROUTES */}
        {currentStep === 5 && (
          <div className="space-y-4 animate-fadeIn">
            {routeEditorView === 'list' ? (
              <>
                <div>
                  <div className="inline-flex items-center gap-1 text-[11px] font-bold text-[#004b87] uppercase tracking-wider">
                    <Route className="w-3.5 h-3.5" />
                    <span>Optional</span>
                  </div>
                  <h1 className="text-xl font-black text-slate-900 tracking-tight mt-0.5">
                    Set up your regular routes
                  </h1>
                  <p className="text-xs text-slate-500 mt-1">
                    Add commutes you take often so JourneyAheadSG can plan them instantly. You can skip this and add routes later.
                  </p>
                </div>

                {formData.regularRoutes.length > 0 ? (
                  <div className="space-y-2.5">
                    {formData.regularRoutes.map((route) => (
                      <JourneySummaryCard
                        key={route.id}
                        journey={route}
                        onEdit={() => {
                          setEditingRouteId(route.id);
                          setRouteEditorView('form');
                        }}
                        onRemove={() => handleRemoveRoute(route.id)}
                      />
                    ))}
                  </div>
                ) : (
                  <div className="p-4 rounded-xl border border-dashed border-slate-300 text-center">
                    <p className="text-xs text-slate-500 font-medium">No routes added yet</p>
                  </div>
                )}

                <Button
                  type="button"
                  variant="outline"
                  size="md"
                  fullWidth
                  onClick={() => {
                    setEditingRouteId(null);
                    setRouteEditorView('form');
                  }}
                  leftIcon={<Plus className="w-4 h-4" />}
                >
                  Add a route
                </Button>
              </>
            ) : (
              <JourneyEditor
                initialJourney={
                  editingRouteId
                    ? formData.regularRoutes.find((r) => r.id === editingRouteId) ?? null
                    : null
                }
                onSave={handleSaveRoute}
                onCancel={() => {
                  setRouteEditorView('list');
                  setEditingRouteId(null);
                }}
              />
            )}
          </div>
        )}

        {/* STEP 6: REVIEW & COMPLETE */}
        {currentStep === 6 && (
          <div className="space-y-4 animate-fadeIn">
            <div>
              <div className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 uppercase tracking-wider">
                <ShieldCheck className="w-4 h-4" />
                <span>All set</span>
              </div>
              <h1 className="text-xl font-black text-slate-900 tracking-tight mt-0.5">
                Ready for your journey
              </h1>
              <p className="text-xs text-slate-500 mt-1">
                Your commuter profile is configured. You can update these anytime in your Profile.
              </p>
            </div>

            <Card variant="default" className="p-4 border border-slate-200 bg-white space-y-3 shadow-xs">
              <div className="border-b border-slate-100 pb-2.5">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                  Profile summary
                </span>
                <p className="text-base font-bold text-slate-900 mt-0.5">
                  {user?.displayName || 'Commuter'}
                </p>
                <p className="text-xs text-slate-500">
                  {user?.email}
                </p>
              </div>

              <div className="space-y-2 text-xs">
                <div className="flex justify-between py-1 border-b border-slate-50">
                  <span className="text-slate-500">Pace:</span>
                  <strong className="text-slate-800 capitalize">{formData.walking.walkingPace} (~3-4 km/h)</strong>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-50">
                  <span className="text-slate-500">Max walk:</span>
                  <strong className="text-slate-800">{formData.walking.maxContinuousWalk}</strong>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-50">
                  <span className="text-slate-500">Accessibility:</span>
                  <strong className="text-[#00847f]">
                    {formData.accessibility.avoidStairs ? '100% Step-free' : 'Standard'}
                  </strong>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-50">
                  <span className="text-slate-500">Text scale:</span>
                  <strong className="text-[#004b87] capitalize">{formData.display.textSize}</strong>
                </div>
                <div className="flex justify-between py-1">
                  <span className="text-slate-500">Regular routes:</span>
                  <strong className="text-slate-800">
                    {formData.regularRoutes.length === 0
                      ? 'None added'
                      : `${formData.regularRoutes.length} route${formData.regularRoutes.length > 1 ? 's' : ''} saved`}
                  </strong>
                </div>
                {formData.regularRoutes.length > 0 && (
                  <ul className="pl-1 space-y-0.5">
                    {formData.regularRoutes.map((route) => (
                      <li key={route.id} className="text-[11px] text-slate-500">
                        • {route.name}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </Card>
          </div>
        )}

        {/* Navigation Buttons */}
        {!(currentStep === 5 && routeEditorView === 'form') && (
          <div className="pt-4 border-t border-slate-200 space-y-2.5">
            {currentStep === 5 && (
              <button
                type="button"
                onClick={handleNext}
                className="w-full text-center text-xs font-bold text-slate-400 underline"
              >
                Skip for now
              </button>
            )}
            <div className="flex items-center gap-3">
              {currentStep > 1 && (
                <Button
                  type="button"
                  variant="outline"
                  size="lg"
                  onClick={handleBack}
                  disabled={isSubmitting}
                  leftIcon={<ChevronLeft className="w-4 h-4" />}
                  className="py-3 px-4"
                >
                  Back
                </Button>
              )}

              {currentStep < 6 ? (
                <Button
                  type="button"
                  variant="primary"
                  size="lg"
                  fullWidth
                  onClick={handleNext}
                  rightIcon={<ChevronRight className="w-4 h-4" />}
                  className="py-3"
                >
                  Continue
                </Button>
              ) : (
                <Button
                  type="button"
                  variant="primary"
                  size="lg"
                  fullWidth
                  isLoading={isSubmitting}
                  onClick={handleComplete}
                  rightIcon={<ArrowRight className="w-4 h-4" />}
                  className="py-3"
                >
                  Save & Start Journey
                </Button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
