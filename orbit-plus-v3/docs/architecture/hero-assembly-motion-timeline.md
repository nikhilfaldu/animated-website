# Hero Assembly Motion Choreography Timeline

## Overview

This document details the precise timing, sequencing, and synchronization of all animated elements during the Hero Assembly sequence. Use this as the authoritative reference for animation implementation and QA validation.

---

## Visual Timeline

```
T=0ms        First Scroll Detected
             ↓
             ├─ Emit 'hero_assembly_started' event
             └─ Begin assembly animation

T=0-100ms    Response & Setup
             ↓
             ├─ OrbitSystem.animateTo('assembly', 1.2)
             ├─ Calculate radial start positions
             └─ Initialize headline animation

T=100ms      First Radials Begin Moving (quadrant 1, radials 0-7)
             ↓
             └─ Radial animation: dispersed → center
                - Duration: 1.2s (1200ms)
                - Easing: cubic-bezier(0.25, 0.46, 0.45, 0.94)

T=112ms      Quadrant 2 radials begin (radials 8-15)
             └─ Stagger delay: +12ms from previous

T=124ms      Quadrant 3 radials begin (radials 16-23)
             └─ Stagger delay: +12ms from previous

T=136ms      Quadrant 4 radials begin (radials 24-31)
             └─ Stagger delay: +12ms from previous

T=484ms      Last radial finishes stagger start (100ms + 384ms spread)
             ↓
             └─ All radials now in motion

T=600ms      Headline Reveal Begins (50% assembly progress)
             ↓
             ├─ Phase 1: Opacity 0 → 1 (600ms)
             ├─ Phase 1: Scale 0.98 → 1.0 (600ms)
             ├─ Phase 1: Y 10px → 0px (600ms)
             └─ Phase 2: SVG mask pathLength 0 → 1 (700ms, staggered)

T=1200ms     Headline Fully Visible (Phase 1)
             ↓
             └─ Headline opacity = 1, scale = 1, y = 0

T=1300ms     Assembly Complete - All Radials Locked
             ↓
             ├─ assemblyProgress = 1.0
             ├─ Radials snap to final position (spring overshoot)
             ├─ Emit 'hero_assembly_locked' event
             └─ Trigger audio feedback (Phase 3)

T=1300-1350ms Spring Overshoot (subtle bounce)
             ↓
             └─ Spring: stiffness=300, damping=20 (ζ ≈ 0.65)

T=1350ms     Headline Fully Revealed (Phase 2 with mask)
             ↓
             └─ Emit 'hero_headline_revealed' event

T=1500ms     Begin Left-Pin Transition (auto-advance or scroll trigger)
             ↓
             ├─ Origin X: 50 → 0 (800ms)
             ├─ Origin Y: 50 (no change)
             ├─ X: compensate for origin shift (800ms)
             └─ Scale: 4 → 12 (800ms)

T=2300ms     Left-Pin Complete
             ↓
             ├─ Emblem at final hero pose
             ├─ Ready for scroll-driven orbit
             └─ Total time-to-first-lock (ttfl): 2.3s

T=2300ms+    Ready for Orbit State
             ↓
             └─ Monitor scrollProgress > 20% for Act 2 transition
```

---

## Detailed Animation Sequences

### 1. Radial Ingress (T=100ms - T=1300ms)

**Total Duration**: 1.2s per radial
**Stagger Spread**: 384ms (32 radials × 12ms)
**Overall Duration**: 1.484s (100ms + 1.2s + 184ms overshoot)

#### Per-Radial Animation Properties

| Property | From | To | Duration | Easing |
|----------|------|-----|----------|--------|
| **Position X** | `cos(angle) × 800px` | `0px` | 1200ms | cubic-bezier(0.25, 0.46, 0.45, 0.94) |
| **Position Y** | `sin(angle) × 800px` | `0px` | 1200ms | cubic-bezier(0.25, 0.46, 0.45, 0.94) |
| **Scale** | `0.5` | `1.0` | 1200ms | cubic-bezier(0.25, 0.46, 0.45, 0.94) |
| **Opacity** | `0` | `1.0` | 250ms | easeOut |
| **Rotate** | `45deg` | `0deg` | 600ms | cubic-bezier(0.25, 0.46, 0.45, 0.94) |

#### Stagger Pattern (Quadrant-Based)

```javascript
const quadrants = [
  [0, 1, 2, 3, 4, 5, 6, 7],       // Q1: Top-right
  [8, 9, 10, 11, 12, 13, 14, 15], // Q2: Bottom-right
  [16, 17, 18, 19, 20, 21, 22, 23], // Q3: Bottom-left
  [24, 25, 26, 27, 28, 29, 30, 31]  // Q4: Top-left
];

// Stagger within each quadrant
const getDelay = (index) => {
  const quadrantIndex = Math.floor(index / 8);
  const intraQuadrantIndex = index % 8;

  // Quadrants start slightly offset
  const quadrantOffset = quadrantIndex * 12; // 0, 12, 24, 36ms

  // Within quadrant, random-ish order to avoid linear wipe
  const shuffledOrder = [0, 4, 2, 6, 1, 5, 3, 7];
  const actualDelay = shuffledOrder[intraQuadrantIndex] * 12;

  return quadrantOffset + actualDelay;
};
```

#### Gravitational Arc Path

Radials don't travel in straight lines—they follow a subtle arc (gravitational curve):

```javascript
// Bezier control points for arc
const startX = cos(angle) * 800;
const startY = sin(angle) * 800;
const controlX = cos(angle) * 400 + sin(angle) * 50;  // Slight perpendicular offset
const controlY = sin(angle) * 400 - cos(angle) * 50;
const endX = 0;
const endY = 0;

// Framer Motion path animation
<motion.path
  animate={{
    d: [
      `M ${startX} ${startY}`,
      `Q ${controlX} ${controlY}, ${endX} ${endY}`
    ]
  }}
  transition={{
    duration: 1.2,
    ease: [0.25, 0.46, 0.45, 0.94]
  }}
/>
```

---

### 2. Headline Reveal (T=600ms - T=1200ms)

**Start Trigger**: `assemblyProgress >= 0.5` (radials 50% converged)
**Duration**: 600ms (Phase 1) | 700ms (Phase 2 with mask)

#### Phase 1: Simple Fade/Scale (MVP)

| Property | From | To | Duration | Easing |
|----------|------|-----|----------|--------|
| **Opacity** | `0` | `1.0` | 600ms | easeOut |
| **Scale** | `0.98` | `1.0` | 600ms | easeOut |
| **Translate Y** | `10px` | `0px` | 600ms | easeOut |

```typescript
const headlineVariants = {
  hidden: { opacity: 0, scale: 0.98, y: 10 },
  visible: {
    opacity: 1,
    scale: 1.0,
    y: 0,
    transition: {
      duration: 0.6,
      ease: 'easeOut'
    }
  }
};
```

#### Phase 2: SVG Mask Reveal (Enhanced)

**Mask Type**: 32 radial paths matching `EMBLEM_PATHS`

**Per-Mask-Path Animation**:

| Property | From | To | Duration | Easing |
|----------|------|-----|----------|--------|
| **pathLength** | `0` | `1.0` | 700ms | easeOut |
| **Opacity** | `0` | `1.0` | 250ms | easeOut |

**Stagger**: Same 12ms pattern as radials (synchronized)

```typescript
const maskVariants = {
  hidden: (i) => ({
    pathLength: 0,
    opacity: 0
  }),
  visible: (i) => ({
    pathLength: 1,
    opacity: 1,
    transition: {
      pathLength: { duration: 0.7, ease: 'easeOut', delay: getDelay(i) / 1000 },
      opacity: { duration: 0.25, ease: 'easeOut', delay: getDelay(i) / 1000 }
    }
  })
};
```

---

### 3. Assembly Lock & Spring Overshoot (T=1300ms - T=1350ms)

**Purpose**: Subtle tactile feedback—radials "snap" into final position with spring physics

**Spring Configuration** (Framer Motion):
```typescript
const springConfig = {
  type: 'spring',
  stiffness: 300,
  damping: 20,    // ζ ≈ 0.65 (slight underdamping)
  mass: 1
};
```

**Visual Effect**:
- Radials overshoot final position by ~2%
- Settle within 50ms (1-2 oscillations)
- Feels "magnetic" or "locked"

**Amplitude Clamping**: Prevent excessive bounce

```typescript
const clampedSpring = {
  ...springConfig,
  // Clamp final position to prevent drift
  onUpdate: (latest) => {
    if (Math.abs(latest - target) < 0.5) {
      controls.stop();
      controls.set(target);
    }
  }
};
```

---

### 4. Audio Feedback (T=1300ms, Phase 3)

**Trigger**: Assembly lock complete (`assemblyProgress === 1.0`)

**Audio Specification** (Tone.js):
```javascript
const synth = new Tone.Synth({
  oscillator: { type: 'sine' },
  envelope: {
    attack: 0.005,
    decay: 0.1,
    sustain: 0.3,
    release: 0.05
  }
}).toDestination();

// Play sub-bass "lock"
synth.triggerAttackRelease('C2', '0.15', Tone.now(), 0.3); // ~65 Hz, 150ms, volume 0.3
```

**Conditional Playback**:
- ❌ Skip if `prefers-reduced-motion`
- ❌ Skip on mobile by default (autoplay policy)
- ✅ Play only after user gesture (first scroll counts)

---

### 5. Left-Pin Origin Transition (T=1500ms - T=2300ms)

**Total Duration**: 800ms
**Easing**: `cubic-bezier(0.33, 1, 0.68, 1)` (perpetual motion)

#### Transform Properties

| Property | From | To | Duration | Easing |
|----------|------|-----|----------|--------|
| **originX** | `50` (center) | `0` (left edge) | 800ms | cubic-bezier(0.33, 1, 0.68, 1) |
| **originY** | `50` | `50` (no change) | — | — |
| **X Position** | `startX` | `compensatedX` | 800ms | cubic-bezier(0.33, 1, 0.68, 1) |
| **Scale** | `4` | `12` | 800ms | cubic-bezier(0.33, 1, 0.68, 1) |

#### Origin Compensation Logic

**Challenge**: Changing `transform-origin` shifts the element's visual position

**Solution**: Compensate with `translateX` to maintain visual continuity

```typescript
const leftPinTransition = () => {
  const progress = 0; // Animate 0 → 1 over 800ms
  const eased = cubicBezier(0.33, 1, 0.68, 1)(progress);

  const originX = lerp(50, 0, eased);     // 50% → 0%
  const scale = lerp(4, 12, eased);       // 4x → 12x

  // Calculate compensation
  // When origin moves left, element shifts right visually
  // Compensate by translating left
  const originShift = (50 - originX) / 100; // 0 → 0.5 (50% shift)
  const elementWidth = emblemSize * scale;
  const compensation = -originShift * elementWidth;

  const x = initialX + compensation;

  return { originX, scale, x };
};
```

---

## Reduced Motion Timeline

When `prefers-reduced-motion: reduce` is detected, use this simplified timeline:

```
T=0ms        First Scroll Detected
             ↓
             └─ Emit 'hero_assembly_started' event

T=0-50ms     Instant State Change
             ↓
             ├─ OrbitSystem.setState('assembly') [no animation]
             ├─ Radials: instant snap to center (no travel)
             └─ Emblem: opacity = 1, scale = 1

T=50ms       Headline Simple Fade Begins
             ↓
             ├─ Opacity: 0 → 1
             ├─ Scale: 0.98 → 1.0
             └─ Duration: 240ms

T=290ms      Headline Fully Visible
             ↓
             ├─ Emit 'hero_headline_revealed' event
             └─ Emit 'hero_assembly_locked' event

T=290ms      Left-Pin Transition (Instant)
             ↓
             ├─ Origin X: 50 → 0 (instant)
             ├─ Scale: 4 → 12 (instant)
             └─ Ready for orbit

Total Duration: ~300ms (vs. 2.3s full animation)
```

---

## Synchronization Points

### Critical Sync Requirements

1. **Radial Stagger ↔ Mask Stagger**
   - Both use identical `getDelay(index)` function
   - Ensures headline reveals "through" radials (not before/after)

2. **Assembly Progress ↔ Headline Reveal**
   - Headline starts at 50% assembly (`progress >= 0.5`)
   - Prevents headline appearing before radials have converged

3. **Assembly Lock ↔ Audio Feedback**
   - Audio fires exactly when `assemblyProgress === 1.0`
   - No premature or delayed audio (feels laggy)

4. **Left-Pin ↔ Scroll Readiness**
   - Left-pin completes before enabling orbit transition
   - Prevents jarring mid-transition state changes

---

## Performance Timing Constraints

### Frame Budget Analysis (60 FPS = 16.67ms per frame)

| Animation Phase | Duration | Frame Count | Complexity | Risk Level |
|----------------|----------|-------------|------------|-----------|
| **First Scroll Response** | 100ms | 6 frames | Low | 🟢 Low |
| **Radial Ingress** | 1200ms | 72 frames | High (32 paths) | 🟡 Medium |
| **Headline Reveal** | 600ms | 36 frames | Low | 🟢 Low |
| **Spring Overshoot** | 50ms | 3 frames | Medium | 🟡 Medium |
| **Audio Trigger** | 1ms | <1 frame | Low | 🟢 Low |
| **Left-Pin Transition** | 800ms | 48 frames | Medium | 🟢 Low |

**Total Frame Budget**: 165 frames over 2.75s

### Acceptable Frame Drops

Per acceptance criteria: **One minor hitch (<32ms) allowed** during assembly

**Most Likely Hitch Points**:
1. First scroll detection (JavaScript → GPU handoff)
2. 32 radials starting animation simultaneously (GPU load)
3. SVG mask pathLength calculation (if mask is complex)

**Mitigation**:
- Use `will-change: transform, opacity` on radials
- Pre-calculate stagger delays (no runtime computation)
- Simplify SVG mask paths if needed (Phase 2 optimization)

---

## QA Validation Checklist

### Timing Accuracy
- [ ] Assembly triggers within 100ms of first scroll
- [ ] Radial stagger is perceptibly even (no "clumps")
- [ ] Headline reveals at ~50% assembly (visual sync)
- [ ] Audio "lock" fires at assembly completion (no delay)
- [ ] Left-pin transition feels smooth (no jump)
- [ ] Total ttfl is 2.0-2.5s (within acceptable range)

### Synchronization
- [ ] Radials and mask stagger match perfectly
- [ ] Headline doesn't appear before radials converge
- [ ] Audio doesn't play prematurely
- [ ] Left-pin doesn't start before assembly locks

### Performance
- [ ] 60 FPS maintained on modern laptop
- [ ] No more than one frame drop >32ms
- [ ] GPU usage stays reasonable (<50% on mid-tier GPU)
- [ ] No layout thrashing (check DevTools Performance tab)

### Reduced Motion
- [ ] Assembly completes in <300ms
- [ ] No radial travel or stagger
- [ ] Simple headline fade (240ms)
- [ ] No audio feedback

---

## Instrumentation Timing Events

For analytics and performance monitoring:

```typescript
// T=0ms
performance.mark('hero_assembly_start');
emit('hero_assembly_started');

// T=1300ms
performance.mark('hero_assembly_lock');
emit('hero_assembly_locked');
const ttfl = performance.measure('ttfl', 'hero_assembly_start', 'hero_assembly_lock');
console.log(`Time to First Lock: ${ttfl.duration}ms`);

// T=1350ms
performance.mark('hero_headline_reveal');
emit('hero_headline_revealed');

// T=2300ms
performance.mark('hero_left_pin_complete');
const totalTime = performance.measure('assembly_total', 'hero_assembly_start', 'hero_left_pin_complete');
console.log(`Total Assembly Time: ${totalTime.duration}ms`);
```

---

## References

- **Story File**: `docs/stories/1. STORY-hero-assembly.md` (Motion Language section)
- **PRD**: `docs/PRD-ORBIT-SYSTEM.md` (Motion Language, Performance Requirements)
- **Implementation Plan**: `PRPs/hero-assembly.md` (Motion Language section)
- **State Machine**: `docs/architecture/hero-assembly-state-machine.md`
