'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { AlertCircle, LogIn, ArrowRight } from 'lucide-react';
import { useAuth } from '@/features/auth/useAuth';
import { getFriendlyAuthErrorMessage } from '@/lib/auth-errors';
import { AuthCard } from '@/components/auth/AuthCard';
import { PasswordInput } from '@/components/auth/PasswordInput';
import { Button } from '@/components/ui/Button';

export default function LoginPage() {
  const router = useRouter();
  const { signIn, isFirebaseConfigured } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!email.trim()) {
      setError('Please enter your email address.');
      return;
    }

    if (!password) {
      setError('Please enter your password.');
      return;
    }

    setIsSubmitting(true);

    try {
      const userProfile = await signIn(email, password);
      if (!userProfile.onboardingComplete) {
        router.push('/onboarding');
      } else {
        router.push('/');
      }
    } catch (err: unknown) {
      const firebaseError = err as { code?: string; message?: string };
      const friendlyMsg = firebaseError.code
        ? getFriendlyAuthErrorMessage(firebaseError.code)
        : firebaseError.message || 'Unable to sign in. Please check your credentials and try again.';
      setError(friendlyMsg);
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex-1 flex flex-col justify-center px-4 py-8">
      <AuthCard
        title="GoAble SG"
        subtitle="Your journey. Personalised for you."
        footer={
          <div className="space-y-3 pt-2">
            <p className="text-xs text-slate-600">
              Don&apos;t have an account?{' '}
              <Link
                href="/signup"
                className="font-bold text-[#004b87] hover:underline inline-flex items-center gap-0.5"
              >
                Create account
                <ArrowRight className="w-3.5 h-3.5 inline" />
              </Link>
            </p>
          </div>
        }
      >
        <div className="border-b border-slate-100 pb-3 mb-1">
          <h2 className="text-base font-bold text-slate-800">
            Welcome back
          </h2>
          <p className="text-xs text-slate-500">
            Sign in to access your saved journeys and commuter preferences.
          </p>
        </div>

        {!isFirebaseConfigured && (
          <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-800 space-y-1">
            <p className="font-bold">Firebase configuration required</p>
            <p className="text-[11px] leading-relaxed text-amber-700">
              Please copy <code className="bg-amber-100 px-1 py-0.5 rounded">.env.example</code> to <code className="bg-amber-100 px-1 py-0.5 rounded">.env.local</code> and supply your Firebase project credentials.
            </p>
          </div>
        )}

        {error && (
          <div
            className="p-3 rounded-xl bg-red-50 border border-red-200 flex items-start gap-2.5 text-xs text-red-700 animate-fadeIn"
            role="alert"
          >
            <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
            <span className="font-medium">{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4" noValidate>
          <div className="space-y-1">
            <label
              htmlFor="login-email"
              className="text-xs font-bold uppercase tracking-wider text-slate-700 block"
            >
              Email address
            </label>
            <input
              id="login-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={isSubmitting}
              placeholder="commuter@example.sg"
              autoComplete="email"
              required
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 bg-white text-sm font-medium text-slate-900 placeholder:text-slate-400 hover:border-slate-400 focus:outline-none focus:ring-2 focus:ring-[#004b87] focus:border-transparent transition-colors disabled:bg-slate-100"
            />
          </div>

          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <label
                htmlFor="login-password"
                className="text-xs font-bold uppercase tracking-wider text-slate-700 block"
              >
                Password
              </label>
              <Link
                href="/forgot-password"
                className="text-xs font-semibold text-[#004b87] hover:underline"
              >
                Forgot password?
              </Link>
            </div>
            <PasswordInput
              id="login-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={isSubmitting}
              autoComplete="current-password"
              placeholder="Enter your password"
              required
            />
          </div>

          <Button
            type="submit"
            variant="primary"
            size="lg"
            fullWidth
            isLoading={isSubmitting}
            leftIcon={<LogIn className="w-4 h-4" />}
            className="mt-2 py-3"
          >
            Sign in
          </Button>
        </form>
      </AuthCard>
    </div>
  );
}
