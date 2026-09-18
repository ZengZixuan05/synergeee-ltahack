'use client';

import React, { useState } from 'react';
import { X, Mic, Sparkles, AlertCircle, ArrowRight, CornerDownLeft } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';

interface VoiceAssistantSheetProps {
  isOpen: boolean;
  onClose: () => void;
  isDisrupted?: boolean;
}

const SAMPLE_PROMPTS = [
  {
    query: 'Why did my route change?',
    response: 'Exit A lift at Outram Park MRT is currently unavailable for maintenance. To ensure your route remains 100% step-free, we recommended Exit B instead, which adds only 7 minutes and 80 metres.',
  },
  {
    query: 'Can I walk less?',
    response: 'Your current recommended route requires 420 metres of walking. You can switch to a direct bus linkway (Bus 12 to SGH shuttle), but it involves 2 transfers.',
  },
  {
    query: 'Is my journey okay tomorrow?',
    response: 'Tomorrow morning around 8:40 AM, light passing showers are forecast. The Exit B alternative remains fully sheltered all the way to SGH Block 4.',
  },
  {
    query: 'Read my directions',
    response: 'Step 1: Walk 320 m to Bedok MRT via sheltered linkway. Step 2: Use Lift B at Entrance A to reach the concourse.',
  },
];

export function VoiceAssistantSheet({
  isOpen,
  onClose,
  isDisrupted = false,
}: VoiceAssistantSheetProps) {
  const [selectedResponse, setSelectedResponse] = useState<string | null>(null);
  const [activeQuery, setActiveQuery] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSelectPrompt = (prompt: typeof SAMPLE_PROMPTS[0]) => {
    setActiveQuery(prompt.query);
    setSelectedResponse(prompt.response);
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="voice-assistant-title"
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 backdrop-blur-xs p-0 sm:p-4 animate-fadeIn"
    >
      <div className="w-full max-w-md bg-white rounded-t-3xl sm:rounded-3xl shadow-modal overflow-hidden flex flex-col max-h-[85vh] animate-slideUp">
        {/* Sheet Drag Indicator & Close Header */}
        <div className="pt-3 px-4 pb-2 flex items-center justify-between border-b border-slate-100">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-red-50 flex items-center justify-center text-[#d42426]">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h2 id="voice-assistant-title" className="text-sm font-bold text-slate-900">
                Voice Assistant
              </h2>
              <span className="text-[11px] text-slate-500 font-medium">UI Prototype Preview</span>
            </div>
          </div>

          <button
            onClick={onClose}
            aria-label="Close assistant dialog"
            className="p-2 rounded-full text-slate-500 hover:text-slate-800 hover:bg-slate-100 min-h-[44px] min-w-[44px] flex items-center justify-center focus-visible:outline-2"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-4 overflow-y-auto space-y-4 pb-bottom-sheet">
          <div className="text-center py-2">
            <div className="w-16 h-16 mx-auto mb-2 rounded-full bg-red-100 text-[#d42426] flex items-center justify-center animate-pulse">
              <Mic className="w-8 h-8" />
            </div>
            <h3 className="text-lg font-bold text-slate-900">
              How can I help with your journey?
            </h3>
            <p className="text-xs text-slate-500 mt-1">
              Tap a sample question below to test how proactive advice is delivered.
            </p>
          </div>

          {/* Sample Actions / Chips */}
          <div className="space-y-2">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500 block">
              Sample queries
            </span>
            <div className="flex flex-col gap-2">
              {SAMPLE_PROMPTS.map((prompt) => (
                <button
                  key={prompt.query}
                  type="button"
                  onClick={() => handleSelectPrompt(prompt)}
                  className={`text-left p-3 rounded-xl border transition-all text-xs font-semibold flex items-center justify-between gap-2 min-h-[44px] focus-visible:outline-2 ${
                    activeQuery === prompt.query
                      ? 'border-[#d42426] bg-red-50 text-[#d42426]'
                      : 'border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-800'
                  }`}
                >
                  <span>"{prompt.query}"</span>
                  <ArrowRight className="w-3.5 h-3.5 flex-shrink-0 opacity-70" />
                </button>
              ))}
            </div>
          </div>

          {/* Simulated Response Box */}
          {selectedResponse && (
            <div className="p-3.5 rounded-2xl bg-slate-900 text-white space-y-2 animate-fadeIn">
              <div className="flex items-center gap-1.5 text-xs text-red-300 font-bold">
                <Sparkles className="w-3.5 h-3.5" />
                <span>Simulated Assistant Advice</span>
              </div>
              <p className="text-xs leading-relaxed text-slate-100 font-medium">
                {selectedResponse}
              </p>
            </div>
          )}

          {/* Unambiguous Prototype Disclaimer */}
          <div className="p-3 rounded-xl bg-amber-50 border border-amber-300 text-amber-950 text-xs flex items-start gap-2">
            <AlertCircle className="w-4 h-4 text-amber-700 flex-shrink-0 mt-0.5" />
            <p className="text-[11px] leading-relaxed">
              <strong>Notice:</strong> This is an interactive frontend UI prototype. The conversational AI backend and speech recognition are not connected yet.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
