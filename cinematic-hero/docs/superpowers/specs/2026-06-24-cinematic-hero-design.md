# Cinematic Particle Hero — Design Spec

Date: 2026-06-24
Status: Approved

## Purpose

A single-page portfolio site for job applications, styled after high-end
creative-agency sites (Active Theory-style). A dark, full-viewport WebGL hero
with a particle system that morphs across scroll, followed by a content
section listing portfolio categories.

## Stack

- Vite + vanilla JS (no framework) — matches existing personal projects
  (`pottery-reveal`, `game-theory-simulator`) and avoids a React render layer
  competing with the animation loop.
- Three.js for the WebGL scene.
- GSAP + ScrollTrigger for scroll-driven animation.

## Requirements (from original brief)

1. Full-viewport near-black canvas background (Three.js).
2. Central particle system (thousands of points) forming a recognizable
   shape, continuously drifting, with soft additive glow/bloom.
3. On scroll, the formation morphs through 2-3 scenes, driven by a 0-1
   (here: 0-2) progress value fed into the shader via GSAP ScrollTrigger.
4. Fixed top navbar: logo left, "WORK"/"CONTACT" links right, small stats
   readout in a corner.
5. Subsequent dark content section: large bold heading + short nav list
   ("WEBSITES / INSTALLATIONS / VR / XR / GAMES"), revealed as the user
   scrolls past the hero.
6. 60fps target: BufferGeometry, dispose unused geometry/materials on scene
   changes, throttled resize handling.
7. Mobile responsive: reduce particle count / bloom quality on smaller or
   lower-power devices.

## Content decisions

- Branding: navbar logo and content-section heading both read
  "MICHAEL STYLIANOU" (logo mark abbreviated as "STYLI").
- Hero shape: abstract rotating ring/torus (shape-agnostic, easy to swap).
- Color: cool white / ice-blue particles and glow on near-black background.
- Content-section nav list: kept as the generic placeholder
  "WEBSITES / INSTALLATIONS / VR / XR / GAMES" from the original brief.

## Architecture

```
cinematic-hero/
├── index.html
├── package.json
├── vite.config.js
├── docs/superpowers/{specs,plans}/
├── src/
│   ├── main.js                  # boots renderer, particle field, scroll timeline, UI
│   ├── scene/
│   │   ├── shapes.js            # ring(), cubeOutline(), starfield() -> Float32Array position sets
│   │   ├── ParticleField.js     # BufferGeometry + ShaderMaterial, exposes setProgress(p)
│   │   ├── particle.vert.glsl   # morph + size/twinkle
│   │   ├── particle.frag.glsl   # soft circular falloff, additive glow color
│   │   ├── renderer.js          # WebGLRenderer + EffectComposer + UnrealBloomPass, debounced resize
│   │   └── deviceTier.js        # picks particle count + bloom quality
│   ├── scroll/
│   │   └── scrollTimeline.js    # GSAP ScrollTrigger -> ParticleField.setProgress + content reveal
│   ├── ui/
│   │   ├── navbar.js            # fixed nav, logo, WORK/CONTACT, stats HUD
│   │   └── contentSection.js    # heading + nav-list reveal
│   └── styles/main.css
```

## Particle system & morph technique

**Chosen approach: GPU shader-driven morph** (over CPU-side per-frame lerp,
and over crossfading separate Points objects — see Alternatives below).

`shapes.js` generates three equal-length `Float32Array` position sets
(ring, cube outline, scattered starfield) at the same particle count.
`ParticleField` uploads all three as vertex attributes (`positionA`,
`positionB`, `positionC`) on a **single** `BufferGeometry`. Because only one
geometry/material pair ever exists, there is nothing to allocate or dispose
as the user scrolls between scenes — requirement #6's "dispose on scene
changes" is satisfied by construction rather than by an explicit dispose call
at transition time.

The vertex shader receives a `uProgress` uniform in the range `[0, 2]`:

- `0 → 1`: blend `positionA` (ring) into `positionB` (cube outline)
- `1 → 2`: blend `positionB` (cube outline) into `positionC` (starfield)

using `floor(uProgress)` to pick the active pair and `fract(uProgress)` as
the `mix()` factor. The shader also applies a constant slow rotation and a
per-particle twinkle (phase attribute → size/alpha oscillation independent of
scroll). The fragment shader draws a soft radial-falloff dot in ice-blue,
rendered with `THREE.AdditiveBlending` so overlapping particles build up
glow naturally. A real `UnrealBloomPass` (via `EffectComposer`) adds bloom on
top, with strength/radius pulled from `deviceTier.js`.

### Alternatives considered

- **CPU-side per-frame lerp**: simpler to read/debug, but looping over
  thousands of particles in JS every frame is the first thing to break 60fps
  on weaker devices — rejected for performance.
- **Crossfading separate Points objects per scene**: cheapest to implement,
  but produces a fade/dissolve rather than a morph — particles don't flow
  between shapes, which is visually weaker than what was asked for —
  rejected for visual quality.

## Scroll → progress mapping

One `ScrollTrigger` pins the hero across roughly the first 250vh of scroll
height with `scrub: true`. Its update callback is the single place that
connects scroll position to the shader:

```js
ScrollTrigger.create({
  trigger: '#hero',
  start: 'top top',
  end: '+=250%',
  scrub: true,
  pin: true,
  onUpdate: (self) => particleField.setProgress(self.progress * 2),
});
```

This line — `self.progress * 2` — is the entire scroll-to-shader contract:
`self.progress` is GSAP's normalized 0-1 scroll position within the pin,
multiplied by 2 to span the two morph segments (ring→cube, cube→starfield)
described above. Swapping in a 4th scene later means changing this multiplier
and adding a 4th position attribute + an extra `floor`/`fract` branch in the
shader — both call sites will have an explanatory comment.

A second `ScrollTrigger`, anchored to the end of the pin, fades/slides in the
content section as the starfield scene recedes.

## Navbar & content section

- Fixed navbar: "STYLI" logo mark (left), "WORK" / "CONTACT" anchor links
  (right), and a small monospace stats HUD (bottom-right) showing live
  particle count, FPS, and scroll progress %.
- Content section: large bold "MICHAEL STYLIANOU" heading above the
  placeholder category list ("WEBSITES / INSTALLATIONS / VR / XR / GAMES"),
  continuing the hero's near-black palette.

## Performance & responsive strategy

`deviceTier.js` checks `window.innerWidth` and `navigator.hardwareConcurrency`
once at boot and selects a tier:

| Tier | Trigger | Particle count | Bloom |
|------|---------|-----------------|-------|
| low | width < 768px or hardwareConcurrency < 4 | 3,000 | off |
| mid | hardwareConcurrency < 8 | 8,000 | light |
| high | otherwise | 18,000 | full |

Resize handling is debounced (~150ms) before resizing the renderer,
composer, and camera aspect ratio. Because the particle system reuses one
geometry for the whole experience, explicit disposal is only needed at true
teardown points (Vite HMR module dispose, page unload) — not mid-experience.

## Testing approach

Manual verification via `npm run dev`: confirm 60fps in browser dev tools
performance panel at each device tier (simulated via DevTools device
toolbar + CPU throttling), confirm the morph sequence tracks scroll
smoothly forward and backward, confirm content section reveal timing.
No automated test suite — this is a visual/animation-driven demo, consistent
with `game-theory-simulator`'s approach (no test framework) rather than
`pottery-reveal`'s (which has unit-testable simulation logic).

## Out of scope

- Real portfolio content/case studies behind WORK — placeholder links only.
- CONTACT functionality (mailto link only, no form/backend).
- Cross-browser support beyond modern evergreen browsers (Chrome/Firefox/
  Safari/Edge current versions) — no WebGL fallback for unsupported browsers.
