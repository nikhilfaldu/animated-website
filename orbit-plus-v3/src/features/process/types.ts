// Process Parallax Reveal Types
export type ProcessPhaseId = 'DISCOVER' | 'DEFINE' | 'DESIGN' | 'DELIVER';

export type ProcessPhase = {
  id: ProcessPhaseId;
  scrollRange: [number, number];     // normalized 0..1
  maskRadiusPct: [number, number];   // 0..100 viewport %
  lines: string[];
  components: string[];              // asset keys
};

export const PROCESS_PHASES: ProcessPhase[] = [
  {
    id: 'DISCOVER',
    scrollRange: [0.00, 0.25],
    maskRadiusPct: [20, 40],
    lines: [
      'We start by listening.',
      'Understanding your market, your users, your truth.',
      'Research becomes clarity.'
    ],
    components: ['compass', 'magnifier', 'map']
  },
  {
    id: 'DEFINE',
    scrollRange: [0.25, 0.50],
    maskRadiusPct: [40, 65],
    lines: [
      'Strategy isn\'t decoration.',
      'We position you where you belong.',
      'Differentiation with purpose.'
    ],
    components: ['target', 'path', 'foundation']
  },
  {
    id: 'DESIGN',
    scrollRange: [0.50, 0.75],
    maskRadiusPct: [65, 85],
    lines: [
      'Systems that scale.',
      'Interfaces that breathe.',
      'Craft meets performance.'
    ],
    components: ['grid', 'layers', 'precision']
  },
  {
    id: 'DELIVER',
    scrollRange: [0.75, 1.00],
    maskRadiusPct: [85, 100],
    lines: [
      'Shipped, not shelved.',
      'Optimized for reality.',
      'Built to last.'
    ],
    components: ['rocket', 'gauge', 'seal']
  }
];
