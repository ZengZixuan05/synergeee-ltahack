'use client';

import React, { useState } from 'react';
import { ChevronDown, ChevronUp, ShieldCheck } from 'lucide-react';

export function GovMasthead() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <aside
      aria-label="Singapore Government official banner"
      className="bg-[#f0f3f6] border-b border-[#dbe2e8] text-[11px] text-[#485363] px-3 py-1.5 select-none"
    >
      <div className="max-w-md mx-auto flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          {/* Stylized SG Lion Crest Icon */}
          <div className="w-3.5 h-3.5 rounded-full bg-[#d42426] flex items-center justify-center text-[8px] text-white font-bold" aria-hidden="true">
            SG
          </div>
          <span className="font-medium text-slate-700">
            A Singapore Government Agency Website
          </span>
          <span className="hidden xs:inline text-slate-400">·</span>
          <span className="text-slate-500 font-normal">UI Prototype</span>
        </div>

        <button
          onClick={() => setIsOpen(!isOpen)}
          className="text-slate-600 hover:text-slate-900 inline-flex items-center gap-0.5 text-[11px] min-h-[32px] px-1 py-0.5 rounded underline decoration-slate-400 focus-visible:outline-2"
          aria-expanded={isOpen}
          aria-controls="gov-masthead-details"
        >
          <span>{isOpen ? 'Hide' : 'How to identify'}</span>
          {isOpen ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
        </button>
      </div>

      {isOpen && (
        <div
          id="gov-masthead-details"
          className="max-w-md mx-auto mt-2 pt-2 border-t border-[#dbe2e8] text-xs text-slate-600 space-y-1.5 pb-1"
        >
          <div className="flex items-start gap-2">
            <ShieldCheck className="w-4 h-4 text-[#059669] flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-slate-800">Official Smart Commuter Prototype</p>
              <p className="text-[11px] text-slate-600">
                This is a high-fidelity frontend UI prototype built for the Singapore transport hackathon. All routing data shown is simulated demonstration data.
              </p>
            </div>
          </div>
        </div>
      )}
    </aside>
  );
}
