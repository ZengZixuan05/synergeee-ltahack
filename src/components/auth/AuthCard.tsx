'use client';

import React from 'react';
import { cn } from '@/lib/utils';
import { Card } from '@/components/ui/Card';

interface AuthCardProps {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
  className?: string;
}

export function AuthCard({
  title,
  subtitle,
  children,
  footer,
  className,
}: AuthCardProps) {
  return (
    <div className={cn('w-full max-w-sm mx-auto space-y-4 animate-fadeIn', className)}>
      {/* Brand Header */}
      <div className="text-center space-y-1">
        <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-[#f0f5fa] border border-[#b8d2eb] text-[#004b87] text-[11px] font-bold tracking-wider uppercase mb-1">
          <span>Singapore Civic Transit</span>
        </div>
        <h1 className="text-2xl font-black text-slate-900 tracking-tight">
          {title}
        </h1>
        {subtitle && (
          <p className="text-xs text-slate-500 font-medium">
            {subtitle}
          </p>
        )}
      </div>

      {/* Main Card */}
      <Card variant="default" className="border border-slate-200 p-5 bg-white shadow-xs space-y-4">
        {children}
      </Card>

      {/* Footer Navigation / Links */}
      {footer && (
        <div className="text-center text-xs text-slate-500">
          {footer}
        </div>
      )}
    </div>
  );
}
