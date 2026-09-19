/**
 * Reference/illustrative bus service numbers for the "Usual route" builder's
 * searchable bus service selector. This is a curated static fixture — NOT
 * live LTA BusServices/BusRoutes data — used only so a user can pick a
 * recognisable service number instead of typing free text. Replace with
 * authoritative LTA DataMall BusServices data when live routing is added.
 */

export interface BusService {
  number: string;
  description: string;
}

export const BUS_SERVICES: BusService[] = [
  { number: '2', description: 'Changi Village ↔ Tanah Merah / Eunos' },
  { number: '5', description: 'Nee Soon ↔ Marina Centre' },
  { number: '7', description: 'Katong ↔ Bras Basah' },
  { number: '10', description: 'Bedok ↔ Clementi' },
  { number: '12', description: 'Katong ↔ Ang Mo Kio' },
  { number: '14', description: 'Bedok ↔ Orchard' },
  { number: '17', description: 'Marine Parade ↔ Toa Payoh' },
  { number: '30', description: 'Bedok North ↔ Shenton Way' },
  { number: '33', description: 'Bedok ↔ Botanic Gardens' },
  { number: '36', description: 'Changi Airport ↔ Orchard' },
  { number: '51', description: 'Pasir Ris ↔ Toa Payoh' },
  { number: '61', description: 'Sembawang ↔ Jurong East' },
  { number: '65', description: 'Yishun ↔ Shenton Way' },
  { number: '67', description: 'Woodlands ↔ Sentosa' },
  { number: '70', description: 'Woodlands ↔ Bedok' },
  { number: '100', description: 'HarbourFront ↔ Changi Village' },
  { number: '107', description: 'Bedok ↔ Bukit Merah' },
  { number: '123', description: 'HarbourFront ↔ Bukit Merah' },
  { number: '133', description: 'Toa Payoh ↔ Tiong Bahru' },
  { number: '147', description: 'Bukit Merah ↔ Marina Centre' },
  { number: '155', description: 'Ang Mo Kio ↔ Bishan' },
  { number: '156', description: 'Bishan ↔ HarbourFront' },
  { number: '170', description: 'Queen Street ↔ Johor Bahru' },
  { number: '174', description: 'Bukit Batok ↔ Queen Street' },
  { number: '190', description: 'Jurong East ↔ Bukit Merah' },
  { number: '196', description: 'Serangoon ↔ Orchard' },
  { number: '197', description: 'Bishan ↔ Marina Centre' },
  { number: '851', description: 'Choa Chu Kang ↔ Woodlands' },
  { number: '961', description: 'Woodlands ↔ Bukit Batok' },
];

export function searchBusServices(query: string, limit = 8): BusService[] {
  const q = query.trim().toLowerCase();
  if (!q) return BUS_SERVICES.slice(0, limit);
  return BUS_SERVICES.filter(
    (service) => service.number.toLowerCase().includes(q) || service.description.toLowerCase().includes(q)
  ).slice(0, limit);
}
