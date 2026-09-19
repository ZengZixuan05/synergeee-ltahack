'use client';

import React, { useEffect, useRef, useState } from 'react';
import { usePathname } from 'next/navigation';
import { BottomNavigation } from './BottomNavigation';
import { NotificationBell } from '@/components/notifications/NotificationBell';
import { NotificationPanel } from '@/components/notifications/NotificationPanel';
import { useNotificationCenter } from '@/hooks/useNotificationCenter';
import { useOsNotification } from '@/hooks/useOsNotification';
import { useDemoMode } from '@/features/demo/useDemoMode';

interface AppShellProps {
  children: React.ReactNode;
  showNav?: boolean;
}

const HIDE_NAV_ROUTES = ['/login', '/signup', '/forgot-password', '/onboarding'];

export function AppShell({ children, showNav = true }: AppShellProps) {
  const pathname = usePathname();
  const shouldShowNav = showNav && !HIDE_NAV_ROUTES.includes(pathname);

  const { commuter } = useDemoMode();
  const { items } = useNotificationCenter(commuter.preferences.notifications);
  const { permission, notify } = useOsNotification();

  const [isPanelOpen, setIsPanelOpen] = useState(false);
  const [seenIds, setSeenIds] = useState<Set<string>>(new Set());
  const previouslySeenIds = useRef<Set<string> | null>(null);

  // Fire a real OS notification for any item that's genuinely new since the
  // last render — only once permission has already been granted, and never
  // on the very first load (that would fire one per existing live alert).
  useEffect(() => {
    const previous = previouslySeenIds.current;
    if (previous !== null && permission === 'granted') {
      for (const item of items) {
        if (!previous.has(item.id)) {
          notify(item.title, item.description);
        }
      }
    }
    previouslySeenIds.current = new Set(items.map((item) => item.id));
  }, [items, permission, notify]);

  const unreadCount = items.filter((item) => !seenIds.has(item.id)).length;

  const openPanel = () => {
    setIsPanelOpen(true);
    setSeenIds(new Set(items.map((item) => item.id)));
  };

  return (
    <div className="min-h-screen bg-slate-200/70 flex flex-col items-center">
      <div className="w-full max-w-md min-h-screen bg-[#f4f6f9] border-x border-slate-200 shadow-sm relative flex flex-col">
        <div className="absolute top-2 right-2 z-40">
          <NotificationBell count={unreadCount} onClick={openPanel} />
        </div>
        <NotificationPanel isOpen={isPanelOpen} onClose={() => setIsPanelOpen(false)} items={items} />

        {/* Main Content Area */}
        <main className={`flex-1 flex flex-col ${shouldShowNav ? 'pb-safe' : 'pb-6'}`}>
          {children}
        </main>

        {/* Sticky/Fixed Bottom Navigation */}
        {shouldShowNav && <BottomNavigation />}
      </div>
    </div>
  );
}
