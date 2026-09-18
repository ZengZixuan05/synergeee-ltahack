'use client';

import React from 'react';
import { Train, CloudRain, Users, Info } from 'lucide-react';
import { TransportAlert } from '@/types';
import { cn } from '@/lib/utils';

interface AlertCardProps {
  alert: TransportAlert;
  className?: string;
}

export function AlertCard({ alert, className }: AlertCardProps) {
  const getSeverityBorder = (severity: TransportAlert['severity']) => {
    switch (severity) {
      case 'critical':
        return 'border-l-4 border-l-rose-500 bg-rose-50/40';
      case 'moderate':
        return 'border-l-4 border-l-amber-500 bg-amber-50/40';
      case 'low':
      default:
        return 'border-l-4 border-l-blue-400 bg-slate-50/60';
    }
  };

  return (
    <article
      aria-label={`Transport update: ${alert.title}`}
      className={cn(
        'rounded-xl border border-slate-200 p-3 bg-white shadow-xs transition-colors',
        getSeverityBorder(alert.severity),
        className
      )}
    >
      <div className="flex items-start gap-2.5">
        <div className="p-1.5 rounded-lg bg-white border border-slate-200 text-slate-700 flex-shrink-0 mt-0.5">
          {alert.category === 'rail' && <Train className="w-4 h-4" aria-hidden="true" />}
          {alert.category === 'weather' && <CloudRain className="w-4 h-4" aria-hidden="true" />}
          {alert.category === 'crowding' && <Users className="w-4 h-4" aria-hidden="true" />}
          {alert.category !== 'rail' && alert.category !== 'weather' && alert.category !== 'crowding' && (
            <Info className="w-4 h-4" aria-hidden="true" />
          )}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-1 flex-wrap mb-1">
            <h3 className="text-sm font-semibold text-slate-900 leading-snug">
              {alert.title}
            </h3>
            <span className="text-[11px] text-slate-600 font-medium">
              {alert.updatedAt}
            </span>
          </div>

          <p className="text-xs text-slate-600 leading-relaxed mb-2">
            {alert.description}
          </p>

          <div className="flex items-center justify-between text-[11px] text-slate-600">
            <span>{alert.affectedLineOrStation}</span>
            <span className="text-[10px] uppercase font-bold tracking-wider text-slate-600 bg-slate-100 px-1.5 py-0.5 rounded">
              Sample Update
            </span>
          </div>
        </div>
      </div>
    </article>
  );
}
