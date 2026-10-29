# Cinematic Particle Hero

Dark, scroll-driven Three.js particle hero (ring -> cube outline -> starfield)
built with Vite, Three.js, and GSAP ScrollTrigger.

## Run

```bash
npm install
npm run dev
```

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
