import React from 'react';
import { Card } from '@/components/ui/Card';

interface PreferenceSectionProps {
  title: string;
  description?: string;
  children: React.ReactNode;
}

export function PreferenceSection({
  title,
  description,
  children,
}: PreferenceSectionProps) {
  return (
    <section className="space-y-2">
      <div>
        <h2 className="text-xs font-bold uppercase tracking-wider text-slate-500">
          {title}
        </h2>
        {description && (
          <p className="text-xs text-slate-500 mt-0.5">{description}</p>
        )}
      </div>

      <Card variant="default" className="border border-slate-200 divide-y divide-slate-100 p-3 bg-white">
        {children}
      </Card>
    </section>
  );
}
