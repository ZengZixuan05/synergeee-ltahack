/** Subtracts `minutes` from an "HH:mm" or "HH:mm:ss" clock time, wrapping around midnight. */
export function subtractMinutesFromTime(time: string, minutes: number): string {
  const [hh, mm, ss] = time.split(':');
  const hours = Number(hh);
  const mins = Number(mm);
  const total = (((hours * 60 + mins - minutes) % 1440) + 1440) % 1440;
  const newHours = Math.floor(total / 60);
  const newMins = total % 60;
  const secondsSuffix = ss !== undefined ? `:${ss}` : '';
  return `${String(newHours).padStart(2, '0')}:${String(newMins).padStart(2, '0')}${secondsSuffix}`;
}
