'use client';

import React from 'react';
import { GovMasthead } from './GovMasthead';
import { BottomNavigation } from './BottomNavigation';

interface AppShellProps {
  children: React.ReactNode;
  showNav?: boolean;
}

export function AppShell({ children, showNav = true }: AppShellProps) {
  return (
    <div className="min-h-screen bg-slate-200/70 flex flex-col items-center">
      <div className="w-full max-w-md min-h-screen bg-[#f4f6f9] border-x border-slate-200 shadow-sm relative flex flex-col">
        {/* Top SG Government Masthead */}
        <GovMasthead />

        {/* Main Content Area */}
        <main className="flex-1 flex flex-col pb-safe">
          {children}
        </main>

        {/* Sticky/Fixed Bottom Navigation */}
        {showNav && <BottomNavigation />}
      </div>
    </div>
  );
}
