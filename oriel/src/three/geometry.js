// Geometry helpers shared by the watch parts. Watch-local units: case radius = 1 (20 mm), dial faces +Z,
// twelve o'clock is +Y. All builders run once at init.
import {
  BufferGeometry,
  ExtrudeGeometry,
  Float32BufferAttribute,
  LatheGeometry,
  Path,
  Shape,
  SplineCurve,
  Vector2,
  Vector3,
} from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';

export const TAU = Math.PI * 2;

/** Revolves an (r, z) profile around the watch axis. Traverse CCW in (r, z) for outward-facing normals. */
export function lathe(profile, segments) {
  const geometry = new LatheGeometry(profile.map(([r, z]) => new Vector2(r, z)), segments);
  geometry.rotateX(Math.PI / 2);
  return geometry.toNonIndexed();
}

/** Several lathe strips with hard edges between them, merged. */
export function latheStrips(strips, segments) {
  return mergeGeometries(strips.map((s) => lathe(s, segments)));
}

/** Planar UVs over [-extent, extent] around `center`; side walls get non-degenerate UVs (valid tangents). */
export function planarUV(extent, cx = 0, cy = 0) {
  const s = 1 / (2 * extent);
  return {
    generateTopUV(geometry, v, a, b, c) {
      return [a, b, c].map((i) => new Vector2((v[i * 3] - cx) * s + 0.5, (v[i * 3 + 1] - cy) * s + 0.5));
    },
    generateSideWallUV(geometry, v, a, b, c, d) {
      const alongX = Math.abs(v[a * 3 + 1] - v[b * 3 + 1]) < Math.abs(v[a * 3] - v[b * 3]);
      return [a, b, c, d].map((i) => new Vector2((alongX ? v[i * 3] - cx : v[i * 3 + 1] - cy) * s + 0.5, v[i * 3 + 2] * s * 4 + 0.5));
    },
  };
}

/**
 * Extrudes a shape along +Z from z = 0 to z = depth (bevels stay inside that range).
 * Groups: 0 = caps, 1 = side walls and bevels.
 */
export function extrude(shape, { depth, bevel = 0, bevelSegments = 2, curveSegments = 24, uvExtent = 0, cx = 0, cy = 0 }) {
  const geometry = new ExtrudeGeometry(shape, {
    depth: Math.max(1e-4, depth - bevel * 2),
    bevelEnabled: bevel > 0,
    bevelThickness: bevel,
    bevelSize: bevel,
    bevelOffset: -bevel,
    bevelSegments,
    curveSegments,
    UVGenerator: uvExtent ? planarUV(uvExtent, cx, cy) : undefined,
  });
  geometry.translate(0, 0, bevel);
  return geometry;
}

/** Splits a non-indexed geometry into one geometry per material group index. */
export function splitGroups(geometry) {
  const out = [];
  const groups = geometry.groups.length ? geometry.groups : [{ start: 0, count: geometry.attributes.position.count, materialIndex: 0 }];
  const buckets = new Map();
  for (const g of groups) {
    if (!buckets.has(g.materialIndex)) buckets.set(g.materialIndex, []);
    buckets.get(g.materialIndex).push(g);
  }
  for (const [index, ranges] of buckets) {
    const result = new BufferGeometry();
    for (const [name, attr] of Object.entries(geometry.attributes)) {
      const size = attr.itemSize;
      const parts = ranges.map((r) => attr.array.slice(r.start * size, (r.start + r.count) * size));
      const length = parts.reduce((n, p) => n + p.length, 0);
      const array = new Float32Array(length);
      let offset = 0;
      for (const p of parts) {
        array.set(p, offset);
        offset += p.length;
      }
      result.setAttribute(name, new Float32BufferAttribute(array, size));
    }
    out[index] = result;
  }
  return out;
}

/** Splits a non-indexed geometry's triangles into buckets by a predicate on the face normal. */
export function splitByNormal(geometry, classify, count) {
  const pos = geometry.attributes.position;
  const nor = geometry.attributes.normal;
  const uv = geometry.attributes.uv;
  const buckets = Array.from({ length: count }, () => ({ p: [], n: [], u: [] }));
  const n = new Vector3();
  for (let i = 0; i < pos.count; i += 3) {
    n.set(0, 0, 0);
    for (let k = 0; k < 3; k++) n.x += nor.getX(i + k), n.y += nor.getY(i + k), n.z += nor.getZ(i + k);
    n.normalize();
    const b = buckets[classify(n)];
    for (let k = 0; k < 3; k++) {
      b.p.push(pos.getX(i + k), pos.getY(i + k), pos.getZ(i + k));
      b.n.push(nor.getX(i + k), nor.getY(i + k), nor.getZ(i + k));
      if (uv) b.u.push(uv.getX(i + k), uv.getY(i + k));
    }
  }
  return buckets.map((b) => {
    const g = new BufferGeometry();
    g.setAttribute('position', new Float32BufferAttribute(b.p, 3));
    g.setAttribute('normal', new Float32BufferAttribute(b.n, 3));
    if (uv) g.setAttribute('uv', new Float32BufferAttribute(b.u, 2));
    return g;
  });
}

/** Keeps only position / normal / uv so geometries from different builders can merge. */
export function clean(geometry) {
  const g = geometry.index ? geometry.toNonIndexed() : geometry;
  for (const name of Object.keys(g.attributes)) if (!['position', 'normal', 'uv'].includes(name)) g.deleteAttribute(name);
  if (!g.attributes.uv) g.setAttribute('uv', new Float32BufferAttribute(new Float32Array(g.attributes.position.count * 2), 2));
  g.clearGroups();
  return g;
}

export function merge(geometries) {
  return mergeGeometries(geometries.map(clean));
}

/** Corner-cutting smoothing of a closed polygon. */
function chaikin(points, iterations = 2) {
  let pts = points;
  for (let it = 0; it < iterations; it++) {
    const next = [];
    for (let i = 0; i < pts.length; i++) {
      const a = pts[i];
      const b = pts[(i + 1) % pts.length];
      next.push(new Vector2(a.x * 0.75 + b.x * 0.25, a.y * 0.75 + b.y * 0.25));
      next.push(new Vector2(a.x * 0.25 + b.x * 0.75, a.y * 0.25 + b.y * 0.75));
    }
    pts = next;
  }
  return pts;
}

const polar = (r, a) => new Vector2(Math.cos(a) * r, Math.sin(a) * r);

function circlePoints(r, n, cx = 0, cy = 0) {
  return Array.from({ length: n }, (_, i) => new Vector2(cx + Math.cos((i / n) * TAU) * r, cy + Math.sin((i / n) * TAU) * r));
}

export function circlePath(r, n = 48, cx = 0, cy = 0) {
  return new Path(circlePoints(r, n, cx, cy).reverse());
}

/**
 * Wheel outline with real tooth forms and crossed-out spokes.
 * style: 'cycloid' (watch wheels and pinions, ogival tips), 'ratchet' (sawtooth), 'club' (escape wheel),
 * 'knurl' (crown), 'none' (plain rim, e.g. the balance).
 */
export function gearShape({
  teeth = 0,
  root,
  tip = root,
  style = 'cycloid',
  fill = 0.46,
  hole = 0,
  spokes = 0,
  rimWidth = 0,
  hubRadius = 0,
  spokeWidth = 0,
  phase = 0,
  detail = 6,
}) {
  const outline = [];
  const pitch = teeth ? TAU / teeth : 0;
  const h = tip - root;

  if (!teeth || style === 'none') {
    outline.push(...circlePoints(root, 128));
  } else {
    for (let i = 0; i < teeth; i++) {
      const a0 = phase + i * pitch;
      const at = (f, r) => outline.push(polar(r, a0 + f * pitch));
      if (style === 'cycloid' || style === 'knurl') {
        const rp = root + h * (style === 'knurl' ? 0.2 : 0.42);
        at(0, root);
        for (let s = 0; s <= detail; s++) {
          const u = s / detail;
          const f = (fill * (1 - Math.cos(Math.PI * u))) / 2;
          const r = rp + (tip - rp) * Math.pow(Math.sin(Math.PI * u), style === 'knurl' ? 0.5 : 0.7);
          at(f, r);
        }
        at(fill, root);
        at((fill + 1) / 2, root - h * 0.06);
      } else if (style === 'ratchet') {
        at(0, root);
        at(0.06, tip);
        at(0.16, tip - h * 0.08);
        at(0.94, root + h * 0.04);
      } else if (style === 'club') {
        at(0, root);
        at(0.3, root + h * 0.55);
        at(0.5, tip - h * 0.2);
        at(0.66, tip);
        at(0.6, tip - h * 0.28);
        at(0.34, root + h * 0.35);
        at(0.2, root);
      }
    }
  }

  const shape = new Shape(outline);

  if (spokes > 0) {
    const rimIn = root - rimWidth;
    for (let k = 0; k < spokes; k++) {
      const a = phase + (k / spokes) * TAU + Math.PI / spokes * 0;
      const b = a + TAU / spokes;
      const pts = [];
      const outerA = a + Math.asin(Math.min(0.95, spokeWidth / 2 / rimIn));
      const outerB = b - Math.asin(Math.min(0.95, spokeWidth / 2 / rimIn));
      const innerA = a + Math.asin(Math.min(0.95, spokeWidth / 2 / hubRadius));
      const innerB = b - Math.asin(Math.min(0.95, spokeWidth / 2 / hubRadius));
      const n = 20;
      for (let i = 0; i <= n; i++) pts.push(polar(rimIn, outerA + ((outerB - outerA) * i) / n));
      for (let i = 0; i <= 6; i++) pts.push(polar(hubRadius, innerB - ((innerB - innerA) * i) / 6));
      shape.holes.push(new Path(chaikin(pts, 2).reverse()));
    }
  }
  if (hole > 0) shape.holes.push(circlePath(hole, 24));
  return shape;
}

/**
 * Smooth band (a watch bridge or cock) along a centreline with varying width and round end caps.
 * @param {Array<[number, number]>} points centreline
 * @param {number[]} widths full width at each point
 */
export function bandShape(points, widths, { samples = 64, holes = [] } = {}) {
  const curve = new SplineCurve(points.map(([x, y]) => new Vector2(x, y)));
  const left = [];
  const right = [];
  const widthAt = (t) => {
    const f = t * (widths.length - 1);
    const i = Math.min(widths.length - 2, Math.floor(f));
    const u = f - i;
    return widths[i] + (widths[i + 1] - widths[i]) * u;
  };
  for (let i = 0; i <= samples; i++) {
    const t = i / samples;
    const p = curve.getPointAt(t);
    const tan = curve.getTangentAt(t);
    const w = widthAt(t) / 2;
    left.push(new Vector2(p.x - tan.y * w, p.y + tan.x * w));
    right.push(new Vector2(p.x + tan.y * w, p.y - tan.x * w));
  }
  const cap = (centre, from, a0, sweep) => {
    const r = from.distanceTo(centre);
    const pts = [];
    for (let i = 1; i < 12; i++) pts.push(polar(r, a0 + (sweep * i) / 12).add(centre));
    return pts;
  };
  const end = curve.getPointAt(1);
  const start = curve.getPointAt(0);
  const endTan = curve.getTangentAt(1);
  const startTan = curve.getTangentAt(0);
  const endAngle = Math.atan2(endTan.y, endTan.x) + Math.PI / 2;
  const startAngle = Math.atan2(startTan.y, startTan.x) - Math.PI / 2;
  const outline = [
    ...right,
    ...cap(end, right[right.length - 1], endAngle - Math.PI, Math.PI),
    ...left.reverse(),
    ...cap(start, left[left.length - 1], startAngle + Math.PI, Math.PI),
  ];
  const shape = new Shape(outline);
  holes.forEach(([x, y, r]) => shape.holes.push(circlePath(r, 24, x, y)));
  return shape;
}

/** Shape from an outline of [x, y] points, optionally smoothed. */
export function polygonShape(points, { smooth = 0, holes = [] } = {}) {
  const pts = points.map(([x, y]) => new Vector2(x, y));
  const shape = new Shape(smooth ? chaikin(pts, smooth) : pts);
  holes.forEach(([x, y, r]) => shape.holes.push(circlePath(r, 24, x, y)));
  return shape;
}

/** Builds a flat-shaded triangle soup; each face is flipped to point along its `outward` hint. */
export function faceted() {
  const positions = [];
  const a = new Vector3();
  const b = new Vector3();
  const n = new Vector3();
  return {
    tri(p0, p1, p2, outward) {
      a.set(p1[0] - p0[0], p1[1] - p0[1], p1[2] - p0[2]);
      b.set(p2[0] - p0[0], p2[1] - p0[1], p2[2] - p0[2]);
      n.crossVectors(a, b);
      if (n.x * outward[0] + n.y * outward[1] + n.z * outward[2] < 0) positions.push(...p0, ...p2, ...p1);
      else positions.push(...p0, ...p1, ...p2);
    },
    quad(p0, p1, p2, p3, outward) {
      this.tri(p0, p1, p2, outward);
      this.tri(p0, p2, p3, outward);
    },
    build() {
      const geometry = new BufferGeometry();
      geometry.setAttribute('position', new Float32BufferAttribute(positions, 3));
      geometry.computeVertexNormals();
      const uv = new Float32Array((positions.length / 3) * 2);
      for (let i = 0; i < positions.length / 3; i++) {
        uv[i * 2] = positions[i * 3] * 4 + 0.5;
        uv[i * 2 + 1] = positions[i * 3 + 1] * 4 + 0.5;
      }
      geometry.setAttribute('uv', new Float32BufferAttribute(uv, 2));
      return geometry;
    },
  };
}
