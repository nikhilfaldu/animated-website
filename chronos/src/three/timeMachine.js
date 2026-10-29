import { THREE } from '../libs.js';

const portalVert = /* glsl */`
  varying vec2 vUv;
  void main() { vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }
`;
const portalFrag = /* glsl */`
  uniform float uTime; uniform float uPower; uniform vec3 uColor; uniform vec3 uColor2;
  varying vec2 vUv;
  void main() {
    vec2 p = vUv - 0.5; float r = length(p) * 2.0; float a = atan(p.y, p.x);
    float swirl = sin(a * 6.0 + r * 14.0 - uTime * (2.0 + uPower * 6.0)) * 0.5 + 0.5;
    float ring = smoothstep(1.0, 0.82, r) * smoothstep(0.55, 0.9, r);
    float core = smoothstep(0.7, 0.0, r);
    vec3 col = mix(uColor2, uColor, swirl) * (ring * 1.4 + core * (0.6 + uPower * 1.6));
    col += vec3(1.0) * pow(core, 4.0) * (0.4 + uPower);
    float alpha = clamp((ring + core) * smoothstep(1.0, 0.9, r), 0.0, 1.0);
    gl_FragColor = vec4(col, alpha);
  }
`;

/** Builds the CHRONOS temporal reactor. Returns the group plus handles for animation. */
export function createTimeMachine(quality) {
  const root = new THREE.Group();
  root.name = 'timeMachine';
  const parts = {}; // component id -> { group, base: Vector3, explode: Vector3, meshes: [] }

  const chrome = new THREE.MeshStandardMaterial({ color: 0xc8d4e6, metalness: 1, roughness: 0.22 });
  const darkMetal = new THREE.MeshStandardMaterial({ color: 0x1a2233, metalness: 0.9, roughness: 0.35 });
  const energy = new THREE.MeshBasicMaterial({ color: 0x3ef2ff, toneMapped: false });
  const energyViolet = new THREE.MeshBasicMaterial({ color: 0xa77bff, toneMapped: false });
  const amber = new THREE.MeshBasicMaterial({ color: 0xffb347, toneMapped: false });
  const highlight = new THREE.MeshBasicMaterial({ color: 0xffffff, wireframe: true, transparent: true, opacity: 0.35, toneMapped: false });

  const seg = quality.low ? 48 : 96;

  function part(id, group, explode) {
    group.userData.component = id;
    group.traverse((o) => { if (o.isMesh) o.userData.component = id; });
    parts[id] = { group, base: group.position.clone(), explode, meshes: [] };
    group.traverse((o) => { if (o.isMesh) parts[id].meshes.push(o); });
    root.add(group);
  }

  // --- Temporal Reactor: chrome core with energy seams + portal
  const reactor = new THREE.Group();
  const core = new THREE.Mesh(new THREE.SphereGeometry(1, seg, seg / 2), chrome);
  reactor.add(core);
  const seamGeo = new THREE.TorusGeometry(1.005, 0.018, 8, seg);
  for (let i = 0; i < 3; i++) {
    const s = new THREE.Mesh(seamGeo, energy);
    s.rotation.set(i === 0 ? Math.PI / 2 : 0, i === 1 ? Math.PI / 2 : 0, i * 0.6);
    reactor.add(s);
  }
  const glow = new THREE.Mesh(new THREE.SphereGeometry(1.25, 32, 16), new THREE.MeshBasicMaterial({ color: 0x3ef2ff, transparent: true, opacity: 0.08, blending: THREE.AdditiveBlending, depthWrite: false }));
  reactor.add(glow);
  part('reactor', reactor, new THREE.Vector3(0, 0, 0));

  // Portal (front-facing disc). Lives on root so it can scale toward the camera.
  const portalMat = new THREE.ShaderMaterial({
    vertexShader: portalVert, fragmentShader: portalFrag, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
    uniforms: { uTime: { value: 0 }, uPower: { value: 0 }, uColor: { value: new THREE.Color(0x3ef2ff) }, uColor2: { value: new THREE.Color(0xa77bff) } },
  });
  const portal = new THREE.Mesh(new THREE.PlaneGeometry(2.6, 2.6), portalMat);
  portal.position.z = 1.15;
  root.add(portal);

  // --- Chrono-Rings: 4 concentric rings with nodes
  const rings = new THREE.Group();
  const ringMeshes = [];
  [1.7, 2.1, 2.55, 3.05].forEach((r, i) => {
    const holder = new THREE.Group();
    const ring = new THREE.Mesh(new THREE.TorusGeometry(r, i === 3 ? 0.05 : 0.08, 12, seg * 2), i % 2 ? darkMetal : chrome);
    holder.add(ring);
    const channel = new THREE.Mesh(new THREE.TorusGeometry(r, 0.012, 6, seg * 2), i === 2 ? energyViolet : energy);
    channel.position.z = 0.085;
    holder.add(channel);
    const nodeGeo = new THREE.BoxGeometry(0.16, 0.16, 0.22);
    const count = 4 + i * 2;
    for (let n = 0; n < count; n++) {
      const a = (n / count) * Math.PI * 2;
      const node = new THREE.Mesh(nodeGeo, n % 2 ? darkMetal : chrome);
      node.position.set(Math.cos(a) * r, Math.sin(a) * r, 0);
      node.rotation.z = a;
      holder.add(node);
    }
    holder.rotation.set(Math.random() * Math.PI, Math.random() * Math.PI, 0);
    holder.userData.speed = (i % 2 ? -1 : 1) * (0.25 + i * 0.12);
    holder.userData.axis = new THREE.Vector3(Math.random() - 0.5, 1, Math.random() - 0.5).normalize();
    rings.add(holder);
    ringMeshes.push(holder);
  });
  part('rings', rings, new THREE.Vector3(0, 0, -2.2));

  // --- Quantum Stabilizer: twin caps above and below
  const stab = new THREE.Group();
  [1, -1].forEach((dir) => {
    const cap = new THREE.Mesh(new THREE.CylinderGeometry(0.35, 0.6, 0.35, 32), darkMetal);
    cap.position.y = dir * 1.25;
    const coil = new THREE.Mesh(new THREE.TorusGeometry(0.48, 0.04, 8, 48), energy);
    coil.rotation.x = Math.PI / 2;
    coil.position.y = dir * 1.25;
    const fin = new THREE.Mesh(new THREE.ConeGeometry(0.22, 0.6, 6), chrome);
    fin.position.y = dir * 1.68;
    fin.rotation.x = dir < 0 ? Math.PI : 0;
    stab.add(cap, coil, fin);
  });
  part('stabilizer', stab, new THREE.Vector3(0, 1.6, 0));

  // --- Navigation Core: orbiting octahedron cluster
  const nav = new THREE.Group();
  nav.position.set(2.2, 1.4, 0.6);
  const navCore = new THREE.Mesh(new THREE.OctahedronGeometry(0.28), chrome);
  const navRing = new THREE.Mesh(new THREE.TorusGeometry(0.45, 0.02, 6, 48), amber);
  navRing.rotation.x = 1.1;
  const navShell = new THREE.Mesh(new THREE.IcosahedronGeometry(0.42, 0), new THREE.MeshBasicMaterial({ color: 0xffb347, wireframe: true, transparent: true, opacity: 0.4 }));
  nav.add(navCore, navRing, navShell);
  part('nav', nav, new THREE.Vector3(1.6, 0.8, 0.6));

  // --- Reality Anchor: base spire with tether
  const anchor = new THREE.Group();
  anchor.position.y = -3.0;
  const base = new THREE.Mesh(new THREE.CylinderGeometry(0.9, 1.3, 0.3, 48), darkMetal);
  const spire = new THREE.Mesh(new THREE.ConeGeometry(0.35, 1.1, 24), chrome);
  spire.position.y = 0.6; spire.rotation.x = Math.PI;
  const tether = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, 1.4, 6), energy);
  tether.position.y = 0.9;
  const baseRing = new THREE.Mesh(new THREE.TorusGeometry(1.1, 0.025, 6, 64), energy);
  baseRing.rotation.x = Math.PI / 2; baseRing.position.y = 0.16;
  anchor.add(base, spire, tether, baseRing);
  part('anchor', anchor, new THREE.Vector3(0, -1.8, 0));

  // --- Outer housing (cage) + energy conduits (decorative, explode outward)
  const housing = new THREE.Mesh(new THREE.IcosahedronGeometry(3.6, 1), new THREE.MeshBasicMaterial({ color: 0x3e6a9a, wireframe: true, transparent: true, opacity: 0.12 }));
  root.add(housing);
  const conduits = new THREE.Group();
  const conduitGeo = new THREE.TorusGeometry(1.45, 0.03, 8, 64, Math.PI * 0.7);
  for (let i = 0; i < 4; i++) {
    const c = new THREE.Mesh(conduitGeo, i % 2 ? energyViolet : energy);
    c.rotation.set(Math.PI / 2, 0, (i / 4) * Math.PI * 2);
    c.rotation.y = i * 0.4;
    conduits.add(c);
  }
  root.add(conduits);

  const coreLight = new THREE.PointLight(0x3ef2ff, 6, 14, 1.6);
  root.add(coreLight);

  const highlightMesh = new THREE.Mesh(new THREE.SphereGeometry(1, 16, 12), highlight);
  highlightMesh.visible = false;
  root.add(highlightMesh);

  const state = { power: 0.15, explode: 0, focus: null, spin: 0 };
  const tmp = new THREE.Vector3();

  function update(dt, time, reduced) {
    const speed = (reduced ? 0.25 : 1) * (0.25 + state.power * 6);
    state.spin += dt * speed;
    ringMeshes.forEach((h, i) => {
      h.rotateOnAxis(h.userData.axis, h.userData.speed * dt * speed);
    });
    nav.rotation.y += dt * 0.8; navRing.rotation.z += dt * 2;
    conduits.rotation.z += dt * 0.2 * speed;
    housing.rotation.y -= dt * 0.03;
    core.rotation.y += dt * 0.2;
    const pulse = 0.5 + 0.5 * Math.sin(time * 2.4);
    energy.color.setRGB(0.24 + state.power * 0.6, 0.95, 1).multiplyScalar(0.8 + state.power * 1.2 + pulse * 0.2);
    glow.material.opacity = 0.06 + state.power * 0.25 + pulse * 0.03;
    glow.scale.setScalar(1 + state.power * 0.25 + pulse * 0.03);
    coreLight.intensity = 4 + state.power * 30;
    portalMat.uniforms.uTime.value = time;
    portalMat.uniforms.uPower.value = state.power;

    // exploded layout
    for (const id in parts) {
      const p = parts[id];
      tmp.copy(p.base).addScaledVector(p.explode, state.explode);
      p.group.position.lerp(tmp, 0.12);
    }
    housing.scale.setScalar(1 + state.explode * 0.35);
    housing.material.opacity = 0.12 * (1 - state.explode * 0.6);
    conduits.scale.setScalar(1 + state.explode * 0.6);

    if (state.focus && parts[state.focus]) {
      const g = parts[state.focus].group;
      highlightMesh.visible = true;
      g.getWorldPosition(tmp); root.worldToLocal(tmp);
      highlightMesh.position.lerp(tmp, 0.2);
      const s = state.focus === 'rings' ? 3.3 : state.focus === 'reactor' ? 1.4 : 0.9;
      highlightMesh.scale.lerp(new THREE.Vector3(s, s, s), 0.15);
      highlightMesh.rotation.y += dt;
    } else highlightMesh.visible = false;
  }

  function dispose() {
    root.traverse((o) => { if (o.geometry) o.geometry.dispose(); if (o.material) o.material.dispose?.(); });
  }

  return { group: root, parts, portal, state, update, dispose };
}
