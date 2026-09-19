'use client';

import { useDemoMode } from '@/features/demo/useDemoMode';

export function useTextSize() {
  const { textSize, setTextSize } = useDemoMode();
  return { textSize, setTextSize };
}
