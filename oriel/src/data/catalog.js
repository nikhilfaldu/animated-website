// Product data for the fictional ORIEL Calibre O-1. Prices are invented for the concept.

export const FINISHES = [
  { id: 'steel', name: 'Steel', material: '904L stainless steel', price: 8400, swatch: '#b9bcc0' },
  { id: 'rosegold', name: 'Rose gold', material: '18k rose gold', price: 24800, swatch: '#d6a58c' },
  { id: 'ceramic', name: 'Black ceramic', material: 'Zirconium-oxide ceramic', price: 12600, swatch: '#232325' },
];

export const DIALS = [
  { id: 'midnight', name: 'Midnight', description: 'Sunburst blue lacquer', swatch: '#1a2a4a', strap: 'Navy calfskin' },
  { id: 'ivory', name: 'Ivory', description: 'Cream lacquer, grained', swatch: '#ece2cc', strap: 'Cognac calfskin' },
  { id: 'malachite', name: 'Malachite', description: 'Deep green sunburst', swatch: '#1f4d3a', strap: 'Forest calfskin' },
];

export const EDITIONS = [
  {
    id: 'minuit',
    name: 'Édition Minuit',
    finish: 'steel',
    dial: 'midnight',
    tagline: 'Steel, after dark.',
    description: 'Satin steel and a blue sunburst dial that turns almost black away from the light.',
  },
  {
    id: 'aube',
    name: 'Édition Aube',
    finish: 'rosegold',
    dial: 'ivory',
    tagline: 'Gold at first light.',
    description: 'Warm 18k rose gold around a grained ivory dial, the softest of the three.',
  },
  {
    id: 'foret',
    name: 'Édition Forêt',
    finish: 'ceramic',
    dial: 'malachite',
    tagline: 'Black ceramic, green shade.',
    description: 'A scratch-proof ceramic case that never warms, framing a deep green sunburst.',
  },
];

export const DEFAULT_CONFIG = Object.freeze({ finish: 'steel', dial: 'midnight' });

export const findFinish = (id) => FINISHES.find((f) => f.id === id) ?? FINISHES[0];
export const findDial = (id) => DIALS.find((d) => d.id === id) ?? DIALS[0];
export const findEdition = (id) => EDITIONS.find((e) => e.id === id) ?? null;
export const editionFor = (finish, dial) => EDITIONS.find((e) => e.finish === finish && e.dial === dial) ?? null;

export const priceOf = (finish) => findFinish(finish).price;

const currency = new Intl.NumberFormat('en-IE', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 });
export const formatPrice = (n) => currency.format(n);

const base = import.meta.env.BASE_URL;
export const posterFor = (finish, dial) => `${base}media/config-${finish}-${dial}.webp`;

export function productHref({ finish, dial }) {
  const edition = editionFor(finish, dial);
  return edition ? `${base}product.html?edition=${edition.id}` : `${base}product.html?finish=${finish}&dial=${dial}`;
}

/** Display name for any configuration: the edition name, or "Calibre O-1" for made-to-order combinations. */
export function nameFor({ finish, dial }) {
  return editionFor(finish, dial)?.name ?? 'Calibre O-1';
}

export function describe({ finish, dial }) {
  return `${findFinish(finish).name} · ${findDial(dial).name} dial`;
}
