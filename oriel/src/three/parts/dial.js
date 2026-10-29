// Dial (lacquered disc, rehaut, applied faceted batons) and the hands (faceted dauphine, lume, seconds).
import { CircleGeometry, CylinderGeometry, Group, Mesh } from 'three';
import { faceted, lathe, merge, TAU } from '../geometry.js';

export const DIAL_RADIUS = 0.83;
export const DIAL_Z = 0.02;

/** Applied batons, clockwise from twelve (double at twelve). Shared with the dial print for their shadows. */
export const INDICES = (() => {
  const out = [];
  for (let i = 0; i < 12; i++) {
    const angle = (i / 12) * TAU;
    const xs = i === 0 ? [-0.026, 0.026] : [0];
    for (const x of xs) out.push({ angle, x, width: 0.032, inner: 0.625, outer: 0.755 });
  }
  return out;
})();

/** A baton with a pitched top ridge and chamfered ends, along +Y at offset x, rotated clockwise by angle. */
function baton(builder, { angle, x, width, inner, outer }, z0, height) {
  const w = width / 2;
  const e = width * 0.45;
  const cos = Math.cos(-angle);
  const sin = Math.sin(-angle);
  const p = (lx, ly, z) => [(lx + x) * cos - ly * sin, (lx + x) * sin + ly * cos, z0 + z];
  const out = (lx, ly, lz) => [lx * cos - ly * sin, lx * sin + ly * cos, lz];
  const shoulder = height * 0.62;
  // Ridge along the centre, shoulders on both long edges.
  const r0 = p(0, inner + e, height);
  const r1 = p(0, outer - e, height);
  const lIn = p(-w, inner, shoulder);
  const lOut = p(-w, outer, shoulder);
  const rIn = p(w, inner, shoulder);
  const rOut = p(w, outer, shoulder);
  builder.quad(lIn, lOut, r1, r0, out(-0.6, 0, 1));
  builder.quad(r0, r1, rOut, rIn, out(0.6, 0, 1));
  builder.tri(lOut, rOut, r1, out(0, 0.7, 1));
  builder.tri(lIn, r0, rIn, out(0, -0.7, 1));
  // Vertical flanks down to the dial.
  const b = (lx, ly) => p(lx, ly, 0);
  builder.quad(b(-w, inner), b(-w, outer), lOut, lIn, out(-1, 0, 0));
  builder.quad(b(w, inner), rIn, rOut, b(w, outer), out(1, 0, 0));
  builder.quad(b(-w, outer), b(w, outer), rOut, lOut, out(0, 1, 0));
  builder.quad(b(-w, inner), lIn, rIn, b(w, inner), out(0, -1, 0));
}

export function createDial({ mats, hi }) {
  const group = new Group();
  const segments = hi ? 192 : 96;

  const disc = new Mesh(new CircleGeometry(DIAL_RADIUS, segments).translate(0, 0, DIAL_Z), mats.dial);
  // Rehaut: the sloped ring between the dial and the bezel, plus the dial's edge and back for the exploded view.
  const rehaut = lathe([[0.862, 0.112], [0.846, 0.06], [DIAL_RADIUS, DIAL_Z + 0.002]], segments);
  const edge = lathe([[DIAL_RADIUS, -0.012], [DIAL_RADIUS, DIAL_Z]], segments);
  const back = new CircleGeometry(DIAL_RADIUS, segments / 2).rotateX(Math.PI).translate(0, 0, -0.012);
  const shell = new Mesh(merge([rehaut, edge, back]), mats.flange);

  const builder = faceted();
  INDICES.forEach((index) => baton(builder, index, DIAL_Z, 0.014));
  const batons = new Mesh(builder.build(), mats.metal('accent'));

  group.add(disc, shell, batons);
  return { group, rim: { radius: DIAL_RADIUS, z: DIAL_Z } };
}

/** Faceted dauphine hand: four facets meeting on a raised centre ridge. */
function dauphine(len, tail, width, ridge) {
  const b = faceted();
  const w = width / 2;
  const y = len * 0.13;
  const tailP = [0, -tail, ridge * 0.4];
  const mid = [0, y, ridge];
  const tip = [0, len, ridge * 0.15];
  const left = [-w, y, 0];
  const right = [w, y, 0];
  const tailL = [-w * 0.55, -tail, 0];
  const tailR = [w * 0.55, -tail, 0];
  b.quad(tailL, left, mid, tailP, [-1, 0, 1]);
  b.quad(tailP, mid, right, tailR, [1, 0, 1]);
  b.tri(left, tip, mid, [-1, 0, 1]);
  b.tri(mid, tip, right, [1, 0, 1]);
  b.quad(tailL, tailR, right, left, [0, 0, -1]);
  b.tri(left, right, tip, [0, 0, -1]);
  b.tri(tailL, tailP, tailR, [0, -1, 0]);
  return b.build();
}

/** Thin lume strip laid on the ridge, from near the hub to just short of the tip. */
function lumeStrip(len, from, width, z) {
  const b = faceted();
  const w = width / 2;
  b.quad([-w * 0.6, from, z], [w * 0.6, from, z], [w * 0.25, len * 0.86, z], [-w * 0.25, len * 0.86, z], [0, 0, 1]);
  return b.build();
}

export function createHands({ mats, hi }) {
  const group = new Group();
  const metal = mats.metal('accent');
  const seg = hi ? 40 : 20;
  const cyl = (r, h, z) => new CylinderGeometry(r, r, h, seg).rotateX(Math.PI / 2).translate(0, 0, z + h / 2);

  const hour = new Group();
  hour.position.z = DIAL_Z + 0.028;
  hour.add(
    new Mesh(merge([dauphine(0.5, 0.06, 0.088, 0.017), cyl(0.046, 0.005, 0)]), metal),
    new Mesh(lumeStrip(0.5, 0.085, 0.02, 0.0172), mats.lume),
  );

  const minute = new Group();
  minute.position.z = DIAL_Z + 0.042;
  minute.add(
    new Mesh(merge([dauphine(0.75, 0.06, 0.074, 0.014), cyl(0.036, 0.005, 0)]), metal),
    new Mesh(lumeStrip(0.75, 0.08, 0.016, 0.0142), mats.lume),
  );

  const seconds = new Group();
  seconds.position.z = DIAL_Z + 0.056;
  const needle = faceted();
  needle.quad([-0.0045, -0.17, 0.003], [0.0045, -0.17, 0.003], [0.0016, 0.67, 0.003], [-0.0016, 0.67, 0.003], [0, 0, 1]);
  const counterweight = new CylinderGeometry(0.024, 0.024, 0.004, seg).rotateX(Math.PI / 2).translate(0, -0.12, 0.003);
  const tipNeedle = faceted();
  tipNeedle.quad([-0.0016, 0.67, 0.0032], [0.0016, 0.67, 0.0032], [0.0009, 0.79, 0.0032], [-0.0009, 0.79, 0.0032], [0, 0, 1]);
  seconds.add(
    new Mesh(merge([needle.build(), counterweight, cyl(0.02, 0.006, 0)]), metal),
    new Mesh(tipNeedle.build(), mats.tip),
    new Mesh(cyl(0.012, 0.008, 0.004), metal),
  );

  group.add(hour, minute, seconds);

  return {
    group,
    rim: { radius: 0.5, z: DIAL_Z + 0.04 },
    /** Angles in radians, clockwise from twelve. */
    set(hourAngle, minuteAngle, secondsAngle) {
      hour.rotation.z = -hourAngle;
      minute.rotation.z = -minuteAngle;
      seconds.rotation.z = -secondsAngle;
    },
  };
}
