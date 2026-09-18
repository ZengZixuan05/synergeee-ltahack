import React from 'react';
import { cn } from '@/lib/utils';

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'elevated' | 'bordered' | 'highlight' | 'warning';
}

export function Card({
  className,
  variant = 'default',
  children,
  ...props
}: CardProps) {
  const variants = {
    default: 'bg-white border border-slate-200/80 shadow-card',
    elevated: 'bg-white border border-slate-200 shadow-elevated',
    bordered: 'bg-white border-2 border-slate-300',
    highlight: 'bg-white border-2 border-[#d42426]/30 shadow-card',
    warning: 'bg-amber-50/70 border-2 border-amber-300 shadow-card',
  };

  return (
    <div
      className={cn(
        'rounded-2xl p-4 transition-all duration-150',
        variants[variant],
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}
