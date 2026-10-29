# Global Canvas Implementation Guide

## Overview

This document outlines the complete implementation for integrating a persistent WebGL canvas, tunnel transitions, Services refactor, and Process emblem entrance. The implementation creates a seamless scroll-driven narrative where users pass *through* the emblem to transition between color worlds.

**Core narrative:** You don't watch the brand. You move through it.

---

## Important Guidelines

### Legacy Policy
**No files are to be deleted entirely.** All replaced or deprecated files must be moved to a `legacy/` folder in the appropriate location. This preserves code blocks for future reference.

- Component-level legacy: `/src/components/{component}/legacy/`
- Section-level legacy: `/src/sections/{section}/legacy/`
- Top-level legacy: `/src/legacy/`

### File Action Legend
Throughout this document, actions are marked as:
- **CREATE** - New file, no equivalent exists
- **EXTRACT** - Move existing code from one file to a new dedicated file
- **MIGRATE** - Port existing implementation to new location/architecture
- **REVISE** - Modify existing file in place
- **SIMPLIFY** - Remove functionality from existing file (moved elsewhere)

---

## Codebase Analysis Summary

Before implementation, an analysis was conducted comparing this spec to the existing codebase. Key findings:

| Proposed | Actual Status | Action Required |
|----------|---------------|-----------------|
| `scrollRanges.ts` | Constants exist in `ScrollController.tsx` (lines 51-75) | EXTRACT |
| `ApertureScene.tsx` | Full implementation in `/src/components/emblem/ApertureEmblem/` | MIGRATE |
| `GlobalCanvas.tsx` | No equivalent | CREATE |
| `useSceneVisibility.ts` | No equivalent | CREATE |
| `TunnelIn/Out` sections | No equivalent | CREATE |
| Tunnel shaders | 9-scene shader exists in `/src/shaders/tunnel/` | REFERENCE |

---

## Architecture

```
App.tsx
├── OrbitSystemProvider (context)
├── GlobalCanvas ─────────────────────── Fixed, never unmounts
│   ├── TunnelInScene                    (radials converge → white → invert)
│   ├── TunnelOutScene                   (quick pass-through → dark)
│   └── ApertureScene                    (iris snap during Reveal)
├── Emblem (SVG)
├── GlobalNav
└── ScrollController
    ├── Hero
    ├── Positioning
    ├── TunnelIn ←─────────────────────── CREATE: 200vh scroll runway
    ├── Services ←─────────────────────── REVISE: Panel system
    ├── TunnelOut ←────────────────────── CREATE: 150vh scroll runway
    ├── Process                           (emblem reconstitutes)
    ├── Reveal
    ├── Work
    └── Contact
```

---

## Tunnel In Animation Concept

The tunnel is not abstract shader art. It's passing through the emblem itself.

### Sequence

```
Progress 0.0 ──────────────────────────────────────────── Progress 1.0

[Emblem centered]     [Radials stretch]     [White convergence]     [Invert complete]
     ○                    ╲│╱                      ●                    □ (white)
    /│\                   ─┼─                   (all meet)
   ─ ○ ─                  ╱│╲
    \│/
```

1. **0.0 - 0.2:** Emblem fills viewport, user approaches center
2. **0.2 - 0.7:** Radials begin stretching toward center, staggered by index
   - Each radial elongates from its position toward the center point
   - Creates a "collapsing star" effect
   - As more radials arrive, the center becomes increasingly white/bright
3. **0.7 - 0.9:** All radials converged, screen is white
4. **0.9 - 1.0:** White holds, section hands off to Services (white background)

### Technical Approach

**This is a custom animation** that references existing shader code for utilities and patterns.

**Reference code:** `/src/shaders/tunnel/tunnelShaders.ts` contains helper functions worth reusing:
- `ring()` - SDF for circular rings
- `radialLine()` - SDF for radial line segments  
- `sdRoundedBox()` - SDF for rounded rectangles
- Uniform setup patterns in `/src/shaders/tunnel/useTunnelShader.ts`

**Important distinction:** The existing shader draws spokes radiating *outward* from center. This animation needs spokes converging *inward* to center—opposite direction. The helper functions are reusable; the scene logic is not.

**Custom shader concept:**
```glsl
// Each radial has a "stretch" factor based on scroll + stagger
float stretchProgress = clamp((uProgress - staggerOffset) / stretchDuration, 0.0, 1.0);
vec2 radialEnd = mix(originalTip, center, stretchProgress);
```

The radials extend *inward* to the center, creating a collapsing star effect.

---

## Tunnel Out Animation Concept

Simple, decisive return to dark.

### Sequence

1. **0.0 - 0.3:** White screen (inherited from Services)
2. **0.3 - 0.7:** Quick forward motion through a tunnel/vortex effect
3. **0.7 - 1.0:** Emerge into dark, emblem reconstitutes ahead

**Reference existing shader:** `/src/shaders/tunnel/tunnelShaders.ts` contains:
- `sceneRingsDense` - Dense concentric rings
- `sceneCombined` - Rings + spokes hybrid

This can use existing scenes or a simplified shader: concentric rings or radial lines rushing past, fading to black.

---

## Scroll Ranges

Based on section heights from architecture doc:

| Section | Height | Global Start | Global End |
|---------|--------|--------------|------------|
| Hero | 100vh | 0.000 | 0.045 |
| Positioning | 300vh | 0.045 | 0.182 |
| **Tunnel In** | 200vh | 0.182 | 0.273 |
| **Services** | 400vh | 0.273 | 0.455 |
| **Tunnel Out** | 150vh | 0.455 | 0.523 |
| Process | 500vh | 0.523 | 0.750 |
| Reveal | 150vh | 0.750 | 0.818 |
| Work | 300vh | 0.818 | 0.955 |
| Contact | 100vh | 0.955 | 1.000 |

**Total: ~2200vh**

*These will be calculated dynamically based on actual section heights, but provide reference targets.*

---

## Implementation Steps

### Step 1: Scroll Ranges Configuration

**Action:** EXTRACT from existing file

**Source:** `/src/components/ScrollController.tsx` (lines 51-75)

**Target:** `/src/config/scrollRanges.ts`

**Purpose:** Centralize scroll-driven transition constants. Currently, these exist in ScrollController.tsx:
- `HANDOFF_IN_START = 0.70`, `HANDOFF_IN_END = 0.74`
- `SCROLL_BREAKPOINTS` array with 12 breakpoint values
- Scroll choreography comments

**Extract and expand:**
- Move existing `HANDOFF_*` and `SCROLL_BREAKPOINTS` constants
- Add `SCROLL_RANGES` object with start/end for each section
- Add helper function to calculate local progress within a range
- Add type definitions for range objects

**Update ScrollController.tsx:** Import from new config file instead of defining locally.

**Dependencies:** None

**Verification:** TypeScript compiles, ScrollController still works, constants export correctly

---

### Step 2: Global Canvas Component

**Action:** CREATE

**File:** `/src/components/GlobalCanvas/GlobalCanvas.tsx`

**Purpose:** Single R3F Canvas that lives at App root, never unmounts.

**Requirements:**
- Fixed position, full viewport, `pointer-events-none`
- `frameloop="demand"` for performance (only render when invalidated)
- Orthographic camera for 2D shader work
- `gl` config: `{ antialias: true, alpha: true, powerPreference: 'high-performance' }`
- `dpr={[1, 2]}` for retina support
- Children are scene components

**Scroll Progress Distribution:**

*Decision deferred to implementing agent.* The agent should examine `/src/context/OrbitSystem.tsx` and existing patterns in the codebase to determine the best approach. Options:

1. **Prop drilling:** GlobalCanvas receives `scrollProgress` as prop, passes to each scene
2. **Internal context:** GlobalCanvas creates a `GlobalCanvasContext` that scenes consume
3. **Direct import:** Scenes import `useOrbitSystem` directly from context

The implementing agent should choose based on:
- How other components currently access OrbitSystem values
- Whether scenes need additional shared state beyond scrollProgress
- Consistency with existing codebase patterns

**Structure:**
```tsx
<div className="fixed inset-0 pointer-events-none" style={{ zIndex: 57 }}>
  <Canvas ...>
    {children}
  </Canvas>
</div>
```

**z-index rationale:**
- Above section backgrounds
- Below main Emblem (z-60)
- Coordinates with WorkBridgeOverlay (z-55)

**Dependencies:** Step 1

**Verification:** Canvas renders, doesn't block interactions, respects reduced motion

---

### Step 3: Scene Visibility Hook

**Action:** CREATE

**File:** `/src/components/GlobalCanvas/useSceneVisibility.ts`

**Purpose:** Performance optimization—scenes only render when in their scroll range.

**API:**
```tsx
function useSceneVisibility(
  scrollProgress: MotionValue<number>,
  range: { start: number; end: number }
): {
  visible: boolean;
  localProgress: MotionValue<number>;  // 0-1 within the range
  entering: boolean;  // First 10% of range
  exiting: boolean;   // Last 10% of range
}
```

**Implementation:**
- Subscribe to `scrollProgress` changes
- Calculate if current value falls within range
- Derive `localProgress` as normalized value
- Provide entering/exiting flags for transition effects

**Dependencies:** Step 1

**Verification:** Hook correctly reports visibility, localProgress maps 0-1

---

### Step 4: GlobalCanvas Index and Integration

**Action:** CREATE index, REVISE App.tsx

**Create:** `/src/components/GlobalCanvas/index.ts`

**Revise:** `/src/App.tsx`

**Purpose:** Clean exports, wire GlobalCanvas into app.

**App.tsx changes:**
```tsx
import { GlobalCanvas } from '@/components/GlobalCanvas';

// In AppContent, after OrbitSystemProvider consumption:
<GlobalCanvas scrollProgress={scrollProgress}>
  {/* Scenes will be added in later steps */}
</GlobalCanvas>
```

**Dependencies:** Steps 2, 3

**Verification:** App renders without errors, GlobalCanvas visible in React DevTools

---

### Step 5: Tunnel In Scene - Shader Foundation

**Action:** CREATE

**File:** `/src/components/GlobalCanvas/scenes/TunnelInScene.tsx`

**Purpose:** WebGL scene for the radial convergence animation.

**Approach:** Create a custom shader that references existing code for utilities.

**Reference files:**
- `/src/shaders/tunnel/tunnelShaders.ts` - Reuse helper functions: `ring()`, `radialLine()`, `sdRoundedBox()`
- `/src/shaders/tunnel/useTunnelShader.ts` - Uniform setup patterns and R3F integration

**Custom shader requirements:**
1. Draws 32 radial paths (matching emblem geometry)
2. Each path has individual `stretchProgress` driven by scroll + stagger offset
3. Paths extend from outer edge toward center as progress increases
4. Background transitions from dark to white as convergence completes

**Uniforms:**
```glsl
uniform float uProgress;      // 0-1 scroll progress within tunnel range
uniform vec2 uResolution;     // viewport size
uniform float uTime;          // for subtle animation
uniform float uConvergence;   // derived: how much of center is filled (0-1)
```

**Dependencies:** Steps 2, 3

**Verification:** Scene renders when in range, radials animate on scroll

---

### Step 6: Tunnel In Scene - Convergence Animation

**Action:** REVISE

**File:** `/src/components/GlobalCanvas/scenes/TunnelInScene.tsx`

**Purpose:** Implement the staggered radial convergence.

**Animation curve per radial:**
```tsx
const getRadialProgress = (globalProgress: number, radialIndex: number) => {
  const totalRadials = 32;
  const staggerWindow = 0.5;  // Radials start converging over 50% of scroll
  const radialDelay = (radialIndex / totalRadials) * staggerWindow;
  const radialDuration = 0.4;

  const localStart = 0.1 + radialDelay;  // Start after initial approach
  const localEnd = localStart + radialDuration;

  return clamp((globalProgress - localStart) / (localEnd - localStart), 0, 1);
};
```

**Visual states:**
- `progress < 0.1`: Emblem static, centered
- `progress 0.1 - 0.6`: Radials converging in staggered sequence
- `progress 0.6 - 0.8`: All converged, white center expanding
- `progress 0.8 - 1.0`: Full white, hold for handoff

**Color transition:**
```glsl
// In fragment shader
float whiteness = smoothstep(0.5, 0.9, uConvergence);
vec3 bgColor = mix(vec3(0.039), vec3(1.0), whiteness);  // --bg to white
```

**Dependencies:** Step 5

**Verification:** Radials converge smoothly, white transition is clean

---

### Step 7: Tunnel In Section Component

**Action:** CREATE

**File:** `/src/sections/TunnelIn.tsx`

**Purpose:** Scroll runway for the tunnel animation. No visible content—just height.

**Structure:**
```tsx
export function TunnelIn() {
  return (
    <section
      id="tunnel-in"
      className="relative w-full"
      style={{ height: '200vh' }}
      aria-hidden="true"
    />
  );
}
```

**Revise:** `/src/sections/index.ts` to export TunnelIn

**Revise:** `/src/App.tsx` ScrollController to include TunnelIn between Positioning and Services

**Dependencies:** Steps 5, 6

**Verification:** Section appears in DOM, scroll range activates tunnel scene

---

### Step 8: Services Refactor - Strip Conic Wipe

**Action:** REVISE

**File:** `/src/sections/Services.tsx`

**Purpose:** Remove all conic wipe machinery, prepare for panel system.

**Current implementation:** 508 lines with sophisticated triple-layer conic wipe system.

**Remove (move logic to legacy comments or separate legacy file):**
- `maskFromDeg()` function (lines 100-134)
- All `WIPE_*`, `FLIP_*` constants
- `wipe1Deg`, `wipe2Deg` transforms
- `maskImageFirst`, `maskImageSecond` transforms
- `maskSupported` state and related logic
- `cutEnergy`, `ringsRotate` transforms
- Triple-layer div structure (base/design/build with masks)
- `designOpacityFallback`, `buildOpacityFallback`

**Keep:**
- `STEPS` data (rename phases appropriately)
- `AnimatedWord` component (lines 139-172)
- `AnimatedSubtext` component (lines 177-237)
- `getCopyForPhase()` function (lines 476-507)
- Basic section structure and scroll binding

**Legacy:** Before removing, copy entire current Services.tsx to `/src/sections/legacy/Services-conic-wipe.tsx`

**Temporary state:** Section will be broken after this step. That's expected.

**Dependencies:** Step 7 (tunnel provides white entry state)

**Verification:** File compiles (may have runtime issues)

---

### Step 9: Services Refactor - Panel System

**Action:** REVISE

**File:** `/src/sections/Services.tsx`

**Purpose:** Implement AnimatePresence panel transitions matching Process.tsx pattern.

**Reference:** `/src/sections/Process/Process.tsx` - working panel system with AnimatePresence

**Add state management:**
```tsx
type Phase = 'strategy' | 'design' | 'build';
const [activePhase, setActivePhase] = useState<Phase>('strategy');

useMotionValueEvent(scrollYProgress, 'change', (p) => {
  // Equal thirds
  const phase = p < 0.333 ? 'strategy' : p < 0.666 ? 'design' : 'build';
  if (phase !== activePhase) setActivePhase(phase);
});
```

**Create ServicePanel component:**
```tsx
function ServicePanel({ phase }: { phase: Phase }) {
  const copy = getCopyForPhase(phase);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.4, ease: [0.25, 0.46, 0.45, 0.94] }}
      className="absolute inset-0 flex items-center justify-center"
    >
      {/* Panel content */}
    </motion.div>
  );
}
```

**Render structure:**
```tsx
<div className="sticky top-0 h-screen bg-white text-black">
  <AnimatePresence mode="wait">
    <ServicePanel key={activePhase} phase={activePhase} />
  </AnimatePresence>
</div>
```

**Dependencies:** Step 8

**Verification:** Panels transition smoothly on scroll, no visual glitches

---

### Step 10: Services Refactor - History Stack

**Action:** REVISE

**File:** `/src/sections/Services.tsx`

**Purpose:** Add progression indicator showing previous phases.

**History stack component:**
```tsx
function HistoryStack({ activePhase }: { activePhase: Phase }) {
  const phases: Phase[] = ['strategy', 'design', 'build'];
  const activeIndex = phases.indexOf(activePhase);

  return (
    <div className="flex flex-col gap-1 mb-3">
      {phases.slice(0, activeIndex).map((phase, i) => {
        const depth = activeIndex - i;  // 1 = most recent, 2 = older
        const scale = depth === 1 ? 0.65 : 0.45;
        const opacity = depth === 1 ? 0.45 : 0.30;

        return (
          <span
            key={phase}
            className="display font-semibold"
            style={{
              transform: `scale(${scale})`,
              transformOrigin: 'left center',
              opacity
            }}
          >
            {phase.charAt(0).toUpperCase() + phase.slice(1)}
          </span>
        );
      })}
    </div>
  );
}
```

**Integration:** Add HistoryStack above the primary headline in ServicePanel.

**Dependencies:** Step 9

**Verification:** History words appear and stack correctly as phases progress

---

### Step 11: Services Refactor - Subtext Animation Timing

**Action:** REVISE

**File:** `/src/sections/Services.tsx`

**Purpose:** Trigger word-by-word animation on panel entry, not scroll position.

**Current issue:** `SUBTEXT_TIMING` is based on scroll positions within the old wipe system.

**New approach:** Each ServicePanel triggers its own animation on mount.

```tsx
function ServicePanel({ phase }: { phase: Phase }) {
  // Internal progress for this panel's animations
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setMounted(true), 100);
    return () => clearTimeout(timer);
  }, []);

  // Animate words based on mounted state, not scroll
  // ...
}
```

Or simpler: Use Framer Motion's `staggerChildren` for the subtext:

```tsx
<motion.div
  initial="hidden"
  animate="visible"
  variants={{
    hidden: {},
    visible: { transition: { staggerChildren: 0.02 } }
  }}
>
  {words.map((word, i) => (
    <motion.span
      key={i}
      variants={{
        hidden: { opacity: 0 },
        visible: { opacity: 1 }
      }}
    >
      {word}
    </motion.span>
  ))}
</motion.div>
```

**Dependencies:** Step 10

**Verification:** Subtext animates in cleanly when each panel appears

---

### Step 12: Tunnel Out Scene

**Action:** CREATE

**File:** `/src/components/GlobalCanvas/scenes/TunnelOutScene.tsx`

**Purpose:** Quick forward pass-through, white to dark inversion.

**Reference:** `/src/shaders/tunnel/tunnelShaders.ts` contains `sceneRingsDense` and `sceneCombined`

**Animation concept:**
- Concentric rings or radial lines rushing toward camera
- Color inverts from white (1,1,1) to dark (0.039, 0.039, 0.039)
- Faster than Tunnel In—decisive exit

**Shader approach:**
```glsl
// Simple ring rush effect
float ring(vec2 p, float radius, float thickness) {
  float d = abs(length(p) - radius);
  return smoothstep(thickness, 0.0, d);
}

void main() {
  vec2 p = vUv - 0.5;
  p.x *= uResolution.x / uResolution.y;

  float acc = 0.0;
  for (float i = 0.0; i < 8.0; i++) {
    float z = fract(uProgress * 2.0 + i / 8.0);
    float radius = z * 1.5;
    float thickness = 0.02 + 0.02 * (1.0 - z);
    acc += ring(p, radius, thickness) * (1.0 - z);
  }

  // Color invert
  vec3 bgColor = mix(vec3(1.0), vec3(0.039), uProgress);
  vec3 lineColor = mix(vec3(0.039), vec3(1.0), uProgress);

  vec3 col = mix(bgColor, lineColor, acc);
  gl_FragColor = vec4(col, 1.0);
}
```

**Dependencies:** Steps 2, 3

**Verification:** Scene activates in range, color inverts smoothly

---

### Step 13: Tunnel Out Section Component

**Action:** CREATE

**File:** `/src/sections/TunnelOut.tsx`

**Purpose:** Scroll runway for tunnel out animation.

**Structure:**
```tsx
export function TunnelOut() {
  return (
    <section
      id="tunnel-out"
      className="relative w-full"
      style={{ height: '150vh' }}
      aria-hidden="true"
    />
  );
}
```

**Revise:** `/src/sections/index.ts` to export TunnelOut

**Revise:** `/src/App.tsx` ScrollController to include TunnelOut between Services and Process

**Dependencies:** Step 12

**Verification:** Section appears in DOM, scroll range activates tunnel out scene

---

### Step 14: Process Emblem Entrance

**Action:** REVISE

**File:** `/src/sections/Process/Process.tsx`

**Purpose:** Emblem reconstitutes from tunnel exit instead of just appearing.

**Current implementation:** MorphingEmblem component (lines 80-125) with 32 radial paths.

**Current behavior:**
```tsx
const radialOffset = useTransform(scrollYProgress, [0.05, 0.5, 0.95], [0, 200, 0]);
```

Radials start at rest (0), expand outward (200), contract back (0). This "breathing" animation is designed for idle states, not scroll-driven experiences where users scroll through it quickly.

**New behavior:**
```tsx
// Start compressed (negative = overlapping at center), expand to natural formation, hold steady
const radialOffset = useTransform(
  scrollYProgress,
  [0, 0.08, 0.15, 0.9, 1],
  [-80, -40, 0, 0, 0]
);
```

**Rationale:** Remove breathing, keep reconstitution + hold. On a scroll-driven site, breathing gets skipped through. The emblem should emerge from the tunnel (compressed→natural) then hold steady while users engage with Process content. The morph animation (shape changes between states) remains—only the idle pulsing is removed.

Sequence:
- `0.00 - 0.08`: Radials tightly clustered at center (emerging from tunnel)
- `0.08 - 0.15`: Radials expand to natural formation
- `0.15 - 1.0`: Radials hold steady in natural position

**Opacity adjustment:**
```tsx
// Fade in during reconstitution
const emblemOpacity = useTransform(
  scrollYProgress,
  [0, 0.05, 0.15, 0.9, 1],
  [0, 0.1, 0.25, 0.25, 0.15]
);
```

**Dependencies:** Step 13

**Verification:** Emblem appears to emerge from tunnel, holds steady, smooth transition

---

### Step 15: Aperture Scene Migration

**Action:** MIGRATE (not create from scratch)

**Source files to consolidate into ApertureScene:**
- `/src/components/emblem/ApertureEmblem/ApertureCanvas.tsx` (61 lines) → MIGRATE
- `/src/components/emblem/ApertureEmblem/IrisShutter.tsx` (227 lines) → MIGRATE
- `/src/components/emblem/ApertureEmblem/IrisBlade.tsx` → MIGRATE
- `/src/components/emblem/ApertureEmblem/CenterDisc.tsx` (46 lines) → MIGRATE

**Supporting files to keep in original location (imported by ApertureScene):**
- `/src/components/emblem/ApertureEmblem/bladeVertices.ts` → KEEP (shared vertex data)
- `/src/components/emblem/ApertureEmblem/bladeConfig.ts` → KEEP (blade constants)
- `/src/components/emblem/ApertureEmblem/createBladeGeometry.ts` → KEEP (geometry helper)
- `/src/components/emblem/ApertureEmblem/useOrbitEmblemRect.ts` → KEEP (positioning hook)
- `/src/components/emblem/ApertureEmblem/EmblemLogo.tsx` → KEEP (SVG component, used elsewhere)
- `/src/components/emblem/ApertureEmblem/index.ts` → REVISE (update exports)

**Target:** `/src/components/GlobalCanvas/scenes/ApertureScene.tsx`

**Purpose:** Move existing iris shutter animation to global canvas.

**Existing implementation quality:** Production-ready with:
- 227 lines of sophisticated Three.js code in IrisShutter
- 32-blade geometry with exact SVG vertices
- Performance optimizations (BufferGeometry, demand rendering)
- Responsive scaling matching OrbitSystem
- Window resize handling

**Key changes:**
- Combine ApertureCanvas + IrisShutter into single ApertureScene component
- Use `useSceneVisibility` for activation (instead of always rendering)
- Receive progress from GlobalCanvas context (not props)
- Keep all existing blade geometry and animation logic

**Imports to preserve:**
```tsx
// From IrisShutter.tsx
import { BLADE_VERTICES } from './bladeVertices';
// Blade bounds calculation
// Rotation animation logic
// BufferGeometry setup
```

**Legacy:** Move original files to `/src/components/emblem/ApertureEmblem/legacy/`

**Dependencies:** Steps 2, 3

**Verification:** Aperture animates during Reveal scroll range with identical visual output

---

### Step 16: Reveal Section Simplification

**Action:** SIMPLIFY

**File:** `/src/sections/Reveal/Reveal.tsx`

**Purpose:** Remove section-scoped canvas, rely on GlobalCanvas.

**Remove:**
- `ApertureCanvas` import and usage
- `webglOpacity` transform
- WebGL-related motion.div wrapper

**Keep:**
- Section structure and height
- Scroll progress bindings (for other elements)
- Gradient overlays
- Accessibility markup

**Dependencies:** Step 15

**Verification:** Reveal section works, aperture animation comes from GlobalCanvas

---

### Step 17: Legacy Migration and Cleanup

**Action:** MIGRATE to legacy

**Files to move to legacy (NOT delete):**

1. `/src/components/emblem/ApertureEmblem/ApertureCanvas.tsx`
   → `/src/components/emblem/ApertureEmblem/legacy/ApertureCanvas.tsx`

2. `/src/components/emblem/ApertureEmblem/IrisShutter.tsx`
   → `/src/components/emblem/ApertureEmblem/legacy/IrisShutter.tsx`

3. `/src/components/emblem/ApertureEmblem/IrisBlade.tsx`
   → `/src/components/emblem/ApertureEmblem/legacy/IrisBlade.tsx`

4. `/src/components/emblem/ApertureEmblem/CenterDisc.tsx`
   → `/src/components/emblem/ApertureEmblem/legacy/CenterDisc.tsx`

5. Services conic wipe backup (created in Step 8):
   → `/src/sections/legacy/Services-conic-wipe.tsx`

**Update imports:** Ensure no active files reference moved components.

**Update `/src/components/GlobalCanvas/index.ts`:**
```tsx
export { GlobalCanvas } from './GlobalCanvas';
export { useSceneVisibility } from './useSceneVisibility';
export { TunnelInScene } from './scenes/TunnelInScene';
export { TunnelOutScene } from './scenes/TunnelOutScene';
export { ApertureScene } from './scenes/ApertureScene';
```

**Dependencies:** Steps 15, 16

**Verification:** Build passes, no import errors, legacy files preserved but excluded from active compilation

---

### Step 18: Integration Testing

**Purpose:** Verify complete scroll sequence works end-to-end.

**Test sequence:**
1. Hero → Positioning: Emblem behavior unchanged
2. Positioning → Tunnel In: Radials begin converging
3. Tunnel In midpoint: White convergence visible
4. Tunnel In → Services: Clean handoff to white background
5. Services Strategy → Design → Build: Panels transition, history stacks
6. Services → Tunnel Out: Quick inversion begins
7. Tunnel Out → Process: Emblem reconstitutes from clustered state
8. Process → Reveal: MorphingEmblem fades, aperture activates
9. Reveal → Work: Aperture holds, viewfinder framing

**Performance checks:**
- No visible frame drops during tunnel animations
- Canvas doesn't block scroll or interactions
- Memory usage stable (no leaks from scene switching)

**Dependencies:** All previous steps

**Verification:** Full scroll-through without issues

---

## File Manifest

### New Files (CREATE)

```
src/
├── components/
│   └── GlobalCanvas/
│       ├── index.ts                       [Step 4]
│       ├── GlobalCanvas.tsx               [Step 2]
│       ├── useSceneVisibility.ts          [Step 3]
│       └── scenes/
│           ├── TunnelInScene.tsx          [Steps 5-6]
│           └── TunnelOutScene.tsx         [Step 12]
└── sections/
    ├── TunnelIn.tsx                       [Step 7]
    └── TunnelOut.tsx                      [Step 13]
```

### Extracted Files (EXTRACT)

```
src/
└── config/
    └── scrollRanges.ts                    [Step 1] ← from ScrollController.tsx
```

### Migrated Files (MIGRATE)

```
src/
└── components/
    └── GlobalCanvas/
        └── scenes/
            └── ApertureScene.tsx          [Step 15] ← from ApertureEmblem/*
```

### Revised Files (REVISE)

```
src/
├── App.tsx                                [Steps 4, 7, 13]
├── components/
│   └── ScrollController.tsx               [Step 1] - import from new config
├── sections/
│   ├── index.ts                           [Steps 7, 13]
│   ├── Services.tsx                       [Steps 8-11]
│   ├── Process/Process.tsx                [Step 14]
│   └── Reveal/Reveal.tsx                  [Step 16]
```

### Legacy Migration (PRESERVE, NOT DELETE)

```
src/
├── components/
│   └── emblem/
│       └── ApertureEmblem/
│           └── legacy/                    [Step 17]
│               ├── ApertureCanvas.tsx
│               ├── IrisShutter.tsx
│               ├── IrisBlade.tsx
│               └── CenterDisc.tsx
└── sections/
    └── legacy/
        └── Services-conic-wipe.tsx        [Step 8]
```

---

## Reference: Existing Files

| Purpose | Location | Notes |
|---------|----------|-------|
| Scroll range constants | `/src/components/ScrollController.tsx` | Lines 51-75, EXTRACT to config |
| Tunnel shader (9 scenes) | `/src/shaders/tunnel/tunnelShaders.ts` | Reference for TunnelIn/Out |
| Shader hook | `/src/shaders/tunnel/useTunnelShader.ts` | Infrastructure for shader setup |
| Process panel pattern | `/src/sections/Process/Process.tsx` | Reference for Services refactor |
| Current Services | `/src/sections/Services.tsx` | 508 lines, conic wipe system |
| Aperture components | `/src/components/emblem/ApertureEmblem/` | MIGRATE to GlobalCanvas |
| OrbitSystem context | `/src/context/OrbitSystem.tsx` | scrollProgress source |

---

## Success Criteria

- [ ] Single WebGL canvas persists across entire experience
- [ ] Tunnel In: Radials converge to white, color inverts
- [ ] Services: Clean panel transitions with history stack
- [ ] Tunnel Out: Quick decisive return to dark
- [ ] Process: Emblem reconstitutes from tunnel smoothly
- [ ] Aperture: Activates from global canvas during Reveal
- [ ] No performance regression (60fps on desktop)
- [ ] Reduced motion respected throughout
- [ ] Build passes with no TypeScript errors
- [ ] All replaced files preserved in legacy folders
