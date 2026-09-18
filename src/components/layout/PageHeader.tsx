'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { ChevronLeft } from 'lucide-react';
import { cn } from '@/lib/utils';

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  showBack?: boolean;
  onBack?: () => void;
  rightAction?: React.ReactNode;
  className?: string;
}

export function PageHeader({
  title,
  subtitle,
  showBack = false,
  onBack,
  rightAction,
  className,
}: PageHeaderProps) {
  const router = useRouter();

  const handleBack = () => {
    if (onBack) {
      onBack();
    } else {
      router.back();
    }
  };

  return (
    <header className={cn('bg-white border-b border-slate-200/90 px-4 py-3 sticky top-0 z-30', className)}>
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0">
          {showBack && (
            <button
              onClick={handleBack}
              aria-label="Go back to previous page"
              className="p-2 -ml-2 rounded-xl text-slate-700 hover:text-slate-900 hover:bg-slate-100 min-h-[44px] min-w-[44px] flex items-center justify-center focus-visible:outline-2"
            >
              <ChevronLeft className="w-6 h-6" />
            </button>
          )}
          <div className="min-w-0">
            <h1 className="text-lg font-bold text-slate-900 leading-snug truncate">
              {title}
            </h1>
            {subtitle && (
              <p className="text-xs text-slate-500 font-medium truncate">
                {subtitle}
              </p>
            )}
          </div>
        </div>

        {rightAction && (
          <div className="flex-shrink-0 flex items-center">
            {rightAction}
          </div>
        )}
      </div>
    </header>
  );
}
