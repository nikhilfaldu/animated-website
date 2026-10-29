// A dark photo studio built from emissive panels and pre-filtered into an environment map. Strip softboxes
// draw the long highlight bands on polished metal; a warm key and a cool rim separate the watch from the black.
import {
  BackSide,
  BufferAttribute,
  Color,
  DoubleSide,
  Mesh,
  MeshBasicMaterial,
  PlaneGeometry,
  PMREMGenerator,
  Scene,
  SphereGeometry,
} from 'three';

const PANELS = [
  // [width, height, intensity, colour, position, optional roll]
  [7, 4.5, 3.4, '#fff1df', [-7.5, 6.5, 7.5]], // warm key, upper left front
  [10, 6, 1.5, '#f4f2ef', [0, 13, 0.5]], // overhead
  [1.1, 14, 5.0, '#f1f4f8', [-10.5, 0.5, 2.5]], // tall strip, left
  [1.1, 14, 3.6, '#f6f3ee', [10.5, 0, 1.5]], // tall strip, right
  [4, 9, 3.2, '#d4e1ff', [7, 3, -9]], // cool rim, back right
  [3, 6, 1.1, '#efe7dc', [-7, -2, -8]], // back left kicker
  [12, 0.7, 1.8, '#f2efe9', [0, -6.5, 8.5]], // low front strip: a thin line on the lower bevels
  [2.2, 2.2, 2.6, '#ffffff', [4.5, 5.5, 10.5]], // small specular card near the lens
];

function roomGeometry() {
  const geometry = new SphereGeometry(30, 48, 24);
  const position = geometry.attributes.position;
  const colors = new Float32Array(position.count * 3);
  const top = new Color(0.024, 0.023, 0.022);
  const horizon = new Color(0.012, 0.0115, 0.011);
  const floor = new Color(0.003, 0.003, 0.003);
  const c = new Color();
  for (let i = 0; i < position.count; i++) {
    const y = position.getY(i) / 30;
    if (y > 0) c.lerpColors(horizon, top, Math.pow(y, 0.8));
    else c.lerpColors(horizon, floor, Math.pow(-y, 0.6));
    colors.set([c.r, c.g, c.b], i * 3);
  }
  geometry.setAttribute('color', new BufferAttribute(colors, 3));
  return geometry;
}

/**
 * Renders the studio into a PMREM environment map.
 * @returns {{ texture: import('three').Texture, dispose(): void }}
 */
export function createStudioEnvironment(renderer, { size = 256 } = {}) {
  const scene = new Scene();
  const disposables = [];

  const roomMaterial = new MeshBasicMaterial({ vertexColors: true, side: BackSide });
  const room = new Mesh(roomGeometry(), roomMaterial);
  scene.add(room);
  disposables.push(room.geometry, roomMaterial);

  const plane = new PlaneGeometry(1, 1);
  disposables.push(plane);
  for (const [w, h, intensity, color, [x, y, z]] of PANELS) {
    const material = new MeshBasicMaterial({ color: new Color(color).multiplyScalar(intensity), side: DoubleSide });
    const panel = new Mesh(plane, material);
    panel.scale.set(w, h, 1);
    panel.position.set(x, y, z);
    panel.lookAt(0, 0, 0);
    scene.add(panel);
    disposables.push(material);
  }

  const pmrem = new PMREMGenerator(renderer);
  const target = pmrem.fromScene(scene, 0.012, 0.1, 100, { size });
  pmrem.dispose();
  disposables.forEach((d) => d.dispose());

  return {
    texture: target.texture,
    dispose: () => target.dispose(),
  };
}
