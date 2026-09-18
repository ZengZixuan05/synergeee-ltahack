'use client';

import React, { useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import { useAuth } from './AuthContext';

const PUBLIC_ROUTES = ['/login', '/signup', '/forgot-password'];

export function AuthGuard({ children }: { children: React.ReactNode }) {
  const { user, profile, loading, isFirebaseConfigured } = useAuth();
  const pathname = usePathname();
  const router = useRouter();

  const isPublicRoute = PUBLIC_ROUTES.includes(pathname);
  const isOnboardingRoute = pathname === '/onboarding';

  useEffect(() => {
    if (loading) return;

    // If Firebase is not configured, do not block local development evaluation
    if (!isFirebaseConfigured) return;

    // 1. Unauthenticated users cannot access protected routes
    if (!user) {
      if (!isPublicRoute) {
        router.replace('/login');
      }
      return;
    }

    // 2. Authenticated user logic
    if (user && profile) {
      if (!profile.onboardingComplete) {
        // Must complete onboarding first
        if (!isOnboardingRoute) {
          router.replace('/onboarding');
        }
      } else {
        // Onboarding already complete: prevent returning to auth/onboarding pages
        if (isPublicRoute || isOnboardingRoute) {
          router.replace('/');
        }
      }
    }
  }, [user, profile, loading, pathname, isPublicRoute, isOnboardingRoute, router, isFirebaseConfigured]);

  // Loading state: prevent flashing protected content
  if (loading && isFirebaseConfigured) {
    return (
      <div className="flex-1 min-h-[60vh] flex flex-col items-center justify-center p-6 text-center space-y-4">
        <div className="w-14 h-14 rounded-2xl bg-[#004b87] text-white flex items-center justify-center shadow-sm">
          <Loader2 className="w-7 h-7 animate-spin" />
        </div>
        <div className="space-y-1">
          <h2 className="text-lg font-black text-slate-900 tracking-tight">
            GoAble SG
          </h2>
          <p className="text-xs text-slate-500 font-medium">
            Verifying secure commuter session...
          </p>
        </div>
      </div>
    );
  }

  // If unauthenticated and on a protected route (before redirect fires), keep screen clean
  if (!loading && !user && !isPublicRoute && isFirebaseConfigured) {
    return (
      <div className="flex-1 min-h-[60vh] flex flex-col items-center justify-center p-6 text-center space-y-3">
        <Loader2 className="w-6 h-6 animate-spin text-[#004b87]" />
        <p className="text-xs text-slate-500 font-medium">
          Redirecting to sign in...
        </p>
      </div>
    );
  }

  return <>{children}</>;
}
