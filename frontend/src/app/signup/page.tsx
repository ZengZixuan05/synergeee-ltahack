'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { AlertCircle, UserPlus, ArrowLeft } from 'lucide-react';
import { useAuth } from '@/features/auth/useAuth';
import { getFriendlyAuthErrorMessage } from '@/lib/auth-errors';
import { AuthCard } from '@/components/auth/AuthCard';
import { PasswordInput } from '@/components/auth/PasswordInput';
import { Button } from '@/components/ui/Button';

export default function SignUpPage() {
  const router = useRouter();
  const { signUp, isFirebaseConfigured } = useAuth();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [errors, setErrors] = useState<{
    name?: string;
    email?: string;
    password?: string;
    confirmPassword?: string;
    general?: string;
  }>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const validate = () => {
    const newErrors: typeof errors = {};

    if (!name.trim()) {
      newErrors.name = 'Please enter your full name.';
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email.trim()) {
      newErrors.email = 'Please enter your email address.';
    } else if (!emailRegex.test(email.trim())) {
      newErrors.email = 'Please enter a valid email address.';
    }

    if (!password) {
      newErrors.password = 'Please create a password.';
    } else if (password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters.';
    }

    if (!confirmPassword) {
      newErrors.confirmPassword = 'Please confirm your password.';
    } else if (password !== confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match.';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;

    if (!validate()) return;

    setIsSubmitting(true);
    setErrors({});

    try {
      await signUp(name, email, password);
      // Account created and initial users/{uid} document written in Firestore
      // Passwords are NEVER written to Firestore.
      router.push('/onboarding');
    } catch (err: unknown) {
      const firebaseError = err as { code?: string; message?: string };
      const friendlyMsg = firebaseError.code
        ? getFriendlyAuthErrorMessage(firebaseError.code)
        : firebaseError.message || 'Unable to create account. Please try again.';
      setErrors({ general: friendlyMsg });
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex-1 flex flex-col justify-center px-4 py-8">
      <AuthCard
        title="Create Account"
        subtitle="Join JourneyAheadSG for proactive, personalised journeys"
        footer={
          <div className="space-y-3 pt-2">
            <p className="text-xs text-slate-600">
              Already have an account?{' '}
              <Link
                href="/login"
                className="font-bold text-[#004b87] hover:underline inline-flex items-center gap-0.5"
              >
                Sign in
              </Link>
            </p>
          </div>
        }
      >
        {!isFirebaseConfigured && (
          <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-800 space-y-1">
            <p className="font-bold">Firebase configuration required</p>
            <p className="text-[11px] leading-relaxed text-amber-700">
              Please copy <code className="bg-amber-100 px-1 py-0.5 rounded">.env.example</code> to <code className="bg-amber-100 px-1 py-0.5 rounded">.env.local</code> and supply your Firebase project credentials.
            </p>
          </div>
        )}

        {errors.general && (
          <div
            className="p-3 rounded-xl bg-red-50 border border-red-200 flex items-start gap-2.5 text-xs text-red-700 animate-fadeIn"
            role="alert"
          >
            <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
            <span className="font-medium">{errors.general}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-3.5" noValidate>
          {/* Full Name */}
          <div className="space-y-1">
            <label
              htmlFor="signup-name"
              className="text-xs font-bold uppercase tracking-wider text-slate-700 block"
            >
              Full name
            </label>
            <input
              id="signup-name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              disabled={isSubmitting}
              placeholder="e.g. Mdm Lim"
              autoComplete="name"
              required
              aria-invalid={Boolean(errors.name)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 bg-white text-sm font-medium text-slate-900 placeholder:text-slate-400 hover:border-slate-400 focus:outline-none focus:ring-2 focus:ring-[#004b87] focus:border-transparent transition-colors disabled:bg-slate-100"
            />
            {errors.name && (
              <p className="text-xs font-semibold text-red-600 animate-fadeIn">{errors.name}</p>
            )}
          </div>

          {/* Email */}
          <div className="space-y-1">
            <label
              htmlFor="signup-email"
              className="text-xs font-bold uppercase tracking-wider text-slate-700 block"
            >
              Email address
            </label>
            <input
              id="signup-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={isSubmitting}
              placeholder="commuter@example.sg"
              autoComplete="email"
              required
              aria-invalid={Boolean(errors.email)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 bg-white text-sm font-medium text-slate-900 placeholder:text-slate-400 hover:border-slate-400 focus:outline-none focus:ring-2 focus:ring-[#004b87] focus:border-transparent transition-colors disabled:bg-slate-100"
            />
            {errors.email && (
              <p className="text-xs font-semibold text-red-600 animate-fadeIn">{errors.email}</p>
            )}
          </div>

          {/* Password */}
          <PasswordInput
            id="signup-password"
            label="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            disabled={isSubmitting}
            autoComplete="new-password"
            placeholder="At least 6 characters"
            error={errors.password}
            required
          />

          {/* Confirm Password */}
          <PasswordInput
            id="signup-confirm-password"
            label="Confirm password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            disabled={isSubmitting}
            autoComplete="new-password"
            placeholder="Re-enter your password"
            error={errors.confirmPassword}
            required
          />

          <p className="text-[11px] text-slate-500 pt-1">
            By creating an account, you will set up your personalized commuter preferences next.
          </p>

          <Button
            type="submit"
            variant="primary"
            size="lg"
            fullWidth
            isLoading={isSubmitting}
            leftIcon={<UserPlus className="w-4 h-4" />}
            className="mt-2 py-3"
          >
            Create account
          </Button>
        </form>
      </AuthCard>
    </div>
  );
}
