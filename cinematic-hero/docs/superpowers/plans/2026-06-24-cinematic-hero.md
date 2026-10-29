# Cinematic Particle Hero Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a single-page, dark, scroll-driven Three.js particle hero (ring → cube outline → starfield morph) followed by a content section, per `docs/superpowers/specs/2026-06-24-cinematic-hero-design.md`.

**Architecture:** Vite + vanilla JS. One reused `BufferGeometry`/`ShaderMaterial` particle system with three baked position attributes, morphed via a `uProgress` uniform driven by a single GSAP `ScrollTrigger.onUpdate` callback. Real bloom via `EffectComposer` + `UnrealBloomPass`, tier-gated by device.

**Tech Stack:** Vite, Three.js (`^0.169.0`), GSAP (`^3.12.5`) + ScrollTrigger. No test framework — manual + throwaway-script verification only (per spec's explicit decision).

## Global Constraints

- No framework — vanilla JS + Vite (spec: Stack).
- No automated test suite committed to the repo; verification is manual (browser) or via throwaway Node scripts deleted before commit (spec: Testing approach).
- Branding text is exactly `MICHAEL STYLIANOU` (heading) and `STYLI` (navbar logo) — spec: Content decisions.
- Content-section nav list is exactly: `WEBSITES`, `INSTALLATIONS`, `VR`, `XR`, `GAMES` — spec: Content decisions.
- Particle/glow color is ice-blue (`0xbfe6ff`) on a near-black background (`#05060a`) — spec: Content decisions.
- Device tiers (spec: Performance & responsive strategy):
  | Tier | Trigger | particleCount | bloom |
  |---|---|---|---|
  | low | width < 768 or cores < 4 | 3000 | disabled |
  | mid | cores < 8 | 8000 | strength 0.6, radius 0.4 |
  | high | otherwise | 18000 | strength 1.0, radius 0.5 |
- Resize handling debounced at 150ms (spec: Performance & responsive strategy).
- Hero scroll pin spans 250% of viewport height; `uProgress = scrollProgress * 2` (spec: Scroll → progress mapping).
- Single geometry/material for the whole particle experience — no per-scene dispose calls (spec: Particle system & morph technique).

---

### Task 1: Project scaffold & dependencies

**Files:**
- Create: `package.json`
- Create: `vite.config.js`
- Create: `index.html`
- Create: `src/styles/main.css`
- Create: `.gitignore`

**Interfaces:**
- Produces: a working `npm run dev` Vite server serving `index.html` → `src/main.js` (created in Task 7), with `#hero` containing `canvas#scene`.

- [ ] **Step 1: Create `package.json`**

```json
{
  "name": "cinematic-hero",
  "version": "1.0.0",
  "private": true,
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "preview": "vite preview"
  },
  "dependencies": {
    "gsap": "^3.12.5",
    "three": "^0.169.0"
  },
  "devDependencies": {
    "vite": "^5.4.10"
  }
}
```

- [ ] **Step 2: Create `vite.config.js`**

```js
import { defineConfig } from 'vite';

export default defineConfig({});
```

- [ ] **Step 3: Create `.gitignore`**

```
node_modules
dist
```

- [ ] **Step 4: Create `index.html`**

```html
<!doctype html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Michael Stylianou</title>
</head>
<body>
  <section id="hero">
    <canvas id="scene"></canvas>
  </section>
  <script type="module" src="/src/main.js"></script>
</body>
</html>
```

- [ ] **Step 5: Create `src/styles/main.css`**

```css
* { margin: 0; padding: 0; box-sizing: border-box; }

html, body {
  background: #05060a;
  color: #e8f1ff;
  font-family: 'Helvetica Neue', Arial, sans-serif;
}

#hero { position: relative; height: 100vh; overflow: hidden; }

#scene {
  position: fixed;
  top: 0; left: 0;
  width: 100vw; height: 100vh;
  display: block;
}

.navbar {
  position: fixed;
  top: 0; left: 0; width: 100%;
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 24px 40px;
  z-index: 10;
  font-size: 13px;
  letter-spacing: 0.15em;
  text-transform: uppercase;
}

.navbar__links a {
  color: #e8f1ff;
  text-decoration: none;
  margin-left: 32px;
}

.stats-hud {
  position: fixed;
  bottom: 24px; right: 24px;
  z-index: 10;
  display: flex;
  flex-direction: column;
  gap: 4px;
  font-family: 'SF Mono', 'Consolas', monospace;
  font-size: 11px;
  color: #6f93b8;
  text-align: right;
}

.content-section {
  position: relative;
  min-height: 100vh;
  z-index: 5;
  display: flex;
  flex-direction: column;
  justify-content: center;
  padding: 0 40px;
  background: #05060a;
}

.content-section__heading {
  font-size: clamp(40px, 8vw, 110px);
  font-weight: 700;
  letter-spacing: -0.02em;
}

.content-section__list {
  list-style: none;
  margin-top: 32px;
  font-size: 18px;
  letter-spacing: 0.1em;
}

.content-section__list li {
  padding: 12px 0;
  border-top: 1px solid rgba(232, 241, 255, 0.15);
}
```

- [ ] **Step 6: Install dependencies**

Run: `npm install`
Expected: `node_modules` created, no errors.

- [ ] **Step 7: Manual verification**

Run: `npm run dev`, open the printed local URL in a browser.
Expected: blank near-black page loads, no console errors (404 for `src/main.js` is expected until Task 7 — confirm it's a 404, not a syntax/parse error).

- [ ] **Step 8: Commit**

```bash
git add package.json vite.config.js index.html src/styles/main.css .gitignore
git commit -m "Scaffold Vite project for cinematic hero"
```

---

### Task 2: Shape generators (`shapes.js`)

**Files:**
- Create: `src/scene/shapes.js`

**Interfaces:**
- Produces: `ring(count, opts)`, `cubeOutline(count, opts)`, `starfield(count, opts)` — each returns a `Float32Array` of length `count * 3`. Consumed by `ParticleField` (Task 5).

- [ ] **Step 1: Create `src/scene/shapes.js`**

```js
// Each function returns a Float32Array of length count*3 (x,y,z per particle).
// All three shapes must be called with the SAME count so the vertex shader
// can morph index-for-index between them (see particle.vert.glsl).

export function ring(count, { radius = 2.4, tubeRadius = 0.5 } = {}) {
  const positions = new Float32Array(count * 3);
  for (let i = 0; i < count; i += 1) {
    const angle = (i / count) * Math.PI * 2;
    const tubeAngle = Math.random() * Math.PI * 2;
    const tubeOffset = Math.random() * tubeRadius;
    const x = Math.cos(angle) * radius + Math.cos(tubeAngle) * tubeOffset;
    const y = Math.sin(tubeAngle) * tubeOffset;
    const z = Math.sin(angle) * radius;
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
```

- [ ] **Step 2: Write throwaway verification script**

Create `/tmp/verify-shapes.mjs`:

```js
import { ring, cubeOutline, starfield } from '/home/michael/cinematic-hero/src/scene/shapes.js';

function assert(cond, msg) {
  if (!cond) throw new Error(`FAIL: ${msg}`);
  console.log(`OK: ${msg}`);
}

const COUNT = 500;

const r = ring(COUNT, { radius: 2.4, tubeRadius: 0.5 });
assert(r.length === COUNT * 3, 'ring length === count*3');
let maxDistFromY = 0;
for (let i = 0; i < COUNT; i += 1) {
  const x = r[i * 3], z = r[i * 3 + 2];
  maxDistFromY = Math.max(maxDistFromY, Math.hypot(x, z));
}
assert(maxDistFromY <= 2.4 + 0.5 + 0.01, 'ring points stay within radius+tubeRadius');

const c = cubeOutline(COUNT, { size: 3 });
assert(c.length === COUNT * 3, 'cubeOutline length === count*3');
for (let i = 0; i < COUNT; i += 1) {
  const x = c[i * 3], y = c[i * 3 + 1], z = c[i * 3 + 2];
  assert(Math.abs(x) <= 1.501 && Math.abs(y) <= 1.501 && Math.abs(z) <= 1.501, `cube point ${i} within bounds`);
}

const s = starfield(COUNT, { spread: 8 });
assert(s.length === COUNT * 3, 'starfield length === count*3');
for (let i = 0; i < COUNT; i += 1) {
  const x = s[i * 3], y = s[i * 3 + 1], z = s[i * 3 + 2];
  assert(Math.hypot(x, y, z) <= 8.01, `starfield point ${i} within spread radius`);
}

console.log('All shape checks passed.');
```

- [ ] **Step 3: Run verification script**

Run: `node /tmp/verify-shapes.mjs`
Expected: every line prints `OK: ...`, ends with `All shape checks passed.`, exit code 0.

- [ ] **Step 4: Delete the throwaway script**

Run: `rm /tmp/verify-shapes.mjs`

- [ ] **Step 5: Commit**

```bash
git add src/scene/shapes.js
git commit -m "Add ring/cubeOutline/starfield position generators"
```

---

### Task 3: Device tier selection (`deviceTier.js`)

**Files:**
- Create: `src/scene/deviceTier.js`

**Interfaces:**
- Produces: `getDeviceTier({ width, cores })` → `{ name, particleCount, bloom: { enabled, strength, radius } }`. Consumed by `main.js` (Task 7).

- [ ] **Step 1: Create `src/scene/deviceTier.js`**

```js
// Pure function: pass width/cores explicitly so this is testable outside a
// browser. main.js calls it with window.innerWidth / navigator.hardwareConcurrency.
export function getDeviceTier({ width, cores }) {
  if (width < 768 || cores < 4) {
    return { name: 'low', particleCount: 3000, bloom: { enabled: false, strength: 0, radius: 0 } };
  }
  if (cores < 8) {
    return { name: 'mid', particleCount: 8000, bloom: { enabled: true, strength: 0.6, radius: 0.4 } };
  }
  return { name: 'high', particleCount: 18000, bloom: { enabled: true, strength: 1.0, radius: 0.5 } };
}
```

- [ ] **Step 2: Write throwaway verification script**

Create `/tmp/verify-device-tier.mjs`:

```js
import { getDeviceTier } from '/home/michael/cinematic-hero/src/scene/deviceTier.js';

function assert(cond, msg) {
  if (!cond) throw new Error(`FAIL: ${msg}`);
  console.log(`OK: ${msg}`);
}

assert(getDeviceTier({ width: 400, cores: 8 }).name === 'low', 'narrow width forces low tier');
assert(getDeviceTier({ width: 1200, cores: 2 }).name === 'low', 'few cores forces low tier');
assert(getDeviceTier({ width: 1200, cores: 6 }).name === 'mid', 'mid cores -> mid tier');
assert(getDeviceTier({ width: 1200, cores: 16 }).name === 'high', 'many cores -> high tier');
assert(getDeviceTier({ width: 1200, cores: 16 }).particleCount === 18000, 'high tier particle count is 18000');
assert(getDeviceTier({ width: 400, cores: 8 }).bloom.enabled === false, 'low tier disables bloom');

console.log('All device tier checks passed.');
```

- [ ] **Step 3: Run verification script**

Run: `node /tmp/verify-device-tier.mjs`
Expected: all `OK:` lines print, ends with `All device tier checks passed.`

- [ ] **Step 4: Delete the throwaway script**

Run: `rm /tmp/verify-device-tier.mjs`

- [ ] **Step 5: Commit**

```bash
git add src/scene/deviceTier.js
git commit -m "Add device tier selection for particle count and bloom quality"
```

---

### Task 4: Resize debounce utility (`debounce.js`)

**Files:**
- Create: `src/scene/debounce.js`

**Interfaces:**
- Produces: `debounce(fn, waitMs)` → debounced function. Consumed by `renderer.js` (Task 6).

- [ ] **Step 1: Create `src/scene/debounce.js`**

```js
export function debounce(fn, waitMs) {
  let timeoutId;
  return (...args) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => fn(...args), waitMs);
  };
}
```

- [ ] **Step 2: Write throwaway verification script**

Create `/tmp/verify-debounce.mjs`:

```js
import { debounce } from '/home/michael/cinematic-hero/src/scene/debounce.js';

let calls = 0;
const debounced = debounce(() => { calls += 1; }, 30);

debounced();
debounced();
debounced();

setTimeout(() => {
  if (calls !== 1) throw new Error(`FAIL: expected 1 call, got ${calls}`);
  console.log('OK: rapid calls collapse into a single trailing call');
  console.log('All debounce checks passed.');
}, 80);
```

- [ ] **Step 3: Run verification script**

Run: `node /tmp/verify-debounce.mjs`
Expected: `OK: rapid calls collapse into a single trailing call`, `All debounce checks passed.`

- [ ] **Step 4: Delete the throwaway script**

Run: `rm /tmp/verify-debounce.mjs`

- [ ] **Step 5: Commit**

```bash
git add src/scene/debounce.js
git commit -m "Add debounce utility for resize handling"
```

---

### Task 5: Particle shaders + `ParticleField`

**Files:**
- Create: `src/scene/particle.vert.glsl`
- Create: `src/scene/particle.frag.glsl`
- Create: `src/scene/ParticleField.js`

**Interfaces:**
- Consumes: `ring`, `cubeOutline`, `starfield` from `shapes.js` (Task 2).
- Produces: `class ParticleField { constructor({ count, colorHex }); mesh; setProgress(p: number); update(deltaSeconds: number); dispose(); }`. Consumed by `main.js` (Task 7).

- [ ] **Step 1: Create `src/scene/particle.vert.glsl`**

```glsl
// uProgress in [0, 2]: 0..1 morphs positionA->positionB, 1..2 morphs
// positionB->positionC. Set by ParticleField.setProgress(), which is in
// turn driven by scrollTimeline.js's heroProgressToShaderProgress(). To add
// a 4th scene later: add positionD, extend the range to [0,3], and add one
// more mix() stage below following the same step()-based pattern.
uniform float uProgress;
uniform float uTime;

attribute vec3 positionA;
attribute vec3 positionB;
attribute vec3 positionC;
attribute float phase;

varying float vAlpha;

void main() {
  float seg = clamp(uProgress, 0.0, 1.9999);
  float segIndex = floor(seg);
  float segFract = seg - segIndex;
  float isSecondSegment = step(0.5, segIndex);

  vec3 fromPos = mix(positionA, positionB, isSecondSegment);
  vec3 toPos = mix(positionB, positionC, isSecondSegment);
  vec3 morphed = mix(fromPos, toPos, segFract);

  float angle = uTime * 0.05;
  float c = cos(angle);
  float s = sin(angle);
  vec3 rotated = vec3(
    morphed.x * c - morphed.z * s,
    morphed.y,
    morphed.x * s + morphed.z * c
  );

  vec4 mvPosition = modelViewMatrix * vec4(rotated, 1.0);
  gl_PointSize = (2.0 + 1.5 * sin(uTime * 1.5 + phase)) * (300.0 / -mvPosition.z);
  vAlpha = 0.6 + 0.4 * sin(uTime * 1.5 + phase);
  gl_Position = projectionMatrix * mvPosition;
}
```

- [ ] **Step 2: Create `src/scene/particle.frag.glsl`**

```glsl
uniform vec3 uColor;
varying float vAlpha;

void main() {
  vec2 uv = gl_PointCoord - vec2(0.5);
  float dist = length(uv);
  float falloff = smoothstep(0.5, 0.0, dist);
  if (falloff <= 0.0) discard;
  gl_FragColor = vec4(uColor, falloff * vAlpha);
}
```

- [ ] **Step 3: Create `src/scene/ParticleField.js`**

```js
import * as THREE from 'three';
import { ring, cubeOutline, starfield } from './shapes.js';
import vertexShader from './particle.vert.glsl?raw';
import fragmentShader from './particle.frag.glsl?raw';

export class ParticleField {
  constructor({ count, colorHex = 0xbfe6ff } = {}) {
    this.count = count;

    const positionA = ring(count);
    const positionB = cubeOutline(count);
    const positionC = starfield(count);

    const phase = new Float32Array(count);
    for (let i = 0; i < count; i += 1) phase[i] = Math.random() * Math.PI * 2;

    this.geometry = new THREE.BufferGeometry();
    // 'position' is required by THREE to know the vertex count for the draw
    // call; the shader ignores it in favor of positionA/B/C below.
    this.geometry.setAttribute('position', new THREE.BufferAttribute(positionA.slice(), 3));
    this.geometry.setAttribute('positionA', new THREE.BufferAttribute(positionA, 3));
    this.geometry.setAttribute('positionB', new THREE.BufferAttribute(positionB, 3));
    this.geometry.setAttribute('positionC', new THREE.BufferAttribute(positionC, 3));
    this.geometry.setAttribute('phase', new THREE.BufferAttribute(phase, 1));

    this.material = new THREE.ShaderMaterial({
      uniforms: {
        uProgress: { value: 0 },
        uTime: { value: 0 },
        uColor: { value: new THREE.Color(colorHex) },
      },
      vertexShader,
      fragmentShader,
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    });

    this.mesh = new THREE.Points(this.geometry, this.material);
  }

  setProgress(progress) {
    this.material.uniforms.uProgress.value = progress;
  }

  update(deltaSeconds) {
    this.material.uniforms.uTime.value += deltaSeconds;
  }

  dispose() {
    this.geometry.dispose();
    this.material.dispose();
  }
}
```

- [ ] **Step 4: Write throwaway verification script**

Create `/tmp/verify-particle-field.mjs`:

```js
import { ParticleField } from '/home/michael/cinematic-hero/src/scene/ParticleField.js';

function assert(cond, msg) {
  if (!cond) throw new Error(`FAIL: ${msg}`);
  console.log(`OK: ${msg}`);
}

const field = new ParticleField({ count: 200 });

assert(field.geometry.attributes.positionA.count === 200, 'positionA has 200 vertices');
assert(field.geometry.attributes.positionB.count === 200, 'positionB has 200 vertices');
assert(field.geometry.attributes.positionC.count === 200, 'positionC has 200 vertices');
assert(field.material.uniforms.uProgress.value === 0, 'uProgress starts at 0');

field.setProgress(1.5);
assert(field.material.uniforms.uProgress.value === 1.5, 'setProgress updates the uniform');

const timeBefore = field.material.uniforms.uTime.value;
field.update(0.5);
assert(field.material.uniforms.uTime.value === timeBefore + 0.5, 'update advances uTime');

field.dispose(); // should not throw
console.log('All ParticleField checks passed.');
```

- [ ] **Step 5: Run verification script**

Run: `cd /home/michael/cinematic-hero && node /tmp/verify-particle-field.mjs`
Expected: all `OK:` lines, ends with `All ParticleField checks passed.` (this works because `three`'s core math/geometry/material classes don't require a GPU context to construct — only `WebGLRenderer.render()` does, which isn't called here).

- [ ] **Step 6: Delete the throwaway script**

Run: `rm /tmp/verify-particle-field.mjs`

- [ ] **Step 7: Commit**

```bash
git add src/scene/particle.vert.glsl src/scene/particle.frag.glsl src/scene/ParticleField.js
git commit -m "Add morphing particle shaders and ParticleField"
```

---

### Task 6: Renderer + bloom (`renderer.js`)

**Files:**
- Create: `src/scene/renderer.js`

**Interfaces:**
- Consumes: `debounce` from `debounce.js` (Task 4).
- Produces: `createRenderer(canvas, { bloom }) -> { renderer, scene, camera, composer }`. Consumed by `main.js` (Task 7). Requires a real `<canvas>` and WebGL context, so it is verified manually in the browser (Task 7), not via a Node script.

- [ ] **Step 1: Create `src/scene/renderer.js`**

```js
import * as THREE from 'three';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js';
import { debounce } from './debounce.js';

export function createRenderer(canvas, { bloom }) {
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setSize(window.innerWidth, window.innerHeight);

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(
    50,
    window.innerWidth / window.innerHeight,
    0.1,
    100,
  );
  camera.position.z = 6;

  const composer = new EffectComposer(renderer);
  composer.addPass(new RenderPass(scene, camera));

  let bloomPass = null;
  if (bloom.enabled) {
    bloomPass = new UnrealBloomPass(
      new THREE.Vector2(window.innerWidth, window.innerHeight),
      bloom.strength,
      bloom.radius,
      0.1,
    );
    composer.addPass(bloomPass);
  }

  function resize() {
    const width = window.innerWidth;
    const height = window.innerHeight;
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
    renderer.setSize(width, height);
    composer.setSize(width, height);
    if (bloomPass) bloomPass.resolution.set(width, height);
  }

  window.addEventListener('resize', debounce(resize, 150));

  return { renderer, scene, camera, composer };
}
```

- [ ] **Step 2: Commit**

```bash
git add src/scene/renderer.js
git commit -m "Add WebGLRenderer with tier-aware bloom and debounced resize"
```

(Manual verification of this file happens in Task 7, where it's first actually rendered to screen.)

---

### Task 7: Wire up `main.js` — static hero render

**Files:**
- Create: `src/main.js`
- Modify: `index.html:9` (script tag already points at `/src/main.js` from Task 1 — no change needed, listed for traceability)

**Interfaces:**
- Consumes: `getDeviceTier` (Task 3), `ParticleField` (Task 5), `createRenderer` (Task 6).
- Produces: a running render loop. `particleField` and `composer` instances are referenced again in Tasks 8 and 9.

- [ ] **Step 1: Create `src/main.js`**

```js
import './styles/main.css';
import * as THREE from 'three';
import { getDeviceTier } from './scene/deviceTier.js';
import { ParticleField } from './scene/ParticleField.js';
import { createRenderer } from './scene/renderer.js';

const tier = getDeviceTier({
  width: window.innerWidth,
  cores: navigator.hardwareConcurrency || 4,
});

const canvas = document.getElementById('scene');
const particleField = new ParticleField({ count: tier.particleCount });
const { scene, composer } = createRenderer(canvas, { bloom: tier.bloom });

scene.add(particleField.mesh);

const clock = new THREE.Clock();

function animate() {
  const delta = clock.getDelta();
  particleField.update(delta);
  composer.render();
  requestAnimationFrame(animate);
}

requestAnimationFrame(animate);
```

- [ ] **Step 2: Manual verification**

Run: `npm run dev`, open the local URL.
Expected: a glowing ice-blue ring of particles, centered on screen, against a near-black background, with a gentle twinkle (size/alpha pulsing). No console errors. Confirm in DevTools → Performance that frame time stays well under 16ms on a normal laptop.

- [ ] **Step 3: Commit**

```bash
git add src/main.js
git commit -m "Wire renderer and particle field into a running render loop"
```

---

### Task 8: Scroll-driven morph (`scrollTimeline.js`)

**Files:**
- Create: `src/scroll/scrollTimeline.js`
- Modify: `src/main.js` (add scroll wiring + hero height)
- Modify: `index.html` (give `#hero` enough scrollable height for the pin)

**Interfaces:**
- Produces: `heroProgressToShaderProgress(scrollProgress: number) -> number`, `createScrollTimeline({ heroEl, onHeroProgress }) -> ScrollTrigger`. Consumed by `main.js`.

- [ ] **Step 1: Create `src/scroll/scrollTimeline.js`**

```js
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

// The entire scroll-to-shader contract lives in this one function: GSAP's
// normalized 0..1 scroll progress through the pin maps to the shader's
// 0..2 uProgress range (see particle.vert.glsl). To add a 4th scene, change
// the multiplier here AND extend the shader's clamp/segment logic to match.
export function heroProgressToShaderProgress(scrollProgress) {
  return scrollProgress * 2;
}

export function createScrollTimeline({ heroEl, onHeroProgress }) {
  return ScrollTrigger.create({
    trigger: heroEl,
    start: 'top top',
    end: '+=250%',
    scrub: true,
    pin: true,
    onUpdate: (self) => onHeroProgress(heroProgressToShaderProgress(self.progress)),
  });
}
```

- [ ] **Step 2: Write throwaway verification script for the pure mapping function**

Create `/tmp/verify-scroll-timeline.mjs`:

```js
import { heroProgressToShaderProgress } from '/home/michael/cinematic-hero/src/scroll/scrollTimeline.js';

function assert(cond, msg) {
  if (!cond) throw new Error(`FAIL: ${msg}`);
  console.log(`OK: ${msg}`);
}

assert(heroProgressToShaderProgress(0) === 0, 'scroll start maps to uProgress 0');
assert(heroProgressToShaderProgress(0.5) === 1, 'scroll midpoint maps to uProgress 1');
assert(heroProgressToShaderProgress(1) === 2, 'scroll end maps to uProgress 2');

console.log('All scrollTimeline checks passed.');
```

Note: importing this file will also import `gsap`/`ScrollTrigger`, which run fine in plain Node (they only touch `window`/`document` when `ScrollTrigger.create()` is actually called, not on import).

- [ ] **Step 3: Run verification script**

Run: `cd /home/michael/cinematic-hero && node /tmp/verify-scroll-timeline.mjs`
Expected: 3 `OK:` lines, then `All scrollTimeline checks passed.`

- [ ] **Step 4: Delete the throwaway script**

Run: `rm /tmp/verify-scroll-timeline.mjs`

- [ ] **Step 5: Wire scroll timeline into `src/main.js`**

No change to `index.html` is needed here: GSAP's `ScrollTrigger.create({ pin: true, end: '+=250%' })` (set in Step 1) automatically injects a spacer element to create the scrollable distance — `#hero` itself stays a normal `100vh` section.

Modify `src/main.js` — add the import and call after `scene.add(particleField.mesh);`:

```js
import './styles/main.css';
import * as THREE from 'three';
import { getDeviceTier } from './scene/deviceTier.js';
import { ParticleField } from './scene/ParticleField.js';
import { createRenderer } from './scene/renderer.js';
import { createScrollTimeline } from './scroll/scrollTimeline.js';

const tier = getDeviceTier({
  width: window.innerWidth,
  cores: navigator.hardwareConcurrency || 4,
});

const canvas = document.getElementById('scene');
const particleField = new ParticleField({ count: tier.particleCount });
const { scene, composer } = createRenderer(canvas, { bloom: tier.bloom });

scene.add(particleField.mesh);

createScrollTimeline({
  heroEl: document.getElementById('hero'),
  onHeroProgress: (progress) => particleField.setProgress(progress),
});

const clock = new THREE.Clock();

function animate() {
  const delta = clock.getDelta();
  particleField.update(delta);
  composer.render();
  requestAnimationFrame(animate);
}

requestAnimationFrame(animate);
```

- [ ] **Step 6: Manual verification**

Run: `npm run dev`, open the local URL, scroll down slowly with the mouse wheel/trackpad.
Expected: the ring smoothly flows into the cube outline by about the midpoint of the scroll, then into the scattered starfield by the end. Scrolling back up reverses the morph smoothly (since `scrub: true` ties progress directly to scroll position, not a one-shot animation).

- [ ] **Step 7: Commit**

```bash
git add src/scroll/scrollTimeline.js src/main.js
git commit -m "Drive particle morph from scroll position via ScrollTrigger"
```

---

### Task 9: Navbar + stats HUD (`navbar.js`)

**Files:**
- Create: `src/ui/navbar.js`
- Modify: `src/main.js` (mount navbar, feed live stats each frame)

**Interfaces:**
- Produces: `computeFps(deltaSeconds: number) -> number`, `createNavbar({ particleCount }) -> { updateStats({ fps, scrollProgress }) }`. Consumed by `main.js`.

- [ ] **Step 1: Create `src/ui/navbar.js`**

```js
export function computeFps(deltaSeconds) {
  if (deltaSeconds <= 0) return 0;
  return Math.round(1 / deltaSeconds);
}

export function createNavbar({ particleCount }) {
  const nav = document.createElement('nav');
  nav.className = 'navbar';
  nav.innerHTML = `
    <span class="navbar__logo">STYLI</span>
    <div class="navbar__links">
      <a href="#work">WORK</a>
      <a href="#contact">CONTACT</a>
    </div>
  `;

  const hud = document.createElement('div');
  hud.className = 'stats-hud';
  hud.innerHTML = `
    <span data-stat="fps">FPS --</span>
    <span data-stat="particles">PTS ${particleCount}</span>
    <span data-stat="scroll">SCROLL 0%</span>
  `;

  document.body.append(nav, hud);

  const fpsEl = hud.querySelector('[data-stat="fps"]');
  const scrollEl = hud.querySelector('[data-stat="scroll"]');

  return {
    updateStats({ fps, scrollProgress }) {
      fpsEl.textContent = `FPS ${fps}`;
      scrollEl.textContent = `SCROLL ${Math.round(scrollProgress * 100)}%`;
    },
  };
}
```

- [ ] **Step 2: Write throwaway verification script for `computeFps`**

Create `/tmp/verify-navbar.mjs`:

```js
import { computeFps } from '/home/michael/cinematic-hero/src/ui/navbar.js';

function assert(cond, msg) {
  if (!cond) throw new Error(`FAIL: ${msg}`);
  console.log(`OK: ${msg}`);
}

assert(computeFps(1 / 60) === 60, '1/60s delta computes to 60fps');
assert(computeFps(1 / 30) === 30, '1/30s delta computes to 30fps');
assert(computeFps(0) === 0, 'zero delta is treated as 0fps, not Infinity');

console.log('All navbar checks passed.');
```

Note: this import will also load `document.createElement` usage inside `createNavbar`, but since `computeFps` is the only thing called, `createNavbar` is never invoked and no DOM is touched — safe to run in plain Node.

- [ ] **Step 3: Run verification script**

Run: `node /tmp/verify-navbar.mjs`
Expected: 3 `OK:` lines, then `All navbar checks passed.`

- [ ] **Step 4: Delete the throwaway script**

Run: `rm /tmp/verify-navbar.mjs`

- [ ] **Step 5: Wire navbar into `src/main.js`**

Modify `src/main.js` to its full form:

```js
import './styles/main.css';
import * as THREE from 'three';
import { getDeviceTier } from './scene/deviceTier.js';
import { ParticleField } from './scene/ParticleField.js';
import { createRenderer } from './scene/renderer.js';
import { createScrollTimeline } from './scroll/scrollTimeline.js';
import { createNavbar, computeFps } from './ui/navbar.js';

const tier = getDeviceTier({
  width: window.innerWidth,
  cores: navigator.hardwareConcurrency || 4,
});

const canvas = document.getElementById('scene');
const particleField = new ParticleField({ count: tier.particleCount });
const { scene, composer } = createRenderer(canvas, { bloom: tier.bloom });

scene.add(particleField.mesh);

const navbar = createNavbar({ particleCount: tier.particleCount });

let scrollProgress = 0;
createScrollTimeline({
  heroEl: document.getElementById('hero'),
  onHeroProgress: (progress) => {
    particleField.setProgress(progress);
    scrollProgress = progress / 2;
  },
});

const clock = new THREE.Clock();

function animate() {
  const delta = clock.getDelta();
  particleField.update(delta);
  navbar.updateStats({ fps: computeFps(delta), scrollProgress });
  composer.render();
  requestAnimationFrame(animate);
}

requestAnimationFrame(animate);
```

- [ ] **Step 6: Manual verification**

Run: `npm run dev`, open the local URL.
Expected: fixed navbar with "STYLI" on the left and "WORK"/"CONTACT" on the right; bottom-right HUD shows a live FPS number (updating, roughly 50-60 on a normal laptop), the particle count for the current tier, and a SCROLL percentage that increases as you scroll through the hero.

- [ ] **Step 7: Commit**

```bash
git add src/ui/navbar.js src/main.js
git commit -m "Add fixed navbar and live stats HUD"
```

---

### Task 10: Content section reveal (`contentSection.js`)

**Files:**
- Create: `src/ui/contentSection.js`
- Modify: `src/main.js` (mount content section)

**Interfaces:**
- Produces: `createContentSection() -> HTMLElement`. Consumed by `main.js`.

- [ ] **Step 1: Create `src/ui/contentSection.js`**

```js
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

export function createContentSection() {
  const section = document.createElement('section');
  section.id = 'content';
  section.className = 'content-section';
  section.innerHTML = `
    <h2 class="content-section__heading">MICHAEL STYLIANOU</h2>
    <ul class="content-section__list">
      <li>WEBSITES</li>
      <li>INSTALLATIONS</li>
      <li>VR</li>
      <li>XR</li>
      <li>GAMES</li>
    </ul>
  `;
  document.body.appendChild(section);

  gsap.fromTo(
    section,
    { autoAlpha: 0, y: 60 },
    {
      autoAlpha: 1,
      y: 0,
      duration: 1,
      scrollTrigger: {
        trigger: section,
        start: 'top 85%',
        end: 'top 40%',
        scrub: true,
      },
    },
  );

  return section;
}
```

- [ ] **Step 2: Wire into `src/main.js`**

Modify `src/main.js`: add the import near the other `./ui/` import, and call it once after `createNavbar(...)`:

```js
import { createNavbar, computeFps } from './ui/navbar.js';
import { createContentSection } from './ui/contentSection.js';
```

```js
const navbar = createNavbar({ particleCount: tier.particleCount });
createContentSection();
```

- [ ] **Step 3: Manual verification**

Run: `npm run dev`, open the local URL, scroll all the way past the hero (through the full 250% pin).
Expected: once the hero's starfield scene finishes and the pin releases, the "MICHAEL STYLIANOU" heading and the WEBSITES/INSTALLATIONS/VR/XR/GAMES list fade and slide up into view as you keep scrolling. Scrolling back up fades it back out (since this `ScrollTrigger` also uses `scrub: true`).

- [ ] **Step 4: Commit**

```bash
git add src/ui/contentSection.js src/main.js
git commit -m "Add content section with scroll-triggered reveal"
```

---

### Task 11: Cross-tier performance check, README, final polish

**Files:**
- Create: `README.md`

**Interfaces:**
- None — this task only verifies and documents what Tasks 1-10 built.

- [ ] **Step 1: Add HMR teardown disposal in `src/main.js`**

The spec calls for `ParticleField.dispose()` to run "only at true teardown points (Vite HMR module dispose, page unload)" — add that hook at the end of `src/main.js`:

```js
if (import.meta.hot) {
  import.meta.hot.dispose(() => {
    particleField.dispose();
  });
}
```

- [ ] **Step 2: Manual verification — HMR disposal**

Run: `npm run dev`, open the local URL, then edit and save `src/scene/shapes.js` (e.g. tweak `radius` in `ring`) to trigger Vite HMR.
Expected: no console errors/warnings about leaked WebGL context or duplicate geometries after the hot reload; the page keeps animating with the updated shape.

- [ ] **Step 3: Commit**

```bash
git add src/main.js
git commit -m "Dispose particle field geometry/material on HMR teardown"
```

- [ ] **Step 4: Manual verification — high tier**

Run: `npm run dev` on a normal laptop (no throttling). Open DevTools → Performance, record ~5s while scrolling through the whole experience.
Expected: frame time consistently under ~16ms (60fps), particle count in the HUD reads `18000` (assuming `hardwareConcurrency >= 8`; if your machine has fewer cores, this confirms the mid-tier path instead — note which tier you actually observed).

- [ ] **Step 5: Manual verification — simulated low tier**

In DevTools, open the device toolbar and pick a mobile device preset (e.g. "iPhone SE", width 375px), then reload.
Expected: HUD reads `PTS 3000`, no bloom glow around particles (sharper, dimmer points than the high-tier view), scroll morph and reveal still work, frame time stays low even under DevTools' default mobile CPU throttling (4x slowdown).

- [ ] **Step 6: Manual verification — resize debounce**

With DevTools open on the Performance or Console tab, resize the browser window by dragging its edge continuously for ~2 seconds, then stop.
Expected: no visible canvas distortion/tearing while dragging continues, and exactly one resize-triggered re-layout of the canvas shortly (~150ms) after you stop dragging — not one per pixel of drag.

- [ ] **Step 7: Create `README.md`**

```markdown
# Cinematic Particle Hero

Dark, scroll-driven Three.js particle hero (ring -> cube outline -> starfield)
built with Vite, Three.js, and GSAP ScrollTrigger.

## Run

\`\`\`bash
npm install
npm run dev
\`\`\`

## Swapping in your own shapes/colors

- Shapes: edit/add functions in `src/scene/shapes.js` (each must return a
  `Float32Array` of length `count * 3` for a given `count`).
- Morph stages: `src/scene/particle.vert.glsl` blends `positionA/B/C` based on
  `uProgress` (0..2). `src/scroll/scrollTimeline.js`'s
  `heroProgressToShaderProgress` is the single function mapping scroll
  position into that range — see the comments in both files.
- Color: `colorHex` passed into `new ParticleField({ count, colorHex })` in
  `src/main.js`.
- Device tiers (particle count / bloom quality): `src/scene/deviceTier.js`.

## Testing

No automated test suite (this is a visual/animation demo). Verification
during development was manual (browser, DevTools performance + device
throttling) plus throwaway Node scripts for pure logic, per
`docs/superpowers/specs/2026-06-24-cinematic-hero-design.md`.
```

- [ ] **Step 8: Commit**

```bash
git add README.md
git commit -m "Add README with usage and customization notes"
```

---
