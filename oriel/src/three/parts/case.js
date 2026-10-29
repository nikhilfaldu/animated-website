// Case middle (polished bevels, satin flanks), drilled lugs, crown; the stepped bezel; the domed crystal.
import { CircleGeometry, CylinderGeometry, Group, Matrix4, Mesh, Shape, SphereGeometry } from 'three';
import { circlePath, extrude, gearShape, lathe, latheStrips, merge, splitByNormal } from '../geometry.js';

/** Case middle profile pieces, (r, z), traversed so normals face out. */
const CASE_POLISHED = [
  [[1.0, 0.015], [0.986, 0.04]], // top bevel
  [[0.986, 0.04], [0.84, 0.04]], // seat under the bezel
  [[0.966, -0.272], [0.998, -0.236]], // lower bevel
  [[0.9, -0.272], [0.966, -0.272]], // bottom
];
const CASE_SATIN = [
  [[0.998, -0.236], [1.004, -0.17], [1.006, -0.09], [1.004, -0.02], [1.0, 0.015]], // flank, gently barrelled
  [[0.84, 0.04], [0.84, -0.26]], // bore
  [[0.84, -0.26], [0.9, -0.26], [0.9, -0.272]], // caseback seat
];

/** Side profile of one lug in (y, z): leaves the flank and curves down toward the strap. */
function lugShape() {
  const s = new Shape();
  s.moveTo(0.72, -0.232);
  s.lineTo(0.94, -0.214);
  s.quadraticCurveTo(1.07, -0.205, 1.14, -0.178);
  s.quadraticCurveTo(1.192, -0.15, 1.186, -0.108);
  s.quadraticCurveTo(1.178, -0.076, 1.132, -0.058);
  s.quadraticCurveTo(1.02, -0.012, 0.9, 0.022);
  s.lineTo(0.72, 0.034);
  s.closePath();
  s.holes.push(circlePath(0.0115, 20, 1.112, -0.128));
  return s;
}

function lugs(hi) {
  const base = extrude(lugShape(), { depth: 0.13, bevel: 0.014, bevelSegments: hi ? 3 : 2, curveSegments: hi ? 20 : 10 });
  // Shape (y, z) extruded along x: permute axes so x_shape → y, y_shape → z, z_shape → x.
  base.applyMatrix4(new Matrix4().set(0, 0, 1, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 1));
  const parts = [];
  for (const x of [0.497, -0.627]) {
    const lug = base.clone().translate(x, 0, 0);
    parts.push(lug, lug.clone().rotateZ(Math.PI));
  }
  // Faces pointing sideways (lug flanks) and the bevels are polished; the top surface is brushed.
  const merged = merge(parts);
  const [polished, satin] = splitByNormal(merged, (n) => (Math.abs(n.x) > 0.25 ? 0 : n.z > 0.35 ? 1 : 0), 2);
  return { polished, satin };
}

function crown(mats, hi) {
  const group = new Group();
  const polished = mats.metal('polished');
  const segs = hi ? 48 : 24;
  const knurl = extrude(gearShape({ teeth: hi ? 44 : 32, root: 0.124, tip: 0.136, style: 'knurl', fill: 0.62, detail: 3 }), {
    depth: 0.1,
    bevel: 0.014,
    curveSegments: 4,
  });
  knurl.rotateY(Math.PI / 2).translate(1.05, 0, 0);
  const tube = new CylinderGeometry(0.052, 0.056, 0.08, segs).rotateZ(Math.PI / 2).translate(1.02, 0, 0);
  const cap = lathe([[0.112, 0], [0.104, 0.008], [0.06, 0.016], [0, 0.018]], segs).rotateY(Math.PI / 2).translate(1.15, 0, 0);
  const body = new Mesh(merge([knurl, tube, cap]), polished);
  const markMaterial = mats.metal('polished', { aoMap: mats.textures.crown, aoMapIntensity: 1 });
  const mark = new Mesh(new CircleGeometry(0.058, segs).rotateY(Math.PI / 2).translate(1.1675, 0, 0), markMaterial);
  group.add(body, mark);
  group.position.z = -0.11;
  return group;
}

export function createCase({ mats, hi }) {
  const segments = hi ? 192 : 96;
  const group = new Group();
  const lug = lugs(hi);
  const polished = merge([latheStrips(CASE_POLISHED, segments), lug.polished]);
  const satin = merge([latheStrips(CASE_SATIN, segments), lug.satin]);
  group.add(new Mesh(polished, mats.metal('polished')), new Mesh(satin, mats.metal('satin')), crown(mats, hi));
  return { group, rim: { radius: 1.0, z: -0.11 } };
}

/** Polished bezel with the 0.3 mm step. Hard edges between strips. */
export function createBezel({ mats, hi }) {
  const strips = [
    [[0.99, 0.04], [0.99, 0.064], [0.986, 0.08], [0.974, 0.092], [0.952, 0.1], [0.919, 0.104]],
    [[0.919, 0.104], [0.918, 0.119]], // the step
    [[0.918, 0.119], [0.884, 0.1215], [0.868, 0.1205], [0.861, 0.116]],
    [[0.861, 0.116], [0.86, 0.04]],
    [[0.86, 0.04], [0.99, 0.04]],
  ];
  const group = new Group();
  group.add(new Mesh(latheStrips(strips, hi ? 192 : 96), mats.metal('polished')));
  return { group, rim: { radius: 0.99, z: 0.1 } };
}

/** Gently domed sapphire: a spherical cap, 0.05 sag over a 0.86 radius. */
export function createCrystal({ mats, hi }) {
  const r = 0.862;
  const sag = 0.05;
  const R = (r * r + sag * sag) / (2 * sag);
  const geometry = new SphereGeometry(R, hi ? 128 : 64, hi ? 16 : 10, 0, Math.PI * 2, 0, Math.asin(r / R));
  geometry.rotateX(Math.PI / 2).translate(0, 0, 0.17 - R);
  const material = mats.sapphire();
  const mesh = new Mesh(geometry, material);
  mesh.renderOrder = 2;
  const group = new Group();
  group.add(mesh);
  return { group, rim: { radius: r, z: 0.125 }, glass: [mesh] };
}
