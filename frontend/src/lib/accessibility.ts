export type TextSize = 'standard' | 'large' | 'xlarge';

export const TEXT_SIZE_DESCRIPTIONS: Record<TextSize, string> = {
  standard: 'Default system sizing (16px base)',
  large: 'Comfortable reading for everyday commute (+15%)',
  xlarge: 'High legibility outdoors and in bright light (+30%)',
};

export const CROWDING_DESCRIPTIONS = {
  low: {
    label: 'Low crowding',
    shortLabel: 'Low',
    ariaLabel: 'Low crowding level: Seats easily available',
    colorClass: 'text-emerald-800 bg-emerald-50 border-emerald-300',
    barCount: 1,
  },
  moderate: {
    label: 'Moderate crowding',
    shortLabel: 'Moderate',
    ariaLabel: 'Moderate crowding level: Some standing room only',
    colorClass: 'text-amber-800 bg-amber-50 border-amber-300',
    barCount: 2,
  },
  high: {
    label: 'High crowding',
    shortLabel: 'High',
    ariaLabel: 'High crowding level: Standing room packed, expect boarding delays',
    colorClass: 'text-red-800 bg-red-50 border-red-300',
    barCount: 3,
  },
} as const;
