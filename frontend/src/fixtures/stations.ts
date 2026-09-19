/**
 * Reference/illustrative MRT & LRT station and line data for the "Usual
 * route" builder's structured selectors. This is a curated static fixture —
 * NOT live or authoritative LTA data — used only to give users recognisable
 * stations/lines to pick from and to demonstrate simple "which line connects
 * these two stations" form assistance. It should be replaced with an
 * authoritative station/line data source when real routing is integrated.
 */

export type MrtLineCode = 'NSL' | 'EWL' | 'NEL' | 'CCL' | 'DTL' | 'TEL';

export interface MrtLine {
  code: MrtLineCode;
  name: string;
  color: string; // hex, matches official-style line colours
  termini: [string, string];
}

export const MRT_LINES: MrtLine[] = [
  { code: 'NSL', name: 'North South Line', color: '#d42e12', termini: ['Jurong East', 'Marina South Pier'] },
  { code: 'EWL', name: 'East West Line', color: '#009645', termini: ['Pasir Ris', 'Tuas Link'] },
  { code: 'NEL', name: 'North East Line', color: '#9900aa', termini: ['HarbourFront', 'Punggol'] },
  { code: 'CCL', name: 'Circle Line', color: '#fa9e0d', termini: ['HarbourFront', 'Dhoby Ghaut'] },
  { code: 'DTL', name: 'Downtown Line', color: '#005ec4', termini: ['Bukit Panjang', 'Expo'] },
  { code: 'TEL', name: 'Thomson-East Coast Line', color: '#9d5b25', termini: ['Woodlands North', 'Gardens by the Bay'] },
];

export interface StationCode {
  code: string; // e.g. "EW5"
  line: MrtLineCode;
}

export interface MrtStation {
  id: string; // slug, e.g. "bedok"
  name: string; // e.g. "Bedok"
  codes: StationCode[]; // multiple entries for interchange stations
}

export const MRT_STATIONS: MrtStation[] = [
  { id: 'jurong-east', name: 'Jurong East', codes: [{ code: 'NS1', line: 'NSL' }, { code: 'EW24', line: 'EWL' }] },
  { id: 'choa-chu-kang', name: 'Choa Chu Kang', codes: [{ code: 'NS4', line: 'NSL' }] },
  { id: 'woodlands', name: 'Woodlands', codes: [{ code: 'NS9', line: 'NSL' }, { code: 'TE2', line: 'TEL' }] },
  { id: 'yishun', name: 'Yishun', codes: [{ code: 'NS13', line: 'NSL' }] },
  { id: 'ang-mo-kio', name: 'Ang Mo Kio', codes: [{ code: 'NS16', line: 'NSL' }] },
  { id: 'bishan', name: 'Bishan', codes: [{ code: 'NS17', line: 'NSL' }, { code: 'CC15', line: 'CCL' }] },
  { id: 'toa-payoh', name: 'Toa Payoh', codes: [{ code: 'NS19', line: 'NSL' }] },
  { id: 'novena', name: 'Novena', codes: [{ code: 'NS20', line: 'NSL' }] },
  { id: 'newton', name: 'Newton', codes: [{ code: 'NS21', line: 'NSL' }, { code: 'DT11', line: 'DTL' }] },
  { id: 'orchard', name: 'Orchard', codes: [{ code: 'NS22', line: 'NSL' }, { code: 'TE14', line: 'TEL' }] },
  { id: 'somerset', name: 'Somerset', codes: [{ code: 'NS23', line: 'NSL' }] },
  { id: 'dhoby-ghaut', name: 'Dhoby Ghaut', codes: [{ code: 'NS24', line: 'NSL' }, { code: 'NE6', line: 'NEL' }, { code: 'CC1', line: 'CCL' }] },
  { id: 'city-hall', name: 'City Hall', codes: [{ code: 'NS25', line: 'NSL' }, { code: 'EW13', line: 'EWL' }] },
  { id: 'raffles-place', name: 'Raffles Place', codes: [{ code: 'NS26', line: 'NSL' }, { code: 'EW14', line: 'EWL' }] },
  { id: 'marina-bay', name: 'Marina Bay', codes: [{ code: 'NS27', line: 'NSL' }, { code: 'TE20', line: 'TEL' }] },

  { id: 'pasir-ris', name: 'Pasir Ris', codes: [{ code: 'EW1', line: 'EWL' }] },
  { id: 'tampines', name: 'Tampines', codes: [{ code: 'EW2', line: 'EWL' }] },
  { id: 'simei', name: 'Simei', codes: [{ code: 'EW3', line: 'EWL' }] },
  { id: 'tanah-merah', name: 'Tanah Merah', codes: [{ code: 'EW4', line: 'EWL' }] },
  { id: 'bedok', name: 'Bedok', codes: [{ code: 'EW5', line: 'EWL' }] },
  { id: 'kembangan', name: 'Kembangan', codes: [{ code: 'EW6', line: 'EWL' }] },
  { id: 'eunos', name: 'Eunos', codes: [{ code: 'EW7', line: 'EWL' }] },
  { id: 'paya-lebar', name: 'Paya Lebar', codes: [{ code: 'EW8', line: 'EWL' }, { code: 'CC9', line: 'CCL' }] },
  { id: 'aljunied', name: 'Aljunied', codes: [{ code: 'EW9', line: 'EWL' }] },
  { id: 'kallang', name: 'Kallang', codes: [{ code: 'EW10', line: 'EWL' }] },
  { id: 'lavender', name: 'Lavender', codes: [{ code: 'EW11', line: 'EWL' }] },
  { id: 'bugis', name: 'Bugis', codes: [{ code: 'EW12', line: 'EWL' }, { code: 'DT14', line: 'DTL' }] },
  { id: 'tanjong-pagar', name: 'Tanjong Pagar', codes: [{ code: 'EW15', line: 'EWL' }] },
  { id: 'outram-park', name: 'Outram Park', codes: [{ code: 'EW16', line: 'EWL' }, { code: 'NE3', line: 'NEL' }, { code: 'TE17', line: 'TEL' }] },
  { id: 'tiong-bahru', name: 'Tiong Bahru', codes: [{ code: 'EW17', line: 'EWL' }] },
  { id: 'redhill', name: 'Redhill', codes: [{ code: 'EW18', line: 'EWL' }] },
  { id: 'queenstown', name: 'Queenstown', codes: [{ code: 'EW19', line: 'EWL' }] },
  { id: 'commonwealth', name: 'Commonwealth', codes: [{ code: 'EW20', line: 'EWL' }] },
  { id: 'buona-vista', name: 'Buona Vista', codes: [{ code: 'EW21', line: 'EWL' }, { code: 'CC22', line: 'CCL' }] },
  { id: 'clementi', name: 'Clementi', codes: [{ code: 'EW23', line: 'EWL' }] },
  { id: 'chinese-garden', name: 'Chinese Garden', codes: [{ code: 'EW25', line: 'EWL' }] },
  { id: 'lakeside', name: 'Lakeside', codes: [{ code: 'EW26', line: 'EWL' }] },
  { id: 'boon-lay', name: 'Boon Lay', codes: [{ code: 'EW27', line: 'EWL' }] },
  { id: 'joo-koon', name: 'Joo Koon', codes: [{ code: 'EW29', line: 'EWL' }] },
  { id: 'tuas-link', name: 'Tuas Link', codes: [{ code: 'EW33', line: 'EWL' }] },
  { id: 'expo', name: 'Expo', codes: [{ code: 'CG1', line: 'EWL' }, { code: 'DT35', line: 'DTL' }] },
  { id: 'changi-airport', name: 'Changi Airport', codes: [{ code: 'CG2', line: 'EWL' }] },

  { id: 'harbourfront', name: 'HarbourFront', codes: [{ code: 'NE1', line: 'NEL' }, { code: 'CC29', line: 'CCL' }] },
  { id: 'chinatown', name: 'Chinatown', codes: [{ code: 'NE4', line: 'NEL' }, { code: 'DT19', line: 'DTL' }] },
  { id: 'clarke-quay', name: 'Clarke Quay', codes: [{ code: 'NE5', line: 'NEL' }] },
  { id: 'little-india', name: 'Little India', codes: [{ code: 'NE7', line: 'NEL' }, { code: 'DT12', line: 'DTL' }] },
  { id: 'farrer-park', name: 'Farrer Park', codes: [{ code: 'NE8', line: 'NEL' }] },
  { id: 'boon-keng', name: 'Boon Keng', codes: [{ code: 'NE9', line: 'NEL' }] },
  { id: 'potong-pasir', name: 'Potong Pasir', codes: [{ code: 'NE10', line: 'NEL' }] },
  { id: 'serangoon', name: 'Serangoon', codes: [{ code: 'NE12', line: 'NEL' }, { code: 'CC13', line: 'CCL' }] },
  { id: 'hougang', name: 'Hougang', codes: [{ code: 'NE14', line: 'NEL' }] },
  { id: 'sengkang', name: 'Sengkang', codes: [{ code: 'NE16', line: 'NEL' }] },
  { id: 'punggol', name: 'Punggol', codes: [{ code: 'NE17', line: 'NEL' }] },

  { id: 'bras-basah', name: 'Bras Basah', codes: [{ code: 'CC2', line: 'CCL' }] },
  { id: 'esplanade', name: 'Esplanade', codes: [{ code: 'CC3', line: 'CCL' }] },
  { id: 'promenade', name: 'Promenade', codes: [{ code: 'CC4', line: 'CCL' }, { code: 'DT15', line: 'DTL' }] },
  { id: 'one-north', name: 'one-north', codes: [{ code: 'CC23', line: 'CCL' }] },
  { id: 'botanic-gardens', name: 'Botanic Gardens', codes: [{ code: 'CC19', line: 'CCL' }, { code: 'DT9', line: 'DTL' }] },

  { id: 'bukit-panjang', name: 'Bukit Panjang', codes: [{ code: 'DT1', line: 'DTL' }] },
  { id: 'bayfront', name: 'Bayfront', codes: [{ code: 'DT16', line: 'DTL' }] },

  { id: 'woodlands-north', name: 'Woodlands North', codes: [{ code: 'TE1', line: 'TEL' }] },
  { id: 'orchard-boulevard', name: 'Orchard Boulevard', codes: [{ code: 'TE11', line: 'TEL' }] },
  { id: 'havelock', name: 'Havelock', codes: [{ code: 'TE18', line: 'TEL' }] },
  { id: 'great-world', name: 'Great World', codes: [{ code: 'TE19', line: 'TEL' }] },
  { id: 'gardens-by-the-bay', name: 'Gardens by the Bay', codes: [{ code: 'TE22', line: 'TEL' }] },
];

export function findLine(code: MrtLineCode): MrtLine | undefined {
  return MRT_LINES.find((line) => line.code === code);
}

export function searchStations(query: string, limit = 8): MrtStation[] {
  const q = query.trim().toLowerCase();
  if (!q) return MRT_STATIONS.slice(0, limit);
  return MRT_STATIONS.filter(
    (station) =>
      station.name.toLowerCase().includes(q) ||
      station.codes.some((c) => c.code.toLowerCase().includes(q))
  ).slice(0, limit);
}

export function stationById(id: string): MrtStation | undefined {
  return MRT_STATIONS.find((s) => s.id === id);
}

export function stationByCode(code: string): MrtStation | undefined {
  return MRT_STATIONS.find((s) => s.codes.some((c) => c.code === code));
}

/**
 * Simple "form assistance" helper — not real routing. Finds line(s) common to
 * both stations so the route builder can suggest a likely line once both a
 * boarding and alighting station are picked.
 */
export function inferSharedLines(boardStationId: string, alightStationId: string): MrtLineCode[] {
  const board = stationById(boardStationId);
  const alight = stationById(alightStationId);
  if (!board || !alight) return [];
  const boardLines = new Set(board.codes.map((c) => c.line));
  return alight.codes.map((c) => c.line).filter((line) => boardLines.has(line));
}
