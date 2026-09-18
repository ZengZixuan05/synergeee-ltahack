'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { PageHeader } from '@/components/layout/PageHeader';
import { RouteComparison } from '@/components/journey/RouteComparison';
import { useDemoMode } from '@/features/demo/useDemoMode';
import { DemoBadge } from '@/components/alerts/DemoBadge';

export default function RouteComparePage() {
  const router = useRouter();
  const { usualRoute, recommendedRoute, isDisrupted } = useDemoMode();

  return (
    <div className="flex-1 flex flex-col pb-8">
      <PageHeader
        title="Route Comparison"
        subtitle="SGH Appointment · Alternate Monday"
        showBack={true}
        onBack={() => router.push('/')}
        rightAction={<DemoBadge size="sm" />}
      />

      <div className="p-4">
        <RouteComparison
          usualRoute={usualRoute}
          recommendedRoute={recommendedRoute}
          onSelectRecommended={() => router.push('/journey/guide')}
        />
      </div>
    </div>
  );
}
