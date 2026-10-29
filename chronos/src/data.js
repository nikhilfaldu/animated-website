export const ERAS = [
  { id: 'prehistoric', num: '01', name: 'PREHISTORIC EARTH', date: '65,000,000 YEARS AGO', year: -65000000,
    text: 'Colossal ferns breathe mist into a sky older than memory. Something enormous moves between the trees.',
    color: 0x2fd18a, accent: '#2fd18a', accent2: '#d4b45a', fog: 0x06140e, bg: 0x030a07 },
  { id: 'ancient', num: '02', name: 'ANCIENT CIVILIZATION', date: '2500 BCE', year: -2500,
    text: 'Limestone faces burn white under a vast sun. The monuments are new, and the desert is listening.',
    color: 0xffb347, accent: '#ffb347', accent2: '#c7843f', fog: 0x2a1708, bg: 0x140a03 },
  { id: 'industrial', num: '03', name: 'THE INDUSTRIAL AGE', date: '1890 CE', year: 1890,
    text: 'Steam hisses through iron lungs. Giant clockwork turns the city like a single machine.',
    color: 0xe0753a, accent: '#e0753a', accent2: '#b86b3c', fog: 0x1c0f08, bg: 0x0c0604 },
  { id: 'present', num: '04', name: 'THE PRESENT', date: '2026 CE', year: 2026,
    text: 'Glass towers mirror rivers of light. The familiar city, seen as if for the first time.',
    color: 0x7cc7ff, accent: '#7cc7ff', accent2: '#ffffff', fog: 0x061226, bg: 0x02060f },
  { id: 'future', num: '05', name: 'THE DISTANT FUTURE', date: '3026 CE', year: 3026,
    text: 'Megastructures drift above a cosmic horizon. Gravity has become a design choice.',
    color: 0xa77bff, accent: '#a77bff', accent2: '#3ef2ff', fog: 0x0b0620, bg: 0x04020c },
];

export const COMPONENTS = [
  { id: 'reactor', code: 'CX-R1', title: 'Temporal Reactor', desc: 'The luminous heart of CHRONOS. Folds local spacetime into a stable lens through which a traveler can pass.',
    spec: { 'Core output': '4.2 TJ (fictional)', 'Field radius': '3.1 m', 'Cycle': '0.0007 s' } },
  { id: 'stabilizer', code: 'CX-Q2', title: 'Quantum Stabilizer', desc: 'Dampens paradox resonance during a jump so that the traveler arrives as one continuous person.',
    spec: { 'Coherence': '99.98%', 'Damping modes': '12', 'Status': 'Nominal' } },
  { id: 'rings', code: 'CX-C3', title: 'Chrono-Rings', desc: 'Counter-rotating rings that spin up to wind the temporal field. Their relative speed sets the jump distance.',
    spec: { 'Rings': '4', 'Peak spin': '18,000 rpm', 'Alloy': 'Chrome-iridium' } },
  { id: 'nav', code: 'CX-N4', title: 'Navigation Core', desc: 'Calculates arrival vectors across the timeline, correcting for planetary drift and orbital position.',
    spec: { 'Precision': '±0.4 s', 'Era index': '5 loaded', 'Latency': '3 ms' } },
  { id: 'anchor', code: 'CX-A5', title: 'Reality Anchor', desc: 'A tether to the origin moment. Guarantees there is always a way home.',
    spec: { 'Tether': 'Locked', 'Range': 'Unlimited*', 'Fail-safe': 'Triple' } },
];

export const LOG = [
  { title: 'The First Sunrise', era: 'PREHISTORIC EARTH', date: 'MISSION 0001 · 2026.03.14', text: 'Light crossed a world with no witnesses. We recorded the colour of the air before the first bird sang.', hue: '#2fd18a' },
  { title: 'The Lost Kingdom', era: 'ANCIENT CIVILIZATION', date: 'MISSION 0014 · 2026.05.02', text: 'A city absent from every map, its courtyards still warm. The inscriptions spoke of travelers from tomorrow.', hue: '#ffb347' },
  { title: 'The Clockwork Revolution', era: 'THE INDUSTRIAL AGE', date: 'MISSION 0027 · 2026.06.19', text: 'An engineer drew a reactor on a napkin in 1891. The sketch matches CHRONOS gear-for-gear.', hue: '#e0753a' },
  { title: 'Fragments of Tomorrow', era: 'THE PRESENT', date: 'MISSION 0033 · 2026.08.08', text: 'Viewed from a minute ahead, the present looks like a rehearsal everyone has forgotten.', hue: '#7cc7ff' },
  { title: 'The Silent Orbit', era: 'THE DISTANT FUTURE', date: 'MISSION 0041 · 2026.09.21', text: 'A ring of cities circling a dim star, all lights on, nobody home. A note: “We went further.”', hue: '#a77bff' },
  { title: 'Beyond the Event Horizon', era: 'UNKNOWN', date: 'MISSION 0042 · ——.——.——', text: 'Telemetry ended at the singularity. The reality anchor still pulls. Something is still on the line.', hue: '#3ef2ff' },
];

// Soundtrack streamed by the nav audio toggle. CC0 "Outer Space Loop" by wipics (opengameart.org).
// Falls back to the generative Web Audio drone if it cannot load.
export const SOUNDTRACK = {
  src: 'https://opengameart.org/sites/default/files/outer_space_2.mp3',
  title: 'Outer Space Loop — wipics (CC0)',
  page: 'https://opengameart.org/content/outer-space-loop',
};

// Interactive landmarks inside each era, keyed by era id. `key` matches the mesh tagged in eras.js.
export const LANDMARKS = {
  prehistoric: [
    { key: 'beast', title: 'Long-Necked Giant', desc: 'A sauropod the size of a building, grazing through the mist. Its footsteps register on the reactor seismograph.', spec: { Height: '~13 m', Mass: '~40 t', Threat: 'Low (herbivore)' } },
    { key: 'sun', title: 'Cretaceous Sun', desc: 'Slightly dimmer than today, filtered through a carbon-heavy sky that turns every dawn gold.', spec: { Luminosity: '99.4% of present', CO2: '~1000 ppm', Day: '23.6 h' } },
  ],
  ancient: [
    { key: 'pyramid', title: 'The Great Pyramid', desc: 'Freshly capped in polished limestone. In the noon light it is almost impossible to look at.', spec: { Height: '146 m', Blocks: '~2.3 million', Status: 'Under dedication' } },
    { key: 'obelisk', title: 'Solar Obelisk', desc: 'A needle of granite aligned to the solstice. Its shadow is the city’s clock.', spec: { Height: '21 m', Material: 'Red granite', Alignment: 'Solstice' } },
  ],
  industrial: [
    { key: 'gear', title: 'The Great Escapement', desc: 'The largest gear in the city, ticking once per minute. Every factory sets its shift by it.', spec: { Diameter: '22 m', Teeth: '40', Drive: 'Steam, 1200 hp' } },
    { key: 'chimney', title: 'Foundry Stack No. 6', desc: 'Smoke from here carries soot halfway across the continent. The air tastes of iron.', spec: { Height: '18 m', Output: 'Coke smoke', Built: '1871' } },
  ],
  present: [
    { key: 'spire', title: 'Meridian Spire', desc: 'A glass tower tuned to sway in the wind. At night its crown beacon flickers in time with the city grid.', spec: { Height: '412 m', Floors: '98', Beacon: 'LED, 2 MW' } },
    { key: 'trails', title: 'Arterial Stream', desc: 'Commuter traffic seen from a minute ahead — headlights one way, tail-lights the other.', spec: { Vehicles: '~4,000/h', Speed: '62 km/h', Lanes: '6' } },
  ],
  future: [
    { key: 'planet', title: 'Ringed World Kepler-Ω', desc: 'A gas giant mined for its rings. The ring cities orbit in its shadow to stay cool.', spec: { Radius: '9.4 R⊕', Rings: 'Ice + alloy', Population: '1.2 billion' } },
    { key: 'floater', title: 'Gravity Habitat', desc: 'A drifting ring-station that chooses its own gravity. Residents walk on the inside of the hoop.', spec: { Diameter: '14 km', Gravity: 'Adjustable', Crew: '86,000' } },
    { key: 'moon', title: 'Cyan Moon', desc: 'Its surface is a single continuous solar array. It glows because it is always charging.', spec: { Radius: '1,100 km', Output: '3 PW', Owner: 'Unknown' } },
  ],
};
