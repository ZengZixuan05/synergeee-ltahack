'use client';

import React, { useMemo, useState } from 'react';
import { X, Footprints, Train, Bus, ArrowUpDown, ChevronLeft } from 'lucide-react';
import { RouteLeg, RouteLegMode } from '@/types/journey';
import { MrtStation, MrtLineCode, stationByCode, inferSharedLines, findLine } from '@/fixtures/stations';
import { Button } from '@/components/ui/Button';
import { isLegComplete } from '@/lib/routeLegs';
import { StationSelector } from './StationSelector';
import { LineSelector } from './LineSelector';
import { BusServiceSelector } from './BusServiceSelector';

interface AddLegSheetProps {
  isOpen: boolean;
  initialLeg: RouteLeg | null;
  onSave: (leg: RouteLeg) => void;
  onClose: () => void;
}

const MODE_CHOICES: { mode: RouteLegMode; label: string; icon: React.ReactNode }[] = [
  { mode: 'walk', label: 'Walk', icon: <Footprints className="w-6 h-6 text-[#00847f]" /> },
  { mode: 'rail', label: 'MRT / LRT', icon: <Train className="w-6 h-6 text-[#009645]" /> },
  { mode: 'bus', label: 'Bus', icon: <Bus className="w-6 h-6 text-amber-600" /> },
  { mode: 'transfer', label: 'Transfer', icon: <ArrowUpDown className="w-6 h-6 text-[#004b87]" /> },
];

function makeId(): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) return crypto.randomUUID();
  return `leg-${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

export function AddLegSheet({ isOpen, initialLeg, onSave, onClose }: AddLegSheetProps) {
  const [mode, setMode] = useState<RouteLegMode | null>(initialLeg?.mode ?? null);

  // Walk
  const [walkTo, setWalkTo] = useState(initialLeg?.mode === 'walk' ? initialLeg.to : '');
  const [walkNotes, setWalkNotes] = useState(initialLeg?.mode === 'walk' ? initialLeg.notes ?? '' : '');

  // Rail
  const [boardStation, setBoardStation] = useState<MrtStation | null>(
    initialLeg?.mode === 'rail' ? stationByCode(initialLeg.boardStationCode) ?? null : null
  );
  const [alightStation, setAlightStation] = useState<MrtStation | null>(
    initialLeg?.mode === 'rail' ? stationByCode(initialLeg.alightStationCode) ?? null : null
  );
  const [lineCode, setLineCode] = useState<MrtLineCode | null>(
    initialLeg?.mode === 'rail' ? (initialLeg.lineCode as MrtLineCode) : null
  );
  const [direction, setDirection] = useState(initialLeg?.mode === 'rail' ? initialLeg.direction ?? '' : '');

  // Bus
  const [busBoard, setBusBoard] = useState(initialLeg?.mode === 'bus' ? initialLeg.boardStop : '');
  const [busService, setBusService] = useState(initialLeg?.mode === 'bus' ? initialLeg.serviceNumber : '');
  const [busAlight, setBusAlight] = useState(initialLeg?.mode === 'bus' ? initialLeg.alightStop : '');

  // Transfer
  const [transferStation, setTransferStation] = useState(initialLeg?.mode === 'transfer' ? initialLeg.stationName ?? '' : '');
  const [transferNotes, setTransferNotes] = useState(initialLeg?.mode === 'transfer' ? initialLeg.notes ?? '' : '');

  const boardLineOptions = boardStation?.codes.map((c) => c.line) ?? undefined;
  const suggestedLines = useMemo(
    () => (boardStation && alightStation ? inferSharedLines(boardStation.id, alightStation.id) : []),
    [boardStation, alightStation]
  );

  if (!isOpen) return null;

  const buildLeg = (): RouteLeg | null => {
    const id = initialLeg?.id ?? makeId();
    if (mode === 'walk') {
      return { id, mode: 'walk', to: walkTo, notes: walkNotes || undefined };
    }
    if (mode === 'rail') {
      const boardCode = boardStation?.codes.find((c) => c.line === lineCode)?.code ?? '';
      const alightCode = alightStation?.codes.find((c) => c.line === lineCode)?.code ?? alightStation?.codes[0]?.code ?? '';
      const line = lineCode ? findLine(lineCode) : undefined;
      return {
        id,
        mode: 'rail',
        boardStationCode: boardCode,
        boardStationName: boardStation?.name ?? '',
        lineCode: line?.code ?? lineCode ?? '',
        lineName: line?.name ?? '',
        direction: direction || undefined,
        alightStationCode: alightCode,
        alightStationName: alightStation?.name ?? '',
      };
    }
    if (mode === 'bus') {
      return { id, mode: 'bus', boardStop: busBoard, serviceNumber: busService, alightStop: busAlight };
    }
    if (mode === 'transfer') {
      return { id, mode: 'transfer', stationName: transferStation || undefined, notes: transferNotes || undefined };
    }
    return null;
  };

  const draftLeg = buildLeg();
  const canSave = draftLeg !== null && isLegComplete(draftLeg);

  const handleSave = () => {
    if (!draftLeg || !isLegComplete(draftLeg)) return;
    onSave(draftLeg);
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="add-leg-title"
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 p-0 sm:p-4 animate-fadeIn"
    >
      <div className="w-full max-w-md bg-white rounded-t-3xl sm:rounded-3xl shadow-modal overflow-hidden flex flex-col max-h-[90vh] animate-slideUp">
        <div className="pt-3 px-4 pb-2 flex items-center justify-between border-b border-slate-100 shrink-0">
          <div className="flex items-center gap-2">
            {mode && !initialLeg && (
              <button type="button" onClick={() => setMode(null)} aria-label="Back to travel mode" className="p-1 -ml-1 text-slate-500">
                <ChevronLeft className="w-5 h-5" />
              </button>
            )}
            <h2 id="add-leg-title" className="text-sm font-bold text-slate-900">
              {mode ? MODE_CHOICES.find((m) => m.mode === mode)?.label : 'How do you travel next?'}
            </h2>
          </div>
          <button type="button" onClick={onClose} aria-label="Close" className="p-1.5 rounded-full hover:bg-slate-100 text-slate-500">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="overflow-y-auto p-4 space-y-4" style={{ paddingBottom: 'calc(env(safe-area-inset-bottom, 16px) + 1rem)' }}>
          {!mode && (
            <div className="grid grid-cols-2 gap-3">
              {MODE_CHOICES.map((choice) => (
                <button
                  key={choice.mode}
                  type="button"
                  onClick={() => setMode(choice.mode)}
                  className="p-4 rounded-2xl border border-slate-200 bg-white hover:border-[#004b87] hover:bg-[#f0f5fa] flex flex-col items-center gap-2 min-h-[92px] transition-all"
                >
                  {choice.icon}
                  <span className="text-sm font-bold text-slate-900">{choice.label}</span>
                </button>
              ))}
            </div>
          )}

          {mode === 'walk' && (
            <div className="space-y-3">
              <div>
                <label htmlFor="walk-to" className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block mb-1">
                  Walk to
                </label>
                <input
                  id="walk-to"
                  type="text"
                  value={walkTo}
                  onChange={(e) => setWalkTo(e.target.value)}
                  placeholder="e.g. Bedok MRT"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-sm font-semibold text-slate-900 outline-none focus:border-[#004b87] focus:ring-1 focus:ring-[#004b87] placeholder:text-slate-400 placeholder:font-normal"
                />
              </div>
              <div>
                <label htmlFor="walk-notes" className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block mb-1">
                  Notes (optional)
                </label>
                <input
                  id="walk-notes"
                  type="text"
                  value={walkNotes}
                  onChange={(e) => setWalkNotes(e.target.value)}
                  placeholder="e.g. via sheltered linkway"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-sm font-medium text-slate-900 outline-none focus:border-[#004b87] focus:ring-1 focus:ring-[#004b87] placeholder:text-slate-400"
                />
              </div>
              <p className="text-[11px] text-slate-400">Map-based walking routes will be added later.</p>
            </div>
          )}

          {mode === 'rail' && (
            <div className="space-y-3">
              <StationSelector
                id="board-station"
                label="Board at"
                value={boardStation}
                onChange={(s) => {
                  setBoardStation(s);
                  setLineCode(null);
                }}
              />
              <LineSelector
                label="Line"
                value={lineCode}
                onChange={setLineCode}
                options={boardLineOptions}
                suggested={suggestedLines}
              />
              <div>
                <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block mb-1">
                  Direction / towards
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {(lineCode ? findLine(lineCode)?.termini ?? [] : []).map((terminus) => (
                    <button
                      key={terminus}
                      type="button"
                      onClick={() => setDirection(`Towards ${terminus}`)}
                      className={`px-2 py-2 rounded-lg border text-xs font-bold min-h-[44px] transition-all ${
                        direction === `Towards ${terminus}`
                          ? 'border-[#004b87] bg-[#f0f5fa] text-[#004b87]'
                          : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300'
                      }`}
                    >
                      Towards {terminus}
                    </button>
                  ))}
                  {!lineCode && <p className="text-xs text-slate-400 col-span-2">Pick a line first.</p>}
                </div>
              </div>
              <StationSelector
                id="alight-station"
                label="Alight at"
                value={alightStation}
                onChange={setAlightStation}
                filterLine={lineCode ?? undefined}
              />
              {suggestedLines.length > 0 && lineCode && !suggestedLines.includes(lineCode) && (
                <p className="text-[11px] text-[#00847f] font-semibold">
                  These stations share a line not currently selected — check the suggested option above.
                </p>
              )}
            </div>
          )}

          {mode === 'bus' && (
            <div className="space-y-3">
              <div>
                <label htmlFor="bus-board" className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block mb-1">
                  Board at
                </label>
                <input
                  id="bus-board"
                  type="text"
                  value={busBoard}
                  onChange={(e) => setBusBoard(e.target.value)}
                  placeholder="e.g. Bedok Interchange"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-sm font-semibold text-slate-900 outline-none focus:border-[#004b87] focus:ring-1 focus:ring-[#004b87] placeholder:text-slate-400 placeholder:font-normal"
                />
              </div>
              <BusServiceSelector id="bus-service" label="Bus service" value={busService} onChange={setBusService} />
              <div>
                <label htmlFor="bus-alight" className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block mb-1">
                  Alight at
                </label>
                <input
                  id="bus-alight"
                  type="text"
                  value={busAlight}
                  onChange={(e) => setBusAlight(e.target.value)}
                  placeholder="e.g. Orchard Road"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-sm font-semibold text-slate-900 outline-none focus:border-[#004b87] focus:ring-1 focus:ring-[#004b87] placeholder:text-slate-400 placeholder:font-normal"
                />
              </div>
            </div>
          )}

          {mode === 'transfer' && (
            <div className="space-y-3">
              <div>
                <label htmlFor="transfer-station" className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block mb-1">
                  Station (optional)
                </label>
                <input
                  id="transfer-station"
                  type="text"
                  value={transferStation}
                  onChange={(e) => setTransferStation(e.target.value)}
                  placeholder="e.g. Outram Park"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-sm font-semibold text-slate-900 outline-none focus:border-[#004b87] focus:ring-1 focus:ring-[#004b87] placeholder:text-slate-400 placeholder:font-normal"
                />
              </div>
              <div>
                <label htmlFor="transfer-notes" className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block mb-1">
                  Notes (optional)
                </label>
                <input
                  id="transfer-notes"
                  type="text"
                  value={transferNotes}
                  onChange={(e) => setTransferNotes(e.target.value)}
                  placeholder="e.g. cross-platform interchange"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-sm font-medium text-slate-900 outline-none focus:border-[#004b87] focus:ring-1 focus:ring-[#004b87] placeholder:text-slate-400"
                />
              </div>
            </div>
          )}
        </div>

        {mode && (
          <div className="p-4 border-t border-slate-100 shrink-0">
            <Button type="button" variant="primary" size="lg" fullWidth disabled={!canSave} onClick={handleSave}>
              {initialLeg ? 'Save step' : 'Add step'}
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}

