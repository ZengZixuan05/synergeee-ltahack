'use client';

import { useCallback, useState } from 'react';

export type OsNotificationPermission = 'default' | 'granted' | 'denied' | 'unsupported';

interface UseOsNotificationResult {
  permission: OsNotificationPermission;
  requestPermission: () => void;
  notify: (title: string, body?: string) => void;
}

function readPermission(): OsNotificationPermission {
  if (typeof window === 'undefined' || !('Notification' in window)) return 'unsupported';
  return Notification.permission;
}

/**
 * Thin wrapper around the browser's `Notification` API for a demo-able OS
 * notification banner — deliberately not a full push-subscription setup
 * (no service worker/manifest exists in this app), so this only works while
 * the tab is open/foregrounded. That's sufficient for a live demo on
 * Android/desktop Chrome; iOS Safari only supports the Notification API at
 * all once the site has been added to the home screen as a PWA — a real
 * platform constraint, not something this hook can work around.
 */
export function useOsNotification(): UseOsNotificationResult {
  const [permission, setPermission] = useState<OsNotificationPermission>(readPermission);

  const requestPermission = useCallback(() => {
    if (typeof window === 'undefined' || !('Notification' in window)) {
      setPermission('unsupported');
      return;
    }
    Notification.requestPermission().then((result) => setPermission(result as OsNotificationPermission));
  }, []);

  const notify = useCallback((title: string, body?: string) => {
    if (typeof window === 'undefined' || !('Notification' in window)) return;
    if (Notification.permission !== 'granted') return;
    new Notification(title, { body });
  }, []);

  return { permission, requestPermission, notify };
}
