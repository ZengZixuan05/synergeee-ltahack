'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, MapPin, Bus, User } from 'lucide-react';
import { cn } from '@/lib/utils';

export function BottomNavigation() {
  const pathname = usePathname();

  const tabs = [
    {
      id: 'home',
      label: 'Home',
      href: '/',
      icon: Home,
      isActive: pathname === '/' || pathname.startsWith('/journey'),
    },
    {
      id: 'directions',
      label: 'Map & Directions',
      href: '/directions',
      icon: MapPin,
      isActive: pathname === '/directions',
    },
    {
      id: 'bus',
      label: 'Bus',
      href: '/bus',
      icon: Bus,
      isActive: pathname === '/bus',
    },
    {
      id: 'profile',
      label: 'Profile',
      href: '/profile',
      icon: User,
      isActive: pathname === '/profile',
    },
  ];

  return (
    <nav
      aria-label="Main navigation"
      className="fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-slate-200 shadow-xs"
      style={{
        paddingBottom: 'calc(env(safe-area-inset-bottom, 12px) + 4px)',
      }}
    >
      <div className="max-w-md mx-auto grid grid-cols-4 px-2 pt-1.5">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const active = tab.isActive;

          return (
            <Link
              key={tab.id}
              href={tab.href}
              aria-current={active ? 'page' : undefined}
              className={cn(
                'group relative flex flex-col items-center justify-center py-2 px-1 rounded-xl transition-all min-h-[52px]',
                active
                  ? 'text-[#004b87]'
                  : 'text-slate-600 hover:text-slate-900 active:bg-slate-100'
              )}
            >
              {/* Active indicator bar */}
              {active && (
                <span
                  className="absolute top-0 w-8 h-1 bg-[#004b87] rounded-full"
                  aria-hidden="true"
                />
              )}

              <div
                className={cn(
                  'p-1 rounded-full transition-transform',
                  active ? 'bg-[#f0f5fa]' : 'group-hover:scale-105'
                )}
              >
                <Icon
                  className={cn(
                    'w-5 h-5 transition-colors',
                    active ? 'stroke-[2.5px] text-[#004b87]' : 'stroke-[1.8px]'
                  )}
                  aria-hidden="true"
                />
              </div>

              <span
                className={cn(
                  'text-xs tracking-tight transition-all mt-0.5 text-center',
                  active ? 'font-bold text-[#004b87]' : 'font-medium text-slate-600'
                )}
              >
                {tab.label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
