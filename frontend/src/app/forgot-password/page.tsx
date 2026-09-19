'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, MailCheck, Send, AlertCircle } from 'lucide-react';
import { useAuth } from '@/features/auth/useAuth';
import { AuthCard } from '@/components/auth/AuthCard';
import { Button } from '@/components/ui/Button';

export default function ForgotPasswordPage() {
  const { resetPassword, isFirebaseConfigured } = useAuth();

  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!email.trim()) {
      setError('Please enter your email address.');
      return;
    }

    setIsSubmitting(true);

    try {
      if (isFirebaseConfigured) {
        await resetPassword(email);
      }
      // Always show neutral confirmation, regardless of whether the email exists
      setIsSubmitted(true);
    } catch (err: unknown) {
      console.warn('Password reset request error:', err);
      // For security, show neutral confirmation even if user is not found,
      // but catch connection/network errors
      const fbErr = err as { code?: string };
      if (fbErr.code === 'auth/network-request-failed') {
        setError('Network error. Please check your connection and try again.');
      } else {
        setIsSubmitted(true);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex-1 flex flex-col justify-center px-4 py-8">
      <AuthCard
        title="Reset Password"
        subtitle="JourneyAheadSG Commuter Account Recovery"
        footer={
          <div className="pt-2">
            <Link
              href="/login"
              className="text-xs font-bold text-[#004b87] hover:underline inline-flex items-center gap-1"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              Back to Sign in
            </Link>
          </div>
        }
      >
        {isSubmitted ? (
          <div className="text-center py-4 space-y-3 animate-fadeIn">
            <div className="w-12 h-12 mx-auto rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <MailCheck className="w-6 h-6 stroke-[2.5]" />
            </div>
            <div className="space-y-1.5">
              <h2 className="text-base font-bold text-slate-800">
                Check your email
              </h2>
              <p className="text-xs text-slate-600 leading-relaxed">
                If an account exists for <strong className="text-slate-900">{email}</strong>, we&apos;ve sent password reset instructions. Please check your inbox and spam folder.
              </p>
            </div>
            <Button
              variant="outline"
              size="md"
              fullWidth
              onClick={() => {
                setIsSubmitted(false);
                setEmail('');
              }}
              className="mt-4"
            >
              Try another email
            </Button>
          </div>
        ) : (
          <>
            <div className="border-b border-slate-100 pb-3 mb-1">
              <h2 className="text-base font-bold text-slate-800">
                Forgot your password?
              </h2>
              <p className="text-xs text-slate-500 leading-relaxed">
                Enter your registered email address and we&apos;ll send you instructions to reset your password.
              </p>
            </div>

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
                  htmlFor="reset-email"
                  className="text-xs font-bold uppercase tracking-wider text-slate-700 block"
                >
                  Email address
                </label>
                <input
                  id="reset-email"
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

              <Button
                type="submit"
                variant="primary"
                size="lg"
                fullWidth
                isLoading={isSubmitting}
                leftIcon={<Send className="w-4 h-4" />}
                className="mt-2 py-3"
              >
                Send reset link
              </Button>
            </form>
          </>
        )}
      </AuthCard>
    </div>
  );
}
