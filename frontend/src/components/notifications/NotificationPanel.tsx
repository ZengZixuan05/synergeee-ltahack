'use client';

import React from 'react';
import { X, Train, ArrowUpDown, CloudRain, Users, BellOff } from 'lucide-react';
import { NotificationItem, NotificationSource } from '@/types/notification';
import { DemoBadge } from '@/components/alerts/DemoBadge';
import { formatRelativeTime } from '@/lib/utils';
import { cn } from '@/lib/utils';

interface NotificationPanelProps {
  isOpen: boolean;
  onClose: () => void;
  items: NotificationItem[];
}

const SOURCE_ICON: Record<NotificationSource, React.ReactNode> = {
  train: <Train className="w-4 h-4" aria-hidden="true" />,
  lift: <ArrowUpDown className="w-4 h-4" aria-hidden="true" />,
  weather: <CloudRain className="w-4 h-4" aria-hidden="true" />,
  crowding: <Users className="w-4 h-4" aria-hidden="true" />,
};

// Matches AlertCard.tsx's existing severity-color scheme, for consistency
// with the transport-update cards already shown elsewhere in the app.
function severityBorder(severity: NotificationItem['severity']): string {
  switch (severity) {
    case 'critical':
      return 'border-l-4 border-l-red-600 bg-red-50/40';
    case 'moderate':
      return 'border-l-4 border-l-amber-500 bg-amber-50/40';
    case 'low':
    default:
      return 'border-l-4 border-l-blue-500 bg-[#f4f6f9]/80';
  }
}

export function NotificationPanel({ isOpen, onClose, items }: NotificationPanelProps) {
  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="notification-panel-title"
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 p-0 sm:p-4 animate-fadeIn"
    >
      <div className="w-full max-w-md bg-white rounded-t-3xl sm:rounded-3xl shadow-modal overflow-hidden flex flex-col max-h-[85vh] animate-slideUp">
        <div className="pt-3 px-4 pb-2 flex items-center justify-between border-b border-slate-100">
          <h2 id="notification-panel-title" className="text-sm font-bold text-slate-900">
            Notifications
          </h2>
          <button
            onClick={onClose}
            aria-label="Close notifications"
            className="p-2 rounded-full text-slate-500 hover:text-slate-800 hover:bg-slate-100 min-h-[44px] min-w-[44px] flex items-center justify-center focus-visible:outline-2"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-4 overflow-y-auto space-y-2 pb-bottom-sheet">
          {items.length === 0 && (
            <div className="text-center py-8 text-slate-500">
              <BellOff className="w-8 h-8 mx-auto mb-2 text-slate-300" aria-hidden="true" />
              <p className="text-sm font-medium">No live alerts right now</p>
            </div>
          )}

          {items.map((item) => (
            <article
              key={item.id}
              className={cn('rounded-xl border border-slate-200 p-3 bg-white shadow-xs', severityBorder(item.severity))}
            >
              <div className="flex items-start gap-2.5">
                <div className="p-1.5 rounded-lg bg-white border border-slate-200 text-slate-700 flex-shrink-0 mt-0.5">
                  {SOURCE_ICON[item.source]}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-1 flex-wrap mb-0.5">
                    <h3 className="text-sm font-semibold text-slate-900 leading-snug">{item.title}</h3>
                    <span className="text-[11px] text-slate-600 font-medium shrink-0">{formatRelativeTime(item.timestamp)}</span>
                  </div>
                  {item.description && <p className="text-xs text-slate-600 leading-relaxed">{item.description}</p>}
                  {item.provenance === 'DEMO' && <DemoBadge size="sm" className="mt-1.5" />}
                </div>
              </div>
            </article>
          ))}
        </div>
      </div>
    </div>
  );
}
