'use client';

import React, { Suspense, useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  User,
  MapPin,
  Calendar,
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
  BellRing,
  Check,
  LogOut,
  ShieldCheck,
} from 'lucide-react';
import { useDemoMode } from '@/features/demo/useDemoMode';
import { useAuth } from '@/features/auth/useAuth';
import { useOsNotification } from '@/hooks/useOsNotification';
import { PageHeader } from '@/components/layout/PageHeader';
import { PreferenceSection } from '@/components/profile/PreferenceSection';
import { PreferenceControl } from '@/components/profile/PreferenceControl';
import { TextSizeControl } from '@/components/profile/TextSizeControl';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { WalkingPace, ContinuousWalkDistance, LanguageCode, TransportMode } from '@/types';
import { SavedJourney } from '@/types/journey';
import { JourneySummaryCard } from '@/components/journey-editor/JourneySummaryCard';
import { JourneyEditor } from '@/components/journey-editor/JourneyEditor';
import { cn } from '@/lib/utils';

function ProfilePageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { commuter, updatePreferences, textSize, setTextSize } = useDemoMode();
  const { user, profile, signOut, updateRegularRoutes } = useAuth();
  const { permission: notificationPermission, requestPermission: requestNotificationPermission, notify } = useOsNotification();

  const prefs = commuter.preferences;
  const savedJourneys = profile?.regularRoutes ?? [];
  // Deep link from the home page's "Add a saved journey" prompt (?addJourney=1)
  // straight into the journey editor, instead of landing on a plain profile page.
  const [journeyEditorOpen, setJourneyEditorOpen] = useState(() => searchParams.get('addJourney') === '1');
  const [editingJourneyId, setEditingJourneyId] = useState<string | null>(null);
  const [saveToast, setSaveToast] = useState<string | null>(null);
  const [isSigningOut, setIsSigningOut] = useState(false);

  useEffect(() => {
    if (searchParams.get('addJourney') === '1') {
      router.replace('/profile');
    }
  }, [searchParams, router]);

  const showToast = (msg: string) => {
    setSaveToast(msg);
    setTimeout(() => setSaveToast(null), 2500);
  };

  const handleToggleMode = (mode: TransportMode) => {
    const exists = prefs.transportModes.includes(mode);
    const updated = exists
      ? prefs.transportModes.filter((m) => m !== mode)
      : [...prefs.transportModes, mode];
    updatePreferences({ transportModes: updated });
    showToast('Preferences updated');
  };

  const handleSignOut = async () => {
    setIsSigningOut(true);
    try {
      await signOut();
      router.push('/login');
    } catch (err) {
      console.error('Sign out error:', err);
      setIsSigningOut(false);
    }
  };

  const openAddJourney = () => {
    setEditingJourneyId(null);
    setJourneyEditorOpen(true);
  };

  const openEditJourney = (id: string) => {
    setEditingJourneyId(id);
    setJourneyEditorOpen(true);
  };

  const handleSaveJourney = async (journey: SavedJourney) => {
    const exists = savedJourneys.some((j) => j.id === journey.id);
    const next = exists ? savedJourneys.map((j) => (j.id === journey.id ? journey : j)) : [...savedJourneys, journey];
    try {
      await updateRegularRoutes(next);
      showToast(exists ? 'Journey updated' : 'Journey added');
    } catch (err) {
      console.error('Failed to save journey:', err);
    } finally {
      setJourneyEditorOpen(false);
      setEditingJourneyId(null);
    }
  };

  const handleRemoveJourney = async (id: string) => {
    try {
      await updateRegularRoutes(savedJourneys.filter((j) => j.id !== id));
      showToast('Journey removed');
    } catch (err) {
      console.error('Failed to remove journey:', err);
    }
  };

  const displayName = profile?.displayName || user?.displayName || commuter.name;
  const displayEmail = user?.email || 'commuter@example.sg';

  return (
    <div className="flex-1 flex flex-col pb-8">
      <PageHeader
        title="Profile & Preferences"
        subtitle="Personalised commuter settings"
      />

      <div className="p-4 space-y-5">
        {/* Commuter Persona Header Card */}
        <Card variant="default" className="border border-slate-200 bg-white p-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-[#004b87] text-white flex items-center justify-center font-bold text-lg shadow-xs">
              {displayName.charAt(0)}
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <h1 className="text-base font-bold text-slate-900 truncate">
                  {displayName}
                </h1>
                <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-[#f0f5fa] text-[#004b87] border border-[#b8d2eb]">
                  {user ? 'Authenticated' : 'Persona'}
                </span>
              </div>
              <p className="text-xs text-slate-500 font-medium truncate mt-0.5">
                {displayEmail}
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
            <span className="text-[11px] text-slate-500 font-medium">
              {savedJourneys.length} saved
            </span>
          </div>

          {savedJourneys.length > 0 ? (
            <div className="space-y-2.5">
              {savedJourneys.map((journey) => (
                <JourneySummaryCard
                  key={journey.id}
                  journey={journey}
                  onEdit={() => openEditJourney(journey.id)}
                  onRemove={() => handleRemoveJourney(journey.id)}
                />
              ))}
            </div>
          ) : (
            <div className="p-4 rounded-xl border border-dashed border-slate-300 text-center">
              <p className="text-xs text-slate-500 font-medium">No journeys saved yet</p>
            </div>
          )}

          <Button
            type="button"
            variant="outline"
            size="sm"
            fullWidth
            onClick={openAddJourney}
            leftIcon={<Calendar className="w-3.5 h-3.5 text-slate-600" />}
          >
            Add journey
          </Button>
        </section>

        {journeyEditorOpen && (
          <div className="fixed inset-0 z-50 bg-slate-50 overflow-y-auto">
            <div className="max-w-md mx-auto w-full px-4 py-6">
              <JourneyEditor
                initialJourney={editingJourneyId ? savedJourneys.find((j) => j.id === editingJourneyId) ?? null : null}
                onSave={handleSaveJourney}
                onCancel={() => {
                  setJourneyEditorOpen(false);
                  setEditingJourneyId(null);
                }}
              />
            </div>
          </div>
        )}

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
                        ? 'border-[#004b87] bg-[#f0f5fa] text-[#004b87]'
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
                        ? 'bg-white text-[#004b87] shadow-xs'
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
                        ? 'bg-white text-[#004b87] shadow-xs'
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
                        ? 'border-[#004b87] bg-[#f0f5fa] text-[#004b87]'
                        : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                    )}
                  >
                    <span>{lang.label}</span>
                    {isSelected && <Check className="w-4 h-4 text-[#004b87]" />}
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

          <div className="pt-3 space-y-2">
            {notificationPermission !== 'granted' && notificationPermission !== 'unsupported' && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                fullWidth
                onClick={requestNotificationPermission}
                leftIcon={<BellRing className="w-3.5 h-3.5 text-slate-600" />}
              >
                Enable notifications on this device
              </Button>
            )}
            {notificationPermission === 'granted' && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                fullWidth
                onClick={() => notify('Test notification', 'This is what a proactive alert looks like.')}
                leftIcon={<BellRing className="w-3.5 h-3.5 text-slate-600" />}
              >
                Send test notification
              </Button>
            )}
            {notificationPermission === 'unsupported' && (
              <p className="text-[11px] text-slate-500 px-1">
                This device/browser doesn&apos;t support notifications while the app is open in a plain tab.
              </p>
            )}
          </div>
        </PreferenceSection>

        {/* 6. ACCOUNT & SESSION */}
        <section aria-label="Account and Session" className="space-y-2 pt-2">
          <h2 className="text-xs font-bold uppercase tracking-wider text-slate-500">
            Account & Session
          </h2>

          <Card variant="default" className="border border-slate-200 bg-white p-4 space-y-4 shadow-xs">
            <div className="space-y-1">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                Connected commuter
              </span>
              <p className="text-sm font-bold text-slate-900">
                {user?.email || 'Local Demonstration Session'}
              </p>
              {user?.uid && (
                <p className="text-[11px] text-slate-400 font-mono">
                  UID: {user.uid}
                </p>
              )}
            </div>

            {/* Sign Out Button */}
            <div className="pt-1">
              <Button
                type="button"
                variant="outline"
                size="md"
                fullWidth
                isLoading={isSigningOut}
                onClick={handleSignOut}
                leftIcon={<LogOut className="w-4 h-4 text-red-600" />}
                className="border-red-200 text-red-700 hover:bg-red-50 hover:border-red-300"
              >
                Sign out
              </Button>
            </div>
          </Card>
        </section>

        {/* Save confirmation toast */}
        {saveToast && (
          <div className="fixed bottom-20 left-1/2 -translate-x-1/2 bg-slate-900 text-white px-4 py-2 rounded-full text-xs font-bold shadow-lg flex items-center gap-1.5 animate-fadeIn z-50">
            <Check className="w-4 h-4 text-emerald-400" />
            <span>{saveToast}</span>
          </div>
        )}
      </div>
    </div>
  );
}

export default function ProfilePage() {
  return (
    <Suspense fallback={null}>
      <ProfilePageContent />
    </Suspense>
  );
}
