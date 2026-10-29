import { THREE } from '../libs.js';

/** Distant starfield surrounding everything. */
export function createStars(count) {
  const g = new THREE.BufferGeometry();
  const p = new Float32Array(count * 3);
  for (let i = 0; i < count; i++) {
    const r = 80 + Math.random() * 120, t = Math.random() * Math.PI * 2, u = Math.acos(2 * Math.random() - 1);
    p.set([r * Math.sin(u) * Math.cos(t), r * Math.sin(u) * Math.sin(t), r * Math.cos(u)], i * 3);
  }
  g.setAttribute('position', new THREE.BufferAttribute(p, 3));
  return new THREE.Points(g, new THREE.PointsMaterial({ color: 0xcfe8ff, size: 0.35, sizeAttenuation: true, transparent: true, opacity: 0.9, depthWrite: false, fog: false }));
}

/** Dust motes orbiting the machine. */
export function createDust(count) {
  const g = new THREE.BufferGeometry();
  const p = new Float32Array(count * 3);
  for (let i = 0; i < count; i++) { const r = 3 + Math.random() * 9, a = Math.random() * Math.PI * 2; p.set([Math.cos(a) * r, (Math.random() - 0.5) * 8, Math.sin(a) * r], i * 3); }
  g.setAttribute('position', new THREE.BufferAttribute(p, 3));
  return new THREE.Points(g, new THREE.PointsMaterial({ color: 0x3ef2ff, size: 0.05, transparent: true, opacity: 0.6, depthWrite: false, blending: THREE.AdditiveBlending }));
}

/** Warp tunnel streaks: line segments that stretch with intensity. */
export function createWarp(count) {
  const g = new THREE.BufferGeometry();
  const p = new Float32Array(count * 6);
  const c = new Float32Array(count * 6);
  const base = [];
  for (let i = 0; i < count; i++) {
    const a = Math.random() * Math.PI * 2, r = 1.5 + Math.random() * 10, z = -Math.random() * 80;
    base.push({ x: Math.cos(a) * r, y: Math.sin(a) * r, z });
    const col = Math.random() > 0.5 ? [0.25, 0.95, 1] : [0.65, 0.48, 1];
    c.set([...col, 0, 0, 0], i * 6);
  }
  g.setAttribute('position', new THREE.BufferAttribute(p, 3));
  g.setAttribute('color', new THREE.BufferAttribute(c, 3));
  const lines = new THREE.LineSegments(g, new THREE.LineBasicMaterial({ vertexColors: true, transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false, fog: false, toneMapped: false }));
  lines.frustumCulled = false;
  let travel = 0;
  function update(dt, intensity, camera) {
    lines.visible = intensity > 0.01;
    if (!lines.visible) return;
    travel += dt * (20 + intensity * 120);
    const a = g.attributes.position;
    const len = 0.5 + intensity * 14;
    for (let i = 0; i < base.length; i++) {
      const b = base[i];
      const z = ((b.z + travel) % 80) - 70;
      a.setXYZ(i * 2, b.x, b.y, z);
      a.setXYZ(i * 2 + 1, b.x, b.y, z - len);
    }
    a.needsUpdate = true;
    lines.material.opacity = Math.min(1, intensity * 1.4);
    lines.position.copy(camera.position);
    lines.quaternion.copy(camera.quaternion);
  }
  return { mesh: lines, update };
}

const anomalyVert = /* glsl */`
  uniform float uTime; uniform float uProg; uniform float uSize;
  attribute float aRadius; attribute float aAngle; attribute float aSpeed; attribute float aHeight;
  varying float vGlow;
  void main() {
    float pull = uProg * 0.85;
    float r = aRadius * (1.0 - pull) + 0.6;
    float ang = aAngle + uTime * aSpeed * (0.4 + uProg * 3.0) / max(r * 0.25, 0.3);
    vec3 pos = vec3(cos(ang) * r, aHeight * (1.0 - pull) * (r / (aRadius + 0.6)), sin(ang) * r);
    vGlow = 1.0 - clamp(r / 16.0, 0.0, 1.0);
    vec4 mv = modelViewMatrix * vec4(pos, 1.0);
    gl_PointSize = uSize * (1.0 + vGlow * 2.0) / -mv.z;
    gl_Position = projectionMatrix * mv;
  }
`;
const anomalyFrag = /* glsl */`
  uniform vec3 uA; uniform vec3 uB; varying float vGlow;
  void main() {
    float d = length(gl_PointCoord - 0.5); if (d > 0.5) discard;
    vec3 col = mix(uA, uB, vGlow);
    gl_FragColor = vec4(col, (1.0 - d * 2.0) * (0.35 + vGlow));
  }
`;

/** Temporal anomaly: spiralling particle disc, warped rings, event horizon. */
export function createAnomaly(count, pixelRatio) {
  const group = new THREE.Group();
  const g = new THREE.BufferGeometry();
  const pos = new Float32Array(count * 3), rad = new Float32Array(count), ang = new Float32Array(count), spd = new Float32Array(count), h = new Float32Array(count);
  for (let i = 0; i < count; i++) { rad[i] = 1 + Math.pow(Math.random(), 0.7) * 16; ang[i] = Math.random() * Math.PI * 2; spd[i] = 0.5 + Math.random(); h[i] = (Math.random() - 0.5) * 1.6 * (rad[i] / 6); }
  g.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  g.setAttribute('aRadius', new THREE.BufferAttribute(rad, 1));
  g.setAttribute('aAngle', new THREE.BufferAttribute(ang, 1));
  g.setAttribute('aSpeed', new THREE.BufferAttribute(spd, 1));
  g.setAttribute('aHeight', new THREE.BufferAttribute(h, 1));
  const mat = new THREE.ShaderMaterial({
    vertexShader: anomalyVert, fragmentShader: anomalyFrag, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
    uniforms: { uTime: { value: 0 }, uProg: { value: 0 }, uSize: { value: 60 * pixelRatio }, uA: { value: new THREE.Color(0x5b3cff) }, uB: { value: new THREE.Color(0x9ff6ff) } },
  });
  const disc = new THREE.Points(g, mat);
  disc.frustumCulled = false;
  disc.rotation.x = 0.35;
  group.add(disc);

  const horizon = new THREE.Mesh(new THREE.SphereGeometry(1, 48, 32), new THREE.MeshBasicMaterial({ color: 0x000000 }));
  group.add(horizon);
  const halo = new THREE.Mesh(new THREE.TorusGeometry(1.25, 0.06, 12, 128), new THREE.MeshBasicMaterial({ color: 0xc9b6ff, toneMapped: false, transparent: true, blending: THREE.AdditiveBlending }));
  group.add(halo);
  const warped = [];
  for (let i = 0; i < 4; i++) {
    const r = new THREE.Mesh(new THREE.TorusGeometry(4 + i * 2.5, 0.02, 6, 128), new THREE.MeshBasicMaterial({ color: i % 2 ? 0x3ef2ff : 0xa77bff, transparent: true, opacity: 0.35, blending: THREE.AdditiveBlending }));
    r.rotation.x = Math.PI / 2 + 0.35; group.add(r); warped.push(r);
  }

  function update(time, prog, camera) {
    mat.uniforms.uTime.value = time;
    mat.uniforms.uProg.value = prog;
    const hz = THREE.MathUtils.smoothstep(prog, 0.35, 0.8);
    horizon.scale.setScalar(0.3 + hz * 1.4);
    halo.scale.setScalar(0.3 + hz * 1.5);
    halo.material.opacity = hz;
    halo.lookAt(camera.position);
    warped.forEach((r, i) => { const s = 1 - prog * 0.75; r.scale.set(s * (1 + Math.sin(time * 1.3 + i) * 0.08), s * (1 + Math.cos(time + i) * 0.12), s); r.rotation.z = time * 0.1 * (i + 1); });
  }
  return { group, update };
}
