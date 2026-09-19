/**
 * Safety margin subtracted on top of the estimated travel time when resolving
 * an "arrive by" request into a departure time. Without it, the suggested
 * departure lands the commuter at exactly the deadline — any real-world
 * slack (a missed light, a slightly late bus) makes them late. Padding the
 * departure earlier means the itinerary is expected to arrive a few minutes
 * *before* the requested time instead of right on it.
 */
export const ARRIVE_BY_BUFFER_MINUTES = 5;

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
