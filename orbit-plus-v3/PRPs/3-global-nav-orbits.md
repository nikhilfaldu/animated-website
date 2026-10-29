# Implementation Plan: Global Navigation — Orbital Resonance

## Overview

Transform the global navigation into a seamless emblem-to-cylinder morph system where the emblem's radials transform from flat 2D into the exact 3D cylindrical geometry of the dial navigation. This creates a unified navigational object with two modes: Compact (emblem) and Pinned (dial). The emblem's scroll progress visually reads as the dial's active section during morph, establishing the navigation as an orbital compass responding to user scroll position and intent.

## Story Reference

- **Primary Source**: `docs/stories/3. STORY-global-nav-orbits.md` (lines 400-594)
- **Narrative Act**: Act 2 — Orbit (navigation as compass through the creative narrative)
- **Goal**: Emblem radials morph into 3D cylinder, persist on beat, then cross-fade to dial; 60 FPS, GPU-only transforms, reduced-motion parity
- **User Story**: As a user scrolling through the site, I see my progress reflected in the emblem; when I click the emblem, its radials morph into a 3D cylinder, hold for a beat, then the dial fades in for navigation

## Requirements Summary

### Core Interaction
- **Trigger**: Hover/focus emblem → preview mode; click/tap → navigating (morph starts)
- **Morph Sequence**: 16 of 32 radials transform 2D→3D cylinder (220ms) → persist on cylinder (140ms) → emblem fades out & dial fades in (120ms)
- **Continuity**: Emblem radials become the dial's cylinder geometry (exact same position and perspective)
- **Collapse**: Escape / click-away / auto-collapse after 600ms idle

### Emotional Temperature
From **curiosity** (hover) → **anticipation** (morph begins) → **understanding** (dial reveals structure) → **confidence** (navigation completes)

### Performance Targets
- 60 FPS during morph/collapse on modern laptops
- GPU-only transforms (transform, opacity)
- Total sequence: 220ms morph + 140ms beat + 120ms fade = 480ms
- No layout reads in rAF

### Accessibility
- `aria-expanded` on emblem trigger button
- Roving tabindex on dial items (ArrowLeft/Right to navigate)
- Escape to collapse
- Keyboard selection scrolls via Lenis
- Reduced motion: skip 3D transforms, use opacity-only transitions, preserve timing beat

## State & Contracts

### State Machine
```
compact → preview (hover/focus emblem)
preview → compact (blur/leave unless pinned)
preview → navigating (click/tap emblem - morph starts)
navigating → pinned (after morph + beat + fade complete)
pinned  → compact (escape / click-away / auto-collapse after 600ms idle)
```

**Mode Type**: `'compact' | 'preview' | 'navigating' | 'pinned'` lives in `GlobalNav`.

### Morph Timeline (navigating mode)
```
t=0..220ms:     Emblem radials morph 2D→3D (16 radials only, scale to 2×)
t=220..360ms:   Emblem persists on cylinder (140ms "beat")
t=360..480ms:   Emblem fades out (opacity 1.0→0); dial fades in (opacity 0→1.0)
t=480ms+:       Mode transitions to 'pinned', dial interactive
```

### Motion Values Required (from OrbitSystem)
- `scrollProgress` (0-1) — drives active section index
- `scrollVelocity` — optional for kinetic effects
- `originX`, `originY` — shared for emblem↔dial spatial unification
- `scale` — shared for preview prime (1.0 → 1.04)

### Methods Required (from OrbitSystem)
- `scrollProgress.on('change', callback)` — map scroll to nearest section
- No explicit `animateTo` needed (emblem uses local morph state; dial uses visibility gating)

## Shared Geometry Constants

**Location**: `src/components/navigation/nav/constants.ts`

```typescript
export const NAV_MORPH_V2 = true;

// Cylinder geometry (must match KineticDialNav exactly)
export const CYL_PANEL_SIZE = 40;
export const CYL_ITEM_COUNT = 8;
export const CYL_RADIUS = Math.round(
  CYL_PANEL_SIZE / 2 / Math.tan(Math.PI / CYL_ITEM_COUNT)
);

// Morph timing
export const MORPH_DURATION_MS = 220;        // 2D→3D transform
export const MORPH_PERSIST_BEAT_MS = 140;    // Hold on cylinder
export const FADE_DURATION_MS = 120;         // Emblem fade out / dial fade in

// Radial animation
export const RADIAL_STAGGER_MS = 8;          // Stagger per radial
export const RADIAL_GROW_SCALE = 2.0;        // Scale during morph
export const ANIMATED_RADIALS_COUNT = 16;    // Only half (16 of 32)
```


## Implementation Tasks

### Phase 0: Spatial Unification (45 min)

**Goal**: Emblem and dial share identical position, perspective, and transform context

1. **Create NavStagePortal wrapper**
   - Description: Single spatial stage that positions both ScrollEmblem and KineticDialNav at exact same location (top-6 left-6)
   - Files to create: `src/components/navigation/NavStagePortal.tsx`
   - Implementation:
     - Apply single perspective context: `perspective: 1000px; transform-style: preserve-3d; transform-origin: center;`
     - Remove separate positioning from KineticDialNav
     - Use opacity/pointer-events for visibility, not position
   - Story guidance: Lines 429-443
   - Acceptance gate: Emblem center and dial center pixel-perfect overlap (< 0.5px delta)
   - Estimated effort: 45 minutes

### Phase 1: Emblem Morph State (2-3 hours)

**Goal**: Add `navigating` mode to ScrollEmblem that transforms 16 radials into 3D cylinder

2. **Implement 2D→3D radial transform in ScrollEmblem**
   - Description: Select 16 radials (deterministic rule: `index % 2 === 0`), transform them to cylinder geometry
   - Files to modify: `src/components/navigation/ScrollEmblem.tsx`
   - Implementation:
     - Add `navigating` mode prop (derived from GlobalNav state)
     - For 16 animated radials:
       - Compact/Preview: `rotateX(0) translateZ(0) scale(1)`
       - Navigating: `rotateX(angle) translateZ(CYL_RADIUS) scale(2.0)`
       - Where `angle = (radialIndex / 32) * 360`
     - Timing: `MORPH_DURATION_MS` with `cubic-bezier(0.33,1,0.68,1)` easing
     - Stagger: `RADIAL_STAGGER_MS` for animated radials only
     - **Critical**: Emblem stays fully opaque (1.0) during entire 2D→3D transform
   - Story guidance: Lines 446-469
   - Dependencies: Phase 0
   - Acceptance gate: 16 radials transform to cylinder, 16 remain flat, emblem opacity = 1.0 during morph
   - Estimated effort: 2-3 hours

### Phase 2: Persist Beat & Cross-Fade (1-2 hours)

**Goal**: After morph completes, hold emblem on cylinder, then cross-fade to dial

3. **Orchestrate morph timeline in GlobalNav**
   - Description: Implement 3-phase timeline (morph → persist → fade)
   - Files to modify: `src/components/navigation/GlobalNav.tsx`
   - Implementation:
     - Phase 1 (t=0..220ms): Emblem morphs, dial hidden (opacity 0)
     - Phase 2 (t=220..360ms): Emblem persists on cylinder, dial still hidden
     - Phase 3 (t=360..480ms): Emblem fades out (1.0→0), dial fades in (0→1.0)
     - Use `setTimeout` or animation timeline for phase transitions
     - Track morph phase state: `'idle' | 'morphing' | 'persist' | 'fading' | 'complete'`
   - Story guidance: Lines 472-490
   - Dependencies: Phase 1
   - Acceptance gate: Dial opacity remains 0 through morph + beat; emblem opacity stays 1.0 until fade phase
   - Estimated effort: 1-2 hours

4. **Implement dial visibility gating in KineticDialNav**
   - Description: Control dial visibility based on morph phase
   - Files to modify: `src/components/navigation/KineticDialNav.tsx`
   - Implementation:
     - Initially `opacity: 0; pointer-events: none;`
     - After emblem fade begins, transition to `opacity: 1.0`
     - Enable pointer-events when opacity > 0.5 (around 60% of fade duration)
   - Story guidance: Lines 482-485
   - Dependencies: Task 3
   - Acceptance gate: Dial never visible beneath emblem before fade phase
   - Estimated effort: 30 minutes

### Phase 3: Rotation Synchronization (30-45 min)

**Goal**: Cylinder orientation aligns with active section index

5. **Sync activeIndex rotation between emblem and dial**
   - Description: Both emblem cylinder and dial rotate to same active section
   - Files to modify: `src/components/navigation/ScrollEmblem.tsx`, `src/components/navigation/KineticDialNav.tsx`
   - Implementation:
     - Single `activeIndex` source of truth (scroll-driven)
     - Apply `rotateX(-activeIndex * theta)` to both emblem cylinder group and dial container
     - `theta = 360 / CYL_ITEM_COUNT`
   - Story guidance: Lines 493-505
   - Dependencies: Phase 2
   - Acceptance gate: Section facing "front" on emblem matches dial's front item after fade
   - Estimated effort: 30-45 minutes

### Phase 4: Scroll Progress Integration (1 hour)

**Goal**: Connect scroll progress to active section index

6. **Connect scrollProgress to activeIndex**
   - Description: Compute section offsets, subscribe to scrollProgress, map to nearest section
   - Files to modify: `src/components/navigation/GlobalNav.tsx`
   - Implementation:
     - Create `computeSectionOffsets()` helper (equal segments as MVP)
     - Create `findNearestSectionIndex()` helper (closest section midpoint)
     - Subscribe to `scrollProgress.on('change', callback)` → updates `activeIndex`
     - Compute offsets once on mount, cache in ref
   - Story guidance: Lines 216-232
   - Dependencies: Phase 3
   - Acceptance gate: Active section updates on scroll, no layout thrash
   - Estimated effort: 1 hour

### Phase 5: Keyboard Navigation & A11y (1 hour)

**Goal**: Full keyboard support and ARIA attributes

7. **Implement roving tabindex and keyboard handlers**
   - Description: ArrowLeft/Right navigation, Enter/Space to select, Escape to collapse
   - Files to modify: `src/components/navigation/GlobalNav.tsx`, `src/components/navigation/KineticDialNav.tsx`
   - Implementation:
     - Emblem trigger: `tabIndex={0}`, `aria-expanded`, `aria-controls="global-nav"`
     - Dial items: Roving tabindex (only active item has `tabIndex={0}`)
     - ArrowLeft/Right: Move active item
     - Enter/Space: Select active item
     - Escape: Collapse to compact, return focus to trigger
   - Story guidance: Lines 314-325, Lines 158-168
   - Dependencies: Phase 4
   - Acceptance gate: Keyboard nav works, screen reader announces states
   - Estimated effort: 1 hour

8. **Wire Lenis scrollTo on item selection**
   - Description: Smooth scroll to section with auto-collapse
   - Files to modify: `src/components/navigation/GlobalNav.tsx`
   - Implementation:
     - Use `lenis?.scrollTo(id, { duration: 1.2 })`
     - Auto-collapse after 600ms idle
   - Story guidance: Lines 170-176
   - Dependencies: Task 7
   - Acceptance gate: Scroll to section smooth, auto-collapse timer works
   - Estimated effort: 30 minutes

### Phase 6: Reduced Motion & Polish (30-45 min)

**Goal**: Accessibility parity for reduced motion preference

9. **Implement reduced motion pathway**
   - Description: Skip 3D transforms, use opacity-only transitions, preserve timing beat
   - Files to modify: All navigation components
   - Implementation:
     - Detect `prefers-reduced-motion`
     - Skip 3D transforms (no rotateX/translateZ)
     - Use fade-only: emblem holds flat → fade out → dial fade in
     - Preserve timing beat (140ms persist)
     - Keyboard flow identical
   - Story guidance: Lines 508-518
   - Dependencies: Phase 5
   - Acceptance gate: Reduced motion uses opacity only, timing preserved, keyboard works
   - Estimated effort: 30-45 minutes

### Phase 7: Developer Instrumentation (15-30 min)

**Goal**: Debugging and performance monitoring

10. **Add debug overlay and performance markers**
    - Description: Optional debug overlay showing geometry, performance markers in dev tools
    - Files to modify: `src/components/navigation/GlobalNav.tsx`
    - Implementation:
      - Debug overlay toggle (Alt+Shift+D)
      - Show: shared center point, cylinder radius ring, current rotateX
      - Performance markers: `NAV:MORPH_START`, `NAV:MORPH_END`, `NAV:PERSIST_BEAT_END`, `NAV:EMBLEM_FADE_START`, `NAV:DIAL_FADE_START`, `NAV:DIAL_INTERACTIVE`
    - Story guidance: Lines 536-540
    - Dependencies: Phase 6
    - Acceptance gate: Debug overlay toggles, markers appear in Performance tab
    - Estimated effort: 15-30 minutes

## Files to Touch

**New Files**:
- `src/components/navigation/NavStagePortal.tsx` — Shared spatial stage & perspective

**Modified Files**:
- `src/components/navigation/GlobalNav.tsx` — Timeline orchestration, mode state machine, ARIA, roving index
- `src/components/navigation/ScrollEmblem.tsx` — Add `navigating` mode; 16-radial 3D placement + scale
- `src/components/navigation/KineticDialNav.tsx` — Visibility gating, timing sync, pointer-events control
- `src/components/navigation/nav/constants.ts` — Shared geometry & timing constants (already exists)
- `src/components/navigation/nav/types.ts` — Update NavMode type (already exists)
- `src/context/OrbitSystem.tsx` — Verify motion value exposure (likely no changes needed)
- `src/sections/index.ts` — Ordered section registry (already exists)

## Motion Language

**Easing**: `cubic-bezier(0.33, 1, 0.68, 1)` — Orbit feel (perpetual motion quality)

**Durations**:
- Morph: 220 ms (2D→3D transform)
- Persist Beat: 140 ms (hold on cylinder)
- Fade: 120 ms (cross-fade emblem↔dial)
- Preview Prime: 80-120 ms (scale 1.0 → 1.04)

**Spring Config** (for preview scale):
- Stiffness: 140
- Damping: 22

## Technical Architecture

### State Flow Diagram
```
[User] hover emblem → [mode='preview'] → [previewScale spring 1→1.04]
                                                 ↓
[User] click emblem → [mode='navigating'] → [Timeline orchestration]
                                                 ↓
                         t=0..220ms: Emblem 2D→3D morph (16 radials)
                                                 ↓
                        t=220..360ms: Persist beat (emblem holds)
                                                 ↓
                        t=360..480ms: Emblem fade out, dial fade in
                                                 ↓
                             [mode='pinned'] → [Dial interactive]
                                                 ↓
[User] ArrowRight → [activeIndex++] → [cylinder rotates]
                                                 ↓
[User] Enter → [lenis.scrollTo(section)] → [auto-collapse 600ms] → [mode='compact']
```

### Component Structure
```
<NavStagePortal> (shared spatial stage)
├── position: top-6 left-6
├── perspective: 1000px
├── transform-style: preserve-3d
├── Emblem Slot:
│   └── <ScrollEmblem mode={mode} activeIndex={activeIndex} />
│       └── 16 radials morph to 3D cylinder on navigating
└── Dial Slot:
    └── <KineticDialNav mode={mode} activeIndex={activeIndex} />
        └── Visibility gated by morph phase
```

### Motion Value Synchronization
```
OrbitSystem.scrollProgress (0-1)
    ↓ on('change')
GlobalNav.setActiveIndex(findNearestSectionIndex(p, offsets))
    ↓ pass to
ScrollEmblem & KineticDialNav → rotateX(-activeIndex * theta)

OrbitSystem.{originX, originY, scale}
    ↓ shared via NavStagePortal
Both emblem & dial transform from same origin point
```

## Performance Guardrails

- GPU-only (`transform`, `opacity`) — no layout properties
- No layout reads in rAF — geometry computed once
- Items ≤ 8–10 — currently 8 sections (Hero…Contact)
- Each dial item ≥ 44px tap target
- Total sequence < 500 ms (480ms)
- `will-change: transform, opacity` on animated layers
- FPS target: ≥ 55 fps on mid-tier laptop

## Accessibility Requirements

### Reduced Motion
- Skip 3D transforms (no rotateX/translateZ)
- Use opacity-only transitions
- Preserve timing beat (emblem holds flat → fade out → dial fade in)
- Keyboard flow identical
- Semantics preserved

### Keyboard Navigation
- Emblem trigger: `tabIndex={0}`, `role="button"`, `aria-expanded`, `aria-controls="global-nav"`
- Dial items: Roving tabindex pattern (only active item `tabIndex={0}`, others `-1`)
- ArrowLeft/Right: Move active item
- Enter/Space: Select active item
- Escape: Collapse to compact mode, return focus to trigger

### ARIA
- Emblem trigger: `aria-expanded={mode !== 'compact'}`, `aria-controls="global-nav"`
- Dial container: `id="global-nav"`, `role="navigation"`, `aria-hidden={mode === 'compact'}`
- Dial items: `aria-current={isActive ? 'true' : undefined}`
- Screen reader: Announce navigation state changes

## Acceptance Criteria (Binary Pass/Fail)

From Story lines 567-574:

1. **✓ Position Identity**: During morph and persist beat, emblem cylinder occupies the exact center/space as the dial (rect deltas < 0.5px)

2. **✓ No Early Dial**: Dial opacity is 0 until after morph completes AND the beat elapses

3. **✓ No Concurrent Fade**: Emblem does not fade at all before `MORPH_DURATION_MS` ends (stays at 1.0 opacity)

4. **✓ Half Radials Only**: Exactly 16 radials animate into 3D; 16 remain flat. Animated radials scale to ~2× during morph

5. **✓ Rotation Continuity**: Active index alignment is continuous from emblem hold to dial appear

6. **✓ A11y & Reduced Motion**: Reduced-motion path skips transforms but honors the beat and cross-fade; keyboard nav works after dial appears

7. **✓ Performance**: Animations use only `transform`/`opacity`; observed FPS ≥ 55 on reference hardware

## Dependencies and Libraries

- **Framer Motion** — motion values, useSpring, animate API (already in use)
- **Lenis** — lenis.scrollTo() for smooth scroll (already in use)
- **React** — useState, useEffect, useRef, useMemo, useCallback (already in use)

## Notes and Considerations

- **Cylinder geometry must match**: Compute once via shared constants, use in both ScrollEmblem and KineticDialNav
- **No stacking leaks**: Dial is co-located with emblem, timing-gated via opacity/pointer-events
- **Emblem carries morph illusion**: The dial enters only after morph + beat
- **Only 16 radials animate**: Deterministic selection rule (`index % 2 === 0`)
- **Growth is part of morph**: Scale to 2× happens during transform, not after
- **Section offsets**: Use equal segments initially; refine with actual DOM measurements if needed
- **Auto-collapse timer**: 600ms idle after selection
- **Hit area safety**: Emblem itself remains `pointer-events-none`; trigger button receives events

## Related Documentation

- Story file: `docs/stories/3. STORY-global-nav-orbits.md` (lines 400-594: authoritative implementation plan)
- PRD: `docs/PRD-ORBIT-SYSTEM.md` (sections: Act 2 Exploration, Motion Language, Navigation)
- Architecture: `src/context/OrbitSystem.tsx` (motion values), `src/components/LenisProvider.tsx` (smooth scroll)

---

*This plan implements the emblem-to-cylinder morph choreography with exact timing, spatial unification, and robust accessibility. The foundation (3D cylindrical navigation) is correct; the remaining work is orchestrating the morph timeline and ensuring emblem radials transform into the dial's cylinder geometry.*
