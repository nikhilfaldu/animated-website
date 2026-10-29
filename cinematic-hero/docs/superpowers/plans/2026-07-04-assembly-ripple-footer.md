# Load-In Assembly + Click Ripple + Translucent Footer Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Particles assemble into the ring on load while the name reveals letter-by-letter; clicking the hero sends a ripple through the formation; the starfield glows through a translucent footer.

**Architecture:** Two new vertex-shader stages inserted between the existing morph mix and the uTime rotation — `assembled = mix(scatter, morphed, uAssembly)` then a Gaussian-band radial ripple — driven by new uniforms with setters on `ParticleField`. Load tween and letter stagger are GSAP; ripple click-mapping lives in a new `src/ui/ripple.js`. Footer change is one CSS value.

**Tech Stack:** Three.js (raycaster), GLSL, GSAP, Vite. **No new dependencies.**

**Spec:** `docs/superpowers/specs/2026-07-03-assembly-ripple-footer-design.md`

## Global Constraints

- No automated test suite — verification is manual/visual via `npm run dev` (http://localhost:5173) and the gstack browser (`B="$HOME/.claude/skills/gstack/browse/dist/browse"`; `$B goto/js/screenshot`; check `curl -s -o /dev/null -w "%{http_code}" http://localhost:5173` before starting a server).
- No new npm dependencies. Do not modify `src/scene/renderer.js` or `src/scene/deviceTier.js`.
- Scroll morph contract untouched: `uProgress` in [0,3], clamp 2.9999, palette lerp as-is.
- Vertex stage order (must hold): morph mix → assembly mix → ripple → uTime rotation. Cursor parallax stays outside the shader (mesh.rotation).
- Exact constants from the spec: scatter `spread: 14`; assembly tween `duration: 1.8, ease: 'power3.out'`; letters `autoAlpha: 0, y: 24, duration: 0.8, stagger: 0.05, ease: 'power2.out', delay: 0.4`; ripple speed 3.0, band width 4.0, amplitude 0.6, decay 1.5, `uRippleStart` init `-1000.0`; footer `rgb(5 6 10 / 0.85)`.
- Reduced motion: assembly instant (`setAssembly(1)` before first render), letters instant, no ripple listener.
- Commits end with `Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>`.

---

### Task 1: Load-in assembly + letter reveal

**Files:**
- Modify: `src/scene/particle.vert.glsl`
- Modify: `src/scene/ParticleField.js`
- Modify: `src/ui/heroTitle.js`
- Modify: `src/main.js`
- Modify: `src/styles/main.css`

**Interfaces:**
- Consumes: `starfield(count, { spread })` from `src/scene/shapes.js`; existing `createHeroTitle()` and `reducedMotion` flag in `main.js`.
- Produces: `uniform float uAssembly` and `vec3 assembled` in the shader (Task 2 inserts its ripple between `assembled` and the rotation); `ParticleField.setAssembly(value)`; `createHeroTitle({ animate = true })`.

- [ ] **Step 1: Shader — add the assembly stage**

In `src/scene/particle.vert.glsl`, add with the other attributes/uniforms:

```glsl
uniform float uAssembly;
attribute vec3 positionScatter;
```

Directly after `vec3 morphed = mix(fromPos, toPos, segFract);` add:

```glsl
  vec3 assembled = mix(positionScatter, morphed, uAssembly);
```

and change the rotation lines to read from `assembled` instead of `morphed`:

```glsl
  vec3 rotated = vec3(
    assembled.x * c - assembled.z * s,
    assembled.y,
    assembled.x * s + assembled.z * c
  );
```

- [ ] **Step 2: Geometry + setter in `src/scene/ParticleField.js`**

In the constructor, after the `positionD` line:

```js
    const positionScatter = starfield(count, { spread: 14 });
```

After the `positionD` setAttribute line:

```js
    this.geometry.setAttribute('positionScatter', new THREE.BufferAttribute(positionScatter, 3));
```

In the uniforms object, after `uColor`:

```js
        uAssembly: { value: 0 },
```

After `setProgress`, add:

```js
  setAssembly(value) {
    this.material.uniforms.uAssembly.value = value;
  }
```

- [ ] **Step 3: Letter reveal in `src/ui/heroTitle.js`**

Replace the full contents with:

```js
import gsap from 'gsap';

const NAME = 'MICHAEL STYLIANOU';

export function createHeroTitle({ animate = true } = {}) {
  const el = document.createElement('div');
  el.className = 'hero-title';
  const h1 = document.createElement('h1');
  h1.setAttribute('aria-label', NAME);
  h1.innerHTML = [...NAME]
    .map((ch) => `<span aria-hidden="true">${ch === ' ' ? '&nbsp;' : ch}</span>`)
    .join('');
  el.appendChild(h1);
  document.getElementById('hero').appendChild(el);

  if (animate) {
    gsap.from(h1.children, {
      autoAlpha: 0,
      y: 24,
      duration: 0.8,
      stagger: 0.05,
      ease: 'power2.out',
      delay: 0.4,
    });
  }

  return {
    el,
    // progress is the [0,3] shader progress; the title is fully gone by
    // 0.35 (~12% of the pin) so the name owns the first screen only.
    setProgress(progress) {
      const t = Math.min(progress / 0.35, 1);
      el.style.opacity = 1 - t;
      el.style.transform = `translateY(${t * -30}px)`;
    },
  };
}
```

- [ ] **Step 4: Wire up in `src/main.js`**

Add to the imports:

```js
import gsap from 'gsap';
```

Change the `createHeroTitle()` call to:

```js
const heroTitle = createHeroTitle({ animate: !reducedMotion });
```

In the reduced-motion render branch at the bottom, set assembly before the single render:

```js
if (reducedMotion) {
  particleField.setAssembly(1);
  requestAnimationFrame(() => composer.render());
  window.addEventListener('resize', debounce(() => composer.render(), 200));
} else {
  requestAnimationFrame(animate);
  const assembly = { value: 0 };
  gsap.to(assembly, {
    value: 1,
    duration: 1.8,
    ease: 'power3.out',
    onUpdate: () => particleField.setAssembly(assembly.value),
  });
}
```

- [ ] **Step 5: Letter-span display in `src/styles/main.css`**

`y` transforms need non-inline spans. After the `.hero-title h1` rule add:

```css
.hero-title h1 span {
  display: inline-block;
}
```

- [ ] **Step 6: Visual verification (gstack)**

1. `$B goto http://localhost:5173` then immediately `$B screenshot --viewport <scratch>/assembly-early.png` — particles should be visibly scattered/partially assembled if captured within the first second; a second screenshot after `sleep 2` shows the fully formed ring identical to the current resting state.
2. `$B js "document.querySelectorAll('.hero-title h1 span').length"` → 17; `$B js "document.querySelector('.hero-title h1').getAttribute('aria-label')"` → `MICHAEL STYLIANOU`.
3. Reload and screenshot at ~1s: some letters visible, some still faded (stagger mid-flight) — or verify via `$B js` reading `getComputedStyle` opacity of first vs last span shortly after load.
4. Reduced-motion (`chromium --force-prefers-reduced-motion --screenshot` as in prior tasks): ring fully formed immediately, name fully visible.
5. `$B console --errors` → no app errors.

- [ ] **Step 7: Commit**

```bash
git add src/scene/particle.vert.glsl src/scene/ParticleField.js src/ui/heroTitle.js src/main.js src/styles/main.css
git commit -m "Assemble particles on load with staggered name reveal

Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>"
```

---

### Task 2: Click ripple

**Files:**
- Modify: `src/scene/particle.vert.glsl`
- Modify: `src/scene/ParticleField.js`
- Create: `src/ui/ripple.js`
- Modify: `src/main.js`

**Interfaces:**
- Consumes: `vec3 assembled` from Task 1's shader stage; `{ scene, composer, camera }` from `createRenderer` (camera is already returned — destructure it); `reducedMotion` gate in `main.js`.
- Produces: `ParticleField.triggerRipple(centerVec3)`; `initClickRipple({ heroEl, mesh, camera, particleField })` from `src/ui/ripple.js`.

- [ ] **Step 1: Shader — ripple stage**

In `src/scene/particle.vert.glsl`, add with the uniforms:

```glsl
uniform vec3 uRippleCenter;
uniform float uRippleStart;
```

Directly after the `vec3 assembled = …` line, add:

```glsl
  // Expanding Gaussian band, radial from the click point; dead while
  // rippleAge is negative (uRippleStart initializes to -1000).
  float rippleAge = uTime - uRippleStart;
  float rippleRadius = rippleAge * 3.0;
  float rippleDist = distance(assembled, uRippleCenter);
  float band = exp(-pow(rippleDist - rippleRadius, 2.0) * 4.0);
  float amp = 0.6 * exp(-rippleAge * 1.5);
  vec3 rippleDir = normalize(assembled - uRippleCenter + vec3(0.0001));
  vec3 rippled = assembled + rippleDir * band * amp * step(0.0, rippleAge);
```

and change the rotation lines to read from `rippled`:

```glsl
  vec3 rotated = vec3(
    rippled.x * c - rippled.z * s,
    rippled.y,
    rippled.x * s + rippled.z * c
  );
```

- [ ] **Step 2: Uniforms + trigger in `src/scene/ParticleField.js`**

In the uniforms object, after `uAssembly`:

```js
        uRippleCenter: { value: new THREE.Vector3() },
        uRippleStart: { value: -1000.0 },
```

After `setAssembly`, add:

```js
  triggerRipple(center) {
    this.material.uniforms.uRippleCenter.value.copy(center);
    this.material.uniforms.uRippleStart.value = this.material.uniforms.uTime.value;
  }
```

- [ ] **Step 3: Create `src/ui/ripple.js`**

```js
import * as THREE from 'three';

const Y_AXIS = new THREE.Vector3(0, 1, 0);

export function initClickRipple({ heroEl, mesh, camera, particleField }) {
  const raycaster = new THREE.Raycaster();
  const pointer = new THREE.Vector2();
  const plane = new THREE.Plane(new THREE.Vector3(0, 0, 1), 0);
  const hit = new THREE.Vector3();
  const inverse = new THREE.Matrix4();

  heroEl.addEventListener('pointerdown', (e) => {
    pointer.x = (e.clientX / window.innerWidth) * 2 - 1;
    pointer.y = -(e.clientY / window.innerHeight) * 2 + 1;
    raycaster.setFromCamera(pointer, camera);
    if (!raycaster.ray.intersectPlane(plane, hit)) return;

    // World -> mesh local: undoes the cursor-parallax mesh rotation.
    mesh.updateMatrixWorld();
    inverse.copy(mesh.matrixWorld).invert();
    hit.applyMatrix4(inverse);

    // The shader spins vertices by Ry(-uTime*0.05) (x' = xc - zs, z' = xs + zc),
    // so map the click into pre-spin space with the inverse, Ry(+angle).
    const angle = particleField.material.uniforms.uTime.value * 0.05;
    hit.applyAxisAngle(Y_AXIS, angle);

    particleField.triggerRipple(hit);
  });
}
```

**Correctness note for the implementer:** the rotation-sign derivation above must be verified visually, not trusted. If ripples originate mirrored from the click after the formation has rotated a while, flip the sign of `angle`. Verification step 2 below exercises this.

- [ ] **Step 4: Wire up in `src/main.js`**

Add the import:

```js
import { initClickRipple } from './ui/ripple.js';
```

Change the renderer destructure to include the camera:

```js
const { scene, composer, camera } = createRenderer(canvas, { bloom: tier.bloom });
```

Inside the existing `if (!reducedMotion)` block (with the cursor/magnetic inits), add:

```js
  initClickRipple({
    heroEl: document.getElementById('hero'),
    mesh: particleField.mesh,
    camera,
    particleField,
  });
```

- [ ] **Step 5: Visual verification (gstack)**

1. `$B goto http://localhost:5173`, wait 2s (assembly settles). Baseline screenshot.
2. Click the formation's left edge: `$B js "document.getElementById('hero').dispatchEvent(new PointerEvent('pointerdown', { clientX: window.innerWidth * 0.3, clientY: window.innerHeight * 0.5, bubbles: true }))"` then screenshot ~300ms later: particles near the click point visibly displaced outward; screenshot again after 2s: formation settled back. Repeat with a click on the right edge (`0.7 * innerWidth`) and confirm the disturbance starts on the right — this validates the rotation-sign mapping.
3. Wait ~30s (formation rotated), click the same screen point again, confirm the ripple still originates under the click (not mirrored). If mirrored, flip the `angle` sign per the correctness note and re-verify both step 2 and step 3.
4. Second click while a ripple is mid-flight replaces it (no error, single new ripple).
5. `$B console --errors` → no app errors; FPS stat in the HUD stays near 60 during ripples (`$B js "document.querySelector('[data-stat=fps]').textContent"`).
6. Reduced-motion (chromium flag): dispatching the same pointerdown produces no visual change (listener absent).

- [ ] **Step 6: Commit**

```bash
git add src/scene/particle.vert.glsl src/scene/ParticleField.js src/ui/ripple.js src/main.js
git commit -m "Add click ripple through the particle formation

Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>"
```

---

### Task 3: Translucent footer

**Files:**
- Modify: `src/styles/main.css`

**Interfaces:**
- Consumes: nothing from other tasks (independent).
- Produces: nothing consumed later.

- [ ] **Step 1: Change the footer background**

In the `.footer` rule, change `background: #05060a;` to:

```css
  background: rgb(5 6 10 / 0.85);
```

- [ ] **Step 2: Visual verification (gstack)**

1. `$B goto http://localhost:5173`, `$B js "document.getElementById('contact').scrollIntoView()"`, wait 1s, screenshot: starfield particles faintly visible behind GET IN TOUCH; email and LinkedIn text clearly readable.
2. If text readability is compromised, deepen to `rgb(5 6 10 / 0.9)` (spec-sanctioned fallback) and re-screenshot.
3. Reduced-motion: footer area screenshot still readable over whatever the static scene shows.

- [ ] **Step 3: Commit**

```bash
git add src/styles/main.css
git commit -m "Let the starfield glow through a translucent footer

Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>"
```
