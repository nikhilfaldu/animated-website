# Cinematic Hero v2 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Upgrade the portfolio hero with a 4th morph shape ("MS" monogram), scroll-driven color palette, redesigned PROJECTS rows, micro-interactions, and recruiter-facing polish (SEO/favicon/responsive/reduced-motion).

**Architecture:** Extends the existing scroll-driven Three.js particle system along its documented extension path (uProgress [0,2] → [0,3], new `positionD` attribute). All color work is CPU-side lerping of the existing `uColor` uniform. UI work is vanilla DOM + GSAP, matching the existing `src/ui/` modules.

**Tech Stack:** Three.js, GSAP + ScrollTrigger, Vite, vanilla JS/CSS. **No new dependencies.**

**Spec:** `docs/superpowers/specs/2026-07-03-cinematic-hero-v2-design.md`

## Global Constraints

- **No automated test suite** — deliberate project convention. Verification is manual/visual: run `npm run dev` (serves at `http://localhost:5173`) and inspect in a headless browser (gstack) or real browser. Every task ends with a visual verification step instead of a unit-test step.
- No new npm dependencies.
- Do not modify `src/scene/renderer.js`, `src/scene/deviceTier.js`, or the device-tier perf model.
- The WebGL canvas is opaque (`alpha: false` default) — overlays that must show over the scene need `position: fixed` + z-index above the canvas, not behind it.
- Match existing code style: ES modules, no semicolonless style, comments only for non-obvious constraints.
- Commit after each task with the existing message style (imperative, no prefix), ending with `Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>`.
- Palette stops (exact): ring `#bfe6ff`, cube `#b39dff`, monogram `#ffb86b`, starfield `#7f9cff`.

---

### Task 1: "MS" monogram shape + 4-stage morph

**Files:**
- Modify: `src/scene/shapes.js` (add `initials()`, update header comment)
- Modify: `src/scene/particle.vert.glsl` (add `positionD`, extend to [0,3])
- Modify: `src/scene/ParticleField.js` (wire new buffer order)
- Modify: `src/scroll/scrollTimeline.js` (multiplier 2 → 3, pin length)
- Modify: `src/main.js` (HUD scroll fraction `/2` → `/3`)

**Interfaces:**
- Produces: `initials(count, { text })` returning `Float32Array(count * 3)`; shader accepting `uProgress` in [0, 3]; `heroProgressToShaderProgress()` returning `scrollProgress * 3`. Task 2 relies on progress being in [0, 3].

- [ ] **Step 1: Add the `initials()` generator to `src/scene/shapes.js`**

Update the header comment (first three lines) to say "All four shapes" instead of "All three shapes", then append:

```js
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
```

- [ ] **Step 2: Extend the vertex shader to four shapes**

Replace the full contents of `src/scene/particle.vert.glsl` with:

```glsl
// uProgress in [0, 3]: 0..1 morphs positionA->positionB, 1..2 morphs
// positionB->positionC, 2..3 morphs positionC->positionD. Set by
// ParticleField.setProgress(), driven by scrollTimeline.js's
// heroProgressToShaderProgress(). To add a 5th scene: add positionE,
// extend the range to [0,4], and add one more step() stage below.
uniform float uProgress;
uniform float uTime;

attribute vec3 positionA;
attribute vec3 positionB;
attribute vec3 positionC;
attribute vec3 positionD;
attribute float phase;

varying float vAlpha;

void main() {
  // Clamp below 3.0, not at it: floor(3.0) would select a nonexistent
  // fourth segment, freezing the morph instead of resolving to positionD.
  float seg = clamp(uProgress, 0.0, 2.9999);
  float segIndex = floor(seg);
  float segFract = seg - segIndex;
  float s1 = step(0.5, segIndex);
  float s2 = step(1.5, segIndex);

  vec3 fromPos = mix(positionA, mix(positionB, positionC, s2), s1);
  vec3 toPos = mix(positionB, mix(positionC, positionD, s2), s1);
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
  gl_PointSize = (2.0 + 1.5 * sin(uTime * 1.5 + phase)) * (10.0 / -mvPosition.z);
  vAlpha = 0.6 + 0.4 * sin(uTime * 1.5 + phase);
  gl_Position = projectionMatrix * mvPosition;
}
```

Segment check (do not skip): segIndex 0 → s1=0 → A→B. segIndex 1 → s1=1, s2=0 → B→C. segIndex 2 → s1=1, s2=1 → C→D.

- [ ] **Step 3: Wire the new buffer order in `src/scene/ParticleField.js`**

In the import, add `initials`:

```js
import { ring, cubeOutline, starfield, initials } from './shapes.js';
```

In the constructor, replace the three `positionX` declarations with:

```js
    const positionA = ring(count);
    const positionB = cubeOutline(count);
    const positionC = initials(count);
    const positionD = starfield(count);
```

After the `positionC` attribute line, add:

```js
    this.geometry.setAttribute('positionD', new THREE.BufferAttribute(positionD, 3));
```

- [ ] **Step 4: Update `src/scroll/scrollTimeline.js`**

Replace the comment + function + `end` value:

```js
// The entire scroll-to-shader contract lives in this one function: GSAP's
// normalized 0..1 scroll progress through the pin maps to the shader's
// 0..3 uProgress range (see particle.vert.glsl). To add a 5th scene, change
// the multiplier here AND extend the shader's clamp/segment logic to match.
export function heroProgressToShaderProgress(scrollProgress) {
  return scrollProgress * 3;
}
```

And in `createScrollTimeline`, change `end: '+=250%'` to `end: '+=350%'` so each morph stage keeps roughly the same scroll length.

- [ ] **Step 5: Fix the HUD scroll fraction in `src/main.js`**

In the `onHeroProgress` callback, change `scrollProgress = progress / 2;` to `scrollProgress = progress / 3;`.

- [ ] **Step 6: Visual verification**

Run: `cd ~/cinematic-hero && npm run dev` (background), then screenshot `http://localhost:5173` in a headless browser at scroll positions 0%, ~12%, ~40%, ~60%, ~90% of the pinned range (the pin is 350% of viewport height, so scroll to e.g. 0, 0.4, 1.3, 2.0, 3.0 × viewport heights).
Expected: ring at top → cube outline → readable "MS" monogram → starfield, each fully resolved mid-stage, no frozen particles at the end (starfield fully formed). HUD SCROLL reads 100% at the end of the pin.

- [ ] **Step 7: Commit**

```bash
git add src/scene/shapes.js src/scene/particle.vert.glsl src/scene/ParticleField.js src/scroll/scrollTimeline.js src/main.js
git commit -m "Add MS monogram as a 4th morph stage

Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>"
```

---

### Task 2: Scroll palette, background tint, grain + vignette

**Files:**
- Modify: `src/scene/ParticleField.js` (palette lerp in `setProgress`, `getTintCss()`)
- Modify: `src/main.js` (drive `--scene-tint` CSS var)
- Modify: `index.html` (overlay divs)
- Modify: `src/styles/main.css` (tint + atmosphere styles)

**Interfaces:**
- Consumes: `uProgress` in [0, 3] from Task 1.
- Produces: `ParticleField.getTintCss()` returning a CSS `rgb(r g b)` string; CSS custom property `--scene-tint` on `:root`.

- [ ] **Step 1: Palette lerp in `src/scene/ParticleField.js`**

Below the imports, add:

```js
// One stop per shape: ring, cube, monogram, starfield. setProgress() lerps
// between adjacent stops so the color always matches the current morph.
const PALETTE = [
  new THREE.Color(0xbfe6ff),
  new THREE.Color(0xb39dff),
  new THREE.Color(0xffb86b),
  new THREE.Color(0x7f9cff),
];
```

Replace `setProgress` and add `getTintCss`:

```js
  setProgress(progress) {
    this.material.uniforms.uProgress.value = progress;
    const t = Math.min(Math.max(progress, 0), 2.9999);
    const i = Math.floor(t);
    this.material.uniforms.uColor.value.copy(PALETTE[i]).lerp(PALETTE[i + 1], t - i);
  }

  getTintCss(strength = 0.22) {
    const c = this.material.uniforms.uColor.value;
    const r = Math.round(c.r * 255 * strength);
    const g = Math.round(c.g * 255 * strength);
    const b = Math.round(c.b * 255 * strength);
    return `rgb(${r} ${g} ${b})`;
  }
```

- [ ] **Step 2: Drive the CSS variable from `src/main.js`**

In the `onHeroProgress` callback, after `particleField.setProgress(progress);`, add:

```js
    document.documentElement.style.setProperty('--scene-tint', particleField.getTintCss());
```

- [ ] **Step 3: Overlay divs in `index.html`**

Inside `<body>`, directly after the `<section id="hero">...</section>` block, add:

```html
  <div class="scene-tint" aria-hidden="true"></div>
  <div class="atmosphere" aria-hidden="true"></div>
```

- [ ] **Step 4: Overlay styles in `src/styles/main.css`**

Add at the end of the file:

```css
:root { --scene-tint: rgb(42 51 56); }

/* Canvas is opaque, so the tint sits above it and screens onto the scene. */
.scene-tint {
  position: fixed;
  inset: 0;
  z-index: 1;
  pointer-events: none;
  background: radial-gradient(ellipse 80% 60% at 50% 40%, var(--scene-tint), transparent 75%);
  mix-blend-mode: screen;
}

.atmosphere {
  position: fixed;
  inset: 0;
  z-index: 20;
  pointer-events: none;
}

.atmosphere::before {
  content: '';
  position: absolute;
  inset: 0;
  opacity: 0.05;
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='160' height='160'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E");
}

.atmosphere::after {
  content: '';
  position: absolute;
  inset: 0;
  background: radial-gradient(ellipse at center, transparent 55%, rgb(0 0 0 / 0.45) 100%);
}
```

- [ ] **Step 5: Visual verification**

With the dev server running, screenshot the same five scroll positions as Task 1 Step 6.
Expected: particle color shifts ice blue → violet → warm ember → deep blue in sync with the shapes; a faint matching tint glows behind the scene; film grain is visible on close inspection but subtle at arm's length; corners are gently vignetted. Content section below still readable (grain/vignette overlay it but at low opacity).

- [ ] **Step 6: Commit**

```bash
git add src/scene/ParticleField.js src/main.js index.html src/styles/main.css
git commit -m "Add scroll-driven palette, background tint, and grain/vignette

Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>"
```

---

### Task 3: PROJECTS section redesign + Paper Alpha rewrite

**Files:**
- Modify: `src/ui/contentSection.js` (data-driven numbered rows, stagger)
- Modify: `src/styles/main.css` (row styles, hover states)

**Interfaces:**
- Produces: `createContentSection({ animate = true })` — Task 5 passes `animate: false` under reduced motion. Row markup classes: `.project-row`, `.project-row__link`, `.project-row__num`, `.project-row__title`, `.project-row__tags`, `.project-row__desc`.

- [ ] **Step 1: Rewrite `src/ui/contentSection.js`**

Replace the full contents with:

```js
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

const PROJECTS = [
  {
    title: 'PAPER ALPHA',
    href: 'https://github.com/mstyli04/paper-alpha',
    tags: ['Next.js', 'TypeScript', 'Prisma'],
    desc: 'An educational platform for learning how financial markets and investing work — practice trading stocks and crypto with $100,000 in virtual cash, live market data, and guided lessons, so you can build real investing skills before risking real money.',
  },
  {
    title: 'MACRO MONITOR',
    href: 'https://github.com/mstyli04/macro-monitor',
    tags: ['Python', 'Next.js', 'FRED API'],
    desc: 'A live US macro dashboard with a recession-probability nowcast in the tradition of Estrella & Mishkin (1998) — a probit model with walk-forward out-of-sample validation, refreshed daily from FRED.',
  },
  {
    title: 'GAME THEORY SIMULATOR',
    href: 'https://github.com/mstyli04/game-theory-simulator',
    tags: ['Vanilla JS', 'Zero dependencies'],
    desc: 'An interactive workbook for two-player normal-form games. Build a payoff matrix and watch it get solved live: iterated elimination of dominated strategies, all Nash equilibria, best-response curves, and the Pareto frontier.',
  },
  {
    title: 'FX OPTIONS DASHBOARD',
    href: 'https://github.com/mstyli04/fx-options-dashboard',
    tags: ['Flask', 'NumPy', 'SciPy'],
    desc: 'A pricing and risk dashboard for European FX options using Garman–Kohlhagen, with 3D Greek surfaces, Monte Carlo simulation, implied-volatility solving, and a backtested delta-hedging strategy on real GBPUSD history.',
  },
  {
    title: 'JOB TRACKER',
    href: 'https://github.com/mstyli04/job-tracker',
    tags: ['Flask', 'SQLite'],
    desc: 'A lightweight Flask app for tracking job applications end-to-end, from Applied through Offer or Rejected, built to stay organized during a job search.',
  },
];

function projectRow({ title, href, tags, desc }, index) {
  const num = String(index + 1).padStart(2, '0');
  return `
    <li class="project-row">
      <a class="project-row__link" href="${href}" target="_blank" rel="noopener noreferrer">
        <span class="project-row__num">${num}</span>
        <span class="project-row__title">${title}</span>
      </a>
      <ul class="project-row__tags">${tags.map((t) => `<li>${t}</li>`).join('')}</ul>
      <p class="project-row__desc">${desc}</p>
    </li>
  `;
}

export function createContentSection({ animate = true } = {}) {
  const section = document.createElement('section');
  section.id = 'content';
  section.className = 'content-section';
  section.innerHTML = `
    <h2 class="content-section__heading">MICHAEL STYLIANOU</h2>
    <ul class="content-section__list">
      <li><a href="https://paper-alpha-navy.vercel.app/" target="_blank" rel="noopener noreferrer">WEBSITES</a></li>
      <li>INSTALLATIONS</li>
      <li>XR</li>
      <li>GAMES</li>
    </ul>
    <h3 class="projects__heading">PROJECTS</h3>
    <ul class="projects__list">${PROJECTS.map(projectRow).join('')}</ul>
  `;
  document.body.appendChild(section);

  if (!animate) return section;

  // scrub: 1 (vs. scrub: true) adds ~1s of catch-up smoothing so the reveal
  // eases toward the scroll position instead of snapping rigidly to it.
  gsap.fromTo(
    section.querySelector('.content-section__heading'),
    { autoAlpha: 0, y: 60 },
    {
      autoAlpha: 1,
      y: 0,
      ease: 'power2.out',
      scrollTrigger: { trigger: section, start: 'top 85%', end: 'top 40%', scrub: 1 },
    },
  );

  gsap.from(section.querySelectorAll('.project-row'), {
    autoAlpha: 0,
    y: 40,
    duration: 0.8,
    stagger: 0.12,
    ease: 'power2.out',
    scrollTrigger: { trigger: section.querySelector('.projects__list'), start: 'top 80%' },
  });

  return section;
}
```

Note: descriptions for Macro Monitor, Game Theory Simulator, FX Options Dashboard, and Job Tracker are carried over verbatim (with `&mdash;`/`&ndash;` entities replaced by literal `—`/`–` characters, which template literals handle fine). Only Paper Alpha's copy changes.

- [ ] **Step 2: Row styles in `src/styles/main.css`**

Delete the old `.projects__list li`, `.projects__title`, `a.projects__title:hover`, and `.projects__desc` rules (keep `.projects__heading` and `.projects__list`). Add:

```css
.project-row {
  padding: 28px 0;
  border-top: 1px solid rgba(232, 241, 255, 0.15);
}

.project-row__link {
  display: flex;
  align-items: baseline;
  gap: 24px;
  color: inherit;
  text-decoration: none;
}

.project-row__num {
  font-family: 'SF Mono', 'Consolas', monospace;
  font-size: 13px;
  color: #6f93b8;
}

.project-row__title {
  position: relative;
  font-size: clamp(24px, 4vw, 44px);
  font-weight: 700;
  letter-spacing: 0.02em;
  transition: color 0.25s ease, transform 0.25s ease;
}

.project-row__title::after {
  content: '';
  position: absolute;
  left: 0;
  bottom: -4px;
  width: 100%;
  height: 2px;
  background: currentColor;
  transform: scaleX(0);
  transform-origin: left;
  transition: transform 0.3s ease;
}

.project-row:hover .project-row__title {
  color: #bfe6ff;
  transform: translateX(8px);
}

.project-row:hover .project-row__title::after {
  transform: scaleX(1);
}

.project-row__tags {
  list-style: none;
  display: flex;
  gap: 8px;
  margin-top: 10px;
}

.project-row__tags li {
  font-family: 'SF Mono', 'Consolas', monospace;
  font-size: 11px;
  letter-spacing: 0.08em;
  color: #6f93b8;
  border: 1px solid rgba(111, 147, 184, 0.35);
  border-radius: 999px;
  padding: 3px 10px;
}

.project-row__desc {
  max-width: 640px;
  margin-top: 12px;
  font-size: 14px;
  line-height: 1.6;
  color: rgba(232, 241, 255, 0.55);
  transition: color 0.25s ease;
}

.project-row:hover .project-row__desc {
  color: rgba(232, 241, 255, 0.85);
}
```

Also change `.projects__list { max-width: 640px; ... }` constraint: the old width cap lived on `.projects__list li`; do NOT re-add it to the rows (rows are full-width, only `.project-row__desc` is capped at 640px).

- [ ] **Step 3: Visual verification**

With the dev server running, scroll past the hero to the content section and screenshot.
Expected: five numbered rows (01–05) with large titles, pill-shaped tech tags, dimmed descriptions. Rows fade/slide in staggered as the section enters. Hovering a row (headless: use hover emulation or verify CSS manually) slides the title right, shows an underline, and brightens the description. Paper Alpha's description reads as a pure educational tool — no "originally a paper-trading platform" framing anywhere.

- [ ] **Step 4: Commit**

```bash
git add src/ui/contentSection.js src/styles/main.css
git commit -m "Redesign PROJECTS as numbered hover rows; recast Paper Alpha as educational

Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>"
```

---

### Task 4: Micro-interactions (cursor parallax + magnetic nav)

**Files:**
- Create: `src/ui/cursor.js`
- Modify: `src/main.js` (wire both up)

**Interfaces:**
- Consumes: `particleField.mesh` (a `THREE.Points`).
- Produces: `initCursorParallax(mesh)`, `initMagneticLinks(selector)` — both no-ops on touch devices. Task 5 gates the calls behind reduced-motion.

- [ ] **Step 1: Create `src/ui/cursor.js`**

```js
import gsap from 'gsap';

function isTouchDevice() {
  return window.matchMedia('(pointer: coarse)').matches;
}

// Eases the particle mesh a few degrees toward the pointer. Composes with
// the shader's own uTime rotation, which operates on vertex positions —
// this rotates the whole mesh on top of it.
export function initCursorParallax(mesh, { maxAngle = 0.12 } = {}) {
  if (isTouchDevice()) return;
  const target = { x: 0, y: 0 };
  window.addEventListener('pointermove', (e) => {
    target.x = (e.clientX / window.innerWidth - 0.5) * 2;
    target.y = (e.clientY / window.innerHeight - 0.5) * 2;
  });
  gsap.ticker.add(() => {
    mesh.rotation.y += (target.x * maxAngle - mesh.rotation.y) * 0.05;
    mesh.rotation.x += (target.y * maxAngle - mesh.rotation.x) * 0.05;
  });
}

export function initMagneticLinks(selector, { strength = 0.35 } = {}) {
  if (isTouchDevice()) return;
  document.querySelectorAll(selector).forEach((el) => {
    el.addEventListener('pointermove', (e) => {
      const r = el.getBoundingClientRect();
      const dx = e.clientX - (r.left + r.width / 2);
      const dy = e.clientY - (r.top + r.height / 2);
      gsap.to(el, { x: dx * strength, y: dy * strength, duration: 0.3 });
    });
    el.addEventListener('pointerleave', () => {
      gsap.to(el, { x: 0, y: 0, duration: 0.5, ease: 'elastic.out(1, 0.4)' });
    });
  });
}
```

- [ ] **Step 2: Wire up in `src/main.js`**

Add the import:

```js
import { initCursorParallax, initMagneticLinks } from './ui/cursor.js';
```

After `createContentSection();`, add:

```js
initCursorParallax(particleField.mesh);
initMagneticLinks('.navbar__links a');
```

(`initMagneticLinks` must run after `createNavbar`, which it does at this point.)

- [ ] **Step 3: Visual verification**

With the dev server running, move the pointer across the hero (headless: dispatch pointermove events or verify in a real browser).
Expected: the particle formation tilts subtly toward the cursor and eases back; WORK/CONTACT nav links pull toward the cursor on approach and spring back on leave. No effect with touch emulation enabled.

- [ ] **Step 4: Commit**

```bash
git add src/ui/cursor.js src/main.js
git commit -m "Add cursor parallax and magnetic nav links

Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>"
```

---

### Task 5: Practical polish (meta/OG, favicon, responsive, reduced motion)

**Files:**
- Modify: `index.html` (meta, OG, favicon link)
- Create: `public/favicon.svg`
- Modify: `src/styles/main.css` (responsive rules)
- Modify: `src/main.js` (reduced-motion gating)

**Interfaces:**
- Consumes: `createContentSection({ animate })` from Task 3; `initCursorParallax`/`initMagneticLinks` from Task 4.

- [ ] **Step 1: Meta tags + favicon link in `index.html`**

Replace the `<head>` contents with:

```html
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Michael Stylianou</title>
  <meta name="description" content="Portfolio of Michael Stylianou — quantitative dashboards, financial tools, and interactive web experiments." />
  <meta property="og:title" content="Michael Stylianou" />
  <meta property="og:description" content="Portfolio of Michael Stylianou — quantitative dashboards, financial tools, and interactive web experiments." />
  <meta property="og:type" content="website" />
  <!-- TODO after deploy: add og:url and og:image with the live URL -->
  <meta name="theme-color" content="#05060a" />
  <link rel="icon" type="image/svg+xml" href="/favicon.svg" />
```

- [ ] **Step 2: Create `public/favicon.svg`**

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64">
  <rect width="64" height="64" rx="12" fill="#05060a"/>
  <text x="32" y="42" font-family="Helvetica, Arial, sans-serif" font-size="26" font-weight="900" fill="#bfe6ff" text-anchor="middle">MS</text>
</svg>
```

(Vite serves `public/` at the site root, so `/favicon.svg` resolves with no config change.)

- [ ] **Step 3: Responsive rules in `src/styles/main.css`**

Add at the end:

```css
@media (max-width: 640px) {
  .navbar { padding: 16px 20px; }
  .navbar__links a { margin-left: 20px; }
  .stats-hud { display: none; }
  .content-section { padding: 0 20px; }
  .project-row__link { flex-direction: column; gap: 4px; }
  .project-row:hover .project-row__title { transform: none; }
}
```

- [ ] **Step 4: Reduced-motion gating in `src/main.js`**

At the top of the file (after imports), add:

```js
const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
```

Wrap the scroll timeline so reduced-motion users get a static, unpinned hero:

```js
let scrollProgress = 0;
if (!reducedMotion) {
  createScrollTimeline({
    heroEl: document.getElementById('hero'),
    onHeroProgress: (progress) => {
      particleField.setProgress(progress);
      document.documentElement.style.setProperty('--scene-tint', particleField.getTintCss());
      scrollProgress = progress / 3;
    },
  });
}
createContentSection({ animate: !reducedMotion });
```

Gate the Task 4 calls:

```js
if (!reducedMotion) {
  initCursorParallax(particleField.mesh);
  initMagneticLinks('.navbar__links a');
}
```

And in `animate()`, freeze the pulse/rotation (uTime stops advancing):

```js
  if (!reducedMotion) particleField.update(delta);
```

- [ ] **Step 5: Visual verification**

1. Reload `http://localhost:5173`: browser tab shows the MS favicon; `document.title` and meta description present in page source; no console errors.
2. Screenshot at a 390×844 viewport (iPhone-ish): navbar fits, stats HUD hidden, project rows stack with title below number, no horizontal overflow.
3. Emulate `prefers-reduced-motion: reduce` (headless browsers support media emulation): hero shows a static ice-blue ring, page scrolls straight to content with no pin, content visible without animation, no cursor tilt.

- [ ] **Step 6: Full-site QA pass + commit**

Re-run the Task 1 scroll sweep once more end-to-end at desktop size (all four shapes + palette + content section + overlays together), confirm no console errors, then:

```bash
git add index.html public/favicon.svg src/styles/main.css src/main.js
git commit -m "Add meta/OG tags, favicon, responsive pass, and reduced-motion support

Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>"
```
