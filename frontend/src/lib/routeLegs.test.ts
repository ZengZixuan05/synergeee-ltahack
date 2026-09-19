import { describe, it, expect } from 'vitest';
import { isLegComplete, moveLegUp, moveLegDown, removeLeg, replaceLeg, isAutoTransfer } from '@/lib/routeLegs';
import { RouteLeg, WalkingLeg, RailLeg, BusLeg } from '@/types/journey';

function walk(id: string, to = 'Bedok MRT'): WalkingLeg {
  return { id, mode: 'walk', to };
}

function rail(
  id: string,
  overrides: Partial<RailLeg> = {}
): RailLeg {
  return {
    id,
    mode: 'rail',
    boardStationCode: 'EW5',
    boardStationName: 'Bedok',
    lineCode: 'EWL',
    lineName: 'East West Line',
    alightStationCode: 'EW16',
    alightStationName: 'Outram Park',
    ...overrides,
  };
}

function bus(id: string, overrides: Partial<BusLeg> = {}): BusLeg {
  return { id, mode: 'bus', boardStop: 'Bedok Int', serviceNumber: '14', alightStop: 'Orchard', ...overrides };
}

describe('isLegComplete', () => {
  it('accepts a walking leg with a destination', () => {
    expect(isLegComplete(walk('1'))).toBe(true);
  });

  it('rejects a walking leg with an empty destination', () => {
    expect(isLegComplete(walk('1', '   '))).toBe(false);
  });

  it('accepts a complete MRT leg (board + alight stations)', () => {
    expect(isLegComplete(rail('1'))).toBe(true);
  });

  it('rejects an MRT leg missing the alighting station', () => {
    expect(isLegComplete(rail('1', { alightStationCode: '', alightStationName: '' }))).toBe(false);
  });

  it('rejects an MRT leg missing the boarding station', () => {
    expect(isLegComplete(rail('1', { boardStationCode: '', boardStationName: '' }))).toBe(false);
  });

  it('accepts a bus leg with a service number', () => {
    expect(isLegComplete(bus('1'))).toBe(true);
  });

  it('rejects a bus leg missing the service number', () => {
    expect(isLegComplete(bus('1', { serviceNumber: '' }))).toBe(false);
  });

  it('always accepts a transfer leg (free-form by nature)', () => {
    expect(isLegComplete({ id: '1', mode: 'transfer' })).toBe(true);
  });
});

describe('route ordering and editing', () => {
  it('moves a leg up', () => {
    const legs: RouteLeg[] = [walk('a'), rail('b'), walk('c')];
    const result = moveLegUp(legs, 'b');
    expect(result.map((l) => l.id)).toEqual(['b', 'a', 'c']);
  });

  it('does not move the first leg further up', () => {
    const legs: RouteLeg[] = [walk('a'), rail('b')];
    const result = moveLegUp(legs, 'a');
    expect(result.map((l) => l.id)).toEqual(['a', 'b']);
  });

  it('moves a leg down', () => {
    const legs: RouteLeg[] = [walk('a'), rail('b'), walk('c')];
    const result = moveLegDown(legs, 'b');
    expect(result.map((l) => l.id)).toEqual(['a', 'c', 'b']);
  });

  it('does not move the last leg further down', () => {
    const legs: RouteLeg[] = [walk('a'), rail('b')];
    const result = moveLegDown(legs, 'b');
    expect(result.map((l) => l.id)).toEqual(['a', 'b']);
  });

  it('removes a leg by id', () => {
    const legs: RouteLeg[] = [walk('a'), rail('b'), walk('c')];
    expect(removeLeg(legs, 'b').map((l) => l.id)).toEqual(['a', 'c']);
  });

  it('an empty route array is valid (usual route is optional)', () => {
    expect(removeLeg([walk('a')], 'a')).toEqual([]);
  });

  it('replaces (edits) a leg in place, preserving order', () => {
    const legs: RouteLeg[] = [walk('a'), rail('b')];
    const edited = replaceLeg(legs, 'a', walk('a', 'Tampines MRT'));
    expect(edited[0]).toEqual(walk('a', 'Tampines MRT'));
    expect(edited[1]).toEqual(rail('b'));
  });
});

describe('isAutoTransfer', () => {
  it('detects a transfer between two rail legs at the same station on different lines', () => {
    const outramEwl = rail('a', { alightStationCode: 'EW16', alightStationName: 'Outram Park', lineCode: 'EWL' });
    const outramTel = rail('b', {
      boardStationCode: 'TE17', boardStationName: 'Outram Park', lineCode: 'TEL', lineName: 'Thomson-East Coast Line',
      alightStationCode: 'TE20', alightStationName: 'Marina Bay',
    });
    expect(isAutoTransfer(outramEwl, outramTel)).toBe(true);
  });

  it('does not flag a transfer when the station differs', () => {
    const a = rail('a', { alightStationCode: 'EW16', alightStationName: 'Outram Park' });
    const b = rail('b', { boardStationCode: 'EW17', boardStationName: 'Tiong Bahru' });
    expect(isAutoTransfer(a, b)).toBe(false);
  });

  it('does not flag a transfer when consecutive legs are on the same line (no interchange needed)', () => {
    const a = rail('a', { alightStationCode: 'EW16', alightStationName: 'Outram Park', lineCode: 'EWL' });
    const b = rail('b', { boardStationCode: 'EW16', boardStationName: 'Outram Park', lineCode: 'EWL' });
    expect(isAutoTransfer(a, b)).toBe(false);
  });

  it('does not flag a transfer when either leg is not rail', () => {
    expect(isAutoTransfer(walk('a'), rail('b'))).toBe(false);
  });
});
