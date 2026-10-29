// Calfskin strap closed by a pin buckle round an implied wrist, tapering 20 → 16 mm, saddle-stitched along both
// edges. The short half leaves the 12 o'clock lugs and folds round the buckle's bar under the wrist; the long half
// leaves the 6 o'clock lugs, passes through the buckle and runs back over the short half through two keepers.
// The halves are swept rounded-rectangle sections in the watch's YZ plane; the hardware is modelled flat and bent
// onto the wrist.
import {
  BoxGeometry,
  BufferGeometry,
  CatmullRomCurve3,
  CircleGeometry,
  CylinderGeometry,
  DoubleSide,
  Float32BufferAttribute,
  Group,
  InstancedMesh,
  Matrix4,
  Mesh,
  MeshBasicMaterial,
  Quaternion,
  Shape,
  SphereGeometry,
  TubeGeometry,
  Vector3,
} from 'three';
import { extrude, merge } from '../geometry.js';

const WRIST = { z: -1.62, r: 1.32 }; // implied wrist: a cylinder along X under the caseback
const THICK = 0.07;
const JOIN = 0.62; // angle (from the top of the wrist) where each half meets it
const LOW = THICK / 2; // centreline heights above the wrist: one layer of leather,
const HIGH = THICK * 1.5 + 0.012; // and the long half lying on the short one

// Round the buckle, positions are `s`: arc length on the wrist from the bar, positive towards the 6 o'clock lugs.
const BAR = Math.PI - 0.2; // angle of the bar, a little short of the bottom of the wrist
const FRAME = { depth: 0.6, half: 0.45, corner: 0.2, top: 0.12, wire: 0.045 };
const TAIL = { end: -1.45, tip: 0.3, rise: [0.1, 0.48] }; // the free end, and where the long half climbs onto the short one
const KEEPERS = [
  [-0.36, 0.16], // fixed, [centre, width]
  [-0.8, 0.14], // floating
];
const HOLES = [-2, -1, 0, 1, 2, 3, 4].map((k) => 0.04 + 0.27 * k); // the tang goes through the one at 0.04

/** Strap width at `length` along it from the spring bar: 20 mm tapering to 16 mm. */
const widthAt = (length) => 0.97 - 0.17 * Math.min(1, length / 1.77);

/** (y, z) of the point at angle `a` from the top of the wrist (towards +Y) and `n` above its surface. */
function around(a, n) {
  const r = WRIST.r + n;
  return [Math.sin(a) * r, WRIST.z + Math.cos(a) * r];
}

/** `from` to `to` inclusive, in steps of at most `step`. */
function range(from, to, step) {
  const n = Math.max(1, Math.ceil(Math.abs(to - from) / step));
  return Array.from({ length: n + 1 }, (_, i) => from + ((to - from) * i) / n);
}

/** Height of the long half's centreline: on the wrist, then climbing through the buckle onto the short half. */
function tailHeight(s) {
  const [a, b] = TAIL.rise;
  const t = Math.min(1, Math.max(0, (b - s) / (b - a)));
  return LOW + (HIGH - LOW) * t * t * (3 - 2 * t);
}

/**
 * Centreline of one half in its own frame (its lugs towards +Y): a quadratic lead from the spring bar to the wrist,
 * then `arc` stations [angle from the top of the wrist, height above it, width factor]. Returns [y, z, half-width].
 */
function centreline(arc, lead) {
  const start = [1.112, -0.128];
  const join = around(arc[0][0], arc[0][1]);
  const c = [start[0] + 0.26, start[1] - 0.02]; // leaves the lug almost horizontally
  const pts = [];
  for (let i = 0; i < lead; i++) {
    const t = i / lead;
    const y = (1 - t) ** 2 * start[0] + 2 * (1 - t) * t * c[0] + t * t * join[0];
    const z = (1 - t) ** 2 * start[1] + 2 * (1 - t) * t * c[1] + t * t * join[1];
    pts.push([y, z, 1]);
  }
  for (const [a, n, f] of arc) pts.push([...around(a, n), f]);
  let length = 0;
  return pts.map(([y, z, f], i) => {
    if (i) length += Math.hypot(y - pts[i - 1][0], z - pts[i - 1][1]);
    return [y, z, (widthAt(length) / 2) * f];
  });
}

/** Sweeps a rounded-rectangle section (width along X) along a centreline, capped at both ends. */
function sweep(points, ring = 20) {
  const positions = [];
  const uvs = [];
  const index = [];
  let length = 0;
  const section = [];
  // Rounded rectangle, outer face first, counter-clockwise looking along the strap.
  const corner = THICK * 0.45;
  const sides = ring / 4;
  for (let q = 0; q < 4; q++) {
    for (let i = 0; i < sides; i++) {
      const a = (q + i / sides) * (Math.PI / 2);
      const sx = q === 0 || q === 3 ? 1 : -1;
      const sy = q < 2 ? 1 : -1;
      section.push([sx, sy, Math.cos(a) * corner, Math.sin(a) * corner]);
    }
  }
  const tangent = new Vector3();
  const normal = new Vector3();
  for (let i = 0; i < points.length; i++) {
    const [y, z, w] = points[i];
    const [py, pz] = points[Math.max(0, i - 1)];
    const [ny, nz] = points[Math.min(points.length - 1, i + 1)];
    tangent.set(0, ny - py, nz - pz).normalize();
    normal.set(0, -tangent.z, tangent.y); // outward from the wrist
    if (i) length += Math.hypot(y - py, z - pz);
    const half = Math.max(w, corner + 0.004);
    for (let k = 0; k < section.length; k++) {
      const [sx, sy, cx, cy] = section[k];
      const x = sx * (half - corner) + cx;
      const off = sy * (THICK / 2 - corner) + cy;
      positions.push(x, y + normal.y * off, z + normal.z * off);
      uvs.push(k / section.length, length * 1.4);
    }
  }
  const n = section.length;
  for (let i = 0; i < points.length - 1; i++) {
    for (let k = 0; k < n; k++) {
      const a = i * n + k;
      const b = i * n + ((k + 1) % n);
      const c = a + n;
      const d = b + n;
      index.push(a, c, b, b, c, d);
    }
  }
  // Cap both ends with their own copy of the end ring, so the caps shade flat.
  for (const [i, facing] of [[0, -1], [points.length - 1, 1]]) {
    const first = positions.length / 3;
    positions.push(...positions.slice(i * n * 3, (i + 1) * n * 3));
    uvs.push(...uvs.slice(i * n * 2, (i + 1) * n * 2));
    const centre = positions.length / 3;
    positions.push(0, points[i][0], points[i][1]);
    uvs.push(0.5, 0);
    for (let k = 0; k < n; k++) {
      const a = first + k;
      const b = first + ((k + 1) % n);
      index.push(...(facing > 0 ? [centre, a, b] : [centre, b, a]));
    }
  }
  const geometry = new BufferGeometry();
  geometry.setAttribute('position', new Float32BufferAttribute(positions, 3));
  geometry.setAttribute('uv', new Float32BufferAttribute(uvs, 2));
  geometry.setIndex(index);
  geometry.computeVertexNormals();
  return geometry;
}

/** Wraps a geometry modelled flat (x across the strap, y = s along it, z = height) onto the wrist. */
function bend(geometry) {
  const pos = geometry.attributes.position;
  const nor = geometry.attributes.normal;
  const v = new Vector3();
  for (let i = 0; i < pos.count; i++) {
    const a = BAR + pos.getY(i) / WRIST.r;
    const r = WRIST.r + pos.getZ(i);
    const sin = Math.sin(a);
    const cos = Math.cos(a);
    pos.setXYZ(i, pos.getX(i), sin * r, WRIST.z + cos * r);
    // The bend stretches lengths along the strap by r / WRIST.r: normals take the inverse.
    const along = (nor.getY(i) * WRIST.r) / r;
    const up = nor.getZ(i);
    v.set(nor.getX(i), along * cos + up * sin, up * cos - along * sin).normalize();
    nor.setXYZ(i, v.x, v.y, v.z);
  }
  return geometry;
}

/** Pin buckle (in the case finish): a U frame round the bar, its far edge over the long half, the tang through a hole. */
function buckle(hi) {
  const { depth, half, corner, top, wire } = FRAME;
  const lift = (s) => {
    const t = Math.min(1, s / (depth * 0.55));
    return LOW + (top - LOW) * t * t * (3 - 2 * t);
  };
  // Outline in (x, s): up one side, round the far corners, back down the other.
  const outline = [];
  const arc = (cx, from, to) => {
    for (const a of range(from, to, 0.2).slice(1)) outline.push([cx + Math.cos(a) * corner, depth - corner + Math.sin(a) * corner]);
  };
  for (const s of range(0, depth - corner, 0.1)) outline.push([-half, s]);
  arc(-half + corner, Math.PI, Math.PI / 2);
  for (const x of range(-half + corner, half - corner, 0.1).slice(1)) outline.push([x, depth]);
  arc(half - corner, Math.PI / 2, 0);
  for (const s of range(depth - corner, 0, 0.1).slice(1)) outline.push([half, s]);
  const path = new CatmullRomCurve3(outline.map(([x, s]) => new Vector3(x, s, lift(s))), false, 'centripetal');
  const frame = new TubeGeometry(path, hi ? 96 : 48, wire, hi ? 14 : 8);
  const knobs = [-half, half].map((x) => new SphereGeometry(wire, hi ? 16 : 10, hi ? 12 : 8).translate(x, 0, LOW));
  const bar = new CylinderGeometry(0.018, 0.018, half * 2, hi ? 12 : 8).rotateZ(Math.PI / 2).translate(0, 0, LOW);

  // The tang leaves its hole in the long half and rests on the far edge, tip turned down over it.
  const tangRadius = 0.02;
  const tangPath = new CatmullRomCurve3([
    new Vector3(0, HOLES[2] - 0.01, HIGH),
    new Vector3(0, HOLES[2] + 0.03, HIGH + THICK / 2 + tangRadius),
    new Vector3(0, depth * 0.55, top + wire + tangRadius - 0.006),
    new Vector3(0, depth - 0.01, top + wire + tangRadius),
    new Vector3(0, depth + wire + 0.01, top + 0.012),
  ]);
  const tang = new TubeGeometry(tangPath, hi ? 32 : 16, tangRadius, hi ? 10 : 6);
  const tip = new SphereGeometry(tangRadius, 10, 8).translate(0, depth + wire + 0.01, top + 0.012);
  return bend(merge([frame, ...knobs, bar, tang, tip]));
}

/** The short half's end folded round the bar, and the two keepers round both layers. */
function leatherParts(hi) {
  const foldWidth = widthAt(Infinity) - 0.01;
  const fold = new CylinderGeometry(LOW + 0.008, LOW + 0.008, foldWidth, hi ? 20 : 12).rotateZ(Math.PI / 2).translate(0, 0, LOW);
  const keepers = KEEPERS.map(([centre, width]) => {
    const inner = { x: 0.41, bottom: -0.004, top: HIGH + THICK / 2 + 0.006 };
    const wall = 0.03;
    const shape = roundedRect(-inner.x - wall, inner.bottom - wall, inner.x + wall, inner.top + wall, 0.04);
    shape.holes.push(roundedRect(-inner.x, inner.bottom, inner.x, inner.top, 0.014));
    // Shape in (x, height), extruded along s; rotateX maps (x, y, z) to (x, -z, y).
    const g = extrude(shape, { depth: width, bevel: 0.01, curveSegments: hi ? 6 : 3 });
    return g.rotateX(Math.PI / 2).translate(0, centre + width / 2, 0);
  });
  // Same grain scale and direction as the swept halves: u across the section, v along the strap.
  const geometry = merge([fold, ...keepers]);
  const pos = geometry.attributes.position;
  const uv = geometry.attributes.uv;
  for (let i = 0; i < pos.count; i++) uv.setXY(i, (pos.getX(i) + pos.getZ(i)) * 0.57, pos.getY(i) * 1.4);
  return bend(geometry);
}

function roundedRect(x0, y0, x1, y1, r) {
  const s = new Shape();
  s.moveTo(x0 + r, y0);
  s.lineTo(x1 - r, y0);
  s.quadraticCurveTo(x1, y0, x1, y0 + r);
  s.lineTo(x1, y1 - r);
  s.quadraticCurveTo(x1, y1, x1 - r, y1);
  s.lineTo(x0 + r, y1);
  s.quadraticCurveTo(x0, y1, x0, y1 - r);
  s.lineTo(x0, y0 + r);
  s.quadraticCurveTo(x0, y0, x0 + r, y0);
  return s;
}

/** Punched holes on the long half's outer face, in its own (mirrored) frame. */
function holes() {
  const discs = HOLES.map((s) => {
    const slope = (tailHeight(s + 0.005) - tailHeight(s - 0.005)) / 0.01;
    const len = Math.hypot(1, slope);
    const along = new Vector3(0, 1 / len, slope / len);
    const out = new Vector3(0, -slope / len, 1 / len);
    const centre = new Vector3(0, s, tailHeight(s)).addScaledVector(out, THICK / 2 + 0.003);
    const m = new Matrix4().makeBasis(new Vector3(1, 0, 0), along, out).setPosition(centre);
    return new CircleGeometry(0.042, 16).applyMatrix4(m);
  });
  const geometry = bend(merge(discs));
  const pos = geometry.attributes.position;
  for (let i = 0; i < pos.count; i++) pos.setY(i, -pos.getY(i));
  return geometry;
}

/** Stitches: short dashes along both edges of the outer face of one half, up to point `count`. */
function stitchesFor(points, count, geometry, material) {
  const stitches = new InstancedMesh(geometry, material, count * 2);
  const m = new Matrix4();
  const q = new Quaternion();
  const up = new Vector3(0, 1, 0);
  const dir = new Vector3();
  const pos = new Vector3();
  const scale = new Vector3(1, 1, 1);
  let n = 0;
  for (let i = 1; i <= count; i++) {
    const [y, z, half] = points[i];
    const [py, pz] = points[i - 1];
    dir.set(0, y - py, z - pz).normalize();
    q.setFromUnitVectors(up, dir);
    const nx = -dir.z;
    const ny = dir.y;
    const inset = half - 0.055;
    for (const edge of [-1, 1]) {
      pos.set(edge * inset, y + nx * (THICK / 2 + 0.001), z + ny * (THICK / 2 + 0.001));
      stitches.setMatrixAt(n++, m.compose(pos, q, scale));
    }
  }
  stitches.instanceMatrix.needsUpdate = true;
  return stitches;
}

export function createStrap({ mats, hi }) {
  const group = new Group();
  const step = hi ? 0.03 : 0.054; // radians between sections round the wrist
  const lead = hi ? 16 : 9;

  // Short half: lugs to the bar.
  const shortPoints = centreline(range(JOIN, BAR, step).map((a) => [a, LOW, 1]), lead);
  // Long half, in its own frame: lugs round under the wrist, through the buckle and back to an elliptical tip.
  const angleAt = (s) => 2 * Math.PI - BAR - s / WRIST.r;
  const tipStart = TAIL.end + TAIL.tip;
  const longArc = range((2 * Math.PI - BAR - JOIN) * WRIST.r, tipStart, step * WRIST.r).map((s) => [angleAt(s), tailHeight(s), 1]);
  const tipSteps = hi ? 10 : 6;
  for (let i = 1; i <= tipSteps; i++) {
    const a = (i / tipSteps) * (Math.PI / 2);
    const s = tipStart - Math.sin(a) * TAIL.tip;
    longArc.push([angleAt(s), tailHeight(s), Math.cos(a)]);
  }
  const longPoints = centreline(longArc, lead);

  const ring = hi ? 24 : 16;
  const shortGeo = sweep(shortPoints, ring);
  const longGeo = sweep(longPoints, ring);
  const buckleGeo = buckle(hi);
  const leatherGeo = leatherParts(hi);
  const holeGeo = holes();
  const holeMat = new MeshBasicMaterial({ color: '#0a0908', side: DoubleSide });
  const stitchGeo = new BoxGeometry(0.008, 0.026, 0.006);

  const short = new Group();
  short.add(
    new Mesh(shortGeo, mats.leather),
    stitchesFor(shortPoints, shortPoints.length - 1 - Math.ceil(0.08 / (step * WRIST.r)), stitchGeo, mats.stitch),
    new Mesh(leatherGeo, mats.leather),
    new Mesh(buckleGeo, mats.metal('polished')),
  );
  const long = new Group();
  long.add(
    new Mesh(longGeo, mats.leather),
    stitchesFor(longPoints, longPoints.length - 1 - tipSteps - 2, stitchGeo, mats.stitch),
    new Mesh(holeGeo, holeMat),
  );
  long.scale.y = -1;
  const halves = [short, long];
  group.add(short, long);

  return {
    group,
    /** 0..1: the halves slide out from the lugs (the stage fades them; see watch.js). */
    setPresence(value) {
      halves.forEach((half) => (half.position.y = Math.sign(half.scale.y) * (1 - value) * 0.35));
    },
    dispose() {
      for (const g of [shortGeo, longGeo, buckleGeo, leatherGeo, holeGeo, stitchGeo]) g.dispose();
      holeMat.dispose();
    },
  };
}
