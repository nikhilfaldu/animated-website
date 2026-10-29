# Hero Headline + LIVE Links — Design

**Date:** 2026-07-03
**Status:** Approved by Styli
**Predecessors:** `2026-07-03-cinematic-hero-v2-design.md`,
`2026-07-03-about-footer-design.md` (both shipped)

## Goal

Put Styli's name on the first screen and link deployed projects to their
live apps. Two independent, small features in one round.

## 1. Hero headline (`src/ui/heroTitle.js`, new module)

- `createHeroTitle()` appends into `#hero` (after the canvas):

  ```html
  <div class="hero-title" aria-hidden="false">
    <h1>MICHAEL STYLIANOU</h1>
    <p>QUANTITATIVE TOOLS FOR REAL MARKETS</p>
  </div>
  ```

  and returns `{ el, setProgress }`.

- `setProgress(progress)` (progress in [0, 3] from the existing scroll
  contract): `t = min(progress / 0.35, 1)`; sets `opacity = 1 - t` and
  `transform: translateY(-${t * 30}px)`. Fully gone by ~12% of the pin.
  Driven from the existing `onHeroProgress` callback in `main.js` —
  no new ScrollTrigger.
- Reduced motion: the callback never runs, so the headline stays fully
  visible over the static ring. No extra gating needed; `createHeroTitle`
  is called unconditionally.
- Styling: absolutely positioned over the hero, centered column,
  `pointer-events: none`, `z-index: 5` (above canvas and scene-tint z-1,
  below navbar z-10 and atmosphere z-20). `h1`
  `clamp(40px, 8vw, 120px)`, weight 700, tight letter-spacing; tagline
  13px, 0.15em letter-spacing, color `#6f93b8`. This adds the page's
  only `<h1>` (SEO win — current first heading is an `<h2>`).

## 2. LIVE links on project rows (`src/ui/contentSection.js`)

- `PROJECTS` entries get an optional `live` field. Only Paper Alpha has
  one now: `https://paper-alpha-navy.vercel.app/`. Future deploys are a
  one-line data change.
- `projectRow()` wraps the title anchor in a flex header so the live
  link is a **sibling** anchor (nested anchors are invalid HTML):

  ```html
  <div class="project-row__head">
    <a class="project-row__link" …>(num + title as today)</a>
    <a class="project-row__live" href="${live}" target="_blank"
       rel="noopener noreferrer">LIVE ↗</a>   <!-- only when live is set -->
  </div>
  ```

- `.project-row__live`: small accent pill (ice-blue text/border,
  monospace 11px like other pills), background fill on hover and
  `:focus-visible`.
- The row stagger animation targets `.project-row` — unchanged.

## Verification

Manual/visual: headline visible on load, faded out by early scroll,
name legible against particles at desktop and 390×844; reduced-motion
check (headline stays visible, static ring); LIVE chip renders only on
Paper Alpha and opens the Vercel app; row hover states unaffected.

## Out of scope

Scroll cue, other polish items from the improvements list, deployment.
