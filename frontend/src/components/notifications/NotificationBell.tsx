'use client';

import React from 'react';
import { Bell } from 'lucide-react';

interface NotificationBellProps {
  count: number;
  onClick: () => void;
}

export function NotificationBell({ count, onClick }: NotificationBellProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={count > 0 ? `Notifications, ${count} new` : 'Notifications'}
      className="relative p-2 rounded-full text-slate-700 hover:bg-slate-100 min-h-[44px] min-w-[44px] flex items-center justify-center focus-visible:outline-2"
    >
      <Bell className="w-5 h-5" aria-hidden="true" />
      {count > 0 && (
        <span className="absolute top-1 right-1 min-w-[16px] h-4 px-1 rounded-full bg-red-600 text-white text-[10px] font-bold leading-4 text-center">
          {count > 9 ? '9+' : count}
        </span>
      )}
    </button>
  );
}
