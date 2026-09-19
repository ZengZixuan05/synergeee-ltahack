'use client';

import React from 'react';
import { Mic } from 'lucide-react';
import { cn } from '@/lib/utils';

interface VoiceAssistantButtonProps {
  onClick: () => void;
  className?: string;
}

export function VoiceAssistantButton({
  onClick,
  className,
}: VoiceAssistantButtonProps) {
  return (
    <div
      className={cn(
        'fixed right-4 z-30',
        className
      )}
      style={{
        bottom: 'calc(env(safe-area-inset-bottom, 16px) + 4.5rem)',
      }}
    >
      <button
        type="button"
        onClick={onClick}
        aria-label="Open voice assistant prototype"
        className="w-13 h-13 min-w-[50px] min-h-[50px] rounded-full bg-[#004b87] hover:bg-[#003966] active:bg-[#002a4a] text-white shadow-sm flex items-center justify-center transition-transform hover:scale-105 active:scale-95 focus-visible:outline-2"
      >
        <Mic className="w-6 h-6 stroke-[2.2]" aria-hidden="true" />
      </button>
    </div>
  );
}
