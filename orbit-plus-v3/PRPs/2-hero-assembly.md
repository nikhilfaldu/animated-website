# Implementation Plan: Hero Assembly - Formation Through Gravity

## Overview

Transform the first user input (scroll or keyboard) into ignition: the emblem assembles and the headline crystallizes from that motion, establishing the "living orbital system" and the site's motion language.

**MVP Focus**: Shippable Phase 1 + Phase 2. No audio, particles, or instrumentation.

## Story Reference

- **Primary Source**: `docs/stories/1. STORY-hero-assembly.md`
- **Narrative Act**: Act 1: Assembly
- **Goal**: Turn first user input into ignition - emblem assembles, headline crystallizes
- **User Story**: As a visitor, on my first scroll I want to experience the system "finding itself"

## Requirements Summary

### Core Interaction

**Initial** → **Trigger** → **Ingress** → **Reveal** → **Lock**

1. Near-still particulate drift; emblem latent (reduced opacity)
2. First scroll delta (mouse/trackpad/keyboard/touch)
3. Radials arc inward with gravitational curves
4. Headline revealed through assembly
5. Emblem rests; ready for Orbit

### Performance Targets

- 60 FPS throughout
- GPU transforms only (`transform`, `opacity`)
- ≤ 200 particles global budget
- < 100ms interaction response

### Accessibility

- Headline readable at T0
- Reduced motion: simple fade (~240ms)
- Keyboard triggers: Space/PageDown/Arrows
- WCAG AA contrast maintained

## State & Contracts

### OrbitSystem Requirements

**Required State**: `'assembly'`

**Motion Values** (existing):
- `x, y, z, scale, rotateX, rotateY, rotateZ, opacity`
- `originX, originY` (0-100)
- `scrollProgress, scrollVelocity`

**Methods** (existing):
- `setState, animateTo, setCustomTransform`

**New Method**:
- `staggerRadials(order[], opts)` - Per-radial animation control

### Assembly State Configuration

Current (OrbitSystem.tsx:48-59) needs update for left-pin transition:
```typescript
// From: dispersed radials
// To: assembled + left-pinned pose
originX: 50 → 0 (center to left)
scale: 4 → 12 (dramatic increase)
```

## Research Findings

### Linked Knowledge Sources

**Project ID**: `3c6aeda4-d65b-40e9-a295-90ad77f2f442`

- **Motion.dev** - Framer Motion scroll animations
- **Smashing Magazine SVG** (623eee65f3cccdee) - SVG masking techniques
- **MDN Accessibility** (a8b6340db1a2b96c) - Keyboard navigation
- **React** (ddc6a11b6e0607cf) - React hooks patterns

*All sources linked in Supabase project_sources table*

### Existing Patterns to Preserve

From PRD:145-150 and V1:

1. **Dynamic Transform Origin** - Left-pinned expansion
   - Origin: 50,50 → 0,50 (center to left)
   - Compensate position with x translation
   - Scale: 4 → 12

2. **Theme Flip System** - No flip in Hero
3. **Lenis Smooth Scrolling** - Already integrated

### Code References

See story file sections:
- "Dynamic Transform Origin (left-pin)" for interpolation pattern
- "Radial Variants" for stagger animation
- "Headline Reveal Pattern" for mask structure

## Implementation Tasks

### Phase 1: MVP Assembly (Shippable)

**Goal**: First-scroll → emblem assembly → headline fade

#### 1.1 First-Scroll Detection System
- **Files**: `ScrollController.tsx`, `OrbitSystem.tsx`
- **What**: Detect first non-zero scroll from any input
- **Details**: 
  - Track wheel, touch, keyboard (Space/PageDown/Arrows)
  - Handle anchor links and mid-page landings
  - Debounce by one frame
  - Emit to OrbitSystem once
- **Acceptance**: First scroll from any method triggers assembly once
- **Effort**: 2 hours

#### 1.2 Assembly State Refinement
- **Files**: `OrbitSystem.tsx`
- **What**: Update `STATE_CONFIGS.assembly` for proper poses
- **Details**:
  - Define "from" state (radials dispersed, opacity 0)
  - Define "to" state (radials converged, opacity 1)
  - Support left-pin transition
- **Acceptance**: Assembly state properly animates radials
- **Effort**: 1.5 hours

#### 1.3 Radial Ingress Animation
- **Files**: `Emblem.tsx`
- **What**: Gravitational arc animation for 32 radials
- **Details**:
  - Arc inward from dispersed positions
  - Stagger: 8-12ms per radial (32 total)
  - Group by quadrants (avoid visible wipe)
  - Easing: `cubic-bezier(0.25, 0.46, 0.45, 0.94)`
  - Subtle overshoot spring (ζ ≈ 0.65)
- **Acceptance**: 60 FPS, organic assembly feel
- **Effort**: 4 hours

#### 1.4 Headline Fade (Simple)
- **Files**: `Hero.tsx`
- **What**: Headline reveal synced with assembly
- **Details**:
  - Remove current flip-based logic
  - Add `sr-only` duplicate for a11y
  - Animate opacity + scale with assembly
  - Text remains selectable
- **Acceptance**: Headline readable, synced with lock
- **Effort**: 2 hours

#### 1.5 Left-Pin Origin Handoff
- **Files**: `Hero.tsx`, `OrbitSystem.tsx`
- **What**: Dynamic origin shift center → left
- **Details**:
  - Interpolate `originX`: 50 → 0
  - Keep `originY`: 50
  - Compensate x position
  - Scale: 4 → 12
  - See story "Dynamic Transform Origin" section
- **Acceptance**: Smooth origin shift, matches V1 behavior
- **Effort**: 3 hours

**Phase 1 Total**: ~12.5 hours (MVP shippable)

---

### Phase 2: SVG Mask Reveal

**Goal**: Headline revealed through emblem radial assembly

#### 2.1 SVG Mask Structure
- **Files**: `Hero.tsx` (inline, no new file)
- **What**: SVG mask mirroring emblem radials
- **Details**:
  - Use `EMBLEM_PATHS` for mask
  - Structure: `sr-only` + masked visible layer
  - CSS `mask-image` with fallback
  - Maintain AA contrast during reveal
  - See story "Headline Reveal Pattern" section
- **Acceptance**: Mask syncs with radials, fallback works
- **Effort**: 3 hours

#### 2.2 Mask Progress Binding
- **Files**: `Hero.tsx`
- **What**: Sync mask with assembly progress
- **Details**:
  - Track assembly progress (0-1)
  - Animate `pathLength` per radial
  - Same stagger as emblem (8-12ms)
  - Quadrant grouping
- **Acceptance**: Mask reveals with radials, 60 FPS
- **Effort**: 4 hours

#### 2.3 Reduced Motion Fallback
- **Files**: `Hero.tsx`, `Emblem.tsx`
- **What**: Simple fade for reduced motion users
- **Details**:
  - Use `useReducedMotion()` hook
  - Skip radial travel and mask
  - Fade headline: opacity 0→1 over 240ms
  - Scale: 0.98→1.0 (subtle)
  - Emblem jumps to assembled pose
  - See story "Accessibility" section
- **Acceptance**: Reduced motion path works, accessible
- **Effort**: 2 hours

**Phase 2 Total**: ~9 hours

---

## Files to Touch

From story's "Files to Touch" section:

- `src/sections/Hero.tsx` - Assembly orchestration, headline reveal
- `src/components/emblem/Emblem.tsx` - Radial animations, origin handoff
- `src/components/ScrollController.tsx` - First-scroll detection
- `src/context/OrbitSystem.tsx` - Assembly state, `staggerRadials` method
- `src/components/LenisProvider.tsx` - No changes needed (already integrated)

**No new files in Phase 1+2** - Keep it simple, inline first

---

## Motion Language

From story and PRD:

**Easing**:
- Assembly ingress: `cubic-bezier(0.25, 0.46, 0.45, 0.94)` (confident arrival)
- Headline fade: `easeOut`
- Overshoot: Framer spring ζ ≈ 0.65

**Duration**:
- Assembly total: 1.2s
- Radial stagger: 8-12ms per radial
- Headline fade: 600ms (overlaps assembly)
- Reduced motion: 240ms

**Stagger Pattern**:
- Delay: 12ms per radial
- Quadrant grouping (avoid linear wipe)
- Randomize within quadrants

---

## Technical Architecture

### State Flow

```
User Input → ScrollController detects first scroll
    ↓
OrbitSystem.animateTo('assembly', 1.2)
    ↓
Emblem: 32 radials arc inward (staggered)
Hero: headline fades in (masked/simple)
    ↓
Assembly Lock → Ready for Orbit
```

### Component Structure

```
App
└── LenisProvider
    └── OrbitSystemProvider
        ├── Emblem (fixed, animates assembly)
        ├── ScrollController (first-scroll detection)
        └── Hero (headline reveal)
```

### Motion Value Flow

```
Lenis → ScrollController → OrbitSystem motion values
    ↓
Emblem reads values → calculates per-radial transforms
    ↓
Framer Motion → GPU transforms → 60 FPS
```

---

## Performance Guardrails

From story "Performance Budget":

- GPU transforms only (`transform`, `opacity`)
- No layout reads in rAF loops
- 60 FPS target on modern laptops
- One minor hitch allowed (<32ms)
- No DOM measurements in loops
- Particle budget: ≤50 for Hero (from global 200 max)

---

## Accessibility Requirements

From story "Accessibility":

### Reduced Motion
- Skip radial stagger and mask travel
- Fade headline: 0 → 1 over 240ms
- Scale: 0.98 → 1.0
- Emblem jumps to assembled pose
- Use `useReducedMotion()` hook

### Keyboard Navigation
- Space, PageDown, Arrow keys trigger assembly
- Tab navigation unaffected
- Focus rings stable during animation

### ARIA & Screen Readers
- `<h1>` with `sr-only` duplicate
- Masked layer: `aria-hidden="true"`
- Headline present at T0 (SEO/a11y)

### Color Contrast
- WCAG AA standard (4.5:1)
- `--fg: 245 245 245` on `--bg: 10 10 10`
- Mask never reduces legibility >300ms

---

## Acceptance Criteria

From story:

- [ ] **Readability**: Headline readable; masking ≤300ms obscurity
- [ ] **Determinism**: First scroll always triggers (wheel/touch/keyboard/anchor)
- [ ] **Performance**: 60 FPS; ≤1 minor hitch (<32ms)
- [ ] **Parity**: Left-pin origin handoff matches PRD/V1
- [ ] **A11y**: Reduced-motion works; keyboard nav unaffected
- [ ] **Cleanup**: All listeners/rAF cleaned on unmount

---

## Dependencies and Libraries

**Existing** (already in package.json):
- React 18, TypeScript
- Framer Motion 11
- Lenis (smooth scroll)
- Vite 5

**New**: None needed for MVP

---

## Notes and Considerations

### What We Cut for MVP
- ❌ Tone.js audio feedback (Phase 3 → future)
- ❌ Particle system (Phase 3 → future)
- ❌ Instrumentation/metrics (violates "NO Testing Infrastructure")
- ❌ New utility files (inline first, extract later if needed 3+ times)

### Potential Challenges
- **Mask browser support** - Test Safari/Firefox
- **First-scroll edge cases** - Anchor links, browser back
- **Stagger timing** - May need user testing to refine

### Future Enhancements (Post-MVP)
- Audio lock feedback with Tone.js
- Subtle particle ingress
- Assembly → Orbit transition polish

### Integration Notes
- No theme flip occurs in Hero
- Emblem dynamics (from Story 2) disabled during assembly
- Portal transitions remain unaffected

---

## Related Documentation

- **Story file**: `docs/stories/1. STORY-hero-assembly.md` (authoritative implementation guide)
- **PRD**: `docs/PRD-ORBIT-SYSTEM.md` (sections: Act 1, Technical Architecture, V1 Patterns)
- **OrbitSystem**: `src/context/OrbitSystem.tsx` (state machine API)
- **Emblem**: `src/components/emblem/Emblem.tsx` (current implementation)

---

**Project ID**: `3c6aeda4-d65b-40e9-a295-90ad77f2f442`

*This plan is ready for execution with `/execute-plan PRPs/hero-assembly.md`*

---

**Plan Stats**:
- Lines: ~350 (under 400 ✓)
- Phases: 2 (both shippable ✓)
- New files: 0 in Phase 1+2 ✓
- Testing infra: 0 ✓
- MVP time: ~21.5 hours (2-3 days)

