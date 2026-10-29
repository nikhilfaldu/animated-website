/**
 * Process Section Data Constants
 *
 * Defines emblem positions, cutout configurations, and label content
 * for the Machine Room scroll experience.
 */

// === DESKTOP GROUP POSITIONS ===
// Change these to move entire groups (label + all cutouts move together)
// Scaled by 1.36 (320/235) to maintain same physical position with reduced section height
export const L1_TOP = 10;
export const L2_TOP = 31.5;
export const L3_TOP = 53;
export const L4_TOP = 74.5;

// For uniform spacing, use: const GAP = 15;
// L1_TOP = 9; L2_TOP = 9+GAP; L3_TOP = 9+GAP*2; L4_TOP = 9+GAP*3;

// === MOBILE GROUP POSITIONS (independent from desktop) ===
// Scaled by 1.20 (320/265) - less aggressive to prevent overflow
export const MOBILE_L1_TOP = 9.5;
export const MOBILE_L2_TOP = 37;
export const MOBILE_L3_TOP = 65;
export const MOBILE_L4_TOP = 92;

// Emblem configuration for the gear field
export interface EmblemConfig {
  id: string;
  // Position as percentage of viewport (0-100)
  x: number;
  y: number;
  // Size relative to base (1 = 100% of base size)
  scale: number;
  // Visual depth layer (affects opacity and z-index)
  depth: 1 | 2 | 3;
  // Rotation direction: 1 = clockwise, -1 = counter-clockwise
  direction: 1 | -1;
  // Rotation speed multiplier (1 = normal)
  speed: number;
}

// Emblem field configuration - Interlocking gear clusters
export const EMBLEMS: EmblemConfig[] = [
  // === CLUSTER A ===
  { id: 'e1', x: 27, y: 12, scale: 1.1, depth: 1, direction: 1, speed: 0.7 },
  { id: 'e2', x: 27, y: 30, scale: 0.9, depth: 1, direction: -1, speed: 0.86 },
  { id: 'e3', x: 32, y: 44, scale: 0.7, depth: 1, direction: 1, speed: 1.1 },
  { id: 'e4', x: 20, y: 28, scale: 0.5, depth: 1, direction: 1, speed: 1.54 },

  // === CLUSTER B ===
  { id: 'e5', x: 72, y: 28, scale: 1.4, depth: 1, direction: 1, speed: 0.6 },
  { id: 'e6', x: 84, y: 28, scale: 1.0, depth: 1, direction: -1, speed: 0.84 },
  { id: 'e7', x: 72, y: 46, scale: 0.9, depth: 1, direction: -1, speed: 0.93 },
  { id: 'e8', x: 82, y: 42, scale: 0.7, depth: 1, direction: 1, speed: 1.2 },

  // === CLUSTER C ===
  { id: 'e9', x: 45, y: 50, scale: 1.5, depth: 1, direction: -1, speed: 0.56 },
  { id: 'e10', x: 32, y: 54, scale: 1.1, depth: 1, direction: 1, speed: 0.76 },
  { id: 'e11', x: 45, y: 68, scale: 1.0, depth: 1, direction: 1, speed: 0.84 },
  { id: 'e12', x: 56, y: 58, scale: 0.8, depth: 1, direction: 1, speed: 1.05 },

  // === CLUSTER D ===
  { id: 'e13', x: 25, y: 78, scale: 1.3, depth: 1, direction: 1, speed: 0.65 },
  { id: 'e14', x: 38, y: 82, scale: 0.9, depth: 1, direction: -1, speed: 0.93 },
  { id: 'e15', x: 68, y: 75, scale: 1.6, depth: 1, direction: -1, speed: 0.52 },
  { id: 'e16', x: 80, y: 70, scale: 1.0, depth: 1, direction: 1, speed: 0.84 },
];

// Cutout configuration for the SVG mask
export interface CutoutConfig {
  id: string;
  // Scroll range when visible (0-1)
  startProgress: number;
  endProgress: number;
  // Position as percentage of section height
  top: number;
  // Position as percentage of viewport width
  left: number;
  // Size as percentage of viewport
  width: number;
  height: number;
  // Optional label association
  labelId?: string;
}

/**
 * === DESKTOP CUTOUT SYSTEM (54x24, 6 visible rows) ===
 *
 * Box:
 *   width: 54, height: 24
 *
 * Grid:
 *   Cell: 2x2
 *   Gap: 0.5
 *   Visible rows: first 6 (last 3 rows are empty spacing)
 *
 * Groups:
 *   L1: sparse singles (leave as is)
 *   L2: 60% coverage — keep edge vibe, but more singles + fewer big merges
 *   L3: 80% coverage — connect a little more than before
 *   L4: full coverage — interesting mosaic of rectangles (no overlaps)
 */

// Bounding box size for every step (percent units)
const BOX_W = 54;
const BOX_H = 24;

// Micro-grid spec (percent units)
const CELL = 2;
const GAP = 0.5;
const PITCH = CELL + GAP;

// Grid columns that fit in BOX_W (21)
const GRID_COLS = Math.floor((BOX_W + GAP) / PITCH);
const GRID_W = GRID_COLS * CELL + (GRID_COLS - 1) * GAP;
const GRID_PAD_X = (BOX_W - GRID_W) / 2;

// Full rows that fit in BOX_H (9), but we only show first 6
const GRID_ROWS_FULL = Math.floor((BOX_H + GAP) / PITCH);
const GRID_H_FULL = GRID_ROWS_FULL * CELL + (GRID_ROWS_FULL - 1) * GAP;

// Keep original vertical pad so placement stays aligned to what you tuned
const GRID_PAD_Y = (BOX_H - GRID_H_FULL) / 2;

const TRIM_ROWS = 3;
const GRID_ROWS_VISIBLE = Math.max(1, GRID_ROWS_FULL - TRIM_ROWS);
const GRID_H_VISIBLE = GRID_ROWS_VISIBLE * CELL + (GRID_ROWS_VISIBLE - 1) * GAP;

// Keep TS happy if you’re not using this elsewhere yet (useful for debug frames/panels)
void GRID_H_VISIBLE;

// Anchors (top-left of 54x24 box) — kept aligned to your prior tuned positions
const BOX_ANCHORS = {
  L1: { top: L1_TOP - 2, left: 35 },
  L2: { top: L2_TOP - 2, left: 10 },
  L3: { top: L3_TOP + 1.5, left: 35 },
  L4: { top: L4_TOP + 1, left: 10 },
} as const;

// Deterministic seeds (change these to reshuffle layouts while staying stable)
const SEED_L1 = 1337;
const SEED_L2 = 2029;
const SEED_L3 = 4099;

// ---- RNG helpers (deterministic, lightweight) ----
function mulberry32(seed: number) {
  let a = seed >>> 0;
  return function rand() {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function randInt(rng: () => number, min: number, max: number) {
  return Math.floor(rng() * (max - min + 1)) + min;
}

function shuffleInPlace<T>(arr: T[], rng: () => number) {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    const tmp = arr[i];
    arr[i] = arr[j];
    arr[j] = tmp;
  }
}

// ---- grid-to-rect conversion ----
function gridRect(params: {
  id: string;
  labelId: string;
  startProgress: number;
  endProgress: number;
  boxTop: number;
  boxLeft: number;
  c: number;
  r: number;
  cs: number;
  rs: number;
}): CutoutConfig {
  const { id, labelId, startProgress, endProgress, boxTop, boxLeft, c, r, cs, rs } = params;

  const left = boxLeft + GRID_PAD_X + c * PITCH;
  const top = boxTop + GRID_PAD_Y + r * PITCH;

  // Important: spans INCLUDE internal gaps so merged cells become one clean window
  const width = cs * CELL + (cs - 1) * GAP;
  const height = rs * CELL + (rs - 1) * GAP;

  return { id, labelId, startProgress, endProgress, top, left, width, height };
}

type Block = { c: number; r: number; cs: number; rs: number };

function blocksToCutouts(params: {
  idPrefix: string;
  labelId: string;
  startProgress: number;
  endProgress: number;
  boxTop: number;
  boxLeft: number;
  blocks: Block[];
}): CutoutConfig[] {
  const { idPrefix, labelId, startProgress, endProgress, boxTop, boxLeft, blocks } = params;

  return blocks.map((b, i) =>
    gridRect({
      id: `${idPrefix}-${i}`,
      labelId,
      startProgress,
      endProgress,
      boxTop,
      boxLeft,
      c: b.c,
      r: b.r,
      cs: b.cs,
      rs: b.rs,
    })
  );
}

/**
 * Group 1: sparse singles (leave as is per your request)
 */
function makeSparseSingles(params: {
  idPrefix: string;
  labelId: string;
  startProgress: number;
  endProgress: number;
  boxTop: number;
  boxLeft: number;
  seed: number;
  visibleRatio: number;
}): CutoutConfig[] {
  const { idPrefix, labelId, startProgress, endProgress, boxTop, boxLeft, seed, visibleRatio } = params;

  const rng = mulberry32(seed);
  const total = GRID_COLS * GRID_ROWS_VISIBLE;
  const target = Math.max(1, Math.round(total * visibleRatio));

  const picked = new Uint8Array(total);
  const rowCounts = new Int16Array(GRID_ROWS_VISIBLE);

  const indices: number[] = [];
  for (let r = 0; r < GRID_ROWS_VISIBLE; r++) {
    for (let c = 0; c < GRID_COLS; c++) indices.push(r * GRID_COLS + c);
  }
  shuffleInPlace(indices, rng);

  const maxNeighbors = 1;
  const minPerRow = 2;

  function neighborCount(idx: number) {
    const r = Math.floor(idx / GRID_COLS);
    const c = idx - r * GRID_COLS;
    let n = 0;
    if (c > 0) n += picked[idx - 1];
    if (c < GRID_COLS - 1) n += picked[idx + 1];
    if (r > 0) n += picked[idx - GRID_COLS];
    if (r < GRID_ROWS_VISIBLE - 1) n += picked[idx + GRID_COLS];
    return n;
  }

  let count = 0;

  for (const idx of indices) {
    if (count >= target) break;

    const r = Math.floor(idx / GRID_COLS);
    const c = idx - r * GRID_COLS;

    if (neighborCount(idx) > maxNeighbors) continue;

    const edgeBias =
      c === 0 || c === GRID_COLS - 1 || r === 0 || r === GRID_ROWS_VISIBLE - 1 ? 0.18 : 0.0;

    if (rng() < 0.38 + edgeBias) {
      picked[idx] = 1;
      rowCounts[r]++;
      count++;
    }
  }

  for (let r = 0; r < GRID_ROWS_VISIBLE; r++) {
    while (rowCounts[r] < minPerRow && count < target) {
      const c = randInt(rng, 0, GRID_COLS - 1);
      const idx = r * GRID_COLS + c;
      if (picked[idx]) continue;
      if (neighborCount(idx) > maxNeighbors) continue;
      picked[idx] = 1;
      rowCounts[r]++;
      count++;
    }
  }

  if (count < target) {
    for (const idx of indices) {
      if (count >= target) break;
      if (picked[idx]) continue;
      if (rng() < 0.18) {
        picked[idx] = 1;
        count++;
      }
    }
  }

  const out: CutoutConfig[] = [];
  let idn = 0;
  for (let r = 0; r < GRID_ROWS_VISIBLE; r++) {
    for (let c = 0; c < GRID_COLS; c++) {
      const idx = r * GRID_COLS + c;
      if (!picked[idx]) continue;
      out.push(
        gridRect({
          id: `${idPrefix}-S-${idn++}`,
          labelId,
          startProgress,
          endProgress,
          boxTop,
          boxLeft,
          c,
          r,
          cs: 1,
          rs: 1,
        })
      );
    }
  }

  return out;
}

// ===== polyomino selection (we ONLY use this to decide which cells are visible) =====
type Cell = { c: number; r: number };
type PieceTemplate = { name: string; cells: Array<[number, number]>; weight: number };

const PIECES: PieceTemplate[] = [
  { name: 'T4', cells: [[0, 0], [1, 0], [2, 0], [1, 1]], weight: 10 },
  { name: 'L4', cells: [[0, 0], [0, 1], [0, 2], [1, 2]], weight: 10 },
  { name: 'J4', cells: [[1, 0], [1, 1], [1, 2], [0, 2]], weight: 8 },
  { name: 'S4', cells: [[1, 0], [2, 0], [0, 1], [1, 1]], weight: 7 },
  { name: 'Z4', cells: [[0, 0], [1, 0], [1, 1], [2, 1]], weight: 7 },

  { name: 'I3', cells: [[0, 0], [1, 0], [2, 0]], weight: 8 },
  { name: 'L3', cells: [[0, 0], [0, 1], [1, 1]], weight: 8 },

  { name: 'O4', cells: [[0, 0], [1, 0], [0, 1], [1, 1]], weight: 7 },
  { name: 'D2', cells: [[0, 0], [1, 0]], weight: 6 },
  { name: 'S1', cells: [[0, 0]], weight: 4 },
];

function makeWeightedBag(templates: PieceTemplate[]): number[] {
  const bag: number[] = [];
  for (let i = 0; i < templates.length; i++) {
    for (let w = 0; w < templates[i].weight; w++) bag.push(i);
  }
  return bag;
}

function orientPiece(base: Array<[number, number]>, rot: 0 | 1 | 2 | 3, flip: boolean): Cell[] {
  let pts = base.map(([x, y]) => ({ x, y }));
  if (flip) pts = pts.map((p) => ({ x: -p.x, y: p.y }));
  for (let i = 0; i < rot; i++) {
    pts = pts.map((p) => ({ x: -p.y, y: p.x }));
  }

  let minX = Infinity;
  let minY = Infinity;
  for (const p of pts) {
    if (p.x < minX) minX = p.x;
    if (p.y < minY) minY = p.y;
  }
  pts = pts.map((p) => ({ x: p.x - minX, y: p.y - minY }));

  return pts.map((p) => ({ c: p.x, r: p.y }));
}

function pieceBounds(cells: Cell[]) {
  let maxC = 0;
  let maxR = 0;
  for (const cell of cells) {
    if (cell.c > maxC) maxC = cell.c;
    if (cell.r > maxR) maxR = cell.r;
  }
  return { w: maxC + 1, h: maxR + 1 };
}

function isRingCell(c: number, r: number) {
  return c === 0 || c === GRID_COLS - 1 || r === 0 || r === GRID_ROWS_VISIBLE - 1;
}

/**
 * Select visible cells using polyomino placement (no rendering here).
 * Rendering is handled by a separate "retile" step so we can control
 * how many singles vs merged rectangles we get (your Group 2 request).
 */
function makePolyominoCellMask(params: {
  seed: number;
  visibleRatio: number;
  edgeBias: number;
  centerAvoid: number;
  ringTarget: number;
  ringMax: number;
}): Uint8Array {
  const { seed, visibleRatio, edgeBias, centerAvoid, ringTarget, ringMax } = params;

  const rng = mulberry32(seed);
  const bag = makeWeightedBag(PIECES);

  const totalCells = GRID_COLS * GRID_ROWS_VISIBLE;
  const targetCells = Math.max(1, Math.round(totalCells * visibleRatio));

  const used = new Uint8Array(totalCells);
  const idx = (c: number, r: number) => r * GRID_COLS + c;

  const ringTotal = (() => {
    let n = 0;
    for (let r = 0; r < GRID_ROWS_VISIBLE; r++) {
      for (let c = 0; c < GRID_COLS; c++) if (isRingCell(c, r)) n++;
    }
    return n;
  })();
  const ringTargetCells = Math.round(ringTotal * ringTarget);
  const ringMaxCells = Math.round(ringTotal * ringMax);

  let usedCells = 0;
  let usedRing = 0;

  function canPlace(originC: number, originR: number, shape: Cell[]) {
    for (const cell of shape) {
      const c = originC + cell.c;
      const r = originR + cell.r;
      if (c < 0 || r < 0 || c >= GRID_COLS || r >= GRID_ROWS_VISIBLE) return false;
      const id = idx(c, r);
      if (used[id]) return false;
    }

    if (usedRing >= ringMaxCells) {
      for (const cell of shape) {
        const c = originC + cell.c;
        const r = originR + cell.r;
        if (isRingCell(c, r)) return false;
      }
    }

    return true;
  }

  function scorePlacement(originC: number, originR: number, shape: Cell[]) {
    let ringAdds = 0;
    let edgeTouches = 0;
    let distSum = 0;

    for (const cell of shape) {
      const c = originC + cell.c;
      const r = originR + cell.r;

      if (isRingCell(c, r)) ringAdds++;
      if (c === 0 || c === GRID_COLS - 1) edgeTouches++;
      if (r === 0 || r === GRID_ROWS_VISIBLE - 1) edgeTouches++;

      const d = Math.min(c, GRID_COLS - 1 - c, r, GRID_ROWS_VISIBLE - 1 - r);
      distSum += d;
    }

    const avgDist = distSum / shape.length;
    const ringNeedBoost = usedRing < ringTargetCells ? 2.5 : 1.0;

    const score =
      edgeBias * edgeTouches +
      ringNeedBoost * 3.2 * ringAdds -
      centerAvoid * 1.8 * avgDist +
      rng() * 0.25;

    return { score };
  }

  let safety = 0;
  while (usedCells < targetCells && safety < 6000) {
    safety++;

    const template = PIECES[bag[randInt(rng, 0, bag.length - 1)]];
    const rot = randInt(rng, 0, 3) as 0 | 1 | 2 | 3;
    const flip = rng() < 0.45;

    const shape = orientPiece(template.cells, rot, flip);
    const b = pieceBounds(shape);

    let best: { originC: number; originR: number; score: number } | null = null;

    const trials = 24;
    for (let t = 0; t < trials; t++) {
      const originC = randInt(rng, 0, GRID_COLS - b.w);
      const originR = randInt(rng, 0, GRID_ROWS_VISIBLE - b.h);

      if (!canPlace(originC, originR, shape)) continue;

      const s = scorePlacement(originC, originR, shape);
      if (!best || s.score > best.score) best = { originC, originR, score: s.score };
    }

    if (!best) continue;

    for (const cell of shape) {
      const c = best.originC + cell.c;
      const r = best.originR + cell.r;
      const id = idx(c, r);
      if (used[id]) continue;
      used[id] = 1;
      usedCells++;
      if (isRingCell(c, r)) usedRing++;
      if (usedCells >= targetCells) break;
    }
  }

  return used;
}

/**
 * Retile a selected-cell mask into non-overlapping rectangles.
 * This is where we control: “more singles” vs “more merged blocks”.
 */
type Shape = { cs: number; rs: number; w: number };

function pickWeightedShape(rng: () => number, shapes: Shape[]) {
  let total = 0;
  for (const s of shapes) total += s.w;
  let roll = rng() * total;
  for (const s of shapes) {
    roll -= s.w;
    if (roll <= 0) return s;
  }
  return shapes[shapes.length - 1];
}

function retileMaskToBlocks(params: {
  mask: Uint8Array;
  seed: number;
  shapes: Shape[];
  // how many attempts to form a larger rect before falling back to 1x1
  attemptsPerCell: number;
}): Block[] {
  const { mask, seed, shapes, attemptsPerCell } = params;

  const rng = mulberry32(seed ^ 0x9e3779b9);
  const used = new Uint8Array(mask.length);
  const idx = (c: number, r: number) => r * GRID_COLS + c;

  const cells: Cell[] = [];
  for (let r = 0; r < GRID_ROWS_VISIBLE; r++) {
    for (let c = 0; c < GRID_COLS; c++) {
      const id = idx(c, r);
      if (mask[id]) cells.push({ c, r });
    }
  }

  shuffleInPlace(cells, rng);

  function canRect(c0: number, r0: number, cs: number, rs: number) {
    if (c0 < 0 || r0 < 0) return false;
    if (c0 + cs > GRID_COLS) return false;
    if (r0 + rs > GRID_ROWS_VISIBLE) return false;

    for (let rr = r0; rr < r0 + rs; rr++) {
      for (let cc = c0; cc < c0 + cs; cc++) {
        const id = idx(cc, rr);
        if (!mask[id] || used[id]) return false;
      }
    }
    return true;
  }

  function commitRect(c0: number, r0: number, cs: number, rs: number) {
    for (let rr = r0; rr < r0 + rs; rr++) {
      for (let cc = c0; cc < c0 + cs; cc++) {
        used[idx(cc, rr)] = 1;
      }
    }
  }

  const blocks: Block[] = [];

  for (const cell of cells) {
    const id = idx(cell.c, cell.r);
    if (used[id]) continue;

    let placed = false;

    for (let a = 0; a < attemptsPerCell; a++) {
      const shape = pickWeightedShape(rng, shapes);

      // allow the current cell to be inside the rectangle (not just top-left)
      const offC = randInt(rng, 0, shape.cs - 1);
      const offR = randInt(rng, 0, shape.rs - 1);

      const c0 = cell.c - offC;
      const r0 = cell.r - offR;

      if (!canRect(c0, r0, shape.cs, shape.rs)) continue;

      commitRect(c0, r0, shape.cs, shape.rs);
      blocks.push({ c: c0, r: r0, cs: shape.cs, rs: shape.rs });
      placed = true;
      break;
    }

    if (!placed) {
      // fallback single
      used[id] = 1;
      blocks.push({ c: cell.c, r: cell.r, cs: 1, rs: 1 });
    }
  }

  // Stable visual ordering (left->right, top->bottom)
  blocks.sort((a, b) => (a.r - b.r) || (a.c - b.c) || (a.rs - b.rs) || (a.cs - b.cs));
  return blocks;
}

// === Group 4 mosaic (full coverage, no overlaps) ===
// Tiles the entire 21x6 visible grid with varied rectangles.
const STEP4_BLOCKS: Block[] = [
  // Top band (rows 0-1)
  { c: 0, r: 0, cs: 5, rs: 2 },
  { c: 5, r: 0, cs: 4, rs: 2 },
  { c: 9, r: 0, cs: 6, rs: 2 },
  { c: 15, r: 0, cs: 6, rs: 2 },

  // Left column mass (rows 2-5)
  { c: 0, r: 2, cs: 3, rs: 4 },

  // Mid-left structure
  { c: 3, r: 2, cs: 6, rs: 2 },
  { c: 3, r: 4, cs: 4, rs: 2 },
  { c: 7, r: 4, cs: 2, rs: 2 },

  // Mid block
  { c: 9, r: 2, cs: 5, rs: 4 },

  // Right side, with a notch seam
  { c: 14, r: 2, cs: 3, rs: 2 },
  { c: 17, r: 2, cs: 4, rs: 2 },
  { c: 14, r: 4, cs: 7, rs: 2 },
];

// === FINAL DESKTOP CUTOUTS ===
export const CUTOUTS: CutoutConfig[] = [
  // === L1 GROUP === (leave as is)
  ...makeSparseSingles({
    idPrefix: 'L1',
    labelId: 'L1',
    startProgress: 0.06,
    endProgress: 0.31,
    boxTop: BOX_ANCHORS.L1.top,
    boxLeft: BOX_ANCHORS.L1.left,
    seed: SEED_L1,
    visibleRatio: 0.28,
  }),

  // === L2 GROUP ===
  // Same edge vibe, but retiled into more singles + fewer big combined rectangles.
  ...(() => {
    const mask = makePolyominoCellMask({
      seed: SEED_L2,
      visibleRatio: 0.60,
      edgeBias: 2.6,
      centerAvoid: 2.2,
      ringTarget: 0.78,
      ringMax: 0.92,
    });

    // Heavily favor singles, with occasional small merges
    const blocks = retileMaskToBlocks({
      mask,
      seed: SEED_L2,
      attemptsPerCell: 6,
      shapes: [
        { cs: 1, rs: 1, w: 52 },
        { cs: 2, rs: 1, w: 18 },
        { cs: 1, rs: 2, w: 18 },
        { cs: 2, rs: 2, w: 7 },
        { cs: 3, rs: 1, w: 3 },
        { cs: 1, rs: 3, w: 3 },
        { cs: 4, rs: 1, w: 1 },
        { cs: 1, rs: 4, w: 1 },
      ],
    });

    return blocksToCutouts({
      idPrefix: 'L2',
      labelId: 'L2',
      startProgress: 0.27,
      endProgress: 0.52,
      boxTop: BOX_ANCHORS.L2.top,
      boxLeft: BOX_ANCHORS.L2.left,
      blocks,
    });
  })(),

  // === L3 GROUP ===
  // Slightly more connected than before (more medium merges).
  ...(() => {
    const mask = makePolyominoCellMask({
      seed: SEED_L3,
      visibleRatio: 0.80,
      edgeBias: 1.4,
      centerAvoid: 0.9,
      ringTarget: 0.86,
      ringMax: 0.98,
    });

    // Moderate merges: still lots of singles, but more 2x2 and 3-long bars
    const blocks = retileMaskToBlocks({
      mask,
      seed: SEED_L3,
      attemptsPerCell: 8,
      shapes: [
        { cs: 1, rs: 1, w: 22 },
        { cs: 2, rs: 1, w: 24 },
        { cs: 1, rs: 2, w: 24 },
        { cs: 2, rs: 2, w: 16 },
        { cs: 3, rs: 1, w: 10 },
        { cs: 1, rs: 3, w: 10 },
        { cs: 4, rs: 1, w: 4 },
        { cs: 1, rs: 4, w: 4 },
        { cs: 3, rs: 2, w: 2 },
        { cs: 2, rs: 3, w: 2 },
      ],
    });

    return blocksToCutouts({
      idPrefix: 'L3',
      labelId: 'L3',
      startProgress: 0.48,
      endProgress: 0.73,
      boxTop: BOX_ANCHORS.L3.top,
      boxLeft: BOX_ANCHORS.L3.left,
      blocks,
    });
  })(),

  // === L4 GROUP ===
  // Full coverage mosaic: varied rectangles, interesting seams, no overlaps.
  ...blocksToCutouts({
    idPrefix: 'L4',
    labelId: 'L4',
    startProgress: 0.69,
    endProgress: 0.95,
    boxTop: BOX_ANCHORS.L4.top,
    boxLeft: BOX_ANCHORS.L4.left,
    blocks: STEP4_BLOCKS,
  }),
];

// ===== MOBILE: Single continuous cutout visible throughout scroll =====
export const MOBILE_CUTOUTS: CutoutConfig[] = [
  {
    id: 'M-CONTINUOUS',
    startProgress: 0.0,
    endProgress: 1.0,
    top: 5,
    left: 5,
    width: 90,
    height: 90,
    labelId: 'ALL',
  },
];

// Label configuration for parallax text overlays
export interface LabelConfig {
  id: string;
  title: string;
  description: string;
  // Scroll range for visibility (0-1)
  startProgress: number;
  endProgress: number;
  // Horizontal position: 'left' | 'right' | 'center' | 'right-center' | 'left-center'
  position: 'left' | 'right' | 'center' | 'right-center' | 'left-center';
  // Vertical position as percentage of section height
  top: number;
}

// DESKTOP label content and positioning
export const LABELS: LabelConfig[] = [
  {
    id: 'L1',
    title: 'Discover & Define',
    description: 'We lock the brief: audience, constraints, and the measurable win. Clarity first so motion has purpose.',
    startProgress: 0.06,
    endProgress: 0.31,
    position: 'right',
    top: L1_TOP,
  },
  {
    id: 'L2',
    title: 'Design the System',
    description: 'Type, motion, and interaction language snap into a coherent kit—distinctive but durable.',
    startProgress: 0.27,
    endProgress: 0.52,
    position: 'left',
    top: L2_TOP + 1,
  },
  {
    id: 'L3',
    title: 'Prototype & Refine',
    description: 'Rapid iterations reveal what works. We test, adjust, and polish until every detail clicks.',
    startProgress: 0.48,
    endProgress: 0.73,
    position: 'right',
    top: L3_TOP + 4,
  },
  {
    id: 'L4',
    title: 'Build & Launch',
    description: 'We ship performant, accessible components with instrumentation baked in, ready to iterate.',
    startProgress: 0.69,
    endProgress: 0.95,
    position: 'left-center',
    top: L4_TOP + 4,
  },
];

// MOBILE label content and positioning
// All left-justified, fixed positions with fade in/out (no parallax)
// Labels start at 0.15 progress (after gears lock in place)
// Tighter spacing: 15vh gaps so all labels fit in viewport
export const MOBILE_LABELS: LabelConfig[] = [
  {
    id: 'L1',
    title: 'Discover & Define',
    description: 'We lock the brief: audience, constraints, and the measurable win. Clarity first so motion has purpose.',
    startProgress: 0.15, // Delayed start - gears lock first
    endProgress: 0.38,
    position: 'left',
    top: 15,
  },
  {
    id: 'L2',
    title: 'Design the System',
    description: 'Type, motion, and interaction language snap into a coherent kit—distinctive but durable.',
    startProgress: 0.33, // Overlaps L1 for crossfade
    endProgress: 0.55,
    position: 'left',
    top: 30,
  },
  {
    id: 'L3',
    title: 'Prototype & Refine',
    description: 'Rapid iterations reveal what works. We test, adjust, and polish until every detail clicks.',
    startProgress: 0.50, // Overlaps L2 for crossfade
    endProgress: 0.72,
    position: 'left',
    top: 45,
  },
  {
    id: 'L4',
    title: 'Build & Launch',
    description: 'We ship performant, accessible components with instrumentation baked in, ready to iterate.',
    startProgress: 0.67, // Overlaps L3 for crossfade
    endProgress: 0.85, // Ends early so gears stay pinned during fade out
    position: 'left',
    top: 60,
  },
];

// Depth-based opacity values for emblems
export const DEPTH_OPACITY: Record<1 | 2 | 3, number> = {
  1: 0.3,
  2: 0.15,
  3: 0.08,
};

// Depth-based scale modifiers
export const DEPTH_SCALE: Record<1 | 2 | 3, number> = {
  1: 1.0,
  2: 0.85,
  3: 0.7,
};

// Base emblem size in viewport units
export const BASE_EMBLEM_SIZE = 20; // vmin

// Section height in viewport heights
export const SECTION_HEIGHT_VH = 400; // Increased for longer scroll with delayed label start

// Parallax speed for labels (slower than scroll)
export const LABEL_PARALLAX_SPEED = 1.2;

// Rotation degrees per unit of scroll progress
export const ROTATION_PER_SCROLL = 720;