'use client';

import React, { useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';
import { cn } from '@/lib/utils';

interface PasswordInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  id: string;
  label?: string;
  error?: string;
}

export function PasswordInput({
  id,
  label,
  error,
  className,
  value,
  onChange,
  disabled,
  placeholder = '••••••••',
  autoComplete = 'current-password',
  ...rest
}: PasswordInputProps) {
  const [showPassword, setShowPassword] = useState(false);

  return (
    <div className="space-y-1 w-full">
      {label && (
        <label
          htmlFor={id}
          className="text-xs font-bold uppercase tracking-wider text-slate-700 block"
        >
          {label}
        </label>
      )}

      <div className="relative flex items-center">
        <input
          id={id}
          type={showPassword ? 'text' : 'password'}
          value={value}
          onChange={onChange}
          disabled={disabled}
          placeholder={placeholder}
          autoComplete={autoComplete}
          aria-invalid={Boolean(error)}
          aria-describedby={error ? `${id}-error` : undefined}
          className={cn(
            'w-full px-3.5 py-2.5 pr-11 rounded-xl border bg-white text-sm font-medium text-slate-900 transition-colors',
            'placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#004b87] focus:border-transparent',
            error
              ? 'border-red-400 focus:ring-red-500'
              : 'border-slate-300 hover:border-slate-400',
            disabled && 'bg-slate-100 cursor-not-allowed text-slate-500',
            className
          )}
          {...rest}
        />

        <button
          type="button"
          onClick={() => setShowPassword((prev) => !prev)}
          disabled={disabled}
          aria-label={showPassword ? 'Hide password' : 'Show password'}
          className="absolute right-1 p-2 rounded-lg text-slate-500 hover:text-slate-800 hover:bg-slate-100 min-h-[44px] min-w-[44px] flex items-center justify-center transition-colors focus-visible:outline-2 focus-visible:outline-[#004b87]"
        >
          {showPassword ? (
            <EyeOff className="w-4 h-4" aria-hidden="true" />
          ) : (
            <Eye className="w-4 h-4" aria-hidden="true" />
          )}
        </button>
      </div>

      {error && (
        <p id={`${id}-error`} className="text-xs font-semibold text-red-600 animate-fadeIn" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
