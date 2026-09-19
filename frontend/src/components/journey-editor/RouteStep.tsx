'use client';

import React, { useState } from 'react';
import { Plus, Route as RouteIcon } from 'lucide-react';
import { RouteLeg } from '@/types/journey';
import { Button } from '@/components/ui/Button';
import { moveLegUp, moveLegDown, removeLeg, replaceLeg } from '@/lib/routeLegs';
import { RouteTimeline } from './RouteTimeline';
import { AddLegSheet } from './AddLegSheet';

interface RouteStepProps {
  origin: string;
  destination: string;
  route: RouteLeg[];
  onChange: (route: RouteLeg[]) => void;
}

export function RouteStep({ origin, destination, route, onChange }: RouteStepProps) {
  const [sheetOpen, setSheetOpen] = useState(false);
  const [editingLeg, setEditingLeg] = useState<RouteLeg | null>(null);

  const openForNewLeg = () => {
    setEditingLeg(null);
    setSheetOpen(true);
  };

  const openForEdit = (leg: RouteLeg) => {
    setEditingLeg(leg);
    setSheetOpen(true);
  };

  const handleSaveLeg = (leg: RouteLeg) => {
    const exists = route.some((l) => l.id === leg.id);
    onChange(exists ? replaceLeg(route, leg.id, leg) : [...route, leg]);
    setSheetOpen(false);
    setEditingLeg(null);
  };

  return (
    <div className="space-y-4 animate-fadeIn">
      <div>
        <div className="inline-flex items-center gap-1 text-[11px] font-bold text-[#004b87] uppercase tracking-wider">
          <RouteIcon className="w-3.5 h-3.5" />
          <span>Optional</span>
        </div>
        <h1 className="text-xl font-black text-slate-900 tracking-tight mt-0.5">Usual route</h1>
        <p className="text-xs text-slate-500 mt-1">How do you normally make this journey?</p>
        <p className="text-[11px] text-slate-400 mt-1">
          This is optional. JourneyAheadSG will be able to plan routes automatically when live routing is connected.
        </p>
      </div>

      <RouteTimeline
        origin={origin}
        destination={destination}
        legs={route}
        onEdit={openForEdit}
        onRemove={(id) => onChange(removeLeg(route, id))}
        onMoveUp={(id) => onChange(moveLegUp(route, id))}
        onMoveDown={(id) => onChange(moveLegDown(route, id))}
      />

      <Button type="button" variant="outline" size="md" fullWidth onClick={openForNewLeg} leftIcon={<Plus className="w-4 h-4" />}>
        Add journey step
      </Button>

      <AddLegSheet
        isOpen={sheetOpen}
        initialLeg={editingLeg}
        onSave={handleSaveLeg}
        onClose={() => {
          setSheetOpen(false);
          setEditingLeg(null);
        }}
      />
    </div>
  );
}
