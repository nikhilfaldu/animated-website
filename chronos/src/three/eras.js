import { THREE } from '../libs.js';
import { ERAS, LANDMARKS } from '../data.js';

const rand = (a, b) => a + Math.random() * (b - a);
const dummy = new THREE.Object3D();

function instanced(geo, mat, count, place) {
  const m = new THREE.InstancedMesh(geo, mat, count);
  for (let i = 0; i < count; i++) { place(dummy, i); dummy.updateMatrix(); m.setMatrixAt(i, dummy.matrix); }
  m.instanceMatrix.needsUpdate = true;
  return m;
}

function floatingDust(count, color, spread, size) {
  const g = new THREE.BufferGeometry();
  const p = new Float32Array(count * 3);
  for (let i = 0; i < count; i++) { p[i * 3] = rand(-spread, spread); p[i * 3 + 1] = rand(0, spread * 0.5); p[i * 3 + 2] = rand(-40, 14); }
  g.setAttribute('position', new THREE.BufferAttribute(p, 3));
  return new THREE.Points(g, new THREE.PointsMaterial({ color, size, transparent: true, opacity: 0.7, depthWrite: false, blending: THREE.AdditiveBlending }));
}

function ground(color, size = 200) {
  const m = new THREE.Mesh(new THREE.PlaneGeometry(size, size, 1, 1), new THREE.MeshStandardMaterial({ color, roughness: 0.95, metalness: 0 }));
  m.rotation.x = -Math.PI / 2; m.position.y = -2;
  return m;
}

/* ERA 01 — Prehistoric: towering trees, ferns, mist, silhouetted giant */
function prehistoric(q) {
  const g = new THREE.Group();
  g.add(ground(0x0b1f14));
  const n = q.low ? 60 : 140;
  const trunkMat = new THREE.MeshStandardMaterial({ color: 0x1d1a12, roughness: 1 });
  const leafMat = new THREE.MeshStandardMaterial({ color: 0x0f3b24, roughness: 0.9, emissive: 0x05140b });
  const side = (i) => (i % 2 ? 1 : -1) * rand(4, 26);
  const pos = Array.from({ length: n }, (_, i) => [side(i), rand(-45, 12), rand(0.7, 1.8)]);
  g.add(instanced(new THREE.CylinderGeometry(0.25, 0.6, 16, 7), trunkMat, n, (d, i) => { d.position.set(pos[i][0], 6 * pos[i][2], pos[i][1]); d.scale.setScalar(pos[i][2]); d.rotation.set(0, 0, 0); }));
  g.add(instanced(new THREE.ConeGeometry(3.4, 9, 7), leafMat, n, (d, i) => { d.position.set(pos[i][0], 15 * pos[i][2], pos[i][1]); d.scale.setScalar(pos[i][2]); }));
  // ferns
  g.add(instanced(new THREE.ConeGeometry(0.8, 1.6, 5), new THREE.MeshStandardMaterial({ color: 0x1f6b3d, emissive: 0x0a2414 }), q.low ? 80 : 200, (d) => { d.position.set(rand(-20, 20), -1.4, rand(-40, 12)); d.rotation.set(rand(-.3, .3), rand(0, 6), rand(-.3, .3)); d.scale.setScalar(rand(.5, 1.4)); }));
  // a giant long-necked silhouette in the mist
  const beast = new THREE.Group();
  const bm = new THREE.MeshStandardMaterial({ color: 0x08130d, roughness: 1 });
  const body = new THREE.Mesh(new THREE.SphereGeometry(3, 16, 12), bm); body.scale.set(1.8, 1, 1);
  const neck = new THREE.Mesh(new THREE.CylinderGeometry(0.5, 1, 9, 8), bm); neck.position.set(4, 4.5, 0); neck.rotation.z = -0.6;
  const head = new THREE.Mesh(new THREE.SphereGeometry(0.8, 10, 8), bm); head.position.set(6.6, 8.4, 0);
  [-3, 3].forEach((x) => [-1.5, 1.5].forEach((z) => { const l = new THREE.Mesh(new THREE.CylinderGeometry(.5, .6, 4, 6), bm); l.position.set(x, -2.4, z); beast.add(l); }));
  beast.add(body, neck, head);
  beast.position.set(-6, 2.5, -34); beast.rotation.y = 0.4;
  g.add(beast);
  g.add(floatingDust(q.low ? 300 : 800, 0x9dffc4, 30, 0.08));
  const sun = new THREE.Mesh(new THREE.SphereGeometry(6, 24, 16), new THREE.MeshBasicMaterial({ color: 0xd4b45a, fog: false }));
  sun.position.set(10, 14, -90); g.add(sun);
  return { group: g, landmarks: { beast, sun }, update(t, time) { beast.position.x = -6 + Math.sin(time * 0.2) * 1.5; } };
}

/* ERA 02 — Ancient: pyramids, sun, dust */
function ancient(q) {
  const g = new THREE.Group();
  g.add(ground(0x8a6436));
  const stone = new THREE.MeshStandardMaterial({ color: 0xc9a46a, roughness: 0.85, flatShading: true });
  const pyramids = [[-14, -40, 14], [8, -55, 18], [26, -35, 10], [-30, -60, 9]].map(([x, z, s]) => {
    const p = new THREE.Mesh(new THREE.ConeGeometry(s, s * 0.95, 4, 1), stone);
    p.position.set(x, s * 0.47 - 2, z); p.rotation.y = Math.PI / 4; g.add(p);
    return p;
  });
  // obelisks + colonnade lining the path
  const colMat = new THREE.MeshStandardMaterial({ color: 0xb48a52, roughness: 0.8 });
  g.add(instanced(new THREE.CylinderGeometry(0.45, 0.5, 6, 10), colMat, 16, (d, i) => { d.position.set(i % 2 ? 4.5 : -4.5, 1, 8 - Math.floor(i / 2) * 5); d.rotation.set(0, 0, 0); d.scale.setScalar(1); }));
  const ob = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.7, 12, 4), colMat); ob.position.set(0, 4, -22); g.add(ob);
  const sun = new THREE.Mesh(new THREE.SphereGeometry(10, 32, 16), new THREE.MeshBasicMaterial({ color: 0xffd28a, fog: false }));
  sun.position.set(-4, 8, -120); g.add(sun);
  const halo = new THREE.Mesh(new THREE.SphereGeometry(16, 32, 16), new THREE.MeshBasicMaterial({ color: 0xffb347, transparent: true, opacity: 0.15, fog: false, depthWrite: false }));
  halo.position.copy(sun.position); g.add(halo);
  // dunes
  g.add(instanced(new THREE.SphereGeometry(1, 12, 8), new THREE.MeshStandardMaterial({ color: 0x9a7040, roughness: 1 }), 30, (d) => { d.position.set(rand(-60, 60), -2.5, rand(-90, -20)); d.scale.set(rand(6, 14), rand(1, 3), rand(4, 9)); }));
  const dust = floatingDust(q.low ? 400 : 1000, 0xffc98a, 30, 0.07); g.add(dust);
  return { group: g, landmarks: { pyramid: pyramids[1], obelisk: ob }, update(t, time) { dust.position.x = (time * 0.8) % 10; halo.scale.setScalar(1 + Math.sin(time) * 0.04); } };
}

/* ERA 03 — Industrial: giant gears, chimneys, steam, tungsten light */
function gearGeo(r, teeth, depth) {
  const s = new THREE.Shape();
  for (let i = 0; i < teeth * 2; i++) {
    const a = (i / (teeth * 2)) * Math.PI * 2; const rr = i % 2 ? r : r * 1.14;
    const a2 = ((i + 1) / (teeth * 2)) * Math.PI * 2;
    if (i === 0) s.moveTo(Math.cos(a) * rr, Math.sin(a) * rr); else s.lineTo(Math.cos(a) * rr, Math.sin(a) * rr);
    s.lineTo(Math.cos(a2) * rr, Math.sin(a2) * rr);
  }
  const hole = new THREE.Path(); hole.absarc(0, 0, r * 0.35, 0, Math.PI * 2, true); s.holes.push(hole);
  return new THREE.ExtrudeGeometry(s, { depth, bevelEnabled: false, curveSegments: 6 });
}
function industrial(q) {
  const g = new THREE.Group();
  g.add(ground(0x1a0f0a));
  const copper = new THREE.MeshStandardMaterial({ color: 0xb86b3c, metalness: 0.9, roughness: 0.35 });
  const iron = new THREE.MeshStandardMaterial({ color: 0x2a2220, metalness: 0.7, roughness: 0.6 });
  const gears = [];
  [[-9, 6, -16, 6, 24], [9, 9, -24, 8, 30], [-3, 14, -38, 11, 40], [14, 2, -8, 3.5, 14], [-14, 3, -4, 3, 12]].forEach(([x, y, z, r, t], i) => {
    const m = new THREE.Mesh(gearGeo(r, t, 0.8), i % 2 ? copper : iron);
    m.position.set(x, y, z); m.userData.speed = (i % 2 ? -1 : 1) * (0.6 / r); g.add(m); gears.push(m);
  });
  // brick halls + chimneys
  g.add(instanced(new THREE.BoxGeometry(1, 1, 1), new THREE.MeshStandardMaterial({ color: 0x3a1d14, roughness: 0.9 }), 24, (d, i) => { const h = rand(4, 12); d.position.set((i % 2 ? 1 : -1) * rand(7, 22), h / 2 - 2, rand(-50, 10)); d.scale.set(rand(3, 6), h, rand(3, 7)); d.rotation.set(0, 0, 0); }));
  const chimneys = [];
  for (let i = 0; i < 6; i++) { const c = new THREE.Mesh(new THREE.CylinderGeometry(0.7, 1, 18, 10), iron); c.position.set((i % 2 ? 1 : -1) * rand(10, 20), 7, rand(-55, -10)); g.add(c); chimneys.push(c); }
  // steam
  const steamN = q.low ? 200 : 500; const sg = new THREE.BufferGeometry(); const sp = new Float32Array(steamN * 3);
  for (let i = 0; i < steamN; i++) { const c = chimneys[i % chimneys.length].position; sp[i * 3] = c.x + rand(-1, 1); sp[i * 3 + 1] = rand(16, 30); sp[i * 3 + 2] = c.z + rand(-1, 1); }
  sg.setAttribute('position', new THREE.BufferAttribute(sp, 3));
  const steam = new THREE.Points(sg, new THREE.PointsMaterial({ color: 0xd8b8a0, size: 0.9, transparent: true, opacity: 0.25, depthWrite: false }));
  g.add(steam);
  const lamps = [];
  for (let i = 0; i < 4; i++) { const l = new THREE.PointLight(0xff9a4a, 30, 22, 1.5); l.position.set(i % 2 ? 4 : -4, 3, 4 - i * 10); g.add(l); lamps.push(l); const b = new THREE.Mesh(new THREE.SphereGeometry(0.2, 8, 6), new THREE.MeshBasicMaterial({ color: 0xffc070 })); b.position.copy(l.position); g.add(b); }
  return { group: g, landmarks: { gear: gears[2], chimney: chimneys[0] }, update(t, time, dt) {
    gears.forEach((m) => (m.rotation.z += m.userData.speed * dt * 2));
    const a = steam.geometry.attributes.position;
    for (let i = 0; i < steamN; i++) { let y = a.getY(i) + dt * 1.5; if (y > 34) y = 16; a.setY(i, y); a.setX(i, a.getX(i) + dt * 0.3); }
    a.needsUpdate = true;
    lamps.forEach((l, i) => (l.intensity = 26 + Math.sin(time * 12 + i * 3) * 3));
  } };
}

/* ERA 04 — Present: glass towers, light trails */
function present(q) {
  const g = new THREE.Group();
  g.add(new THREE.Mesh(new THREE.PlaneGeometry(200, 200), new THREE.MeshStandardMaterial({ color: 0x050a14, metalness: 0.8, roughness: 0.25 })).rotateX(-Math.PI / 2).translateZ(-2));
  const glass = new THREE.MeshStandardMaterial({ color: 0x1a2c48, metalness: 0.95, roughness: 0.12, emissive: 0x08182e });
  const n = q.low ? 70 : 160;
  g.add(instanced(new THREE.BoxGeometry(1, 1, 1), glass, n, (d, i) => { const h = rand(8, 46); const x = (i % 2 ? 1 : -1) * rand(5, 40); d.position.set(x, h / 2 - 2, rand(-80, 10)); d.scale.set(rand(2.5, 6), h, rand(2.5, 6)); d.rotation.set(0, 0, 0); }));
  // window lights
  g.add(instanced(new THREE.PlaneGeometry(0.3, 0.12), new THREE.MeshBasicMaterial({ color: 0xbfe4ff }), q.low ? 300 : 900, (d) => { d.position.set((Math.random() > .5 ? 1 : -1) * rand(4.6, 9), rand(0, 26), rand(-80, 10)); d.rotation.set(0, Math.PI / 2, 0); }));
  // light trails
  const trailN = q.low ? 40 : 90; const tg = new THREE.BufferGeometry(); const tp = new Float32Array(trailN * 6); const tc = new Float32Array(trailN * 6);
  const lanes = [];
  for (let i = 0; i < trailN; i++) {
    const x = rand(-3, 3), y = -1.7 + (i % 3) * 0.02, z = rand(-90, 15), len = rand(2, 6), red = i % 2;
    lanes.push({ z, speed: (red ? 1 : -1) * rand(14, 26), len });
    tp.set([x, y, z, x, y, z - len], i * 6);
    const c = red ? [1, 0.25, 0.3] : [0.75, 0.9, 1]; tc.set([...c, ...c.map((v) => v * 0.1)], i * 6);
  }
  tg.setAttribute('position', new THREE.BufferAttribute(tp, 3)); tg.setAttribute('color', new THREE.BufferAttribute(tc, 3));
  const trails = new THREE.LineSegments(tg, new THREE.LineBasicMaterial({ vertexColors: true, transparent: true, blending: THREE.AdditiveBlending, toneMapped: false }));
  trails.userData.anchor = new THREE.Vector3(0, -1.6, -34);
  g.add(trails);
  // landmark spire with a blinking crown beacon
  const spire = new THREE.Group();
  const shaft = new THREE.Mesh(new THREE.CylinderGeometry(1.2, 3.2, 60, 6), glass); shaft.position.y = 28;
  const mast = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.15, 10, 6), glass); mast.position.y = 63;
  const beacon = new THREE.Mesh(new THREE.SphereGeometry(0.5, 12, 8), new THREE.MeshBasicMaterial({ color: 0xff4060, toneMapped: false }));
  beacon.position.y = 68.5;
  spire.add(shaft, mast, beacon);
  spire.position.set(-16, 0, -58); spire.userData.anchor = new THREE.Vector3(0, 40, 0);
  g.add(spire);
  g.add(floatingDust(q.low ? 200 : 500, 0x7cc7ff, 30, 0.05));
  return { group: g, landmarks: { spire, trails }, update(t, time, dt) {
    beacon.visible = Math.sin(time * 3) > -0.3;
    const a = trails.geometry.attributes.position;
    lanes.forEach((l, i) => { l.z += l.speed * dt; if (l.z > 15) l.z = -90; if (l.z < -90) l.z = 15; a.setZ(i * 2, l.z); a.setZ(i * 2 + 1, l.z - l.len * Math.sign(l.speed)); });
    a.needsUpdate = true;
  } };
}

/* ERA 05 — Distant future: floating megastructures, planets, cosmic horizon */
function future(q) {
  const g = new THREE.Group();
  const neon = new THREE.MeshBasicMaterial({ color: 0x3ef2ff, toneMapped: false });
  const struct = new THREE.MeshStandardMaterial({ color: 0x2a2450, metalness: 0.9, roughness: 0.2, emissive: 0x120a30 });
  const planet = new THREE.Mesh(new THREE.SphereGeometry(30, 48, 32), new THREE.MeshStandardMaterial({ color: 0x3a1f7a, emissive: 0x1a0b40, roughness: 0.7 }));
  planet.position.set(30, 10, -140); g.add(planet);
  const ringP = new THREE.Mesh(new THREE.RingGeometry(38, 52, 96), new THREE.MeshBasicMaterial({ color: 0xa77bff, side: THREE.DoubleSide, transparent: true, opacity: 0.35, fog: false }));
  ringP.position.copy(planet.position); ringP.rotation.set(1.2, 0.3, 0); g.add(ringP);
  const moon = new THREE.Mesh(new THREE.SphereGeometry(5, 32, 16), new THREE.MeshBasicMaterial({ color: 0x9ff6ff, fog: false })); moon.position.set(-40, 26, -120); g.add(moon);
  const floaters = [];
  for (let i = 0; i < 9; i++) {
    const m = new THREE.Group();
    const r = rand(3, 8);
    const ring = new THREE.Mesh(new THREE.TorusGeometry(r, 0.25, 8, 64), struct);
    const band = new THREE.Mesh(new THREE.TorusGeometry(r, 0.05, 6, 64), i % 2 ? neon : new THREE.MeshBasicMaterial({ color: 0xa77bff }));
    const body = new THREE.Mesh(i % 2 ? new THREE.OctahedronGeometry(r * 0.35) : new THREE.CylinderGeometry(r * 0.15, r * 0.3, r * 1.4, 6), struct);
    m.add(ring, band, body);
    m.position.set((i % 2 ? 1 : -1) * rand(8, 28), rand(2, 20), rand(-80, -5));
    m.rotation.set(rand(0, 3), rand(0, 3), 0);
    m.userData.phase = rand(0, 6);
    g.add(m); floaters.push(m);
  }
  // grid horizon
  const grid = new THREE.GridHelper(300, 120, 0x3ef2ff, 0x2a1a6a); grid.position.y = -4; grid.material.transparent = true; grid.material.opacity = 0.35; g.add(grid);
  g.add(floatingDust(q.low ? 400 : 1000, 0xc7b0ff, 40, 0.09));
  floaters[0].position.set(-12, 9, -30);
  return { group: g, landmarks: { planet, floater: floaters[0], moon }, update(t, time, dt) {
    floaters.forEach((m) => { m.position.y += Math.sin(time * 0.6 + m.userData.phase) * dt * 0.5; m.rotation.y += dt * 0.15; m.rotation.x += dt * 0.05; });
    planet.rotation.y += dt * 0.02;
  } };
}

const BUILDERS = [prehistoric, ancient, industrial, present, future];

/** Creates all era environments, hidden by default. */
export function createEras(scene, quality) {
  const list = BUILDERS.map((build, i) => {
    const env = build(quality);
    env.group.visible = false;
    env.data = ERAS[i];
    // pair each tagged mesh with its copy; picking walks up to the object carrying userData.landmark
    env.landmarks = (LANDMARKS[ERAS[i].id] || []).filter((l) => env.landmarks?.[l.key]).map((l) => {
      const object = env.landmarks[l.key];
      object.userData.landmark = l.key;
      return { ...l, object };
    });
    scene.add(env.group);
    return env;
  });
  return list;
}

export function setActiveEra(list, index) {
  list.forEach((e, i) => (e.group.visible = i === index));
}
