'use client';

import React from 'react';
import { MapPin, Navigation, Info, AlertTriangle, Layers } from 'lucide-react';
import { cn } from '@/lib/utils';

interface MapPlaceholderProps {
  className?: string;
  heightClass?: string;
  showAffectedDetour?: boolean;
}

export function MapPlaceholder({
  className,
  heightClass = 'h-52',
  showAffectedDetour = true,
}: MapPlaceholderProps) {
  return (
    <div
      role="region"
      aria-label="Map preview prototype"
      className={cn(
        'w-full relative rounded-2xl overflow-hidden border-2 border-slate-300 bg-[#eef2f6] shadow-inner select-none flex flex-col justify-between p-3',
        heightClass,
        className
      )}
    >
      {/* Background SVG Grid & Schematic Transit Line */}
      <svg
        className="absolute inset-0 w-full h-full opacity-60 pointer-events-none"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden="true"
      >
        <defs>
          <pattern id="map-grid" width="30" height="30" patternUnits="userSpaceOnUse">
            <path d="M 30 0 L 0 0 0 30" fill="none" stroke="#cbd5e1" strokeWidth="0.8" />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#map-grid)" />

        {/* East West Line representation (Green line EWL #009640) */}
        <path
          d="M 40 140 Q 140 130 200 90 T 360 60"
          fill="none"
          stroke="#009640"
          strokeWidth="6"
          strokeLinecap="round"
        />

        {/* Bedok Station Node */}
        <circle cx="60" cy="138" r="6" fill="#ffffff" stroke="#009640" strokeWidth="3" />
        <text x="60" y="160" fontSize="10" fontWeight="bold" fill="#1e293b" textAnchor="middle">
          Bedok (EW5)
        </text>

        {/* Outram Park Interchange Node */}
        <circle cx="280" cy="72" r="7" fill="#ffffff" stroke="#009640" strokeWidth="3.5" />
        <text x="280" y="58" fontSize="10" fontWeight="bold" fill="#1e293b" textAnchor="middle">
          Outram Park (EW16)
        </text>

        {/* Detour Route / Walking linkway to SGH */}
        {showAffectedDetour && (
          <>
            {/* Normal Affected Exit A path (Red dash / unavailable) */}
            <path
              d="M 280 72 L 310 95"
              fill="none"
              stroke="#dc2626"
              strokeWidth="3"
              strokeDasharray="4 3"
            />
            <circle cx="310" cy="95" r="4" fill="#dc2626" />

            {/* Recommended Exit B path (Teal / Mobility step-free line) */}
            <path
              d="M 280 72 Q 295 110 330 115"
              fill="none"
              stroke="#00847f"
              strokeWidth="3.5"
            />
            <circle cx="330" cy="115" r="4.5" fill="#00847f" />
            <text x="330" y="132" fontSize="9" fontWeight="bold" fill="#00847f" textAnchor="middle">
              Exit B (Step-free)
            </text>

            {/* SGH Destination Node */}
            <circle cx="350" cy="120" r="5" fill="#004b87" stroke="#ffffff" strokeWidth="1.5" />
            <text x="350" y="145" fontSize="10" fontWeight="bold" fill="#004b87" textAnchor="middle">
              SGH Block 4
            </text>
          </>
        )}
      </svg>

      {/* Top Header Badge */}
      <div className="relative z-10 flex items-center justify-between">
        <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-white border border-slate-300 text-xs font-bold text-slate-800 shadow-xs">
          <Layers className="w-3.5 h-3.5 text-[#004b87]" aria-hidden="true" />
          <span>Map preview — UI prototype</span>
        </div>

        <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-slate-800 text-white text-[10px] font-medium">
          MapLibre / OSM area
        </div>
      </div>

      {/* Bottom Map Legend */}
      <div className="relative z-10 bg-white rounded-xl p-2 border border-slate-200 text-[11px] shadow-xs space-y-1">
        <div className="flex items-center justify-between text-slate-700">
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-[#009640] inline-block" />
            <span className="font-semibold">East West Line</span>
          </div>

          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-[#00847f] inline-block" />
            <span className="font-semibold">Exit B (Accessible)</span>
          </div>

          <div className="flex items-center gap-1 text-red-800 font-semibold">
            <AlertTriangle className="w-3 h-3 text-red-600" />
            <span>Exit A Lift Outage</span>
          </div>
        </div>
      </div>
    </div>
  );
}
