# Hero Assembly Performance Budget

## Overview

This document defines the comprehensive performance budget for the Hero Assembly feature, including frame rates, memory usage, CPU/GPU budgets, particle counts, and optimization strategies. All measurements assume a **2019 MacBook Pro (mid-tier laptop)** as the baseline target device.

---

## Performance Targets (Acceptance Criteria)

From story file and PRD:

| Metric | Target | Maximum Acceptable | Measurement |
|--------|--------|-------------------|-------------|
| **Frame Rate** | 60 FPS | 30 FPS (transient dips) | Chrome DevTools Performance |
| **Frame Drop Tolerance** | 0 drops | 1 drop <32ms | requestAnimationFrame delta |
| **Interaction Response** | <50ms | <100ms | First scroll → animation start |
| **Time to First Lock (ttfl)** | 2.0s | 2.5s | First scroll → assembly lock |
| **Total Assembly Time** | 2.3s | 3.0s | First scroll → left-pin complete |
| **Memory Overhead** | <10 MB | <20 MB | Heap snapshot delta |
| **CPU Usage** | <30% | <50% | Chrome Task Manager |
| **GPU Usage** | <40% | <60% | GPU monitor (Activity Monitor on Mac) |

---

## Global Budget Allocations

### Particle Budget

**Global Limit**: ≤200 particles across entire application

**Hero Section Allocation**:
- **Phase 1 (MVP)**: 0 particles (radials only)
- **Phase 3 (Optional)**: ≤50 particles (particle ingress effect)

**Remaining Budget**: 150 particles for other sections (Positioning, Proof, Contact)

**Rationale**: Hero sets the tone—prioritize smooth radial animation over particle quantity

---

### Element Count Budget

| Element Type | Count | GPU Load | Notes |
|--------------|-------|----------|-------|
| **SVG Radial Paths** | 32 | Medium | Animated with `transform` only |
| **Headline Text** | 1 | Low | Opacity/scale animation |
| **SVG Mask Paths** (Phase 2) | 32 | Medium-High | `pathLength` animation |
| **Particles** (Phase 3) | 0-50 | Medium | Optional enhancement |
| **Audio Context** (Phase 3) | 1 | Low | Single Tone.js synth |

**Total Animating Elements**: 33-115 (depending on phase)

---

### Animation Concurrency Budget

**Simultaneous Animations**:
- **T=100ms**: 32 radials start staggered animation (0-384ms spread)
- **T=600ms**: Headline animation begins (overlaps with radials)
- **Peak Concurrency (T=600-1200ms)**: 33 elements animating simultaneously

**GPU Workload Calculation**:
```
32 radials × 4 transforms each (x, y, scale, rotate) = 128 GPU ops/frame
1 headline × 3 transforms (opacity, scale, y) = 3 GPU ops/frame
--------------------------------------------------------------
Total: 131 GPU ops/frame (acceptable on modern GPUs)
```

**Optimization**: Use `will-change: transform, opacity` to hint browser for GPU layer promotion

---

## Frame-by-Frame Performance Budget

### Frame Budget Breakdown (60 FPS = 16.67ms per frame)

```
Frame Time Budget: 16.67ms
├─ JavaScript Execution:    3ms  (18%)
├─ Style Recalculation:     1ms  (6%)
├─ Layout:                  0ms  (0% - avoid layout!)
├─ Paint:                   2ms  (12%)
├─ Composite Layers:        8ms  (48%)
└─ Browser Overhead:        2.67ms (16%)
```

### Critical Path Timeline (per frame during assembly)

```
0ms     ├─ requestAnimationFrame callback fires
0-3ms   ├─ JS: Calculate motion value updates
        │  - Read scrollProgress
        │  - Update 32 radial transforms
        │  - Update headline opacity/scale
        │
3-4ms   ├─ Style: Recalculate styles for changed elements
        │  - Apply transform matrices
        │  - Update opacity values
        │
4-4ms   ├─ Layout: NONE (all GPU transforms)
        │
4-6ms   ├─ Paint: Rasterize changed layers
        │  - Radial paths (if not cached)
        │  - Headline text (if opacity changed)
        │
6-14ms  ├─ Composite: Blend GPU layers
        │  - 32 radial layers
        │  - 1 headline layer
        │  - Background layers
        │
14-16.67ms └─ Browser: Overhead + vsync wait
```

---

## GPU Transform Budget

### Allowed Properties (GPU-Accelerated)

✅ **Use These**:
- `transform: translate(X, Y, Z)` - 2D/3D positioning
- `transform: scale(X, Y)` - Uniform or non-uniform scaling
- `transform: rotate(Xdeg, Ydeg, Zdeg)` - 2D/3D rotation
- `opacity` - Transparency
- `filter: blur()` - Gaussian blur (use sparingly)

❌ **Avoid These** (trigger layout/paint):
- `top`, `left`, `right`, `bottom` - Layout properties
- `width`, `height` - Layout properties
- `margin`, `padding` - Layout properties
- `color`, `background-color` - Paint properties (unless changing opacity)

### Per-Element Transform Budget

**32 Radial Paths**:
```typescript
// Each radial animates 4 properties
{
  x: 0-800px,           // translateX
  y: 0-800px,           // translateY
  scale: 0.5-1.0,       // scale
  rotate: 45deg-0deg    // rotateZ
  opacity: 0-1          // opacity
}

// Total: 5 GPU properties × 32 paths = 160 GPU operations/frame
```

**1 Headline**:
```typescript
{
  opacity: 0-1,         // opacity
  scale: 0.98-1.0,      // scale
  y: 10px-0px           // translateY
}

// Total: 3 GPU properties × 1 element = 3 GPU operations/frame
```

**Grand Total**: 163 GPU operations per frame (well within budget)

---

## Memory Budget

### Heap Memory Allocation

**Baseline (Hero Section Loaded, Pre-Assembly)**:
```
OrbitSystem Context:      ~2 MB
Emblem Component:         ~1 MB
  - EMBLEM_PATHS data:    ~50 KB
  - Motion values:        ~20 KB
  - React component:      ~1 MB
Lenis Instance:           ~500 KB
--------------------------------------
Total Baseline:           ~3.5 MB
```

**During Assembly**:
```
Animation Frame Callbacks:  ~500 KB
Radial Transform Caches:    ~200 KB
Headline Animation State:   ~100 KB
Stagger Delay Arrays:       ~10 KB
--------------------------------------
Assembly Overhead:          ~810 KB
```

**Peak Memory (Assembly + Particles Phase 3)**:
```
Baseline:                   3.5 MB
Assembly Overhead:          0.8 MB
Particle System (50):       ~2 MB
--------------------------------------
Total Peak:                 ~6.3 MB
```

**Budget Status**: ✅ Well under 10 MB target

---

### Garbage Collection Pressure

**GC Triggers to Avoid**:
1. Creating objects in animation loops
2. Allocating large arrays each frame
3. String concatenation in hot paths

**Mitigation Strategies**:
```typescript
// ✅ GOOD: Pre-allocate arrays
const radialTransforms = new Array(32).fill(null).map(() => ({
  x: 0, y: 0, scale: 1, rotate: 0, opacity: 1
}));

// ❌ BAD: Allocate new array each frame
const radialTransforms = EMBLEM_PATHS.map(() => ({
  x: 0, y: 0, scale: 1, rotate: 0, opacity: 1
}));

// ✅ GOOD: Reuse objects
const updateTransform = (transform, values) => {
  transform.x = values.x;
  transform.y = values.y;
  // ...
};

// ❌ BAD: Create new objects
const updateTransform = (values) => {
  return { x: values.x, y: values.y, /* ... */ };
};
```

---

## CPU Budget

### JavaScript Execution Time Budget

**Per Animation Frame**: ≤3ms

**Breakdown**:
```
Motion Value Updates:        1.5ms  (50%)
├─ Read scrollProgress:      0.1ms
├─ Calculate 32 radial pos:  1.0ms
└─ Update Framer Motion:     0.4ms

Stagger Calculations:        0.3ms  (10%)
├─ getDelay(index):          0.2ms
└─ Easing functions:         0.1ms

Event Handling:              0.5ms  (16%)
├─ Scroll event:             0.3ms
└─ First-scroll check:       0.2ms

React Reconciliation:        0.5ms  (16%)
├─ Component re-render:      0.4ms
└─ Virtual DOM diff:         0.1ms

Instrumentation:             0.2ms  (8%)
├─ performance.now():        0.1ms
└─ Event emitters:           0.1ms
```

**Total**: 3.0ms (18% of 16.67ms frame budget)

---

### Optimization Strategies

#### 1. Memoization
```typescript
// Cache expensive calculations
const radialPositions = useMemo(() => {
  return EMBLEM_PATHS.map((path, i) => {
    const angle = (i / 32) * Math.PI * 2;
    return {
      startX: Math.cos(angle) * 800,
      startY: Math.sin(angle) * 800,
      angle
    };
  });
}, []); // Only calculate once
```

#### 2. RAF Throttling
```typescript
// Limit updates to 60 FPS max
let rafId: number | null = null;

const updateAnimation = () => {
  if (rafId) return; // Already scheduled

  rafId = requestAnimationFrame(() => {
    // Update logic...
    rafId = null;
  });
};
```

#### 3. Avoid Layout Thrashing
```typescript
// ✅ GOOD: Batch reads, then batch writes
const scrollY = window.scrollY; // Read
const progress = scrollY / maxScroll; // Calculate

motionValues.forEach((mv, i) => {
  mv.set(calculate(progress, i)); // Write
});

// ❌ BAD: Interleave reads and writes
motionValues.forEach((mv, i) => {
  const scrollY = window.scrollY; // Read
  mv.set(calculate(scrollY, i));  // Write (triggers layout)
});
```

---

## Network & Asset Budget

### Asset Sizes

| Asset | Size | Load Timing | Notes |
|-------|------|-------------|-------|
| **React + Framer Motion Bundle** | ~150 KB gzipped | Critical path | Already loaded by app |
| **Lenis** | ~15 KB gzipped | Critical path | Already loaded by app |
| **EMBLEM_PATHS** | ~5 KB | Critical path | Inline in bundle |
| **Tone.js** (Phase 3) | ~50 KB gzipped | Lazy load | Only if audio enabled |
| **Hero Component** | ~10 KB gzipped | Critical path | Inline in bundle |

**Total Critical Path**: ~180 KB (acceptable)

**Lazy-Loaded**: ~50 KB (Tone.js)

---

### Code Splitting Strategy

**Critical (Inline in Main Bundle)**:
- OrbitSystem context
- Emblem component
- Hero section
- ScrollController
- LenisProvider

**Lazy-Loaded (Phase 3)**:
```typescript
const AudioFeedback = lazy(() => import('@/utils/audioFeedback'));

// Only load if audio enabled and user gesture occurred
if (audioEnabled && userGesture) {
  const { playLockSound } = await import('@/utils/audioFeedback');
  playLockSound();
}
```

---

## Phase-Specific Budgets

### Phase 1: MVP (No Mask, No Audio, No Particles)

| Metric | Budget | Status |
|--------|--------|--------|
| **Animating Elements** | 33 | ✅ Low |
| **GPU Operations/Frame** | 163 | ✅ Acceptable |
| **Peak Memory** | 4.3 MB | ✅ Well under limit |
| **CPU Time/Frame** | 3.0 ms | ✅ 18% of budget |
| **Asset Size** | 180 KB | ✅ Minimal |

**Risk Level**: 🟢 **Low** - Simple animation, well-optimized

---

### Phase 2: SVG Mask Reveal

**Added Complexity**:
- 32 additional SVG mask paths
- `pathLength` animation per path
- SVG rendering overhead

| Metric | Budget | Status |
|--------|--------|--------|
| **Animating Elements** | 65 (33 + 32) | ✅ Medium |
| **GPU Operations/Frame** | 195 (+32) | ✅ Still acceptable |
| **Peak Memory** | 5.5 MB (+1.2 MB) | ✅ Under limit |
| **CPU Time/Frame** | 4.5 ms (+1.5 ms) | ⚠️ 27% of budget |
| **Asset Size** | 185 KB (+5 KB) | ✅ Minimal increase |

**Risk Level**: 🟡 **Medium** - SVG pathLength can be expensive; test on target devices

**Mitigation**:
- Simplify mask paths if needed (fewer points)
- Consider circular mask fallback for low-end devices
- Profile on 2019 MacBook Pro

---

### Phase 3: Full Polish (Audio + Particles)

**Added Complexity**:
- 50 particles (optional)
- Tone.js audio context
- Particle physics calculations

| Metric | Budget | Status |
|--------|--------|--------|
| **Animating Elements** | 115 (65 + 50) | ⚠️ High |
| **GPU Operations/Frame** | 245 (+50) | ⚠️ Approaching limit |
| **Peak Memory** | 6.3 MB (+0.8 MB) | ✅ Under 10 MB |
| **CPU Time/Frame** | 6.0 ms (+1.5 ms) | ⚠️ 36% of budget |
| **Asset Size** | 235 KB (+50 KB) | ✅ Still acceptable |

**Risk Level**: 🟡 **Medium-High** - Particle system adds significant load

**Mitigation**:
- Reduce particle count to 30-40 if needed
- Use instanced rendering (THREE.InstancedMesh if using R3F)
- Profile heavily on target devices
- Provide opt-out for low-end devices

---

## Device-Specific Budgets

### Target: 2019 MacBook Pro (Baseline)

**Specs**:
- CPU: Intel i5 8th gen (quad-core)
- GPU: Intel UHD 630
- RAM: 8 GB

**Budgets** (as defined above)

---

### High-End Devices (2023+ MacBook Pro M2/M3)

**Can Afford**:
- 2x particle count (100 particles)
- Higher stagger frequency (5ms instead of 12ms)
- More complex SVG masks
- 4K display rendering

**Adjusted Budgets**:
- Frame Rate: 120 FPS target (ProMotion displays)
- CPU Time/Frame: ≤8ms (adjust for 120 Hz)
- GPU Operations: 400+/frame (powerful GPU)

---

### Low-End Devices (2016-2018 Laptops, Tablets)

**Constraints**:
- Weaker GPUs (Intel HD 520)
- Less RAM (4-8 GB)
- Possible thermal throttling

**Adjusted Budgets**:
- Frame Rate: 30 FPS acceptable
- Particle count: 0 (skip particles)
- Mask: Simplified circular mask or skip
- Stagger: Reduce to 20ms (fewer concurrent animations)

**Detection**:
```typescript
const isLowEnd = () => {
  const ua = navigator.userAgent;
  const memory = (navigator as any).deviceMemory; // GB

  // Heuristics
  if (memory && memory < 6) return true;
  if (ua.includes('iPad') || ua.includes('Android')) return true;

  return false;
};

if (isLowEnd()) {
  // Use simplified animation
  skipParticles = true;
  simplifyMask = true;
}
```

---

## Monitoring & Instrumentation

### Performance Metrics to Track

**Real-Time (During Development)**:
```typescript
// Frame rate monitoring
let lastFrameTime = performance.now();
let frameCount = 0;
let fps = 60;

const measureFPS = () => {
  const now = performance.now();
  const delta = now - lastFrameTime;

  frameCount++;

  if (delta >= 1000) {
    fps = Math.round((frameCount * 1000) / delta);
    console.log(`FPS: ${fps}`);
    frameCount = 0;
    lastFrameTime = now;
  }

  requestAnimationFrame(measureFPS);
};

if (process.env.NODE_ENV === 'development') {
  measureFPS();
}
```

**Time-to-First-Lock (ttfl)**:
```typescript
performance.mark('hero_assembly_start');

// ... assembly animation ...

performance.mark('hero_assembly_lock');
const ttfl = performance.measure('ttfl', 'hero_assembly_start', 'hero_assembly_lock');

console.log(`Time to First Lock: ${ttfl.duration}ms`);
emit('hero_assembly_metrics', { ttfl: ttfl.duration });
```

**Memory Usage**:
```typescript
// Heap snapshot delta
if ((performance as any).memory) {
  const memoryBefore = (performance as any).memory.usedJSHeapSize;

  // ... assembly animation ...

  const memoryAfter = (performance as any).memory.usedJSHeapSize;
  const delta = (memoryAfter - memoryBefore) / 1024 / 1024; // MB

  console.log(`Memory Delta: ${delta.toFixed(2)} MB`);
}
```

---

### Production Monitoring (Phase 3)

**Analytics Events**:
```typescript
// Send to analytics service
analytics.track('hero_assembly_complete', {
  ttfl: ttfl.duration,
  totalTime: totalTime.duration,
  frameDrops: frameDropCount,
  deviceType: isLowEnd() ? 'low' : 'high',
  reducedMotion: prefersReducedMotion
});
```

**Performance Budgets in CI**:
```javascript
// Lighthouse CI config
module.exports = {
  ci: {
    collect: {
      numberOfRuns: 3,
      settings: {
        onlyCategories: ['performance'],
        throttlingMethod: 'simulate',
        throttling: {
          cpuSlowdownMultiplier: 2 // Simulate low-end
        }
      }
    },
    assert: {
      assertions: {
        'first-contentful-paint': ['error', { maxNumericValue: 2000 }],
        'speed-index': ['error', { maxNumericValue: 3500 }],
        'time-to-interactive': ['error', { maxNumericValue: 5000 }]
      }
    }
  }
};
```

---

## Optimization Checklist

### Pre-Launch QA

- [ ] **Frame Rate**: Verified 60 FPS on 2019 MacBook Pro
- [ ] **Frame Drops**: ≤1 drop >32ms during assembly
- [ ] **CPU Usage**: ≤30% average during assembly
- [ ] **GPU Usage**: ≤40% average during assembly
- [ ] **Memory**: Peak heap ≤10 MB (DevTools Memory Profiler)
- [ ] **ttfl**: Time-to-first-lock ≤2.5s
- [ ] **Asset Size**: Critical path ≤200 KB gzipped
- [ ] **Layout Thrashing**: 0 layout recalculations (Performance tab)
- [ ] **Particles**: ≤50 active (if Phase 3 enabled)
- [ ] **Reduced Motion**: Falls back to <300ms simple animation
- [ ] **Low-End Devices**: Graceful degradation tested

---

### Runtime Optimization Flags

```typescript
// Feature flags for performance tuning
const PERF_CONFIG = {
  enableParticles: !isLowEnd(),
  enableAudio: !prefersReducedMotion && !isMobile(),
  enableComplexMask: !isLowEnd(),
  staggerDelay: isLowEnd() ? 20 : 12, // ms
  particleCount: isLowEnd() ? 0 : 50,
  maxConcurrentAnimations: isLowEnd() ? 16 : 32
};
```

---

## Budget Violation Handling

### Exceeding Frame Budget (>16.67ms)

**Detection**:
```typescript
const frameBudget = 16.67; // ms

const checkFrameBudget = () => {
  const frameTime = performance.now() - lastFrameTime;

  if (frameTime > frameBudget) {
    console.warn(`Frame budget exceeded: ${frameTime.toFixed(2)}ms`);
    frameViolations++;

    if (frameViolations > 5) {
      // Degrade performance
      enablePerformanceMode();
    }
  }
};
```

**Automatic Degradation**:
```typescript
const enablePerformanceMode = () => {
  // Reduce particle count
  particleCount = Math.floor(particleCount * 0.5);

  // Simplify mask
  useSimplifiedMask = true;

  // Increase stagger delay (fewer concurrent animations)
  staggerDelay *= 1.5;

  console.log('Performance mode enabled');
};
```

---

### Exceeding Memory Budget (>10 MB)

**Detection**:
```typescript
if ((performance as any).memory) {
  const heapUsed = (performance as any).memory.usedJSHeapSize / 1024 / 1024;

  if (heapUsed > 10) {
    console.warn(`Memory budget exceeded: ${heapUsed.toFixed(2)} MB`);
    // Trigger cleanup
    cleanupResources();
  }
}
```

**Cleanup Strategy**:
```typescript
const cleanupResources = () => {
  // Remove particles
  if (particleSystem) {
    particleSystem.dispose();
    particleSystem = null;
  }

  // Clear animation caches
  animationCache.clear();

  // Force garbage collection (if available)
  if ((window as any).gc) {
    (window as any).gc();
  }
};
```

---

## References

- **Story File**: `docs/stories/1. STORY-hero-assembly.md` (Performance Budget section)
- **PRD**: `docs/PRD-ORBIT-SYSTEM.md` (Performance Requirements, Optimization Strategies)
- **Implementation Plan**: `PRPs/hero-assembly.md` (Performance Guardrails)
- **State Machine**: `docs/architecture/hero-assembly-state-machine.md`
- **Motion Timeline**: `docs/architecture/hero-assembly-motion-timeline.md`
- **Interaction Flow**: `docs/architecture/hero-assembly-interaction-flow.md`

---

## Appendix: Profiling Guide

### Chrome DevTools Performance Profiling

**Steps**:
1. Open DevTools → Performance tab
2. Enable "Screenshots" and "Memory"
3. Click Record
4. Trigger first scroll (assembly)
5. Wait for assembly to complete (~2.5s)
6. Stop recording

**What to Look For**:
- **FPS graph**: Should stay green (60 FPS)
- **CPU usage**: Should stay below 50% (yellow/orange bars)
- **Layout** (purple): Should be minimal or zero
- **Paint** (green): Should be minimal
- **Composite** (teal): Expected to be high (GPU work)

**Red Flags**:
- Red bars in FPS graph (dropped frames)
- Purple bars (layout thrashing)
- Long tasks >50ms (blocking main thread)

---

### Memory Profiling

**Steps**:
1. DevTools → Memory tab
2. Take Heap Snapshot (before assembly)
3. Trigger assembly
4. Take Heap Snapshot (after assembly)
5. Compare snapshots

**Budget Check**:
- Delta should be ≤10 MB
- No detached DOM trees (memory leaks)
- Animation frames should be cleaned up

---

**End of Performance Budget Document**