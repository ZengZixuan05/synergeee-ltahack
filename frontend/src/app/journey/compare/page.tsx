'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { PageHeader } from '@/components/layout/PageHeader';
import { RouteComparison } from '@/components/journey/RouteComparison';
import { useDemoMode } from '@/features/demo/useDemoMode';
import { Card } from '@/components/ui/Card';

export default function RouteComparePage() {
  const router = useRouter();
  const { currentJourney } = useDemoMode();

  const recommendedRoute = currentJourney?.recommendedRoute;

  return (
    <div className="flex-1 flex flex-col pb-8">
      <PageHeader
        title="Route Comparison"
        subtitle={currentJourney ? `${currentJourney.title} · ${currentJourney.recurrence}` : 'No saved journey yet'}
        showBack={true}
        onBack={() => router.push('/')}
      />

      <div className="p-4">
        {currentJourney && recommendedRoute ? (
          <RouteComparison
            usualRoute={currentJourney.normalRoute}
            recommendedRoute={recommendedRoute}
            recommendedWhy={currentJourney.recommendedAction}
            onSelectRecommended={() => router.push('/journey/guide')}
          />
        ) : (
          <Card variant="default" className="p-4 text-sm text-slate-600">
            {currentJourney
              ? 'Your usual route has no live disruption right now, so there is no alternative to compare it against.'
              : 'Save a regular route from your profile to see a live comparison here.'}
          </Card>
        )}
      </div>
    </div>
  );
}
