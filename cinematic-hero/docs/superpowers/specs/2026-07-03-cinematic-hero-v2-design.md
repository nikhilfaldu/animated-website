# Cinematic Hero v2 — Design

**Date:** 2026-07-03
**Status:** Approved by Styli
**Predecessor:** `2026-06-24-cinematic-hero-design.md` (v1, shipped)

## Goal

General visual and practical upgrade of the portfolio site for job
applications: a richer morph sequence, scroll-driven color, a redesigned
PROJECTS section, micro-interactions, and recruiter-facing polish
(SEO/meta, favicon, responsive, accessibility). Deployment is out of
scope — Styli deploys manually when ready.

## 1. Fourth morph shape — "MS" monogram

- New generator `initials(count, { text = 'MS' })` in `src/scene/shapes.js`:
  render the text on an offscreen 2D canvas in a heavy sans-serif weight,
  sample pixels with alpha above a threshold, map sampled (x, y) into scene
  coordinates centered at the origin, and add small random z-jitter
  (±0.15) for depth. Returns `Float32Array(count * 3)` like the existing
  generators. If fewer lit pixels than `count`, reuse sampled pixels with
  jitter rather than leaving particles at the origin.
- Shader (`particle.vert.glsl`): add `attribute vec3 positionD`, extend
  `uProgress` to [0, 3], clamp at 2.9999, and select morph segments for
  three stages (A→B, B→C, C→D). This follows the extension path already
  documented in the shader comments.
- `ParticleField.js`: buffer order becomes
  A = ring, B = cubeOutline, C = initials, D = starfield.
- `scrollTimeline.js`: `heroProgressToShaderProgress` multiplier 2 → 3.
  Pin distance grows from `+=250%` to `+=350%` so each morph stage keeps
  roughly the same scroll length.
- Scroll sequence: **ring → cube → MS monogram → starfield**.

## 2. Scroll palette + atmosphere

- Four palette stops, one per shape:
  - ring: ice blue `#bfe6ff` (current color, unchanged at progress 0)
  - cube: violet `#b39dff`
  - monogram: warm ember `#ffb86b`
  - starfield: deep blue `#7f9cff`
- CPU-side lerp: `ParticleField.setProgress()` interpolates between
  adjacent stops based on progress in [0, 3] and writes the result to the
  existing `uColor` uniform. No fragment shader changes.
- Background tint: the same lerped color, heavily darkened, drives a CSS
  custom property (`--scene-tint`) used in a subtle fixed radial gradient
  behind the canvas, updated in the same callback.
- Film grain + vignette: one fixed, `pointer-events: none` overlay div —
  SVG `feTurbulence` noise as a data-URI background at low opacity plus a
  radial-gradient vignette. Pure CSS, no post-processing changes.

## 3. Content section redesign (`src/ui/contentSection.js`)

- PROJECTS becomes full-width numbered rows (01–05): large project title,
  small tech-stack tags, description. Hover: title slide/fill accent,
  description brightens. Rows stagger in on scroll (GSAP, replacing the
  single whole-section fade).
- Tech tags per project are read from each local repo's actual stack at
  implementation time (`~/paper-alpha`, `~/macro-monitor`, etc. — verify,
  don't guess).
- **Paper Alpha description rewritten** as a straight educational tool
  (no "originally a paper-trading platform" framing): an educational
  platform for learning how financial markets and investing work —
  risk-free trading with virtual cash, real-time market data, and guided
  lessons.
- Other four descriptions unchanged.

## 4. Micro-interactions

- **Cursor parallax:** track pointer position, ease the particle mesh
  rotation a few degrees toward it (lerp per frame, desktop only — skip
  on touch devices and reduced motion).
- **Magnetic navbar links:** links translate slightly toward the cursor
  within a small radius, spring back on leave (GSAP).
- **Animated underlines** on project title links (CSS transform scale).

## 5. Practical polish

- `index.html`: meta description, Open Graph tags (`og:title`,
  `og:description`, `og:type`). `og:image` and `og:url` left as commented
  TODO until the site is deployed and has a URL.
- Favicon: inline SVG monogram ("MS" on dark), added to `/public` and
  linked from `index.html`.
- Responsive pass: fluid type via `clamp()`, reduced paddings at small
  widths, stats HUD hidden below ~640px, project rows stack cleanly on
  mobile.
- `prefers-reduced-motion`: checked via `matchMedia` in `main.js` —
  static ring (no pin/scrub morph), no particle pulse, no cursor
  parallax, content section visible without scroll animation.

## 6. Housekeeping

`.gitignore` (`.gstack/`) and `package-lock.json` committed separately
before feature work. **Done — commit `cd19872`.**

## Architecture notes

- No new dependencies. No changes to `renderer.js`, `deviceTier.js`, or
  the device-tier perf model.
- Attribute count stays well under the WebGL minimum of 16
  (position + A/B/C/D + phase = 6).
- New files: `src/ui/cursor.js` (parallax + magnetic hover),
  `public/favicon.svg`. Everything else is edits to existing files.

## Verification

Manual/visual per project convention (no automated test suite). QA via
dev server + headless browser at desktop and mobile viewport sizes:
morph sequence and palette at multiple scroll positions, hover states,
reduced-motion mode, and mobile layout.

## Out of scope

- Deployment (Styli handles it).
- New page sections (About/CV, contact) — to be discussed after this
  round ships.
- Project thumbnails, mouse-repulsion physics, per-particle gradient
  colors (Approach B items, deliberately dropped).
