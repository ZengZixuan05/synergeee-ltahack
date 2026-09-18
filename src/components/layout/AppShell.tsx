'use client';

import React from 'react';
import { usePathname } from 'next/navigation';
import { GovMasthead } from './GovMasthead';
import { BottomNavigation } from './BottomNavigation';

interface AppShellProps {
  children: React.ReactNode;
  showNav?: boolean;
}

const HIDE_NAV_ROUTES = ['/login', '/signup', '/forgot-password', '/onboarding'];

export function AppShell({ children, showNav = true }: AppShellProps) {
  const pathname = usePathname();
  const shouldShowNav = showNav && !HIDE_NAV_ROUTES.includes(pathname);

  return (
    <div className="min-h-screen bg-slate-200/70 flex flex-col items-center">
      <div className="w-full max-w-md min-h-screen bg-[#f4f6f9] border-x border-slate-200 shadow-sm relative flex flex-col">
        {/* Top SG Government Masthead */}
        <GovMasthead />

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

