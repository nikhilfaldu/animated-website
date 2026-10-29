# SCROLL_JOURNEY_MASTER_SPEC.md

## Overview

This document defines the complete scroll-driven experience for Orbit+ V3. The emblem serves as the connecting thread between sections, transforming through distinct states while maintaining visual continuity. Each section has specific emblem behaviors, transitions, and interactions.

**Guiding Principle:** The scroll journey should feel like one continuous experience, not eight separate pages stacked vertically.

---

## Architecture

### Layer Stack

| Layer | Z-Index | Purpose |
|-------|---------|---------|
| Nav Emblem | 50 | Wayfinding, always accessible |
| Content | 30 | Section content, forms, cards |
| Main Emblem | 20 | Connecting thread, transforms per section |
| Backgrounds | 10 | Gradients, particles, gears |

### Scroll-Driven State
```typescript
// OrbitSystem provides these values globally
type OrbitState = {
  scrollProgress: MotionValue<number>;      // 0-1 across entire site
  scrollVelocity: MotionValue<number>;      // Current scroll speed
  sectionIndex: number;                      // Current section (0-7)
  emblemState: 'assembly' | 'orbit' | 'machine' | 'data' | 'vortex';
  theme: 'dark' | 'light';
  bloomTriggered: boolean;                   // One-time per session
};
```

---

## Section Map

| Section | Scroll Range | Theme | Emblem Visibility | Emblem State |
|---------|--------------|-------|-------------------|--------------|
| Hero | 0-12% | Dark | Prominent → Fading | assembly → orbit |
| Positioning | 12-25% | Dark | 0.08 opacity | orbit (left-pinned) |
| Services | 25-40% | Dark | 0.15 opacity | orbit (right-side) |
| Process | 40-55% | **Light** | **HIDDEN** | machine (gears replace) |
| Work | 55-70% | Dark | **HIDDEN** | — |
| Proof | 70-82% | Dark | Constellation | data |
| Pricing | 82-92% | Dark | **HIDDEN** | — |
| Contact | 92-100% | Dark | Returns → Vortex | vortex |

---

## Transition Choreography
```
SCROLL POSITION ────────────────────────────────────────────────────────────►

0%        12%        25%        40%        55%        70%        82%        92%        100%
│         │          │          │          │          │          │          │          │
▼         ▼          ▼          ▼          ▼          ▼          ▼          ▼          ▼

HERO ──────┬── POSITIONING ──┬── SERVICES ──┬── PROCESS ──┬── WORK ──┬── PROOF ──┬── PRICING ──┬── CONTACT
           │                 │              │             │          │           │             │
           │                 │              │             │          │           │             │
      Left-pin          Cross-screen    Center +      Fade      Hidden    Constellation    Fade in +
      expansion         sweep L→R       theme flip    out                 replaces         Vortex
                                        to LIGHT               Theme      emblem           collapse
                                                               flip to
                                                               DARK
```

### Transition Details

| Transition | Scroll % | Duration | Animation |
|------------|----------|----------|-----------|
| Hero → Positioning | 10-12% | 0.6s | Left-pin expansion, opacity 1.0 → 0.08 |
| Positioning → Services | 23-27% | 0.8s | Cross-screen sweep (left → right) |
| Services → Process | 38-42% | 0.6s | Center movement, theme flip DARK → LIGHT, fade out |
| Process → Work | 53-57% | 0.4s | Gears fade, theme flip LIGHT → DARK |
| Work → Proof | 68-72% | 0.8s | Constellation fades in, replaces emblem |
| Proof → Pricing | 80-82% | 0.4s | Constellation fades out |
| Pricing → Contact | 90-94% | 0.8s | Emblem fades in, begins vortex |
| Contact End | 96-100% | 1.2s | Vortex collapse to center |

---

## Section Specifications

### HERO (0-12%)

**Emblem Behavior:**
- Starts assembled at center
- Transitions to left-pinned position as user scrolls
- Opacity fades from 1.0 to 0.08 at section end

**Content:**
- Headline + subhead
- Scroll indicator

**Technical:**
```typescript
// Hero emblem transform
const heroTransform = {
  originX: useTransform(sectionProgress, [0, 1], [50, 0]),  // center → left
  scale: useTransform(sectionProgress, [0, 0.8, 1], [1, 1.2, 0.6]),
  opacity: useTransform(sectionProgress, [0.7, 1], [1, 0.08]),
};
```

---

### POSITIONING (12-25%)

**Emblem Behavior:**
- Left-pinned, low opacity (0.08)
- Parallax drift based on scroll velocity
- Supporting texture only, never competes with content

**Content:**
- Value proposition
- Key differentiators

**Technical:**
```typescript
const positioningTransform = {
  x: useTransform(scrollVelocity, [-2, 2], [-8, 8]),  // Subtle drift
  opacity: 0.08,
  position: 'left',
};
```

---

### SERVICES (25-40%)

**Emblem Behavior:**
- Cross-screen sweep from left to right (at 25-27%)
- Settles on right side of viewport
- Opacity 0.15
- Subtle rotation toward hovered service card (optional Phase 2)

**Content:**
- Service cards (Strategy, Design, Build, Support)
- Each card has hover state

**Transition In:**
```typescript
// Cross-screen sweep
const servicesEntry = {
  x: useTransform(transitionProgress, [0, 1], ['-40vw', '40vw']),
  opacity: useTransform(transitionProgress, [0, 0.3, 1], [0.08, 0.15, 0.15]),
};
```

---

### PROCESS (40-55%) — The Creative Machine

**Emblem Behavior:**
- **HIDDEN** (opacity 0)
- Gears conceptually replace the emblem
- Nav emblem handles brand presence

**Theme:**
- Flips to LIGHT at entry (40%)

**Architecture:**
See `PROCESS_SECTION_SPEC.md` for full details.
```
LAYER STACK (Process section)
┌─────────────────────────────────────────────────────────────┐
│  Labels (z-30) — Parallax 0.6x, fade in/out                │
├─────────────────────────────────────────────────────────────┤
│  Panels (z-20) — Normal scroll, contains cutouts           │
├─────────────────────────────────────────────────────────────┤
│  Gears (z-10) — Pinned, always spinning                    │
└─────────────────────────────────────────────────────────────┘
```

**Gear Field:**
- 15 gears, organic distribution with breathing room
- Rotation driven by scroll velocity
- Depth-based rendering (opacity, blur, speed)

**Cutouts:**
- 9 rectangular windows revealing gear intersections
- 3 with labels (Strategy, Design, Build)
- 6 texture cutouts (glimpses without labels)

**Cutout Choreography:**
```
A (6-14%)    — Appetizer, tiny peek
B (16-32%)   — STRATEGY reveal
C (28-40%)   — Texture, right side
D (38-48%)   — Accent, tiny center
E (44-62%)   — DESIGN reveal (largest)
F (58-70%)   — Texture, solo gear
G (68-84%)   — BUILD reveal
H (78-88%)   — Floor texture
I (88-96%)   — Farewell glimpse
```

**Exit:**
- Gears fade out over last 5% of section
- Theme flips LIGHT → DARK at 55%

---

### WORK (55-70%)

**Emblem Behavior:**
- **HIDDEN** (opacity 0)
- Nav emblem handles brand presence

**Theme:**
- Dark (flipped at Process exit)

**Content:**
- Project cards / case studies
- Full visual attention on work samples

**Rationale:**
Project cards need undivided attention. Any emblem presence would compete with portfolio imagery.

---

### PROOF (70-82%) — The Data Constellation

**Emblem Behavior:**
- Emblem transforms into data constellation
- 80-100 WebGL particles with connecting lines
- Flicker rate driven by scroll velocity
- **BLOOM interaction available**

**Architecture:**
```
LAYER STACK (Proof section)
┌─────────────────────────────────────────────────────────────┐
│  Overlay Text (z-30) — "Proof of Concept" headline         │
├─────────────────────────────────────────────────────────────┤
│  Constellation Canvas (z-20) — R3F particles + lines       │
└─────────────────────────────────────────────────────────────┘
```

**Constellation Specs:**
```typescript
const CONSTELLATION = {
  particleCount: 80,
  connectionDistance: 120,  // px, max distance for line connections
  flickerFrequency: 2.0,    // Hz base, modified by scroll velocity
  color: 'rgba(125, 223, 255, 0.8)',  // Cyan glow
};
```

**Scroll-Velocity Mapping:**
```typescript
// Faster scroll = more flicker activity
const flickerMultiplier = useTransform(
  scrollVelocity,
  [0, 1, 4],
  [0.5, 1, 2]
);
```

**Entry Transition:**
```typescript
// Constellation fades in as section enters
const constellationOpacity = useTransform(
  sectionProgress,
  [0, 0.15],
  [0, 1]
);
```

---

### PROOF BLOOM — The Surprise Moment

**Trigger:**
- Click-and-hold anywhere during Proof section
- **One-time per session** (guarded in OrbitSystem)

**Animation Sequence:**
```
t=0ms      User click-hold begins
t=0-1500ms Constellation expands radially (60%)
           Node size increases 4x
           Brightness surges
           Lines refract outward
t=1500ms   Peak bloom
t=1500-3500ms Graceful collapse back to normal
t=3500ms   Complete, bloom disabled for session
```

**Technical:**
```typescript
// OrbitSystem
const bloomSignal = useMotionValue(0);  // 0-1, drives all bloom effects

function triggerBloom() {
  if (bloomTriggered) return;
  setBloomTriggered(true);
  
  bloomSignal.set(1);
  // Fade back over 3.5s
  animate(bloomSignal, 0, { duration: 3.5, ease: 'easeOut' });
}
```

**Shader Uniforms:**
```glsl
uniform float uBloom;  // 0-1 from bloomSignal

void main() {
  vec3 pos = position;
  pos.xy *= 1.0 + uBloom * 0.6;  // Radial expansion
  
  float intensity = 0.6 + uBloom * 1.4;
  gl_PointSize = 2.0 + uBloom * 8.0;
}
```

**Accessibility:**
```typescript
// Announce bloom for screen readers
if (bloomTriggered) {
  announce('Constellation expanded — network aligned momentarily.');
}
```

**Reduced Motion:**
- Skip particle animation
- Show static SVG with brightness pulse
- Maintain one-time trigger behavior

---

### PRICING (82-92%)

**Emblem Behavior:**
- **HIDDEN** (opacity 0)
- Constellation fades out at section start
- Nav emblem handles brand presence

**Content:**
- Pricing tiers / packages
- Decision-making focus required

**Rationale:**
Pricing decisions require cognitive clarity. No visual distractions.

---

### CONTACT (92-100%) — The Vortex Portal

**Emblem Behavior:**
- **RETURNS** at section start (fade in)
- Transforms into portal aperture
- Vortex collapse at section end

**Architecture:**
```
LAYER STACK (Contact section)
┌─────────────────────────────────────────────────────────────┐
│  Form Card (z-30) — Inside portal aperture                 │
├─────────────────────────────────────────────────────────────┤
│  Portal Vortex (z-20) — Clip-path + swirl animation        │
├─────────────────────────────────────────────────────────────┤
│  Background Gradient (z-10) — Radial vignette              │
└─────────────────────────────────────────────────────────────┘
```

**Portal Phases:**

| Phase | Trigger | Visual |
|-------|---------|--------|
| ingress | Section entry | Emblem fades in, portal opens |
| ready | Portal stable | Form interactive, portal rotates slowly |
| focusing | Input focused | Vignette deepens, portal rotates slightly |
| submitting | Form submit | Brief supernova burst |
| success | Submit complete | Calm confirmation, portal settles |
| error | Submit failed | Gentle shake, recover to ready |

**Emblem Return:**
```typescript
// Fade in + scale up as section enters
const contactEntry = {
  opacity: useTransform(sectionProgress, [0, 0.08], [0, 0.3]),
  scale: useTransform(sectionProgress, [0, 0.08], [0.8, 1.2]),
};
```

**Portal Implementation:**
```typescript
// Clip-path driven portal aperture
const portalClip = useTransform(
  portalRadius,
  r => `circle(${r * 42}vmin at 50% 50%)`
);

// Swirl rotation
const portalSwirl = useSpring(0, { stiffness: 120, damping: 20 });

// Phase-based targets
useEffect(() => {
  switch (phase) {
    case 'ingress': portalSwirl.set(220); break;
    case 'ready': portalSwirl.set(260); break;
    case 'submitting': portalSwirl.set(360); break;
    case 'success': portalSwirl.set(420); break;
  }
}, [phase]);
```

**Focus Narrowing:**
```typescript
// When user focuses an input, deepen vignette
const vignetteIntensity = useTransform(
  globalFocus,
  [0, 1],
  [0, 0.3]
);
```

**Supernova on Submit:**
```tsx
{phase === 'submitting' && (
  <motion.div
    className="absolute inset-0 pointer-events-none"
    initial={{ opacity: 0, scale: 0.9 }}
    animate={{ opacity: 1, scale: 1 }}
    exit={{ opacity: 0 }}
    transition={{ duration: 0.28 }}
  >
    <svg width="320" height="320" viewBox="0 0 320 320">
      <defs>
        <radialGradient id="burst">
          <stop offset="0%" stopColor="#7dffff" stopOpacity="0.8" />
          <stop offset="100%" stopColor="#7dffff" stopOpacity="0" />
        </radialGradient>
      </defs>
      <circle cx="160" cy="160" r="140" fill="url(#burst)" />
    </svg>
  </motion.div>
)}
```

**Vortex Collapse (96-100%):**
```typescript
// Final spiral to nothing
const vortexCollapse = {
  rotation: useTransform(sectionProgress, [0.8, 1], [0, 720]),
  radius: useTransform(sectionProgress, [0.8, 1], [200, 0]),
  opacity: useTransform(sectionProgress, [0.9, 1], [0.3, 0]),
};
```

---

## Theme System

### Flip Points

| Scroll % | Direction | Trigger |
|----------|-----------|---------|
| 40% | DARK → LIGHT | Entering Process |
| 55% | LIGHT → DARK | Entering Work |

### Implementation
```typescript
// useThemeFlip.tsx
const THEME_FLIP_POINTS = [
  { scroll: 0.40, theme: 'light' },
  { scroll: 0.55, theme: 'dark' },
];

function useThemeFlip(scrollProgress: MotionValue<number>) {
  const [theme, setTheme] = useState<'dark' | 'light'>('dark');
  
  useMotionValueEvent(scrollProgress, 'change', (p) => {
    const target = THEME_FLIP_POINTS.reduce((acc, point) => {
      return p >= point.scroll ? point.theme : acc;
    }, 'dark' as const);
    
    if (target !== theme) {
      setTheme(target);
      document.documentElement.dataset.theme = target;
    }
  });
  
  return theme;
}
```

### CSS Variables
```css
[data-theme="dark"] {
  --color-bg: #0a0a0a;
  --color-fg: #fafafa;
  --color-accent: #7dffff;
}

[data-theme="light"] {
  --color-bg: #fafafa;
  --color-fg: #0a0a0a;
  --color-accent: #0066cc;
}
```

---

## Motion Constants
```typescript
// src/styles/motion.ts
export const MOTION = {
  // Durations
  duration: {
    short: 0.18,
    base: 0.28,
    medium: 0.44,
    long: 0.72,
  },
  
  // Easings
  ease: {
    orbit: [0.33, 1, 0.68, 1],       // Natural orbital feel
    clarity: [0.4, 0, 0.2, 1],       // Standard UI
    spring: { stiffness: 140, damping: 18 },
    softSpring: { stiffness: 80, damping: 22 },
  },
  
  // Scroll mapping
  scroll: {
    sensitivity: 0.0025,
    velocityClamp: [-4, 4],
  },
};
```

---

## Performance Requirements

### GPU-Only Transforms
All animations must use only:
- `transform` (translate, rotate, scale)
- `opacity`
- `clip-path`
- `filter` (sparingly)

### Forbidden in Animation Loops
- `width`, `height`
- `top`, `left`, `right`, `bottom`
- `margin`, `padding`
- `getBoundingClientRect()`

### Budgets

| Metric | Target |
|--------|--------|
| Frame rate | 60 FPS |
| Frame budget | < 16ms |
| Particle count (Proof) | ≤ 100 |
| Gear count (Process) | ≤ 15 |
| Cutout count (Process) | ≤ 12 |

### Optimization Patterns
```typescript
// Use MotionValues directly, avoid React state for scroll-linked values
const rotation = useTransform(scrollProgress, [0, 1], [0, 720]);

// Memoize expensive calculations
const gearPath = useMemo(() => generateGearPath(radius, teeth), [radius, teeth]);

// Batch updates in single RAF
useEffect(() => {
  let raf: number;
  const update = () => {
    // All updates here
    raf = requestAnimationFrame(update);
  };
  raf = requestAnimationFrame(update);
  return () => cancelAnimationFrame(raf);
}, []);
```

---

## Accessibility

### Reduced Motion

All sections must implement reduced-motion alternatives:
```typescript
const prefersReduced = useReducedMotion();

// Pattern: Replace travel with fade
const transition = prefersReduced
  ? { opacity: 1, transition: { duration: 0.2 } }
  : { x: 0, opacity: 1, transition: { duration: 0.6, ease: MOTION.ease.orbit } };
```

### Section-Specific Fallbacks

| Section | Full Motion | Reduced Motion |
|---------|-------------|----------------|
| Hero | Radial assembly | Fade in |
| Process | Spinning gears, scrolling cutouts | Static gear diagram, instant label reveals |
| Proof | Particle constellation, bloom | Static SVG network, brightness pulse |
| Contact | Vortex spiral, supernova | Fade transitions, subtle pulse |

### Screen Reader Support
```tsx
// Live region for state changes
<div id="live-region" role="status" aria-live="polite" className="sr-only" />

// Usage
function announce(message: string) {
  const region = document.getElementById('live-region');
  if (region) {
    region.textContent = '';
    requestAnimationFrame(() => { region.textContent = message; });
  }
}
```

### Keyboard Navigation

- All interactive elements reachable via Tab
- Escape closes any open states
- Arrow keys navigate within components (dial, cards)
- Enter/Space activates focused elements

---

## Files to Create/Modify

### New Files
```
src/
├── context/
│   └── OrbitSystem.tsx          # Central state + motion values
├── hooks/
│   ├── useThemeFlip.tsx         # Theme flip logic
│   ├── useReducedMotion.tsx     # Motion preference
│   └── useConstellation.tsx     # Proof particle data
├── sections/
│   ├── Process/
│   │   ├── Process.tsx          # Section shell
│   │   ├── GearField.tsx        # Pinned gear layer
│   │   ├── PanelMask.tsx        # Scrolling cutouts
│   │   ├── ParallaxLabels.tsx   # Strategy/Design/Build
│   │   ├── Gear.tsx             # Individual gear
│   │   ├── gearPath.ts          # Gear geometry
│   │   └── processData.ts       # Constants
│   ├── Proof/
│   │   ├── Proof.tsx            # Section shell
│   │   ├── ConstellationCanvas.tsx  # R3F canvas
│   │   ├── ThreeConstellation.tsx   # Particle system
│   │   └── StaticDiagram.tsx    # Reduced motion fallback
│   └── Contact/
│       ├── Contact.tsx          # Section shell
│       ├── PortalVortex.tsx     # Clip-path portal
│       ├── ContactForm.tsx      # Form component
│       └── Supernova.tsx        # Submit burst
├── components/
│   └── emblem/
│       └── Emblem.tsx           # Main emblem (scroll-driven)
└── styles/
    ├── motion.ts                # Motion constants
    └── theme.css                # Theme variables
```

### Modify
```
src/
├── App.tsx                      # Integrate OrbitSystem provider
├── components/
│   └── ScrollController.tsx     # Connect to OrbitSystem
└── sections/
    ├── Hero.tsx                 # Add emblem transition out
    ├── Positioning.tsx          # Add emblem parallax
    ├── Services.tsx             # Add cross-screen sweep
    ├── Work.tsx                 # Ensure emblem hidden
    └── Pricing.tsx              # Ensure emblem hidden
```

---

## Implementation Order

### Phase 1: Foundation
1. OrbitSystem context with scroll progress/velocity
2. Theme flip system
3. Basic emblem visibility per section

### Phase 2: Process Section
1. Gear field (pinned, spinning)
2. Panel mask with cutouts
3. Parallax labels
4. Entry/exit transitions

### Phase 3: Proof Section
1. Constellation canvas
2. Particle system with connections
3. Velocity-driven flicker
4. Bloom interaction

### Phase 4: Contact Section
1. Portal vortex
2. Form with focus narrowing
3. Submit supernova
4. Vortex collapse

### Phase 5: Transitions
1. Hero → Positioning (left-pin)
2. Positioning → Services (cross-screen)
3. Services → Process (theme flip + fade)
4. Work → Proof (constellation entry)
5. Pricing → Contact (emblem return)

### Phase 6: Polish
1. Reduced motion fallbacks
2. Performance audit
3. Accessibility audit
4. Cross-browser testing

---

## Success Criteria

### Primary: The Connecting Thread
Emblem must make scroll feel like **one continuous journey**, not eight separate sections.

**The Test:** Scrub scroll bar back and forth. Does the experience flow smoothly through all states in both directions?

### Section-Level Criteria

Each section must:
1. Transition smoothly FROM previous section
2. Transition smoothly TO next section
3. Not compete with content
4. Maintain 60 FPS
5. Degrade gracefully with reduced motion

### Specific Acceptance

| Section | Criterion |
|---------|-----------|
| Process | Gears always spinning; cutouts reveal glimpses sequentially; never see full machine |
| Proof | Constellation forms on entry; bloom triggers once; scroll velocity affects flicker |
| Contact | Portal opens smoothly; focus narrowing works; supernova fires on submit |

### What Failure Looks Like

- Emblem "pops" between states instead of animating
- Scrolling backward causes different behavior than forward
- Theme flip feels jarring instead of intentional
- Sections feel disconnected from each other
- Performance drops below 55 FPS
- Reduced motion users get broken experience

---

## Reference Code

### V1 Sources
- Left-pinned expansion: `/Users/garywalker/projects/orbit-plus/src/sections/original/Hero.tsx`
- Theme flip: `/Users/garywalker/projects/orbit-plus/src/hooks/useThemeFlip.tsx`

### V2 Sources
- Radial ingress: `/Users/garywalker/projects/orbit-plus-v2/src/components/Emblem.tsx`

### Current V3
- Nav emblem (keep as-is): `/Users/garywalker/projects/orbit-plus-v3/src/components/navigation/`