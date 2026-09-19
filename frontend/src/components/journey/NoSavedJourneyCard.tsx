'use client';

import React from 'react';
import Link from 'next/link';
import { CalendarPlus, MapPin } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';

/** Shown on the home page when the commuter has no saved journey yet — onboarding was skipped, or none was ever added from Profile. */
export function NoSavedJourneyCard() {
  return (
    <Card variant="default" className="border-2 border-dashed border-slate-300 bg-white p-5 text-center">
      <div className="w-11 h-11 rounded-full bg-[#f0f5fa] flex items-center justify-center mx-auto mb-3">
        <MapPin className="w-5 h-5 text-[#004b87]" aria-hidden="true" />
      </div>
      <p className="text-sm font-bold text-slate-900">No saved journey yet</p>
      <p className="text-xs text-slate-500 font-medium mt-1 leading-relaxed">
        Save a regular route to get proactive updates here &mdash; step-free directions, live disruption warnings, and lift status for your journey.
      </p>
      <Link href="/profile?addJourney=1" className="block mt-4">
        <Button variant="primary" size="md" fullWidth leftIcon={<CalendarPlus className="w-4 h-4" />}>
          Add a saved journey
        </Button>
      </Link>
    </Card>
  );
}
