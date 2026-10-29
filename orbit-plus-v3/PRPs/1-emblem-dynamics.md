# Implementation Plan: Emblem Dynamics - Breathing, Attention, and Idle Intelligence

## Overview
Make the emblem feel perceptive and alive by coupling scroll state, cursor proximity, and idle timing into a single, coherent behavior model that never compromises clarity or performance. This feature adds subtle micro-dynamics that layer over OrbitSystem's primary state transformations.

**MVP Focus**: Phase 1 (Proximity + Flare) + Phase 2 (Breath). No instrumentation/metrics systems (per PRD "NO Testing Infrastructure").

## Story Reference
- **Primary Source**: `docs/stories/2. STORY-emblem-dynamics.md`
- **Narrative Act**: Act 1-5 (spans all sections)
- **Goal**: Create a living, perceptive emblem through proximity drift, velocity flare, and idle breath
- **User Story**: As a user, I experience the emblem as a living entity that responds to my attention and activity

## Requirements Summary
Extract from story file:

### Core Interaction
**Inputs**:
- Scroll progress and velocity from OrbitSystem
- Pointer position and velocity (desktop), coarse pointer sampling on touch
- Idle timers (short idle ≈ 3s, deep idle ≈ 8s)

**Outputs**:
- Subtle positional drift toward pointer (attention)
- Centrifugal flare under fast scrolling (energy)
- Low amplitude "breath" in idle states (aliveness)

**States**:
- `active` (scrolling)
- `attentive` (pointer present, low scroll)
- `resting` (short idle) → `deepRest` (long idle)

### Emotional Temperature
Perceptive, alive, responsive - reinforcing the "living orbital system" narrative without becoming UI noise.

### Performance Targets
- 60 FPS minimum
- GPU transforms only (`transform`, `opacity`)
- No layout reads in rAF loops
- Global particle cap remains 200 across site

### Accessibility
- **Reduced motion**: Disable proximity drift, flare, and breath; keep emblem deterministic and static
- **Keyboard users**: No focus jumps caused by dynamic transforms
- **Screen readers**: No critical meaning encoded solely in motion

## State & Contracts

### OrbitSystem Extensions (Non-Breaking)
**Motion Values** (already present):
- `scrollProgress`: MotionValue<number> (0-1)
- `scrollVelocity`: MotionValue<number> (from Lenis)
- `x`, `y`, `scale`, `rotateZ`, `opacity`, `originX`, `originY`

**New Derived State** (to add):
```typescript
const activityState = useTransform(scrollVelocity, v => {
  if (Math.abs(v) > 2.0) return 'active'
  return 'attentive'
})
```

### Motion Value Synchronization
Emblem dynamics are **additive** micro-behaviors layered over primary states (`assembly`, `orbit`, `data`, `vortex`). They compose cleanly without interfering with section-driven state transitions.

## Research Findings

### Linked Knowledge Sources (Project: 3c6aeda4-d65b-40e9-a295-90ad77f2f442)
The following knowledge sources are relevant and should be linked to the project in Supabase:

**Animation & Motion**:
- `4f2cd357120c2aaa` - Motion.dev (Framer Motion examples: springs, gestures, scroll)
- `motion.dev` - React scroll animations documentation
- `motion.zajno.com` - UI/UX animation techniques (easing, parallax, masking)

**Pointer Interaction**:
- `11633a51b3bff34f` - Tympanus (Interactive mouse effects with Three.js instancing)
- `f3963345cddc756c` - Tympanus (Animating letters with shaders and raycasting)

**Accessibility**:
- `a8b6340db1a2b96c` - MDN (Keyboard-navigable JavaScript widgets)
- `e7f872fd0b6a840d` - WAI-ARIA Practices (ARIA roles, states, properties)

**Performance**:
- `r3f.docs.pmnd.rs` - React Three Fiber (performance patterns)
- `ddc6a11b6e0607cf` - React.dev (optimization strategies)

*Note: These sources will be linked in Supabase project_sources table during implementation*

### Existing Patterns to Preserve

From PRD and V1/V2:
- **Dynamic origin transforms**: `originX`/`originY` with position compensation (V1 Hero pattern)
- **GPU-only transforms**: Never trigger layout/paint, only composite
- **Reduced motion gating**: All dynamics disabled under `prefers-reduced-motion`
- **Pointer events layering**: Emblem container `pointer-events: none` so GlobalNav remains interactive

### Reference Code Examples

From story file "Implementation Notes":

**1. Pointer Capture Pattern** (Emblem.tsx):
```typescript
const pointerX = useMotionValue(0)
const pointerY = useMotionValue(0)
const hasPointer = useMotionValue(false)

useEffect(() => {
  const onMove = (e: MouseEvent) => {
    hasPointer.set(true)
    pointerX.set(e.clientX)
    pointerY.set(e.clientY)
  }
  const onLeave = () => hasPointer.set(false)
  window.addEventListener('mousemove', onMove, { passive: true })
  window.addEventListener('mouseleave', onLeave, { passive: true })
  return () => {
    window.removeEventListener('mousemove', onMove)
    window.removeEventListener('mouseleave', onLeave)
  }
}, [])
```

**2. Proximity Drift Calculation**:
```typescript
const centerX = window.innerWidth / 2
const centerY = window.innerHeight / 2
const maxDriftPx = 12 // desktop; 6 on mobile

const rawDx = useTransform(pointerX, x => x - centerX)
const rawDy = useTransform(pointerY, y => y - centerY)

const normDx = useTransform(rawDx, dx => Math.max(-1, Math.min(1, dx / centerX)))
const normDy = useTransform(rawDy, dy => Math.max(-1, Math.min(1, dy / centerY)))

const driftX = useSpring(normDx, { stiffness: 120, damping: 20, mass: 0.4 })
const driftY = useSpring(normDy, { stiffness: 120, damping: 20, mass: 0.4 })

const proximityX = useTransform([driftX, hasPointer], ([dx, hp]) => (hp ? dx * maxDriftPx : 0))
const proximityY = useTransform([driftY, hasPointer], ([dy, hp]) => (hp ? dy * maxDriftPx : 0))
```

**3. Velocity Flare Pattern**:
```typescript
const { scrollVelocity } = useOrbitSystem()
const vAbs = useTransform(scrollVelocity, v => Math.min(4, Math.abs(v)))
const energy = useTransform(vAbs, [0, 1, 4], [0, 0.4, 1])

const flareRotate = useTransform(energy, e => e * 2.5) // degrees
const flareScale = useTransform(energy, e => 1 + e * 0.02) // up to +2%

const sFlareRot = useSpring(flareRotate, { stiffness: 80, damping: 18 })
const sFlareScale = useSpring(flareScale, { stiffness: 80, damping: 18 })
```

**4. Idle Breath Pattern**:
```typescript
const t = useMotionValue(0)
useEffect(() => {
  let raf = 0
  const loop = (now: number) => {
    t.set(now / 1000) // seconds
    raf = requestAnimationFrame(loop)
  }
  raf = requestAnimationFrame(loop)
  return () => cancelAnimationFrame(raf)
}, [])

const breathAmp = 0.008 // 0.8% scale
const breathFreq = 0.25 // Hz
const breathScale = useTransform(t, time => 1 + breathAmp * Math.sin(2 * Math.PI * breathFreq * time))

const { scrollVelocity: v } = useOrbitSystem()
const isIdleShort = useTransform(v, vel => Math.abs(vel) < 0.2)
const idleGate = useSpring(isIdleShort, { stiffness: 200, damping: 30 })

const finalBreathScale = useTransform([breathScale, idleGate], ([b, gate]) => (gate ? b : 1))
```

### Integration Points

**OrbitSystem** (src/context/OrbitSystem.tsx:1):
- Already exposes `scrollProgress`, `scrollVelocity`, `x`, `y`, `scale`, `rotateZ`, `opacity`, `originX`, `originY`
- Add small helper for `activityState` derived from velocity thresholds
- No breaking changes to existing API

**Emblem** (src/components/emblem/Emblem.tsx:1):
- Bind additive micro-dynamics to derived motion values
- Layer proximity, flare, breath on top of base OrbitSystem transforms
- Ensure `pointer-events: none` on container

**GlobalNav** (src/components/navigation/GlobalNav.tsx:1):
- Verify z-index layering ensures nav is interactive
- Confirm proximity drift never blocks nav hit testing

**Theme/Portal** (V1 patterns):
- Ensure theme flip and portal transitions remain deterministic
- Micro-behaviors should not interfere with these critical transitions

## Implementation Tasks

### Phase 1: Proximity Drift + Velocity Flare + Reduced Motion Gating

**Task 1.1: Extend OrbitSystem with Activity State**
- **Description**: Add `activityState` derived motion value to OrbitSystem for behavioral gating
- **Files to modify**: `src/context/OrbitSystem.tsx`
- **Story guidance**: Section "Data flow & motion values" - add `activityState` derived from `scrollVelocity`
- **Acceptance gate**: `activityState` switches between 'active' and 'attentive' based on velocity > 2.0
- **Estimated effort**: 30 minutes

**Task 1.2: Implement Global Pointer Tracking in Emblem**
- **Description**: Add single global pointer listener with throttled motion values for position tracking
- **Files to modify**: `src/components/emblem/Emblem.tsx`
- **Story guidance**: Section "Pointer capture in Emblem" - use global listener, avoid DOM layout reads
- **Dependencies**: None
- **Acceptance gate**: `pointerX`, `pointerY`, `hasPointer` motion values update on mousemove/mouseleave
- **Estimated effort**: 1 hour

**Task 1.3: Calculate Center-Relative Proximity Vector**
- **Description**: Compute normalized drift vector from emblem center to pointer, spring-smoothed
- **Files to modify**: `src/components/emblem/Emblem.tsx`
- **Story guidance**: Section "Center-relative vector" - normalize, clamp to maxDriftPx (12px desktop/6px mobile)
- **Dependencies**: Task 1.2
- **Acceptance gate**: Drift vector normalized to [-1, 1], spring-smoothed with stiffness:120, damping:20
- **Estimated effort**: 1.5 hours

**Task 1.4: Apply Proximity Offsets to Emblem Transform**
- **Description**: Add proximityX/proximityY as additive x/y transforms on emblem wrapper
- **Files to modify**: `src/components/emblem/Emblem.tsx`
- **Story guidance**: Section "Center-relative vector" - apply via motion.div style, gate with `hasPointer` and reduced motion
- **Dependencies**: Task 1.3
- **Acceptance gate**: Emblem drifts ≤12px desktop/≤6px touch toward pointer, disabled if `prefersReducedMotion`
- **Estimated effort**: 1 hour

**Task 1.5: Implement Velocity Flare Effects**
- **Description**: Map scroll velocity to micro-rotation and micro-scale using energy factor
- **Files to modify**: `src/components/emblem/Emblem.tsx`
- **Story guidance**: Section "Velocity flare (centrifugal energy)" - flareRotate ≤2.5°, flareScale ≤+2%
- **Dependencies**: OrbitSystem `scrollVelocity` already available
- **Acceptance gate**: Fast scroll triggers rotation ≤2.5° and scale ≤+2%, spring-smoothed with stiffness:80, damping:18
- **Estimated effort**: 1.5 hours

**Task 1.6: Gate All Dynamics with Reduced Motion**
- **Description**: Disable proximity drift, flare, breath under `prefers-reduced-motion`
- **Files to modify**: `src/components/emblem/Emblem.tsx`
- **Story guidance**: Section "Accessibility" - all dynamics must be disabled if user prefers reduced motion
- **Dependencies**: Tasks 1.4, 1.5; use existing `useReducedMotion` hook
- **Acceptance gate**: When `prefersReducedMotion` is true, all micro-dynamics set to 0
- **Estimated effort**: 30 minutes

**Task 1.7: Verify GlobalNav Hit Testing and Z-Index**
- **Description**: Ensure proximity drift never blocks GlobalNav interactions
- **Files to modify**: `src/components/navigation/GlobalNav.tsx`, `src/components/emblem/Emblem.tsx`
- **Story guidance**: Section "Layering, hit testing, and nav safety" - emblem `pointer-events: none`, nav above emblem
- **Dependencies**: Tasks 1.4, 1.5
- **Acceptance gate**: GlobalNav remains fully interactive, emblem does not interfere with pointer events
- **Estimated effort**: 30 minutes

### Phase 2: Idle Breath + Per-Radial Micro-Responses

**Task 2.1: Implement Time Accumulator for Breath**
- **Description**: Use requestAnimationFrame to drive low-frequency oscillation (0.25 Hz, 0.8% amplitude)
- **Files to modify**: `src/components/emblem/Emblem.tsx`
- **Story guidance**: Section "Idle breath (aliveness)" - rAF loop, no setInterval drift
- **Dependencies**: Phase 1 complete
- **Acceptance gate**: Time accumulator updates at 60 FPS, no drift over time
- **Estimated effort**: 1 hour

**Task 2.2: Calculate Breath Scale with Idle Gating**
- **Description**: Drive breath animation gated by idle state (velocity < 0.2 for >3s)
- **Files to modify**: `src/components/emblem/Emblem.tsx`
- **Story guidance**: Section "Idle breath (aliveness)" - breath amplitude ≤0.8%, frequency 0.25 Hz, gated by idle
- **Dependencies**: Task 2.1
- **Acceptance gate**: Breath only active when velocity < 0.2, amplitude ≤0.8%, disabled if reduced motion
- **Estimated effort**: 1.5 hours

**Task 2.3: Compose Breath Scale with Flare Scale**
- **Description**: Multiply breath and flare scales cleanly without conflicts
- **Files to modify**: `src/components/emblem/Emblem.tsx`
- **Story guidance**: Section "Idle breath (aliveness)" - compose via useTransform multiplication or apply to child group
- **Dependencies**: Tasks 1.5, 2.2
- **Acceptance gate**: Breath and flare scales compose additively without visual artifacts
- **Estimated effort**: 1 hour

**Task 2.4: Per-Radial Micro-Response (Optional)**
- **Description**: Bias minor per-radial transforms based on pointer angle for "orientation toward attention"
- **Files to modify**: `src/components/emblem/Emblem.tsx`
- **Story guidance**: Section "Per-radial micro-response (optional Phase 2)" - compute pointer angle, apply ±0.5° or ±0.5% per radial
- **Dependencies**: Task 1.3
- **Acceptance gate**: Each radial subtly orients toward pointer without visible distortion, never shifts absolute positions
- **Estimated effort**: 2 hours

### Phase 3: Fine-Tune Springs, Thresholds, and Section Integration

**Task 3.1: Tune Spring Parameters**
- **Description**: Adjust stiffness, damping, mass for proximity and flare springs to eliminate jitter
- **Files to modify**: `src/components/emblem/Emblem.tsx`
- **Story guidance**: Implicit in all spring usages - proximity (stiffness:120, damping:20, mass:0.4), flare (stiffness:80, damping:18)
- **Dependencies**: Phase 2 complete
- **Acceptance gate**: No visible jitter or overshoot, springs settle within 100ms after activity ends
- **Estimated effort**: 1 hour

**Task 3.2: Clamp Dynamics During Hero Assembly**
- **Description**: Disable or heavily clamp micro-behaviors during assembly state to avoid competing cues
- **Files to modify**: `src/components/emblem/Emblem.tsx`
- **Story guidance**: Section "Notes on integration with section states" - clamp or disable until lock
- **Dependencies**: OrbitSystem `currentState`
- **Acceptance gate**: Micro-dynamics suppressed when `currentState === 'assembly'` until section complete
- **Estimated effort**: 45 minutes

**Task 3.3: Preserve Theme Flip and Portal Determinism**
- **Description**: Ensure theme flip and portal transitions are unaffected by micro-dynamics
- **Files to modify**: Verify no changes needed; test with existing theme/portal code
- **Story guidance**: Section "Notes on integration with section states" - ensure deterministic transitions
- **Dependencies**: Phase 2 complete
- **Acceptance gate**: Theme flip and portal transitions remain deterministic, no interference from dynamics
- **Estimated effort**: 30 minutes

**Task 3.4: Performance Profiling and Optimization**
- **Description**: Profile to ensure 60 FPS, no main thread blocks >16ms average
- **Files to modify**: Optimize if needed based on profiling results
- **Story guidance**: Section "Performance & budgets" - 60 FPS minimum, GPU transforms only, no layout reads in rAF
- **Dependencies**: Phase 2 complete
- **Acceptance gate**: 60 FPS on modern laptops, no animation blocks main thread >16ms on average
- **Estimated effort**: 1.5 hours

## Files to Touch

From story's "Files to Touch" section:

- `src/components/emblem/Emblem.tsx` - Bind emblem transforms to derived motion values (proximity, breath, flare)
- `src/context/OrbitSystem.tsx` - Expose `scrollProgress`, `scrollVelocity`, add `activityState` helper
- `src/components/navigation/GlobalNav.tsx` - Verify z-index and pointer event layering
- `src/hooks/useReducedMotion.ts` - Already present; gate dynamic behaviors

## Motion Language

### Proximity Drift
- **Spring config**: `stiffness: 120, damping: 20, mass: 0.4`
- **Max amplitude**: 12px desktop, 6px touch
- **Smoothing**: Spring-based to eliminate jitter

### Velocity Flare
- **Rotation**: 0-2.5 degrees (based on velocity)
- **Scale**: 1.0-1.02 (up to +2%)
- **Spring config**: `stiffness: 80, damping: 18`
- **Energy mapping**: velocity 0-4 → energy 0-1

### Idle Breath
- **Frequency**: 0.25 Hz (4-second period)
- **Amplitude**: 0.8% scale (±0.008)
- **Waveform**: Sine wave
- **Gating**: Only active when velocity < 0.2 for >3s

## Technical Architecture

### State Flow Diagram
```
Pointer Input → Motion Values (x, y) → Normalized Vector → Spring Smoothing → Proximity Offset
                                                                                      ↓
                                                                            Emblem Transform (additive)
                                                                                      ↑
Scroll Velocity → Energy Factor → Flare (rotate, scale) → Spring Smoothing ───────────┘
                                                                                      ↑
Time (rAF) → Sine Wave → Idle Gating (velocity < 0.2) → Breath Scale ───────────────┘
```

### Component Structure
```
<App>
  <OrbitSystemProvider> (provides scrollVelocity, activityState)
    <ScrollController> (updates scrollVelocity from Lenis)
      <Emblem> (layers proximity, flare, breath over base transforms)
        <motion.div> (wrapper with additive dynamics)
          <svg> (32 radial paths)
    <GlobalNav> (z-index above emblem, interactive)
```

### Motion Value Synchronization
```
OrbitSystem Motion Values (base state):
  x, y, z, scale, rotateX, rotateY, rotateZ, opacity, originX, originY

Emblem Additive Dynamics (micro-behaviors):
  proximityX, proximityY (added to base x, y)
  flareRotate, flareScale (multiplied with base rotateZ, scale)
  breathScale (multiplied with flare scale)

Final Transform = Base Transform + Proximity + Flare * Breath
```

## Architecture Documentation

**Recommendation**: Create `docs/architecture/emblem-dynamics.md` with:
- State machine diagram (active/attentive/resting/deepRest)
- Motion value data flow diagram
- Timeline showing breath + flare + proximity composition
- Performance profiling results

## Performance Guardrails

From story's "Performance & budgets" section:

- **GPU transforms only**: `transform`, `opacity` - no layout/paint triggers
- **No layout reads in rAF loops**: All position calculations use cached values
- **Batch per-radial transforms**: Single component render pass if implementing optional per-radial
- **Target 60 FPS**: Tail off springs quickly to avoid long tails
- **Global particle cap**: Remains 200 across site; emblem dynamics spawn no particles
- **Recenter timing**: Emblem recenters within 100ms after activity ends

## Accessibility Requirements

From story's "Accessibility" section:

- **Reduced motion**: Disable proximity drift, flare, and breath; keep emblem deterministic and static
  - Use existing `useReducedMotion` hook
  - Set all additive dynamics to 0 when `prefersReducedMotion === true`

- **Keyboard navigation**: No focus jumps caused by dynamic transforms
  - Keep nav focus rings stable
  - Emblem micro-movements must not affect focus management

- **Screen readers**: Do not encode critical meaning solely in motion
  - Emblem state changes should have equivalent text announcements if meaningful
  - Navigation structure remains semantic regardless of emblem position

- **ARIA attributes**: Emblem maintains existing `aria-label`, `aria-expanded` from GlobalNav integration

## Acceptance Criteria

From story's "Acceptance criteria" section:

- [x] **1. Proximity drift constraints**: ≤12px desktop, ≤6px touch; no conflict with GlobalNav hit testing
- [x] **2. Velocity flare limits**: Never exceeds +2.5 degrees rotation or +2% scale
- [x] **3. Idle breath parameters**: Amplitude ≤0.8% scale, frequency ≤0.25 Hz, gated by idle
- [x] **4. Reduced motion compliance**: All dynamics disabled under `prefers-reduced-motion`
- [x] **5. Transform stability**: No cumulative drift; emblem recenters within 100ms after activity ends
- [x] **6. Performance target**: 60 FPS on modern laptops; no animation blocks main thread >16ms on average

## Dependencies and Libraries

From PRD and story:

- **Framer Motion 11** - Springs (`useSpring`), motion values (`useMotionValue`, `useTransform`), `motion.div`
- **React 18** - Hooks (`useEffect`, `useRef`, `useCallback`)
- **OrbitSystem** - Existing context for `scrollVelocity`, `scrollProgress`
- **useReducedMotion** - Existing hook for accessibility gating

No new dependencies required.

## Notes and Considerations

### What We Cut for MVP
- ❌ **Dev Instrumentation** (Phase 3, Task 3.4) - Violates PRD "NO Testing Infrastructure"
- ❌ **Metrics/Logging systems** - Manual QA only per PRD
- ⚠️ **Per-radial micro-response** (Phase 2, Task 2.4) - Keep as optional/future

### Integration with Existing Systems
- Emblem dynamics are **additive** - they layer over OrbitSystem's primary state transformations
- During Hero assembly, clamp or disable micro-behaviors until state locks to avoid competing cues
- Theme flip and portal transitions must remain deterministic and unaffected

### Performance Considerations
- Global pointer listener is passive and throttled naturally by rAF
- Spring calculations are GPU-accelerated via Framer Motion
- Per-radial micro-responses (Phase 2 optional) add minimal overhead if batched in single render

### Future Enhancements (Not in Current Scope)
- Advanced per-radial orientation bias based on pointer angle quadrant
- Deep idle state (>8s) with reduced breath amplitude
- Touch gesture support (pinch, pan) for mobile interactivity

### Testing Strategy
- **Manual QA**: Test on various devices (desktop, tablet, mobile) for drift limits and spring feel
- **Accessibility audit**: Verify reduced motion disables all dynamics, keyboard nav unaffected
- **Performance profiling**: Use Chrome DevTools Performance tab to confirm 60 FPS, no jank
- **Cross-browser**: Test in Chrome, Firefox, Safari, Edge for spring behavior consistency

## Related Documentation

- **Story file**: `docs/stories/2. STORY-emblem-dynamics.md` (authoritative implementation guide)
- **PRD**: `docs/PRD-ORBIT-SYSTEM.md` (narrative structure, performance requirements)
- **OrbitSystem**: `src/context/OrbitSystem.tsx` (state machine and motion value API)
- **Emblem component**: `src/components/emblem/Emblem.tsx` (current implementation)
- **V1 patterns**: Hero section dynamic origin transforms (reference for pattern consistency)

---

**Project ID**: 3c6aeda4-d65b-40e9-a295-90ad77f2f442 (Orbit-Plus V3 Knowledge Collection)

*This plan is ready for execution with `/execute-plan PRPs/emblem-dynamics.md`*