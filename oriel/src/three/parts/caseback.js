// Screw-down caseback: polished outer bevel, an engraved satin ring, six notches and a sapphire window.
import { BoxGeometry, CircleGeometry, Float32BufferAttribute, Group, Mesh, RingGeometry } from 'three';
import { latheStrips, merge, TAU } from '../geometry.js';

const FACE_Z = -0.305;
const EXTENT = 0.92; // must match the engraving texture's extent (textures.js)

export function createCaseback({ mats, textures, hi }) {
  const group = new Group();
  const segments = hi ? 192 : 96;

  // (r, z) strips; normal = (dz, -dr), so each runs with the surface on its right.
  const polished = latheStrips(
    [
      [[0.862, FACE_Z], [0.886, -0.3], [0.9, -0.288], [0.902, -0.272]], // outer bevel
      [[0.62, -0.29], [0.645, FACE_Z]], // window bezel
    ],
    segments,
  );
  // The engraved face: planar UVs over [-EXTENT, EXTENT], seen from the back.
  const face = new RingGeometry(0.645, 0.862, segments, 1).rotateX(Math.PI).translate(0, 0, FACE_Z - 0.0002);
  const pos = face.attributes.position;
  const uv = new Float32Array(pos.count * 2);
  for (let i = 0; i < pos.count; i++) {
    uv[i * 2] = pos.getX(i) / (2 * EXTENT) + 0.5;
    uv[i * 2 + 1] = pos.getY(i) / (2 * EXTENT) + 0.5;
  }
  face.setAttribute('uv', new Float32BufferAttribute(uv, 2));
  const engraved = mats.metal('satin', {
    normalMap: textures.caseback.normal,
    aoMap: textures.caseback.ao,
    aoMapIntensity: 1,
  });

  // Six notches for the case wrench, cut into the outer bevel.
  const notches = [];
  for (let i = 0; i < 6; i++) {
    const a = (i / 6) * TAU + TAU / 12;
    notches.push(new BoxGeometry(0.05, 0.028, 0.012).rotateZ(a + Math.PI / 2).translate(Math.cos(a) * 0.885, Math.sin(a) * 0.885, -0.297));
  }

  const glass = new Mesh(new CircleGeometry(0.62, segments / 2).rotateX(Math.PI).translate(0, 0, -0.29), mats.sapphire());
  glass.renderOrder = 2;

  // The inner face, seen from above when the watch is taken apart.
  const inner = new RingGeometry(0.62, 0.9, segments, 1).translate(0, 0, -0.274);

  group.add(
    new Mesh(merge([polished, ...notches]), mats.metal('polished')),
    new Mesh(inner, mats.metal('satin')),
    new Mesh(face, engraved),
    glass,
  );
  return { group, rim: { radius: 0.9, z: -0.29 }, glass: [glass] };
}
