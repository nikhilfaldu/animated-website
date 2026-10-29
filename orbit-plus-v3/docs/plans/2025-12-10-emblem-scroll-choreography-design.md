# Emblem Scroll Choreography Design

**Date**: 2025-12-10
**Status**: Validated
**Scope**: Hero through Contact scroll-driven emblem animations

---

## Architecture

### Single Source of Truth: ScrollController.tsx

All scroll-driven emblem choreography lives in ScrollController.tsx. No section files contain emblem logic. Benefits:
- One place to see the entire scroll journey
- Easier timing management across section boundaries
- Clear debugging when animations misbehave

### Transform Strategy: Layered useTransform

Framer Motion's `useTransform` maps `scrollProgress` (0→1) to emblem properties. Each property gets its own transform with breakpoints:

```typescript
const emblemX = useTransform(scrollProgress,
  [0, 0.12, 0.25, 0.30, ...],  // scroll positions
  [50, 15, 15, 85, ...]         // x values at each position
);
```

### Hybrid Smoothing

- **Position (x, y, originX, originY)**: Direct from useTransform — responsive to scroll
- **Scale, Opacity, RotateZ**: Wrapped in `useSpring` — organic feel, slight lag

### Integration with OrbitSystem

ScrollController calls `setCustomTransform()` on every scroll tick:

```
scrollProgress changes
  → useTransform computes new values
  → useSpring smooths scale/opacity/rotateZ
  → setCustomTransform({ x, y, scale, opacity, originX, originY, rotateZ })
  → Emblem re-renders
```

---

## Hero Sequence (0% → 12%)

### Phase A: Page Load (time-based)

| Time | Event |
|------|-------|
| 0ms | Assembly animation starts (existing, working) |
| 1600ms | Assembly completes |
| 1900ms | Emblem fades to 0.6 opacity + Hero text animates in (simultaneous) |

Implementation: Add `heroTextReady` flag that fires 300ms after `introComplete`. Hero.tsx watches this flag to trigger text animation.

### Phase B: Scroll-Driven Expansion

Only activates after `introComplete` is true.

| Property | Start (0%) | End (12%) | Smoothing |
|----------|------------|-----------|-----------|
| x | 50 | 15 | Direct |
| y | 50 | 50 | Direct |
| originX | 50 | 0 | Direct |
| originY | 50 | 50 | Direct |
| scale | 1 | 4 | Spring |
| opacity | 0.6 | 0.12 | Spring |

---

## Positioning Section (12% → 25%)

Hold left-pinned position, fade to near-invisible background.

| Property | Start (12%) | End (25%) | Smoothing |
|----------|-------------|-----------|-----------|
| x | 15 | 15 | Direct |
| y | 50 | 50 | Direct |
| originX | 0 | 0 | Direct |
| originY | 50 | 50 | Direct |
| scale | 4 | 4 | Spring |
| opacity | 0.12 | 0.07 | Spring |

---

## Positioning → Services Transition (25% → 30%)

The cross-screen sweep. Most dramatic movement in the scroll journey.

| Property | Start (25%) | End (30%) | Smoothing |
|----------|-------------|-----------|-----------|
| x | 15 | 85 | Direct |
| y | 50 | 50 | Direct |
| originX | 0 | 0 (flips to 100 at arrival) | Direct |
| originY | 50 | 50 | Direct |
| scale | 4 | 2.5 | Spring |
| opacity | 0.07 | 0.15 | Spring |

Scale-during-sweep creates depth illusion — emblem moves "into" the right side.
Origin flips to 100 at destination (30%), not during movement.

---

## Services Section (30% → 40%)

Hold on right side, gradual fade.

| Property | Start (30%) | End (40%) | Smoothing |
|----------|-------------|-----------|-----------|
| x | 85 | 85 | Direct |
| y | 50 | 50 | Direct |
| originX | 100 | 100 | Direct |
| originY | 50 | 50 | Direct |
| scale | 2.5 | 2.5 | Spring |
| opacity | 0.15 | 0.08 | Spring |

Pointer behavior (emblem points at hovered cards) deferred — enhancement for later.

---

## Services → Process Transition (40% → 45%)

Move to center, prepare for Process section.

| Property | Start (40%) | End (45%) | Smoothing |
|----------|-------------|-----------|-----------|
| x | 85 | 50 | Direct |
| y | 50 | 65 | Direct |
| originX | 100 | 50 (flip at arrival) | Direct |
| originY | 50 | 50 | Direct |
| scale | 2.5 | 2 | Spring |
| opacity | 0.08 | 0.15 | Spring |

Theme flip (dark → light) happens around here — handled separately.

---

## Process Section (45% → 55%)

Hold center-bottom, fade to invisible.

| Property | Start (45%) | End (55%) | Smoothing |
|----------|-------------|-----------|-----------|
| x | 50 | 50 | Direct |
| y | 65 | 65 | Direct |
| originX | 50 | 50 | Direct |
| originY | 50 | 50 | Direct |
| scale | 2 | 1.5 | Spring |
| opacity | 0.15 | 0 | Spring |

Gear rotation effect deferred — enhancement for later.

---

## Hidden Sections: Work, Proof, Pricing (55% → 92%)

Emblem stays invisible. Values hold at last position for smooth backward scroll.

| Property | 55% → 92% | Notes |
|----------|-----------|-------|
| x | 50 | Hold |
| y | 65 | Hold |
| originX | 50 | Hold |
| originY | 50 | Hold |
| scale | 1.5 | Hold |
| opacity | 0 | **Invisible** |

Theme flip back (light → dark) around 70% — handled separately.
Nav emblem maintains brand presence.

---

## Contact Section: The Return (92% → 100%)

### Phase A: Fade In (92% → 95%)

| Property | Start (92%) | End (95%) | Smoothing |
|----------|-------------|-----------|-----------|
| x | 50 | 50 | Direct |
| y | 65 | 50 | Direct |
| originX | 50 | 50 | Direct |
| originY | 50 | 50 | Direct |
| scale | 1.5 | 1.2 | Spring |
| opacity | 0 | 0.3 | Spring |

### Phase B: Vortex Collapse (95% → 100%)

| Property | Start (95%) | End (100%) | Smoothing |
|----------|-------------|------------|-----------|
| x | 50 | 50 | Direct |
| y | 50 | 50 | Direct |
| scale | 1.2 | 0.3 | Spring |
| opacity | 0.3 | 0 | Spring |
| rotateZ | 0 | 360 | Spring |

Radial vortex behavior (individual radials spiral) deferred — enhancement for later.

---

## Complete Scroll Journey

```
SCROLL %    SECTION          EMBLEM STATE
────────────────────────────────────────────────────────────
0%          Hero Load        Assembly → fade to 0.6 → text enters
0-12%       Hero Scroll      Left-pin expansion (x:50→15, scale:1→4, opacity:0.6→0.12)
12-25%      Positioning      Hold left, fade to background (opacity:0.12→0.07)
25-30%     →Services         SWEEP right (x:15→85, scale:4→2.5, opacity:0.07→0.15)
30-40%      Services         Hold right, fade (opacity:0.15→0.08)
40-45%     →Process          Move center (x:85→50, y:50→65)
45-55%      Process          Hold center, fade out (opacity:0.15→0)
55-92%      Work/Proof/Price HIDDEN (opacity:0)
92-95%     →Contact          RETURN (opacity:0→0.3, y:65→50)
95-100%     Contact          VORTEX collapse (scale:1.2→0.3, rotateZ:0→360)
```

---

## Deferred Enhancements

These features are out of scope for initial implementation:

1. **Services pointer behavior** — Emblem rotates to point at hovered service cards
2. **Process gear rotation** — Alternating clockwise/counter-clockwise radial rotation
3. **Contact radial vortex** — Individual radials spiral into center
4. **Theme flip integration** — Dark ↔ light transitions (separate implementation)

---

## Implementation Order

1. **Hero time-based sequence** — Assembly → delay → fade → text entrance
2. **ScrollController useTransform setup** — All breakpoints and interpolations
3. **Hybrid smoothing** — Spring wrappers for scale/opacity
4. **Test bidirectional scroll** — Scrub back and forth, verify smooth reversibility
5. **Polish timing** — Adjust spring stiffness/damping as needed
