'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function JourneyIndexPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/journey/compare');
  }, [router]);

  return (
    <div className="flex-1 flex items-center justify-center p-6 text-center text-slate-500 text-sm">
      Loading journey details...
    </div>
  );
}
