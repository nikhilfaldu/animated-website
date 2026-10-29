// Assembles the Calibre O-1 from its parts into the seven exploded-view layers and drives everything that
// moves on its own: the hands (live or fixed time), the movement, the rotor and the layer states.
import { Group, Quaternion, Vector3 } from 'three';
import { createTextures, loadFonts } from './textures.js';
import { createMaterials } from './materials.js';
import { createBezel, createCase, createCrystal } from './parts/case.js';
import { createDial, createHands, DIAL_RADIUS, INDICES } from './parts/dial.js';
import { createMovement } from './parts/movement.js';
import { createCaseback } from './parts/caseback.js';
import { createStrap } from './parts/strap.js';
import { LAYER_ORDER, layerReveal } from './poses.js';
import { TAU } from './geometry.js';

/** Separation along the case axis at explode = 1 (watch units). */
const EXPLODE_OFFSET = { crystal: 2.8, bezel: 2.18, hands: 1.6, dial: 1.05, movement: 0.32, case: -0.62, caseback: -1.6 };
/** Plane of the caseback window: from anywhere in front of it, the closed case hides the movement completely. */
const WINDOW_Z = -0.29;

/** Hand angles (clockwise from twelve). Seconds step 8 times a second: 28,800 vph. */
export function handAngles({ h, m, s }, out = {}) {
  const stepped = Math.floor(s * 8) / 8;
  out.seconds = (stepped / 60) * TAU;
  out.minute = ((m + s / 60) / 60) * TAU;
  out.hour = (((h % 12) + m / 60 + s / 3600) / 12) * TAU;
  return out;
}

export async function createWatch({ tier = 'high' } = {}) {
  const hi = tier !== 'low';
  await loadFonts();
  const textures = await createTextures({ tier, dialRadius: DIAL_RADIUS, indices: INDICES });
  const mats = createMaterials({ tier, textures, dialRadius: DIAL_RADIUS });
  mats.textures = textures;
  const ctx = { mats, textures, hi };

  const parts = {
    crystal: createCrystal(ctx),
    bezel: createBezel(ctx),
    hands: createHands(ctx),
    dial: createDial(ctx),
    movement: createMovement(ctx),
    case: createCase(ctx),
    caseback: createCaseback(ctx),
  };
  const strap = createStrap(ctx);

  const root = new Group();
  const layers = {};
  for (const id of LAYER_ORDER) {
    const layer = new Group();
    layer.name = id;
    layer.add(parts[id].group);
    root.add(layer);
    layers[id] = layer;
  }
  root.add(strap.group);

  const anchors = {};
  for (const id of LAYER_ORDER) anchors[id] = { object: layers[id], local: new Vector3(parts[id].rim.radius, 0, parts[id].rim.z) };
  for (const [id, local] of Object.entries(parts.movement.focus)) anchors[id] = { object: layers.movement, local };

  // Fade levels stacked on the bare movement, each adding its parts to the ones below it, so a level's presence
  // never exceeds the one before. Mid-fade the stage renders once per level and blends the images by presence:
  // parts fade as a whole, with no dithering and no sorting.
  const levels = [
    { objects: LAYER_ORDER.filter((id) => id !== 'movement').map((id) => layers[id]), presence: 1 },
    { objects: [strap.group], presence: 1 },
  ];

  let movementVisible = true;

  /** Shows the movement (unless sealed from view) and the first `count` levels (by default every present one). */
  function showLevels(count = levels.length) {
    layers.movement.visible = movementVisible;
    levels.forEach((level, i) => {
      const visible = i < count && level.presence > 0.01;
      for (const object of level.objects) object.visible = visible;
    });
  }

  /** Every part, present or not (shader precompilation); showLevels() puts things back. */
  function showAll() {
    layers.movement.visible = true;
    for (const level of levels) level.objects.forEach((object) => (object.visible = true));
  }

  const applied = { explode: NaN, isolate: NaN, strap: NaN };
  const angles = {};
  const down = new Vector3();
  const inverse = new Quaternion();
  const gravity = { x: 0, y: -1 };

  /** @param {number} cameraZ the camera's height above the dial plane, in watch units (negative behind the watch) */
  function setLayers({ explode, movement: isolate, strap: strapValue }, cameraZ) {
    if (explode !== applied.explode) {
      for (const id of LAYER_ORDER) layers[id].position.z = EXPLODE_OFFSET[id] * layerReveal(explode, id);
      applied.explode = explode;
    }
    if (isolate !== applied.isolate) {
      levels[0].presence = 1 - isolate;
      applied.isolate = isolate;
    }
    const strapPresence = strapValue * (1 - isolate) * (1 - Math.min(1, explode * 4));
    if (strapPresence !== applied.strap) {
      strap.setPresence(strapPresence);
      levels[1].presence = strapPresence;
      applied.strap = strapPresence;
    }
    // Its gears are a large share of the scene, so skip drawing them while the closed case hides them.
    movementVisible = isolate > 0.001 || explode > 0.001 || cameraZ < WINDOW_Z;
    showLevels();
  }

  function readGravity() {
    root.getWorldQuaternion(inverse).invert();
    down.set(0, -1, 0).applyQuaternion(inverse);
    gravity.x = down.x;
    gravity.y = down.y;
    return gravity;
  }

  return {
    root,
    layers,
    anchors,
    mats,
    levels,
    setLayers,
    showLevels,
    showAll,
    setConfig: (config, options) => mats.setConfig(config, options),
    getConfig: () => mats.getConfig(),
    /**
     * @param {number} dt seconds since the last frame
     * @param {{ h: number, m: number, s: number }} time wall-clock time of day
     */
    update(dt, time) {
      handAngles(time, angles);
      parts.hands.set(angles.hour, angles.minute, angles.seconds);
      mats.dialUniforms.uHands.value.set(angles.hour, angles.minute, angles.seconds);
      const t = time.h * 3600 + time.m * 60 + time.s;
      parts.movement.update(t, dt, angles, readGravity());
    },
    /** Rotor at rest for the current orientation (stills). */
    settle() {
      parts.movement.settleRotor(readGravity());
    },
    dispose() {
      root.traverse((object) => {
        if (object.isMesh) object.geometry.dispose();
      });
      strap.dispose();
      mats.dispose();
      textures.dispose();
    },
  };
}
