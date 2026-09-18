import type { Metadata, Viewport } from 'next';
import './globals.css';
import { AuthProvider } from '@/features/auth/AuthContext';
import { AuthGuard } from '@/features/auth/AuthGuard';
import { DemoProvider } from '@/features/demo/DemoContext';
import { AppShell } from '@/components/layout/AppShell';

export const metadata: Metadata = {
  title: 'GoAble SG — Smart Commuter Companion',
  description:
    'A mobile-first Smart Commuter Companion providing personalised, proactive journey recommendations for Singapore commuters.',
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  viewportFit: 'cover',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" data-text-size="large" suppressHydrationWarning>
      <body className="min-h-screen bg-slate-100 text-slate-900 selection:bg-red-100 selection:text-red-900">
        <AuthProvider>
          <DemoProvider>
            <AuthGuard>
              <AppShell>{children}</AppShell>
            </AuthGuard>
          </DemoProvider>
        </AuthProvider>
      </body>
    </html>
  );
}

