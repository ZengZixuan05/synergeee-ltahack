'use client';

import React, { useState } from 'react';
import {
  User,
  MapPin,
  Calendar,
  Clock,
  Edit2,
  Footprints,
  Umbrella,
  Shuffle,
  Users,
  Train,
  Bus,
  Bike,
  Accessibility,
  ArrowUpDown,
  Layers,
  Globe,
  Bell,
  Check,
} from 'lucide-react';
import { useDemoMode } from '@/features/demo/useDemoMode';
import { PageHeader } from '@/components/layout/PageHeader';
import { PreferenceSection } from '@/components/profile/PreferenceSection';
import { PreferenceControl } from '@/components/profile/PreferenceControl';
import { TextSizeControl } from '@/components/profile/TextSizeControl';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { WalkingPace, ContinuousWalkDistance, LanguageCode, TransportMode } from '@/types';
import { cn } from '@/lib/utils';

export default function ProfilePage() {
  const { commuter, updatePreferences, textSize, setTextSize } = useDemoMode();
  const prefs = commuter.preferences;
  const [isEditingJourney, setIsEditingJourney] = useState(false);
  const [saveToast, setSaveToast] = useState(false);

  const showSavedToast = () => {
    setSaveToast(true);
    setTimeout(() => setSaveToast(false), 2000);
  };

  const handleToggleMode = (mode: TransportMode) => {
    const exists = prefs.transportModes.includes(mode);
    const updated = exists
      ? prefs.transportModes.filter((m) => m !== mode)
      : [...prefs.transportModes, mode];
    updatePreferences({ transportModes: updated });
  };

  return (
    <div className="flex-1 flex flex-col pb-8">
      <PageHeader
        title="Profile & Preferences"
        subtitle="Personalised commuter settings"
      />

      <div className="p-4 space-y-5">
        {/* Commuter Persona Header Card */}
        <Card variant="default" className="border border-slate-200 bg-gradient-to-r from-red-50/50 via-white to-slate-50 p-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-[#d42426] text-white flex items-center justify-center font-bold text-lg shadow-sm">
              {commuter.name.charAt(0)}
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <h1 className="text-base font-bold text-slate-900 truncate">
                  {commuter.name}
                </h1>
                <span className="text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded bg-red-100 text-[#d42426]">
                  Sample Commuter
                </span>
              </div>
              <p className="text-xs text-slate-500 font-medium truncate mt-0.5">
                {commuter.homeLocation.name}
              </p>
            </div>
          </div>
        </Card>

        {/* 1. MY JOURNEYS */}
        <section aria-label="My Journeys" className="space-y-2">
          <div className="flex items-center justify-between">
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-500">
              My Journeys
            </h2>
            <span className="text-[11px] text-slate-500 font-medium">1 active routine</span>
          </div>

          <Card variant="default" className="border-2 border-slate-200 p-4 bg-white space-y-3">
            <div className="flex items-start justify-between gap-2">
              <div>
                <h3 className="text-base font-bold text-slate-900">
                  SGH Appointment
                </h3>
                <p className="text-xs font-medium text-slate-500 mt-0.5">
                  Sky Eden @ Bedok → Singapore General Hospital
                </p>
              </div>
              <span className="text-[11px] font-bold text-emerald-800 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-md">
                Active
              </span>
            </div>

            <div className="flex flex-wrap items-center gap-3 text-xs text-slate-700 bg-slate-50 p-2.5 rounded-xl border border-slate-200">
              <div className="flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-slate-500" />
                <span>Every second Monday</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-slate-500" />
                <span>Arrive by <strong>10:00 AM</strong></span>
              </div>
            </div>

            <Button
              variant="outline"
              size="sm"
              fullWidth
              onClick={() => {
                setIsEditingJourney(!isEditingJourney);
                if (isEditingJourney) showSavedToast();
              }}
              leftIcon={<Edit2 className="w-3.5 h-3.5 text-slate-600" />}
            >
              {isEditingJourney ? 'Save Journey' : 'Edit journey'}
            </Button>

            {isEditingJourney && (
              <div className="p-3 bg-red-50/50 rounded-xl border border-red-200 text-xs text-slate-700 space-y-2 animate-fadeIn">
                <p className="font-bold text-[#d42426]">Edit Schedule (UI Prototype)</p>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-[10px] uppercase font-bold text-slate-500 block">Frequency</label>
                    <input
                      type="text"
                      defaultValue="Every second Monday"
                      className="w-full text-xs p-1.5 rounded border border-slate-300 bg-white font-medium"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] uppercase font-bold text-slate-500 block">Arrive By</label>
                    <input
                      type="text"
                      defaultValue="10:00 AM"
                      className="w-full text-xs p-1.5 rounded border border-slate-300 bg-white font-medium"
                    />
                  </div>
                </div>
              </div>
            )}
          </Card>
        </section>

        {/* 2. JOURNEY PREFERENCES */}
        <PreferenceSection
          title="Journey Preferences"
          description="We tailor proactive suggestions against these criteria"
        >
          <PreferenceControl
            id="pref-min-walking"
            label="Minimise walking"
            description="Prioritise shorter walking transfers even if slightly longer"
            checked={prefs.minimiseWalking}
            onChange={(val) => updatePreferences({ minimiseWalking: val })}
            icon={<Footprints className="w-4 h-4" />}
          />
          <PreferenceControl
            id="pref-sheltered"
            label="Prefer sheltered routes"
            description="Favour covered walkways and underground station links"
            checked={prefs.preferSheltered}
            onChange={(val) => updatePreferences({ preferSheltered: val })}
            icon={<Umbrella className="w-4 h-4" />}
          />
          <PreferenceControl
            id="pref-fewer-transfers"
            label="Prefer fewer transfers"
            description="Keep journey simple with direct lines where possible"
            checked={prefs.preferFewerTransfers}
            onChange={(val) => updatePreferences({ preferFewerTransfers: val })}
            icon={<Shuffle className="w-4 h-4" />}
          />
          <PreferenceControl
            id="pref-avoid-crowding"
            label="Avoid high crowding"
            description="Alert when carriages or concourses exceed comfortable limits"
            checked={prefs.avoidHighCrowding}
            onChange={(val) => updatePreferences({ avoidHighCrowding: val })}
            icon={<Users className="w-4 h-4" />}
          />

          {/* Transport Modes Selector */}
          <div className="py-3 space-y-2">
            <span className="text-sm font-bold text-slate-900 block">
              Transport modes
            </span>
            <div className="grid grid-cols-2 gap-2">
              {[
                { id: 'rail', label: 'Rail (MRT/LRT)', icon: Train },
                { id: 'bus', label: 'Public Bus', icon: Bus },
                { id: 'walking', label: 'Walking', icon: Footprints },
                { id: 'cycling', label: 'Cycling', icon: Bike },
              ].map(({ id, label, icon: Icon }) => {
                const isSelected = prefs.transportModes.includes(id as TransportMode);
                return (
                  <button
                    key={id}
                    type="button"
                    onClick={() => handleToggleMode(id as TransportMode)}
                    className={cn(
                      'p-2.5 rounded-xl border text-xs font-bold flex items-center gap-2 transition-all min-h-[44px] focus-visible:outline-2',
                      isSelected
                        ? 'border-[#d42426] bg-red-50 text-[#d42426]'
                        : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                    )}
                  >
                    <Icon className="w-4 h-4" />
                    <span>{label}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </PreferenceSection>

        {/* 3. ACCESSIBILITY */}
        <PreferenceSection
          title="Accessibility Requirements"
          description="Routes are filtered to guarantee barrier-free compliance"
        >
          <PreferenceControl
            id="acc-avoid-stairs"
            label="Avoid stairs"
            description="100% barrier-free paths; ramps or level crossings only"
            checked={prefs.avoidStairs}
            onChange={(val) => updatePreferences({ avoidStairs: val })}
            icon={<Accessibility className="w-4 h-4" />}
          />
          <PreferenceControl
            id="acc-require-lifts"
            label="Require working lifts"
            description="Immediately reroute if station concourse or platform lift is out of service"
            checked={prefs.requireWorkingLifts}
            onChange={(val) => updatePreferences({ requireWorkingLifts: val })}
            icon={<ArrowUpDown className="w-4 h-4" />}
          />
          <PreferenceControl
            id="acc-wheelchair"
            label="Wheelchair mode"
            description="Include wide-fare-gate and ramp clearance indicators"
            checked={prefs.wheelchairMode}
            onChange={(val) => updatePreferences({ wheelchairMode: val })}
            icon={<Accessibility className="w-4 h-4" />}
          />

          {/* Walking Pace Selector */}
          <div className="py-3 space-y-2">
            <span className="text-sm font-bold text-slate-900 block">
              Walking pace
            </span>
            <div className="grid grid-cols-3 gap-1.5 p-1 bg-slate-100 rounded-xl">
              {[
                { id: 'slow', label: 'Slow (3 km/h)' },
                { id: 'standard', label: 'Standard (4 km/h)' },
                { id: 'fast', label: 'Fast (5 km/h)' },
              ].map((pace) => {
                const isSelected = prefs.walkingPace === pace.id;
                return (
                  <button
                    key={pace.id}
                    type="button"
                    onClick={() => updatePreferences({ walkingPace: pace.id as WalkingPace })}
                    className={cn(
                      'py-2 px-1 text-center rounded-lg text-xs font-bold transition-all min-h-[44px] focus-visible:outline-2',
                      isSelected
                        ? 'bg-white text-[#d42426] shadow-xs'
                        : 'text-slate-600 hover:text-slate-900'
                    )}
                  >
                    {pace.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Maximum Comfortable Continuous Walk */}
          <div className="py-3 space-y-2">
            <span className="text-sm font-bold text-slate-900 block">
              Maximum comfortable continuous walk
            </span>
            <div className="grid grid-cols-4 gap-1 p-1 bg-slate-100 rounded-xl">
              {[
                { id: '200m', label: '200 m' },
                { id: '400m', label: '400 m' },
                { id: '600m', label: '600 m' },
                { id: 'no-preference', label: 'Any' },
              ].map((dist) => {
                const isSelected = prefs.maxContinuousWalk === dist.id;
                return (
                  <button
                    key={dist.id}
                    type="button"
                    onClick={() =>
                      updatePreferences({
                        maxContinuousWalk: dist.id as ContinuousWalkDistance,
                      })
                    }
                    className={cn(
                      'py-2 px-1 text-center rounded-lg text-xs font-bold transition-all min-h-[44px] focus-visible:outline-2',
                      isSelected
                        ? 'bg-white text-[#d42426] shadow-xs'
                        : 'text-slate-600 hover:text-slate-900'
                    )}
                  >
                    {dist.label}
                  </button>
                );
              })}
            </div>
          </div>
        </PreferenceSection>

        {/* 4. DISPLAY & TEXT SIZING */}
        <PreferenceSection
          title="Display & Accessibility"
          description="Adjust typography scale and preferred language"
        >
          <TextSizeControl
            currentSize={textSize}
            onChange={(size) => setTextSize(size)}
          />

          {/* Language Selector */}
          <div className="py-3 space-y-2">
            <div className="flex items-center gap-2 text-sm font-bold text-slate-900">
              <Globe className="w-4 h-4 text-slate-600" />
              <span>Language</span>
            </div>
            <div className="grid grid-cols-2 gap-2">
              {[
                { id: 'en', label: 'English' },
                { id: 'zh', label: '中文 (Chinese)' },
                { id: 'ms', label: 'Melayu (Malay)' },
                { id: 'ta', label: 'தமிழ் (Tamil)' },
              ].map((lang) => {
                const isSelected = prefs.language === lang.id;
                return (
                  <button
                    key={lang.id}
                    type="button"
                    onClick={() => updatePreferences({ language: lang.id as LanguageCode })}
                    className={cn(
                      'p-2.5 rounded-xl border text-xs font-bold text-left transition-all min-h-[44px] flex items-center justify-between focus-visible:outline-2',
                      isSelected
                        ? 'border-[#d42426] bg-red-50 text-[#d42426]'
                        : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                    )}
                  >
                    <span>{lang.label}</span>
                    {isSelected && <Check className="w-4 h-4 text-[#d42426]" />}
                  </button>
                );
              })}
            </div>
          </div>
        </PreferenceSection>

        {/* 5. NOTIFICATIONS */}
        <PreferenceSection
          title="Proactive Notifications"
          description="Control which types of transport events trigger proactive rerouting advice"
        >
          <PreferenceControl
            id="notif-planned"
            label="Planned disruptions"
            description="Advance warnings for scheduled track or lift maintenance"
            checked={prefs.notifications.plannedDisruptions}
            onChange={(val) =>
              updatePreferences({
                notifications: {
                  ...prefs.notifications,
                  plannedDisruptions: val,
                },
              })
            }
            icon={<Bell className="w-4 h-4" />}
          />
          <PreferenceControl
            id="notif-unexpected"
            label="Unexpected disruptions"
            description="Immediate notification when train fault or lift breakdown occurs"
            checked={prefs.notifications.unexpectedDisruptions}
            onChange={(val) =>
              updatePreferences({
                notifications: {
                  ...prefs.notifications,
                  unexpectedDisruptions: val,
                },
              })
            }
            icon={<Bell className="w-4 h-4" />}
          />
          <PreferenceControl
            id="notif-weather"
            label="Weather affecting my journey"
            description="Warnings when heavy rain impacts unsheltered links"
            checked={prefs.notifications.weatherDisruptions}
            onChange={(val) =>
              updatePreferences({
                notifications: {
                  ...prefs.notifications,
                  weatherDisruptions: val,
                },
              })
            }
            icon={<Umbrella className="w-4 h-4" />}
          />
          <PreferenceControl
            id="notif-crowding"
            label="Crowding affecting my journey"
            description="Alerts when high peak volume will cause elevator queues"
            checked={prefs.notifications.crowdingDisruptions}
            onChange={(val) =>
              updatePreferences({
                notifications: {
                  ...prefs.notifications,
                  crowdingDisruptions: val,
                },
              })
            }
            icon={<Users className="w-4 h-4" />}
          />
        </PreferenceSection>

        {/* Save confirmation toast */}
        {saveToast && (
          <div className="fixed bottom-20 left-1/2 -translate-x-1/2 bg-slate-900 text-white px-4 py-2 rounded-full text-xs font-bold shadow-lg flex items-center gap-1.5 animate-fadeIn z-50">
            <Check className="w-4 h-4 text-emerald-400" />
            <span>Preferences saved</span>
          </div>
        )}
      </div>
    </div>
  );
}
