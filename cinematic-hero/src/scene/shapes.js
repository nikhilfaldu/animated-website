// Each function returns a Float32Array of length count*3 (x,y,z per particle).
// All four shapes must be called with the SAME count so the vertex shader
// can morph index-for-index between them (see particle.vert.glsl).

export function ring(count, { radius = 2.4, tubeRadius = 0.5 } = {}) {
  const positions = new Float32Array(count * 3);
  for (let i = 0; i < count; i += 1) {
    const angle = (i / count) * Math.PI * 2;
    const tubeAngle = Math.random() * Math.PI * 2;
    const tubeOffset = Math.random() * tubeRadius;
    const x = Math.cos(angle) * radius + Math.cos(tubeAngle) * tubeOffset;
    const y = Math.sin(angle) * radius;
    const z = Math.sin(tubeAngle) * tubeOffset;
    positions[i * 3] = x;
    positions[i * 3 + 1] = y;
    positions[i * 3 + 2] = z;
  }
  return positions;
}

export function cubeOutline(count, { size = 3 } = {}) {
  const positions = new Float32Array(count * 3);
  const half = size / 2;
  // 12 edges of a cube, each defined by a fixed axis pair and a varying axis.
  const edges = [
    [-half, -half, 'z'], [-half, half, 'z'], [half, -half, 'z'], [half, half, 'z'],
    [-half, -half, 'y'], [-half, half, 'y'], [half, -half, 'y'], [half, half, 'y'],
    [-half, -half, 'x'], [-half, half, 'x'], [half, -half, 'x'], [half, half, 'x'],
  ];

  for (let i = 0; i < count; i += 1) {
    const edge = edges[i % edges.length];
    const [a, b, axis] = edge;
    const t = (Math.random() - 0.5) * size;
    let x, y, z;
    if (axis === 'z') { x = a; y = b; z = t; }
    else if (axis === 'y') { x = a; y = t; z = b; }
    else { x = t; y = a; z = b; }
    positions[i * 3] = x;
    positions[i * 3 + 1] = y;
    positions[i * 3 + 2] = z;
  }
  return positions;
}

export function starfield(count, { spread = 8 } = {}) {
  const positions = new Float32Array(count * 3);
  for (let i = 0; i < count; i += 1) {
    const theta = Math.random() * Math.PI * 2;
    const phi = Math.acos(2 * Math.random() - 1);
    const r = spread * Math.cbrt(Math.random());
    positions[i * 3] = r * Math.sin(phi) * Math.cos(theta);
    positions[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
    positions[i * 3 + 2] = r * Math.cos(phi);
  }
  return positions;
}

export function initials(count, { text = 'MS' } = {}) {
  const canvas = document.createElement('canvas');
  canvas.width = 240;
  canvas.height = 120;
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = '#fff';
  ctx.font = '900 90px "Helvetica Neue", Arial, sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(text, canvas.width / 2, canvas.height / 2);

  const { data } = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const lit = [];
  for (let y = 0; y < canvas.height; y += 1) {
    for (let x = 0; x < canvas.width; x += 1) {
      if (data[(y * canvas.width + x) * 4 + 3] > 128) lit.push([x, y]);
    }
  }

  // Random sampling with jitter handles count > lit.length naturally:
  // pixels get reused but the jitter keeps particles from stacking exactly.
  const positions = new Float32Array(count * 3);
  const scale = 5.2 / canvas.width;
  for (let i = 0; i < count; i += 1) {
    const [px, py] = lit[Math.floor(Math.random() * lit.length)];
    positions[i * 3] = (px - canvas.width / 2 + Math.random() - 0.5) * scale;
    positions[i * 3 + 1] = (canvas.height / 2 - py + Math.random() - 0.5) * scale;
    positions[i * 3 + 2] = (Math.random() - 0.5) * 0.3;
  }
  return positions;
}
