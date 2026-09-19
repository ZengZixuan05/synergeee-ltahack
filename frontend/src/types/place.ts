// ---------------------------------------------------------------------------
// Place — a normalised internal representation of a searchable Singapore
// location, independent of whichever geocoding provider produced it. UI
// components (map markers, comboboxes) should only ever see this shape,
// never a raw OneMap response object.
// ---------------------------------------------------------------------------

export type PlaceSource = 'onemap' | 'device-location' | 'manual';

export interface Place {
  /** Stable-enough id for React keys/dedupe; not persisted across sessions. */
  id: string;
  /** Short display label, e.g. "SKY EDEN@BEDOK" or "Current location". */
  label: string;
  /** Full postal address, when known. */
  address: string;
  latitude: number;
  longitude: number;
  source: PlaceSource;
}
