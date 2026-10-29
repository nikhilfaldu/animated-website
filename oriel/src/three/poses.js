// Named stage poses for the Calibre O-1 and the helpers the story uses to interpolate them.
// Every pose is complete and all-numeric, so any two can be blended with lerpPose().

/** The seven layers of the exploded view, outermost (crystal) to the back (caseback). */
export const LAYER_ORDER = Object.freeze(['crystal', 'bezel', 'hands', 'dial', 'movement', 'case', 'caseback']);

export const POSE_KEYS = Object.freeze([
  'x', 'y', 'size', 'ox', 'oy', 'rx', 'ry', 'rz', 'explode', 'movement', 'strap', 'spin', 'visibility',
]);

export const DEFAULT_POSE = Object.freeze({
  x: 0, y: 0, size: 0.6, ox: 0, oy: 0, rx: 0, ry: 0, rz: 0,
  explode: 0, movement: 0, strap: 1, spin: 0, visibility: 1,
});

// Watch-local points the movement poses centre on (case radius = 1; see parts/movement.js).
export const FOCUS = Object.freeze({
  escapement: { x: -0.11, y: 0.36 },
  barrel: { x: -0.05, y: -0.29 },
  rotor: { x: 0, y: 0 },
});

const pose = (p) => Object.freeze({ ...DEFAULT_POSE, ...p });
const PI = Math.PI;

export const POSES = Object.freeze({
  // Index · hero. The copy owns the left ~45%; the watch sits big on the right, 3/4 with its crown showing.
  hero: pose({ x: 0.43, y: -0.04, size: 0.7, rx: -0.42, ry: -0.5, rz: 0.2 }),
  heroMobile: pose({ x: 0, y: 0.4, size: 0.74, rx: -0.4, ry: -0.42, rz: 0.16 }),

  // Index · manifesto. Recedes behind the serif text, turned toward profile.
  manifesto: pose({ x: 0.74, y: 0.02, size: 0.46, rx: -0.2, ry: -1.18, rz: 0.32, visibility: 0.42 }),

  // Index · anatomy. Exploded stack in the left ~60%, the numbered list on the right.
  anatomyStart: pose({ x: -0.1, y: -0.12, size: 0.42, rx: -0.98, ry: -0.24, rz: 0.06, strap: 0 }),
  anatomyEnd: pose({ x: -0.06, y: -0.17, size: 0.235, rx: -1.02, ry: -0.24, rz: 0.06, explode: 1, strap: 0 }),

  // Index · movement dive, seen from the bridge side. The rotor hangs by gravity, away from the part in focus.
  movementEscapement: pose({
    x: 0.36, y: 0.02, size: 1.55, ox: FOCUS.escapement.x, oy: FOCUS.escapement.y,
    rx: -0.3, ry: PI - 0.22, rz: 0.1, movement: 1, strap: 0,
  }),
  movementBarrel: pose({
    x: 0.36, y: 0.04, size: 1.5, ox: FOCUS.barrel.x, oy: FOCUS.barrel.y,
    rx: -0.34, ry: PI + 0.2, rz: PI - 0.15, movement: 1, strap: 0,
  }),
  movementRotor: pose({
    x: 0.3, y: 0.02, size: 1.0, ox: FOCUS.rotor.x, oy: FOCUS.rotor.y,
    rx: -0.16, ry: PI + 0.24, rz: 0.3, movement: 1, strap: 0,
  }),

  // Index · configure (form on the right) and reserve.
  configure: pose({ x: -0.42, y: -0.02, size: 0.66, rx: -0.3, ry: -0.35, rz: 0.12, spin: 0.2 }),
  configureMobile: pose({ x: 0, y: 0.42, size: 0.72, rx: -0.3, ry: -0.3, rz: 0.1, spin: 0.2 }),
  hidden: pose({ x: 0, y: 0, size: 0.5, visibility: 0 }),
  reserve: pose({ x: 0.45, y: -0.02, size: 0.6, rx: -0.22, ry: -0.3, rz: 0.08 }),

  // Product page: the canvas is its own ~4:5 box, the watch is centred.
  productFront: pose({ x: 0, y: 0.02, size: 0.7, rx: -0.12, ry: -0.18, rz: 0.04 }),
  // Pulled back and shifted left so the whole strap loop fits in the box.
  productProfile: pose({ x: -0.56, y: 0, size: 0.47, rx: -0.12, ry: -PI / 2 + 0.32, rz: 0 }),
  // The closed strap runs right across the exhibition caseback, so this view slides it away.
  productBack: pose({ x: 0, y: 0.02, size: 0.7, rx: -0.12, ry: PI + 0.2, rz: 0, strap: 0 }),
  productExploded: pose({ x: 0, y: -0.04, size: 0.3, rx: -1.02, ry: -0.24, rz: 0.06, explode: 1, strap: 0 }),

  // Stills for scripts/render-posters.mjs (square 1600 for the first three, 1200 x 1500 portrait for config).
  posterHero: pose({ x: 0.02, y: 0, size: 0.6, rx: -0.42, ry: -0.5, rz: 0.2 }),
  posterExploded: pose({ x: 0.04, y: -0.06, size: 0.3, rx: -1.02, ry: -0.24, rz: 0.06, explode: 1, strap: 0 }),
  posterMovement: pose({ x: 0, y: 0, size: 0.86, rx: -0.16, ry: PI + 0.24, rz: 0.3, movement: 1, strap: 0 }),
  posterConfig: pose({ x: 0, y: 0.02, size: 0.68, rx: -0.38, ry: -0.42, rz: 0.16 }),
});

// Layers separate in sequence, crystal first; each takes DURATION of the explode range.
const DURATION = 0.4;
const STEP = (1 - DURATION) / (LAYER_ORDER.length - 1);

const smooth = (t) => t * t * (3 - 2 * t);

/**
 * How far a layer has separated (0..1, eased) at a given explode value.
 * The stage moves each layer by exactly this amount, so labels can follow their layer.
 */
export function layerReveal(explode, id) {
  const index = LAYER_ORDER.indexOf(id);
  if (index < 0) return 0;
  const t = (explode - index * STEP) / DURATION;
  return smooth(t <= 0 ? 0 : t >= 1 ? 1 : t);
}

/**
 * Linear blend of two poses. Missing fields fall back to DEFAULT_POSE.
 * Pass `out` to reuse an object (no allocation per scroll frame).
 */
export function lerpPose(a, b, t, out = {}) {
  for (const key of POSE_KEYS) {
    const from = a?.[key] ?? DEFAULT_POSE[key];
    const to = b?.[key] ?? DEFAULT_POSE[key];
    out[key] = from + (to - from) * t;
  }
  return out;
}
