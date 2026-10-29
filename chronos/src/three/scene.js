import { THREE } from '../libs.js';
import { createTimeMachine } from './timeMachine.js';
import { createEras, setActiveEra } from './eras.js';
import { createStars, createDust, createWarp, createAnomaly } from './particles.js';
import { ERAS } from '../data.js';

export const ERA_START = 0.2;                      // journey progress where era 01 begins
export const ERA_SPAN = (1 - ERA_START) / ERAS.length;
/** Journey progress (0..1) that lands in the middle of an era. */
export const eraProgress = (i) => ERA_START + ERA_SPAN * (i + 0.42);

const ease = (t) => t * t * (3 - 2 * t);
const clamp01 = (v) => Math.min(1, Math.max(0, v));

export function isWebGLAvailable() {
  try { const c = document.createElement('canvas'); return !!(window.WebGLRenderingContext && (c.getContext('webgl2') || c.getContext('webgl'))); }
  catch { return false; }
}

/**
 * The single 3D "director". DOM/scroll code writes into `state`; the render loop reads it.
 */
export function createExperience(canvas, quality, { onEraChange } = {}) {
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: !quality.low, powerPreference: 'high-performance' });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, quality.low ? 1.25 : 1.75));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.1;

  const scene = new THREE.Scene();
  const baseBg = new THREE.Color(0x02040a);
  scene.background = baseBg.clone();
  scene.fog = new THREE.Fog(0x040a18, 18, 140);
  const camera = new THREE.PerspectiveCamera(50, 1, 0.1, 400);
  camera.position.set(0, 1, 11);

  // Procedural environment map for chrome reflections (no external HDR needed)
  const pmrem = new THREE.PMREMGenerator(renderer);
  const envScene = new THREE.Scene();
  envScene.background = new THREE.Color(0x05070d);
  const panel = (color, pos, scale) => { const m = new THREE.Mesh(new THREE.BoxGeometry(1, 1, 1), new THREE.MeshBasicMaterial({ color })); m.position.set(...pos); m.scale.set(...scale); envScene.add(m); };
  panel(0x9fd8ff, [0, 6, 0], [10, 0.2, 10]); panel(0x3ef2ff, [-6, 0, 0], [0.2, 6, 4]); panel(0xa77bff, [6, 1, -2], [0.2, 4, 6]); panel(0xffb347, [0, -1, 6], [3, 1, 0.2]);
  const envTex = pmrem.fromScene(envScene, 0.04).texture;
  scene.environment = envTex;

  // Lighting
  const hemi = new THREE.HemisphereLight(0x9fd8ff, 0x05060a, 0.6);
  const key = new THREE.DirectionalLight(0xffffff, 1.6); key.position.set(5, 8, 6);
  const rim = new THREE.DirectionalLight(0xa77bff, 2.2); rim.position.set(-6, 2, -6);
  scene.add(hemi, key, rim);

  const machine = createTimeMachine(quality);
  scene.add(machine.group);
  const stars = createStars(quality.stars); scene.add(stars);
  const dust = createDust(quality.dust); scene.add(dust);
  const warp = createWarp(quality.warp); scene.add(warp.mesh);
  const anomaly = createAnomaly(quality.anomaly, renderer.getPixelRatio()); anomaly.group.visible = false; scene.add(anomaly.group);
  const eras = createEras(scene, quality);

  const state = {
    section: 'hero', journey: 0, anomaly: 0,
    machineRot: 0, machineFocus: null, jumpBoost: 0, reduced: quality.reduced,
    lookYaw: 0, lookPitch: 0,   // free-look offset inside an era (written by eraInteractions)
  };

  let activeEra = -1;
  const lookTarget = new THREE.Vector3();
  const camTarget = new THREE.Vector3();
  const lookCurrent = new THREE.Vector3();
  const baseDir = new THREE.Vector3(0, 0, -1);   // era camera direction before free-look
  const lookDir = new THREE.Vector3();
  const UP = new THREE.Vector3(0, 1, 0);
  const fogTarget = new THREE.Color();
  const tmpColor = new THREE.Color();
  const clock = new THREE.Clock();
  let width = 1, height = 1, running = true, raf = 0;
  const isMobile = () => width < 860;

  function resize() {
    width = window.innerWidth; height = window.innerHeight;
    renderer.setSize(width, height, false);
    camera.aspect = width / height;
    camera.fov = width < height ? 62 : 50;
    camera.updateProjectionMatrix();
  }
  window.addEventListener('resize', resize);
  resize();

  function warpIntensity(p) {
    let w = 0;
    for (let i = 0; i < ERAS.length; i++) {
      const b = ERA_START + ERA_SPAN * i;
      const width = i === 0 ? 0.06 : 0.03;
      w = Math.max(w, 1 - Math.abs(p - b) / width);
    }
    return clamp01(w);
  }

  function eraIndexFor(p) { return p < ERA_START ? -1 : Math.min(ERAS.length - 1, Math.floor((p - ERA_START) / ERA_SPAN)); }

  function frame() {
    if (!running) return;
    raf = requestAnimationFrame(frame);
    const dt = Math.min(clock.getDelta(), 0.05);
    const time = clock.elapsedTime;
    const s = state;
    const lerpK = 1 - Math.pow(0.001, dt);
    let warpI = 0, power = 0.15, showMachine = true, eraIdx = -1, showAnomaly = false, explode = 0, portalScale = 1;
    let starOpacity = 0.9;
    fogTarget.set(0x040a18);
    tmpColor.copy(baseBg);
    machine.group.position.set(0, 0, 0);

    if (s.section === 'journey') {
      const p = s.journey;
      eraIdx = eraIndexFor(p);
      warpI = s.reduced ? 0 : warpIntensity(p);
      if (eraIdx < 0) {
        const a = ease(clamp01(p / ERA_START));
        power = 0.15 + a * 0.85;
        portalScale = 1 + Math.pow(a, 3) * 4;
        const orbit = (1 - a) * 0.9 + time * 0.05 * (1 - a);
        camTarget.set(Math.sin(orbit) * (11 - a * 9.6), 1 - a * 0.9, Math.cos(orbit) * (11 - a * 9.6));
        lookTarget.set(0, 0, 0);
      } else {
        showMachine = false;
        const t = clamp01((p - ERA_START - eraIdx * ERA_SPAN) / ERA_SPAN);
        const era = ERAS[eraIdx];
        camTarget.set(Math.sin(t * Math.PI) * 2.5, 1.2 + Math.sin(t * Math.PI) * 1.5, 14 - t * 34);
        lookTarget.set(Math.sin(t * Math.PI) * -1.5, 2 + t * 2, camTarget.z - 12);
        // free-look: swing the gaze around the scripted camera path
        baseDir.subVectors(lookTarget, camTarget);
        lookDir.copy(baseDir).applyAxisAngle(UP, s.lookYaw);
        lookDir.y += s.lookPitch * Math.hypot(lookDir.x, lookDir.z);
        lookTarget.addVectors(camTarget, lookDir);
        fogTarget.set(era.fog); tmpColor.set(era.bg);
        starOpacity = eraIdx >= 3 ? 0.9 : 0.2;
      }
    } else if (s.section === 'machine') {
      explode = 1;
      const r = isMobile() ? 14 : 10.5;
      const a = s.machineRot + (s.reduced ? 0 : time * 0.04);
      if (s.machineFocus && machine.parts[s.machineFocus]) {
        const fp = machine.parts[s.machineFocus].group.getWorldPosition(new THREE.Vector3());
        lookTarget.copy(fp);
        camTarget.set(fp.x + Math.sin(a) * r * 0.55, fp.y + 1, fp.z + Math.cos(a) * r * 0.55);
      } else {
        lookTarget.set(isMobile() ? 0 : -1.2, 0, 0);
        camTarget.set(Math.sin(a) * r, 2.2, Math.cos(a) * r);
      }
    } else if (s.section === 'anomaly') {
      showMachine = false; showAnomaly = true;
      const a = s.anomaly;
      camTarget.set(Math.sin(a * 1.5) * 4, 6 - a * 4, 30 - ease(a) * 25);
      lookTarget.set(0, 0, 0);
      fogTarget.set(0x05030f);
      tmpColor.set(0x03020a);
      starOpacity = 0.2 + a * 0.8;
      anomaly.group.scale.setScalar(a > 0.85 ? Math.max(0.001, 1 - (a - 0.85) / 0.15) : 1);
    } else {
      // hero, destinations, control, log, finale: suspended machine, slow orbit
      const orbitR = s.section === 'finale' ? 13 : 11;
      const a = s.reduced ? 0.6 : time * 0.08;
      const offsetX = s.section === 'hero' && !isMobile() ? 2.6 : 0;
      const offsetY = s.section === 'hero' && isMobile() ? 1.4 : 0;
      machine.group.position.set(offsetX, offsetY, 0);
      camTarget.set(Math.sin(a) * orbitR, 1.2 + Math.sin(time * 0.2) * 0.4, Math.cos(a) * orbitR);
      lookTarget.set(offsetX * 0.55, offsetY * 0.6, 0);
      power = s.section === 'finale' ? 0.25 + Math.sin(time * 1.5) * 0.1 : 0.15;
    }

    power = Math.min(1, power + s.jumpBoost);
    warpI = Math.max(warpI, s.reduced ? 0 : s.jumpBoost * 0.8);

    // visibility + era switch (UI is notified only when the era changes)
    machine.group.visible = showMachine;
    dust.visible = showMachine;
    anomaly.group.visible = showAnomaly;
    if (eraIdx !== activeEra) {
      activeEra = eraIdx;
      setActiveEra(eras, eraIdx);
      const era = ERAS[eraIdx];
      if (era) { hemi.color.set(era.color); hemi.intensity = 1.1; key.color.set(era.accent2 || '#ffffff'); rim.color.set(era.color); }
      else { hemi.color.set(0x9fd8ff); hemi.intensity = 0.6; key.color.set(0xffffff); rim.color.set(0xa77bff); }
      onEraChange?.(eraIdx);
    }

    // camera (smoothed so scrubbed values never jump)
    camera.position.lerp(camTarget, s.section === 'journey' ? Math.min(1, lerpK * 2.5) : lerpK * 0.6);
    lookCurrent.lerp(lookTarget, lerpK);
    camera.lookAt(lookCurrent);
    if (warpI > 0) camera.position.x += (Math.random() - 0.5) * warpI * 0.06;

    scene.fog.color.lerp(fogTarget, lerpK);
    scene.background.lerp(tmpColor.lerp(fogTarget, 0.4), lerpK);
    camera.fov += ((width < height ? 62 : 50) + warpI * 25 - camera.fov) * lerpK;
    camera.updateProjectionMatrix();

    machine.state.power += (power - machine.state.power) * lerpK;
    machine.state.explode += (explode - machine.state.explode) * lerpK * 0.6;
    machine.state.focus = s.section === 'machine' ? s.machineFocus : null;
    machine.portal.scale.setScalar(portalScale);
    machine.portal.lookAt(camera.position);
    if (showMachine) machine.update(dt, time, s.reduced);
    dust.rotation.y += dt * 0.05;
    stars.material.opacity += (starOpacity - stars.material.opacity) * lerpK;
    stars.rotation.y += dt * 0.004;
    warp.update(dt, warpI, camera);
    if (activeEra >= 0) eras[activeEra].update(0, time, dt);
    if (showAnomaly) anomaly.update(time, s.anomaly, camera);
    if (s.jumpBoost > 0 && !s.jumpHold) s.jumpBoost = Math.max(0, s.jumpBoost - dt * 0.6);

    renderer.render(scene, camera);
  }
  frame();

  function onVisibility() {
    if (document.hidden) { running = false; cancelAnimationFrame(raf); }
    else if (!running) { running = true; clock.getDelta(); frame(); }
  }
  document.addEventListener('visibilitychange', onVisibility);

  /** Project a component's world position into viewport pixels (for DOM hotspots). */
  const proj = new THREE.Vector3();
  function projectComponent(id) {
    const p = machine.parts[id]; if (!p) return null;
    p.group.getWorldPosition(proj).project(camera);
    return { x: (proj.x * 0.5 + 0.5) * width, y: (-proj.y * 0.5 + 0.5) * height, visible: proj.z < 1 };
  }

  const raycaster = new THREE.Raycaster();
  const ndc = new THREE.Vector2();
  /** Raycast from viewport coords; returns the hit component id or null. */
  function pick(clientX, clientY) {
    ndc.set((clientX / width) * 2 - 1, -(clientY / height) * 2 + 1);
    raycaster.setFromCamera(ndc, camera);
    const hits = raycaster.intersectObjects(Object.values(machine.parts).map((p) => p.group), true);
    for (const h of hits) { let o = h.object; while (o && !o.userData.component) o = o.parent; if (o) return o.userData.component; }
    return null;
  }

  /** Landmarks of the era currently on screen (empty outside an era). */
  const activeLandmarks = () => (activeEra >= 0 ? eras[activeEra].landmarks : []);

  const anchor = new THREE.Vector3();
  function landmarkWorld(obj, out) {
    return obj.userData.anchor ? obj.localToWorld(out.copy(obj.userData.anchor)) : obj.getWorldPosition(out);
  }
  /** Project a landmark to viewport pixels; `visible` is false when behind the camera or off-screen. */
  function projectLandmark(obj) {
    landmarkWorld(obj, anchor).project(camera);
    const x = (anchor.x * 0.5 + 0.5) * width, y = (-anchor.y * 0.5 + 0.5) * height;
    return { x, y, visible: anchor.z < 1 && Math.abs(anchor.x) < 1.05 && Math.abs(anchor.y) < 1.05 };
  }
  /** Raycast the active era; returns the landmark key under the pointer or null. */
  function pickLandmark(clientX, clientY) {
    const list = activeLandmarks();
    if (!list.length) return null;
    ndc.set((clientX / width) * 2 - 1, -(clientY / height) * 2 + 1);
    raycaster.setFromCamera(ndc, camera);
    const hits = raycaster.intersectObjects(list.map((l) => l.object), true);
    for (const h of hits) { let o = h.object; while (o && !o.userData.landmark) o = o.parent; if (o) return o.userData.landmark; }
    return null;
  }
  /** Free-look angles (yaw, pitch) that turn the gaze toward a landmark from the current camera. */
  function focusAngles(obj) {
    const t = landmarkWorld(obj, new THREE.Vector3()).sub(camera.position);
    const yaw = Math.atan2(baseDir.z, baseDir.x) - Math.atan2(t.z, t.x);
    const wrapped = Math.atan2(Math.sin(yaw), Math.cos(yaw));
    const pitch = t.y / Math.hypot(t.x, t.z) - baseDir.y / Math.hypot(baseDir.x, baseDir.z);
    return { yaw: wrapped, pitch };
  }

  function dispose() {
    running = false; cancelAnimationFrame(raf);
    window.removeEventListener('resize', resize);
    document.removeEventListener('visibilitychange', onVisibility);
    scene.traverse((o) => { o.geometry?.dispose(); if (o.material) [].concat(o.material).forEach((m) => m.dispose()); });
    envTex.dispose(); pmrem.dispose(); renderer.dispose();
  }

  return { state, projectComponent, pick, dispose, eraIndexFor, activeLandmarks, projectLandmark, pickLandmark, focusAngles };
}
