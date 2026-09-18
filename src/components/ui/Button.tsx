import React from 'react';
import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'warning' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  fullWidth?: boolean;
  isLoading?: boolean;
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
      isLoading = false,
      leftIcon,
      rightIcon,
      children,
      disabled,
      ...props
    },
    ref
  ) => {
    const isActuallyDisabled = disabled || isLoading;
    const baseStyles =
      'inline-flex items-center justify-center font-medium transition-colors duration-150 rounded-xl select-none min-h-[44px] px-4 py-2 text-center disabled:opacity-50 disabled:cursor-not-allowed disabled:pointer-events-none active:scale-[0.99]';

    const variants = {
      primary:
        'bg-[#004b87] hover:bg-[#003966] active:bg-[#002a4a] text-white shadow-xs font-semibold',
      secondary:
        'bg-[#00847f] hover:bg-[#006c68] active:bg-[#005552] text-white shadow-xs font-semibold',
      outline:
        'border-2 border-slate-300 hover:border-[#004b87] hover:text-[#004b87] bg-white text-slate-800 hover:bg-slate-50',
      ghost:
        'bg-transparent hover:bg-slate-100 text-slate-700 active:bg-slate-200',
      warning:
        'bg-amber-600 hover:bg-amber-700 active:bg-amber-800 text-white font-semibold shadow-xs',
      danger:
        'bg-red-600 hover:bg-red-700 active:bg-red-800 text-white font-semibold shadow-xs',
    };

    const sizes = {
      sm: 'text-sm py-2 px-3 min-h-[44px]',
      md: 'text-base py-2.5 px-4 min-h-[48px]',
      lg: 'text-lg py-3 px-5 min-h-[52px]',
    };

    return (
      <button
        ref={ref}
        disabled={isActuallyDisabled}
        className={cn(
          baseStyles,
          variants[variant],
          sizes[size],
          fullWidth && 'w-full',
          className
        )}
        {...props}
      >
        {isLoading ? (
          <Loader2 className="w-4 h-4 mr-2 animate-spin shrink-0" />
        ) : (
          leftIcon && <span className="mr-2 inline-flex items-center flex-shrink-0">{leftIcon}</span>
        )}
        <span>{children}</span>
        {!isLoading && rightIcon && <span className="ml-2 inline-flex items-center flex-shrink-0">{rightIcon}</span>}
      </button>
    );
  }
);

Button.displayName = 'Button';
