import React from 'react';
import { cn } from '@/lib/utils';

interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: 'default' | 'primary' | 'success' | 'warning' | 'danger' | 'neutral' | 'subtle';
  size?: 'sm' | 'md';
}

export function Badge({
  className,
  variant = 'default',
  size = 'md',
  children,
  ...props
}: BadgeProps) {
  const variants = {
    default: 'bg-slate-100 text-slate-800 border border-slate-200',
    primary: 'bg-red-50 text-[#d42426] border border-red-200 font-semibold',
    success: 'bg-emerald-50 text-emerald-800 border border-emerald-300 font-semibold',
    warning: 'bg-amber-50 text-amber-900 border border-amber-300 font-semibold',
    danger: 'bg-rose-50 text-rose-800 border border-rose-300 font-semibold',
    neutral: 'bg-slate-200 text-slate-700 border border-slate-300',
    subtle: 'bg-white/80 text-slate-600 border border-slate-200',
  };

  const sizes = {
    sm: 'text-xs px-2 py-0.5 rounded-md font-medium',
    md: 'text-sm px-2.5 py-1 rounded-lg font-medium',
  };

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 leading-none transition-colors select-none',
        variants[variant],
        sizes[size],
        className
      )}
      {...props}
    >
      {children}
    </span>
  );
}
