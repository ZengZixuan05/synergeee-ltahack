'use client';

import React from 'react';
import { cn } from '@/lib/utils';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'warning' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  fullWidth?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant = 'primary',
      size = 'md',
      fullWidth = false,
      leftIcon,
      rightIcon,
      children,
      disabled,
      ...props
    },
    ref
  ) => {
    const baseStyles =
      'inline-flex items-center justify-center font-medium transition-colors duration-150 rounded-xl select-none min-h-[44px] px-4 py-2 text-center disabled:opacity-50 disabled:cursor-not-allowed disabled:pointer-events-none active:scale-[0.99]';

    const variants = {
      primary:
        'bg-[#d42426] hover:bg-[#b21f24] active:bg-[#8c1517] text-white shadow-sm font-semibold',
      secondary:
        'bg-slate-900 hover:bg-slate-800 text-white shadow-sm font-semibold',
      outline:
        'border-2 border-slate-300 hover:border-slate-400 bg-white text-slate-800 hover:bg-slate-50',
      ghost:
        'bg-transparent hover:bg-slate-100 text-slate-700 active:bg-slate-200',
      warning:
        'bg-amber-600 hover:bg-amber-700 active:bg-amber-800 text-white font-semibold shadow-sm',
      danger:
        'bg-rose-600 hover:bg-rose-700 active:bg-rose-800 text-white font-semibold shadow-sm',
    };

    const sizes = {
      sm: 'text-sm py-2 px-3 min-h-[44px]',
      md: 'text-base py-2.5 px-4 min-h-[48px]',
      lg: 'text-lg py-3 px-5 min-h-[52px]',
    };

    return (
      <button
        ref={ref}
        disabled={disabled}
        className={cn(
          baseStyles,
          variants[variant],
          sizes[size],
          fullWidth && 'w-full',
          className
        )}
        {...props}
      >
        {leftIcon && <span className="mr-2 inline-flex items-center flex-shrink-0">{leftIcon}</span>}
        <span>{children}</span>
        {rightIcon && <span className="ml-2 inline-flex items-center flex-shrink-0">{rightIcon}</span>}
      </button>
    );
  }
);

Button.displayName = 'Button';
