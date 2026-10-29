// Calibre O-1, seen from the caseback: perlage plate, Côtes de Genève bridges, a gear train with real tooth
// forms, Swiss lever escapement, balance and breathing hairspring, jewels, blued screws and the gold rotor.
// Watch-local units (case radius = 1); the back of the watch is -Z, so "higher" parts are more negative.
import { BufferGeometry, CylinderGeometry, DoubleSide, Float32BufferAttribute, Group, Mesh, Shape, Vector3 } from 'three';
import { bandShape, circlePath, extrude, gearShape, merge, polygonShape, splitGroups, TAU } from '../geometry.js';

export const BALANCE = { x: -0.27, y: 0.42, r: 0.17 };
export const ESCAPE = { x: 0.03, y: 0.27, r: 0.075, teeth: 15 };
export const PALLET = { x: -0.07, y: 0.36 };
export const BARREL = { x: -0.05, y: -0.3 };
export const THIRD = { x: 0.3, y: 0.02 };
export const FOURTH = { x: 0.24, y: 0.3 };

/** Extrudes a shape so its back face sits at zBack (more negative) and its front at zBack + depth. */
function slab(shape, zBack, depth, options = {}) {
  return extrude(shape, { depth, ...options }).translate(0, 0, zBack);
}

const cylinder = (r, h, z, seg = 24) => new CylinderGeometry(r, r, h, seg).rotateX(Math.PI / 2).translate(0, 0, z + h / 2);

/** A wheel with its pinion and arbor; returns a group pivoting on the wheel's centre. */
function wheel(m, { at, zBack, depth = 0.01, pinionTo, hi, ...gear }) {
  const group = new Group();
  group.position.set(at.x, at.y, 0);
  const shape = gearShape({ detail: hi ? 6 : 3, ...gear });
  const [caps, sides] = splitGroups(slab(shape, zBack, depth, { bevel: 0.0012, bevelSegments: 1, curveSegments: 6, uvExtent: gear.tip ?? gear.root }));
  group.add(new Mesh(caps, m.gilt), new Mesh(sides, m.anglage));
  if (pinionTo !== undefined) {
    const pinion = gearShape({ teeth: 8, root: 0.02, tip: 0.029, fill: 0.5, detail: hi ? 4 : 2 });
    const zFront = Math.max(zBack, pinionTo);
    const zEnd = Math.min(zBack + depth, pinionTo);
    const pinionGeo = slab(pinion, Math.min(zFront, zEnd), Math.abs(zFront - zEnd) + 0.002, { curveSegments: 4 });
    group.add(new Mesh(merge([pinionGeo, cylinder(0.009, 0.1, -0.15, 12)]), m.steel));
  }
  return group;
}

function hairspring(r0, r1, coils, z, width) {
  const samples = Math.round(coils * 96);
  const positions = [];
  const coil = [];
  const index = [];
  for (let i = 0; i <= samples; i++) {
    const t = i / samples;
    const a = t * coils * TAU;
    const r = r0 + (r1 - r0) * t;
    const c = Math.cos(a);
    const s = Math.sin(a);
    positions.push(c * (r - width / 2), s * (r - width / 2), z, c * (r + width / 2), s * (r + width / 2), z);
    coil.push(1 - t, 1 - t);
    if (i < samples) {
      const k = i * 2;
      index.push(k, k + 1, k + 2, k + 1, k + 3, k + 2);
    }
  }
  const geometry = new BufferGeometry();
  geometry.setAttribute('position', new Float32BufferAttribute(positions, 3));
  geometry.setAttribute('aCoil', new Float32BufferAttribute(coil, 1));
  geometry.setIndex(index);
  geometry.computeVertexNormals();
  return geometry;
}

function rotorShapes() {
  const body = new Shape();
  body.moveTo(-0.79, 0);
  body.absarc(0, 0, 0.79, Math.PI, TAU, false);
  body.lineTo(0.11, 0);
  body.absarc(0, 0, 0.11, 0, Math.PI, false);
  body.lineTo(-0.79, 0);
  body.holes.push(circlePath(0.034, 24));
  const rim = new Shape();
  rim.moveTo(-0.79, 0);
  rim.absarc(0, 0, 0.79, Math.PI, TAU, false);
  rim.lineTo(0.725, 0);
  rim.absarc(0, 0, 0.725, 0, -Math.PI, true);
  rim.lineTo(-0.79, 0);
  return { body, rim };
}

export function createMovement({ mats, hi }) {
  const m = mats.movement;
  m.hairspring.side = DoubleSide;
  const group = new Group();
  const curve = hi ? 64 : 32;

  // Main plate, opened under the balance.
  const plateShape = new Shape();
  plateShape.absarc(0, 0, 0.82, 0, TAU, false);
  plateShape.holes.push(circlePath(BALANCE.r + 0.02, 48, BALANCE.x, BALANCE.y));
  const [plateCaps, plateSides] = splitGroups(slab(plateShape, -0.1, 0.06, { bevel: 0.004, curveSegments: curve, uvExtent: 0.82 }));
  group.add(new Mesh(plateCaps, m.plate), new Mesh(plateSides, m.anglage));

  // Gear train.
  const centre = wheel(m, { at: { x: 0, y: 0 }, zBack: -0.112, teeth: 80, root: 0.165, tip: 0.174, spokes: 4, rimWidth: 0.022, hubRadius: 0.03, spokeWidth: 0.022, hi });
  const third = wheel(m, { at: THIRD, zBack: -0.124, teeth: 75, root: 0.142, tip: 0.15, spokes: 5, rimWidth: 0.02, hubRadius: 0.026, spokeWidth: 0.016, pinionTo: -0.1, hi });
  const fourth = wheel(m, { at: FOURTH, zBack: -0.136, teeth: 70, root: 0.122, tip: 0.13, spokes: 5, rimWidth: 0.018, hubRadius: 0.024, spokeWidth: 0.014, pinionTo: -0.1, hi });
  const escape = wheel(m, { at: ESCAPE, zBack: -0.136, depth: 0.008, teeth: ESCAPE.teeth, root: 0.052, tip: ESCAPE.r, style: 'club', spokes: 4, rimWidth: 0.01, hubRadius: 0.016, spokeWidth: 0.008, pinionTo: -0.1, hi });
  const barrel = wheel(m, { at: BARREL, zBack: -0.158, depth: 0.054, teeth: 90, root: 0.27, tip: 0.282, hole: 0.03, hi });
  group.add(centre, third, fourth, escape, barrel);

  // Pallet fork with its two ruby pallet stones, pivoting at PALLET.
  const pallet = new Group();
  pallet.position.set(PALLET.x, PALLET.y, 0);
  const rel = (pts) => pts.map(([x, y]) => [x - PALLET.x, y - PALLET.y]);
  const lever = bandShape(rel([[BALANCE.x + 0.105, BALANCE.y - 0.012], [PALLET.x, PALLET.y], [-0.03, 0.326]]), [0.014, 0.03, 0.022], { samples: 24 });
  const arms = bandShape(rel([[-0.028, 0.318], [-0.05, 0.37], [0.0, 0.384], [0.043, 0.348]]), [0.016, 0.02, 0.02, 0.016], { samples: 32 });
  pallet.add(new Mesh(merge([slab(lever, -0.139, 0.006, { curveSegments: 4 }), slab(arms, -0.139, 0.006, { curveSegments: 4 })]), m.steel));
  const stone = (x, y) => new CylinderGeometry(0.007, 0.007, 0.012, 6).rotateX(Math.PI / 2).translate(x - PALLET.x, y - PALLET.y, -0.142);
  pallet.add(new Mesh(merge([stone(-0.028, 0.318), stone(0.043, 0.348)]), m.ruby));
  group.add(pallet);

  // Balance wheel (rim, three arms, rim screws), roller jewel, and the hairspring above it.
  const balance = new Group();
  balance.position.set(BALANCE.x, BALANCE.y, 0);
  const rim = gearShape({ root: BALANCE.r, style: 'none', spokes: 3, rimWidth: 0.024, hubRadius: 0.026, spokeWidth: 0.018 });
  const screws = [];
  for (let i = 0; i < 12; i++) {
    const a = (i / 12) * TAU + 0.13;
    screws.push(new CylinderGeometry(0.0075, 0.0075, 0.018, 10).rotateZ(a - Math.PI / 2).translate(Math.cos(a) * (BALANCE.r + 0.006), Math.sin(a) * (BALANCE.r + 0.006), -0.144));
  }
  balance.add(
    new Mesh(slab(rim, -0.15, 0.012, { bevel: 0.0015, bevelSegments: 1, curveSegments: hi ? 96 : 48 }), m.balance),
    new Mesh(merge(screws), m.balance),
    new Mesh(merge([cylinder(0.008, 0.07, -0.17, 12)]), m.steel),
    new Mesh(cylinder(0.004, 0.012, -0.137, 8).translate(0.02, 0, 0), m.ruby),
  );
  const spring = new Mesh(hairspring(0.03, 0.118, 11, -0.153, 0.0028), m.hairspring);
  spring.position.set(BALANCE.x, BALANCE.y, 0);
  group.add(balance, spring);

  // Bridges: Côtes de Genève on the faces (continuous across bridges), polished bevels on the edges.
  const bridges = [
    [polygonShape([[-0.62, -0.5], [-0.4, -0.66], [-0.05, -0.72], [0.3, -0.62], [0.42, -0.42], [0.3, -0.22], [0.02, -0.1], [-0.3, -0.12], [-0.52, -0.26]], { smooth: 2 }), -0.183, 0.025],
    [bandShape([[0.08, -0.06], [0.3, 0.02], [0.36, 0.2], [0.24, 0.3], [0.4, 0.48], [0.55, 0.55]], [0.14, 0.16, 0.14, 0.13, 0.14, 0.18]), -0.165, 0.025],
    [bandShape([[-0.72, 0.12], [-0.52, 0.28], [BALANCE.x, BALANCE.y]], [0.22, 0.12, 0.08]), -0.182, 0.02],
    [bandShape([[0.0, 0.56], [PALLET.x, PALLET.y]], [0.085, 0.055]), -0.15, 0.01],
    [bandShape([[0.2, 0.5], [ESCAPE.x, ESCAPE.y]], [0.08, 0.055]), -0.15, 0.01],
  ];
  const faces = [];
  const edges = [];
  for (const [shape, zBack, depth] of bridges) {
    const [caps, sides] = splitGroups(slab(shape, zBack, depth, { bevel: 0.004, bevelSegments: hi ? 2 : 1, curveSegments: 24, uvExtent: 0.82 }));
    faces.push(caps);
    edges.push(sides);
  }
  group.add(new Mesh(merge(faces), m.bridge), new Mesh(merge(edges), m.anglage));

  // Ratchet and crown wheels on the barrel bridge (snailed), held by blued screws.
  const ratchet = new Group();
  ratchet.position.set(BARREL.x, BARREL.y, 0);
  ratchet.add(new Mesh(slab(gearShape({ teeth: 60, root: 0.19, tip: 0.205, style: 'ratchet', hole: 0.02 }), -0.197, 0.012, { curveSegments: 4, uvExtent: 0.205 }), m.snailed));
  const crownWheel = new Group();
  crownWheel.position.set(0.24, -0.47, 0);
  crownWheel.add(new Mesh(slab(gearShape({ teeth: 30, root: 0.068, tip: 0.076, hole: 0.012 }), -0.195, 0.01, { curveSegments: 4, uvExtent: 0.076 }), m.snailed));
  group.add(ratchet, crownWheel);

  // Jewels in gold chatons, and blued screws with slotted heads.
  const jewels = [[THIRD, -0.165], [FOURTH, -0.165], [ESCAPE, -0.15], [PALLET, -0.15], [BALANCE, -0.182], [{ x: 0.5, y: 0.5 }, -0.165]];
  group.add(
    new Mesh(merge(jewels.map(([p, z]) => cylinder(0.03, 0.005, z - 0.004).translate(p.x, p.y, 0))), m.chaton),
    new Mesh(merge(jewels.map(([p, z]) => cylinder(0.017, 0.006, z - 0.0065, 16).translate(p.x, p.y, 0))), m.ruby),
  );
  const screwAt = [[0.45, 0.45, -0.165], [0.13, -0.04, -0.165], [-0.45, -0.55, -0.183], [0.25, -0.58, -0.183], [-0.4, -0.2, -0.183], [-0.62, 0.2, -0.182], [-0.005, 0.52, -0.15], [0.17, 0.46, -0.15], [BARREL.x, BARREL.y, -0.197], [0.24, -0.47, -0.195]];
  const heads = [];
  for (const [x, y, z] of screwAt) {
    const big = x === BARREL.x && y === BARREL.y;
    const r = big ? 0.045 : 0.022;
    const h = big ? 0.01 : 0.008;
    // Two half-heads with a gap between them make the slot.
    for (const side of [0, 1]) {
      const half = new CylinderGeometry(r, r, h, 16, 1, false, side * Math.PI, Math.PI).rotateX(Math.PI / 2);
      half.translate(0, side ? -r * 0.12 : r * 0.12, 0);
      half.rotateZ(x * 7 + y * 3).translate(x, y, z - h / 2);
      heads.push(half);
    }
  }
  group.add(new Mesh(merge(heads), m.blued));

  // Rotor: engraved half-moon, a heavier rim, a bearing cap with three screws.
  const rotor = new Group();
  const { body, rim: rotorRim } = rotorShapes();
  const [rotorFaces, rotorSides] = splitGroups(slab(body, -0.235, 0.016, { bevel: 0.003, curveSegments: hi ? 96 : 48, uvExtent: 0.8 }));
  rotor.add(
    new Mesh(rotorFaces, m.rotor),
    new Mesh(rotorSides, m.rotorRim),
    new Mesh(slab(rotorRim, -0.243, 0.03, { bevel: 0.004, curveSegments: hi ? 96 : 48 }), m.rotorRim),
    new Mesh(cylinder(0.052, 0.012, -0.247, 32), m.steel),
  );
  const capScrews = [0, 1, 2].map((i) => {
    const a = (i / 3) * TAU + 0.5;
    return cylinder(0.011, 0.004, -0.251, 12).translate(Math.cos(a) * 0.034, Math.sin(a) * 0.034, 0);
  });
  rotor.add(new Mesh(merge(capScrews), m.blued));
  group.add(rotor);

  // Rotor dynamics: a damped pendulum driven by gravity in the watch's own frame.
  const swing = { angle: 0, velocity: 0 };

  return {
    group,
    rim: { radius: 0.82, z: -0.1 },
    focus: {
      escapement: new Vector3(-0.11, 0.36, -0.15),
      barrel: new Vector3(BARREL.x, BARREL.y, -0.2),
      rotor: new Vector3(0, -0.5, -0.24),
    },
    /**
     * @param {number} t seconds of watch time (continuous)
     * @param {number} dt frame delta in seconds
     * @param {{ minute: number, seconds: number }} angles hand angles (clockwise from twelve)
     * @param {{ x: number, y: number }} gravity world down expressed in watch-local XY
     */
    update(t, dt, angles, gravity) {
      const beat = t * 8;
      const swingAngle = 2.1 * Math.sin(t * 4 * TAU);
      balance.rotation.z = swingAngle;
      mats.springUniforms.uBalance.value = swingAngle * 0.35;
      pallet.rotation.z = 0.11 * Math.tanh(Math.sin(t * 4 * TAU) * 5);
      const step = Math.floor(beat);
      const settle = Math.min(1, (beat - step) / 0.18);
      escape.rotation.z = -((step + settle * settle * (3 - 2 * settle)) * TAU) / ESCAPE.teeth / 2;
      fourth.rotation.z = -angles.seconds;
      third.rotation.z = angles.seconds / 8;
      centre.rotation.z = -angles.minute;
      barrel.rotation.z = -angles.minute / 6;
      ratchet.rotation.z = barrel.rotation.z;

      const torque = Math.sin(swing.angle) * gravity.y + Math.cos(swing.angle) * gravity.x;
      const step2 = Math.min(dt, 1 / 30);
      swing.velocity += (torque * 18 - swing.velocity * 1.6) * step2;
      swing.angle += swing.velocity * step2;
      rotor.rotation.z = swing.angle;
    },
    /** Places the rotor at rest for a given gravity (used for stills). */
    settleRotor(gravity) {
      swing.angle = Math.atan2(gravity.x, -gravity.y);
      swing.velocity = 0;
      rotor.rotation.z = swing.angle;
    },
  };
}
