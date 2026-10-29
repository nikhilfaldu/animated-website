# Emblem Scroll Choreography Implementation Spec

## Current State: Almost Nothing Works

**Reality check:** The emblem currently sits centered on screen and does basically nothing meaningful during scroll. The "states" in OrbitSystem.tsx exist but produce no visual impact. Each section below needs to be built from scratch.

### What Exists (Broken/Incomplete)
- `OrbitSystem.tsx` - State machine with 6 states that don't map to scroll positions
- `Emblem.tsx` - Renders 32 radials, has assembly animation that plays on mount but timing is off
- `ScrollController.tsx` - Has IntersectionObserver for sections but transforms are commented out
- `Hero.tsx` - No emblem interaction whatsoever
- All other sections - Zero emblem integration

### What Should Exist
A scroll-driven choreography where the emblem transforms meaningfully through each section, creating visual continuity and amplifying the content.

---

## Core Design Principles

### 1. The Emblem is a Connecting Thread

The emblem's primary job is **visual continuity between sections**. It should animate through transitions, creating the feeling that sections are connected rather than isolated blocks stacked on a page.

Think of it like a thread being pulled through fabric:
- As you leave Hero, the emblem expands and shifts left
- As you enter Positioning, it's already there, faded but present
- As you transition to Services, it sweeps across the screen to the right
- Through Process, it disperses and rotates like gears
- And so on...

**The emblem should never "pop" into a new state.** Every state change must be a smooth transition triggered by scroll position.

### 2. Know When to Disappear

**Critical rule:** The emblem should fade to near-invisible or fully hidden during content-heavy sections. When cards, text blocks, or interactive elements need user attention, the emblem gets out of the way.

| Section | Emblem Visibility | Reason |
|---------|------------------|--------|
| Hero | Prominent → Fading | Star of the show, then recedes |
| Positioning | Faded background (0.08) | Supporting texture only |
| Services | Faded background (0.15) | Supporting texture only |
| Process | Dispersed texture (0.15-0.25) | Visual interest without competition |
| Work | **HIDDEN** (opacity 0) | Cards need full attention |
| Proof | **HIDDEN** (opacity 0) | Data/stats need full attention |
| Pricing | **HIDDEN** (opacity 0) | Pricing cards need full attention |
| Contact | Returns → Vortex collapse | Dramatic finale |

The **nav emblem** (top-left corner, small) handles brand presence during hidden sections. The main emblem doesn't need to be visible at all times.

### 3. Theme Flip as Punctuation

The dark → light theme flip at Process section creates a "chapter break" in the scroll narrative. This already exists in V1 (`useThemeFlip.tsx`) and should be ported.

**Theme flip points:**
- **52% scroll**: Dark → Light (entering Process)
- **70% scroll**: Light → Dark (entering Work)

This creates three distinct "acts":
1. **Act 1 (Dark)**: Hero, Positioning, Services — Introduction
2. **Act 2 (Light)**: Process — The methodology reveal
3. **Act 3 (Dark)**: Work, Proof, Pricing, Contact — Proof and conversion

### 4. Transitions Are the Magic

The emblem's most important moments are the **transitions between sections**, not what it does within a section. A well-choreographed sweep from left to right as you scroll from Positioning to Services is more impactful than any idle animation.

**The emblem is the connective tissue.** Without it, sections feel like separate pages stacked vertically. With it animated through scroll, the entire site feels like one continuous experience being revealed.

**Key transition moments (ranked by impact):**

| Transition | What Happens | Why It Matters |
|------------|--------------|----------------|
| Hero → Positioning | Left-pin expansion | Sets the tone: "this site responds to you" |
| Positioning → Services | Cross-screen sweep (L→R) | Most dramatic movement, impossible to miss |
| Services → Process | Center + theme flip | Chapter break, signals methodology shift |
| Process → Work | Collapse + FADE OUT | Graceful exit, content takes over |
| Pricing → Contact | FADE IN + vortex begin | Dramatic return, finale energy |

**Even "hidden" sections have transitions.** The emblem doesn't just vanish—it fades out gracefully at the END of Process, stays invisible through Work/Proof/Pricing, then fades back IN at Contact. The absence is intentional, and the return is earned.

---

## Transition Choreography Map

```
SCROLL POSITION    EMBLEM STATE              TRANSITION TYPE
─────────────────────────────────────────────────────────────
0%                 Dispersed → Assembly      Time-based (page load)
│
├─ 0-12%          Assembly → Left-pin       Scroll-driven expansion
│                  (center → left edge)
│
├─ 12%            ─ HOLD ─                   Parallax drift only
│
├─ 25%            Left → Right sweep         Cross-screen movement
│                  (x: 15 → 85)
│
├─ 40%            Right → Center             Move + theme flip
│                  (x: 85 → 50)
│
├─ 50-55%         Center → FADE OUT          Graceful exit
│                  (opacity: 0.2 → 0)
│
├─ 55-92%         ═══ HIDDEN ═══             Nav emblem handles brand
│
├─ 92%            FADE IN → Vortex           Dramatic return
│                  (opacity: 0 → 0.3)
│
└─ 100%           Vortex collapse            Spiral to nothing
```

**Critical rule:** Every state change is scroll-driven. No sudden jumps. If you scrub the scroll bar back and forth, the emblem should smoothly animate through all states in both directions.

---

## Reference: V1 Theme Flip Implementation

**File to port:** `/Users/garywalker/projects/orbit-plus/src/hooks/useThemeFlip.tsx`

The theme flip should:
- Trigger based on scroll position (not IntersectionObserver)
- Flip CSS custom properties (`--bg`, `--fg`)
- Animate the transition with a subtle duration (300-400ms)
- Work with the portal transition effect if desired

---

## The Emblem Structure

```
┌─────────────────────────────────────┐
│         32 SVG Radials              │
│     arranged in circular pattern    │
│                                     │
│            ╱╲    ╱╲                 │
│          ╱    ╲╱    ╲               │
│         │      ●      │  ← center   │
│          ╲    ╱╲    ╱               │
│            ╲╱    ╲╱                 │
│                                     │
│     ViewBox: 0 0 588 588            │
│     Each radial: independent        │
│     transforms (x, y, scale,        │
│     opacity, rotate)                │
└─────────────────────────────────────┘
```

**File:** `/src/assets/emblemPaths.ts` - 32 path strings
**Component:** `/src/components/emblem/Emblem.tsx` - Renders paths with transforms

---

## Files You Must Modify

| File | Current State | Required Changes |
|------|---------------|------------------|
| `/src/context/OrbitSystem.tsx` | States exist but aren't scroll-linked | Add scroll-position-to-transform mapping |
| `/src/components/emblem/Emblem.tsx` | Assembly animation exists but isolated | Integrate with scroll-driven transforms |
| `/src/components/ScrollController.tsx` | Scroll detection works, transforms commented out | Uncomment and implement section-specific transforms |
| `/src/sections/Hero.tsx` | No emblem awareness | Add left-pinned expansion logic |
| `/src/sections/Positioning2.tsx` | No emblem awareness | Add parallax drift behavior |
| `/src/sections/Services.tsx` | No emblem awareness | Add right-side transition + pointer behavior |
| `/src/sections/ProcessGearPanels/` | Has emblem instances but disconnected | Connect to main emblem or replace |
| `/src/sections/Work.tsx` | No emblem awareness | Add rise-to-center transition |
| `/src/sections/Proof.tsx` | No emblem awareness | Add data-pulse behavior |
| `/src/sections/Pricing.tsx` | No emblem awareness | Maintain centered state |
| `/src/sections/Contact.tsx` | No emblem awareness | Add vortex collapse |

---

## Reference Code (What Worked Before)

### V1: Left-Pinned Expansion (COPY THIS LOGIC)
**File:** `/Users/garywalker/projects/orbit-plus/src/sections/original/Hero.tsx`

```typescript
// Lines 66-79 - THIS IS THE GOLD
useMotionValueEvent(scrollYProgress, "change", (progress) => {
  if (!introCompleteRef.current || shouldReduceMotion) return;
  const clamped = Math.min(Math.max(progress, 0), 1);
  const eased = easeOutQuad(clamped);

  const startX = 50;
  const endX = 20;

  originX.set(lerp(50, 0, eased));    // Origin: center → left
  originY.set(50);                      // Keep vertical center
  x.set(lerp(startX, endX, eased));   // Position compensates for origin shift
  y.set(50);
  scale.set(lerp(4, 12, eased));      // Dramatic scale
  opacity.set(lerp(0.05, 0.5, eased)); // Fade in
  rotation.set(-8);
});
```

### V2: Radial Ingress Animation (COPY THIS PATTERN)
**File:** `/Users/garywalker/projects/orbit-plus-v2/src/components/Emblem.tsx`

```typescript
// Lines 188-210 - Staggered entrance from all directions
const assemblyRadials = useMemo(() => {
  if (currentState !== 'assembly') return null;

  return EMBLEM_PATHS.slice(0, 32).map((pathD, i) => (
    <motion.path
      key={`assembly-radial-${i}`}
      d={pathD}
      fill="currentColor"
      initial={{
        opacity: 0,
        x: Math.cos((i / 32) * Math.PI * 2) * 300,  // Start 300px out
        y: Math.sin((i / 32) * Math.PI * 2) * 300,
        scale: 0.5,
      }}
      animate={{
        opacity: 1,
        x: 0,
        y: 0,
        scale: 1,
      }}
      transition={{
        delay: i * 0.05,           // 50ms stagger
        duration: 0.8,
        ease: [0.25, 0.46, 0.45, 0.94],
      }}
    />
  ));
}, [currentState]);
```

---

## Scroll Choreography: Section-by-Section Spec

### Global Scroll Ranges
```
0%   - 12%  : Hero
12%  - 25%  : Positioning  
25%  - 40%  : Services
40%  - 55%  : Process
55%  - 70%  : Work
70%  - 82%  : Proof
82%  - 92%  : Pricing
92%  - 100% : Contact
```

These are approximate - use IntersectionObserver thresholds, not hardcoded percentages.

---

### SECTION 1: HERO (0% - 12%)

**Current state:** Emblem plays assembly animation on mount, then sits centered doing nothing.

**Required behavior:**

#### Phase A: Page Load (before scroll)
```typescript
// Radial starting positions (dispersed)
radials[i] = {
  x: Math.cos((i / 32) * Math.PI * 2) * 800,
  y: Math.sin((i / 32) * Math.PI * 2) * 800,
  scale: 0.3,
  opacity: 0,
  rotate: 180
}

// Container starting position
container = {
  x: 50,        // vw center
  y: 50,        // vh center  
  scale: 1,
  opacity: 1,
  originX: 50,
  originY: 50
}
```

#### Phase B: Assembly Animation (0-1.6s after load)
```typescript
// Radials converge to center
radials[i].animate({
  x: 0,
  y: 0,
  scale: 1,
  opacity: 1,
  rotate: 0
}, {
  type: 'spring',
  stiffness: 200,
  damping: 26,
  delay: staggerDelay[i]  // Quadrant-based stagger, ~12ms per radial
})
```

#### Phase C: Left-Pinned Expansion (on scroll, 0% → 12%)
```typescript
// As user scrolls through Hero section:
const eased = easeOutQuad(sectionProgress);  // 0 → 1 within Hero

container = {
  originX: lerp(50, 0, eased),      // Center → Left edge
  originY: 50,
  x: lerp(50, 15, eased),           // Compensate position for origin shift
  y: 50,
  scale: lerp(1, 4, eased),         // Grow dramatically
  opacity: lerp(1, 0.12, eased)     // Fade to background
}

// Radials: hold assembled position, disable breath animation during transform
```

**Implementation location:** 
- Assembly: `/src/components/emblem/Emblem.tsx` (partially exists, needs timing fix)
- Left-pin: `/src/sections/Hero.tsx` + `/src/components/ScrollController.tsx`

---

### SECTION 2: POSITIONING (12% - 25%)

**Current state:** No emblem interaction.

**Required behavior:**

```typescript
// Container: stays left-pinned, large, faded
container = {
  x: 15,              // vw - pinned left
  y: 50,              // vh - centered
  scale: 4,           // Large background element
  opacity: 0.08,      // Very faded
  originX: 0,         // Left origin
  originY: 50
}

// Radials: parallax drift based on scroll velocity
// Fast scroll → radials separate slightly
// Slow/stop scroll → radials reconverge
radials[i] = {
  x: baseX + (velocity * driftFactor[i]),  // driftFactor: 2-8px based on index
  y: baseY + (velocity * driftFactor[i] * 0.5),
  scale: 1,
  opacity: 1,
  rotate: 0
}
```

**Implementation location:** `/src/sections/Positioning2.tsx`

---

### SECTION 3: SERVICES (25% - 40%)

**Current state:** No emblem interaction.

**Required behavior:**

#### Phase A: Transition to Right Side (25% → 30%)
```typescript
const transitionProgress = (scrollProgress - 0.25) / 0.05;  // 0→1 over 5%

container = {
  x: lerp(15, 85, transitionProgress),        // Left → Right
  originX: lerp(0, 100, transitionProgress),  // Flip origin
  scale: lerp(4, 2.5, transitionProgress),    // Shrink slightly
  opacity: lerp(0.08, 0.15, transitionProgress),
  y: 50,
  originY: 50
}
```

#### Phase B: Service Pointer (30% → 40%, on hover)
```typescript
// When user hovers a service card, radials rotate to "point" at it
// Calculate angle from emblem center to hovered card
const angleToCard = Math.atan2(cardY - emblemY, cardX - emblemX);

// Rotate entire emblem group to point
container.rotateZ = angleToCard * (180 / Math.PI);
```

**Implementation location:** `/src/sections/Services.tsx`

---

### SECTION 4: PROCESS (40% - 55%)

**Current state:** Has `ProcessGearPanels` with emblem instances, but they're disconnected from the main emblem.

**Required behavior:**

```typescript
// Container: moves to center-bottom
container = {
  x: lerp(85, 50, sectionProgress),   // Right → Center
  y: lerp(50, 75, sectionProgress),   // Center → Bottom third
  scale: lerp(2.5, 1.8, sectionProgress),
  opacity: 0.2,
  originX: 50,
  originY: 50
}

// Radials: gear rotation effect
// Even-indexed: clockwise
// Odd-indexed: counter-clockwise
radials[i] = {
  x: 0,
  y: 0,
  scale: 1,
  opacity: 1,
  rotate: i % 2 === 0 
    ? scrollProgress * 180    // Clockwise
    : scrollProgress * -120   // Counter-clockwise, slower
}
```

**Decision needed:** Keep ProcessGearPanels' local emblem instances OR replace with main emblem behavior. Don't have both competing.

**Implementation location:** `/src/sections/ProcessGearPanels/ProcessGearPanels.tsx`

---

### SECTION 5: WORK (55% - 70%)

**Current state:** No emblem interaction.

**Required behavior:** **EMBLEM HIDDEN** — Content-heavy section with project cards.

#### Transition IN (Process → Work, at ~55%)
```typescript
// Fade out over the last 5% of Process section
const fadeOutProgress = (scrollProgress - 0.50) / 0.05;  // 0→1 from 50%→55%

container = {
  x: 50,
  y: 75,
  scale: lerp(1.8, 1.5, fadeOutProgress),
  opacity: lerp(0.2, 0, fadeOutProgress),  // FADE TO INVISIBLE
  originX: 50,
  originY: 50
}
```

#### During Work Section
```typescript
// Emblem is HIDDEN - opacity 0
// Nav emblem (top-left) handles brand presence
container = {
  opacity: 0,
  // Other values don't matter since invisible
}
```

**Why hidden:** Project cards, case studies, and portfolio pieces need full visual attention. The emblem would compete with the work itself.

**Implementation location:** `/src/sections/Work.tsx`

---

### SECTION 6: PROOF (70% - 82%)

**Current state:** No emblem interaction.

**Required behavior:** **EMBLEM HIDDEN** — Data and testimonials need focus.

```typescript
// Emblem stays hidden throughout
// Stats, metrics, testimonials are the visual interest here
container = {
  opacity: 0,
}
```

**Why hidden:** Social proof elements (stats, testimonials, client logos) are dense content. The emblem would create visual noise.

**Implementation location:** `/src/sections/Proof.tsx`

---

### SECTION 7: PRICING (82% - 92%)

**Current state:** No emblem interaction.

**Required behavior:** **EMBLEM HIDDEN** — Pricing cards require clarity.

```typescript
// Emblem stays hidden
// This is a decision-making section - no distractions
container = {
  opacity: 0,
}
```

**Why hidden:** Pricing decisions require cognitive focus. Any background movement or texture competes with the cards and could create anxiety. Clean, minimal background lets the tiers breathe.

**Implementation location:** `/src/sections/Pricing.tsx`

---

### SECTION 8: CONTACT (92% - 100%)

**Current state:** No emblem interaction.

**Required behavior:** Emblem RETURNS for dramatic finale.

#### Transition IN (Pricing → Contact, at ~92%) — THE RETURN
```typescript
// Fade back in over the first 3% of Contact section
const fadeInProgress = (scrollProgress - 0.92) / 0.03;  // 0→1 from 92%→95%

container = {
  x: 50,
  y: 50,
  scale: lerp(0.8, 1.2, fadeInProgress),   // Grow as it appears
  opacity: lerp(0, 0.3, fadeInProgress),    // FADE IN from nothing
  originX: 50,
  originY: 50
}
```

**Why the return matters:** After being absent for 3 sections, the emblem's reappearance feels earned. It signals "we're reaching the end" and creates anticipation for the vortex collapse.

#### Phase B: Vortex Collapse (95% → 100%)
```typescript
const vortexProgress = (scrollProgress - 0.95) / 0.05;  // 0→1 over final 5%

// Container: stays centered, shrinks and fades
container = {
  x: 50,
  y: 50,
  scale: lerp(1.2, 0.5, vortexProgress),
  opacity: lerp(0.3, 0, vortexProgress),  // Fades to nothing
  originX: 50,
  originY: 50
}

// Radials: spiral into center
radials[i] = {
  x: Math.cos(spiralAngle) * spiralRadius,
  y: Math.sin(spiralAngle) * spiralRadius,
  scale: 1 - vortexProgress * 0.7,
  opacity: 1 - vortexProgress,
  rotate: vortexProgress * 720  // Double rotation
}

// Where:
const baseAngle = (i / 32) * Math.PI * 2;
const spiralAngle = baseAngle + (vortexProgress * Math.PI * 4);  // 2 full spiral rotations
const spiralRadius = 200 * (1 - vortexProgress);  // Collapse to center
```

**Implementation location:** `/src/sections/Contact.tsx`

---

## Implementation Order

### Step 1: Fix Hero (Critical Path)
1. Port V1's left-pinned expansion logic to ScrollController
2. Verify radial assembly animation timing
3. Connect Hero section to OrbitSystem scroll values

### Step 2: Implement Section-to-Section Transitions (THE PRIORITY)
**This is where the magic happens.** Focus on the transitions FIRST, then fill in section behaviors.

1. Hero → Positioning: Left-pin expansion
2. Positioning → Services: Cross-screen sweep (LEFT TO RIGHT)
3. Services → Process: Center movement + theme flip trigger
4. Process → Work: FADE OUT transition
5. Pricing → Contact: FADE IN + vortex setup

Test by scrubbing scroll bar—every transition should be smooth and reversible.

### Step 3: Individual Section Behaviors
Once transitions work, add within-section behaviors:
1. Positioning - parallax drift on velocity
2. Services - pointer behavior on card hover
3. Process - gear rotation effect
4. Work/Proof/Pricing - HIDDEN (opacity 0, skip behaviors)
5. Contact - vortex collapse

### Step 4: Theme Flip Integration
1. Port `useThemeFlip.tsx` from V1
2. Trigger at 52% (entering Process) and 70% (entering Work)
3. Ensure emblem color adapts with theme

### Step 5: Polish
1. Add velocity-reactive micro-animations
2. Test reduced-motion fallbacks
3. Performance audit (60fps target)
4. Verify bi-directional scroll behavior

---

## Technical Constraints

### DO
- Use `useTransform` for scroll-linked values
- Use `useSpring` for smooth transitions between states
- Keep transforms GPU-accelerated (transform, opacity only)
- Use `useMemo` for radial transform calculations
- Respect `prefers-reduced-motion`

### DO NOT
- Add console.logs (remove any added during dev)
- Create test files
- Add external dependencies
- Change emblem SVG paths
- Create new context providers (use existing OrbitSystem)
- Hardcode scroll percentages (use IntersectionObserver or section refs)

---

## Easing Functions Reference

```typescript
// Already defined in V1, copy if needed:
const easeOutQuad = (t: number) => 1 - Math.pow(1 - t, 2);
const lerp = (start: number, end: number, t: number) => start + (end - start) * t;

// Framer Motion easings used:
// Assembly: [0.25, 0.46, 0.45, 0.94] - confident arrival
// Orbit: [0.33, 1, 0.68, 1] - perpetual motion
// Mechanical: [0.68, -0.55, 0.265, 1.55] - bouncy precision
// Vortex: [0.87, 0, 0.13, 1] - gravitational pull
```

---

## Success Criteria

### Primary Goal: The Connecting Thread
The emblem must make the scroll feel like **one continuous journey**, not eight separate sections. When someone scrolls through the site, they should feel the sections flowing into each other, connected by the emblem's movement.

**The test:** Scrub the scroll bar back and forth. Does the emblem animate smoothly through all states in both directions? If yes, you've nailed the connecting thread.

### Section-Level Criteria
Each section should:
1. Transition smoothly FROM the previous section's emblem state
2. Transition smoothly TO the next section's emblem state
3. Not compete with or distract from section content
4. Maintain 60fps during scroll
5. Degrade gracefully with reduced motion preference

### Transition-Specific Criteria
| Transition | Success Looks Like |
|------------|-------------------|
| Hero → Positioning | Emblem expands and pins left in one fluid motion |
| Positioning → Services | Cross-screen sweep feels intentional, not jarring |
| Services → Process | Theme flip and centering feel like a "chapter break" |
| Process → Work | Fade out is graceful, not abrupt—you barely notice it leaving |
| Pricing → Contact | Fade in feels like a dramatic return, signals "finale" |

### What Failure Looks Like
- Emblem "pops" between states instead of animating
- Scrolling backward causes different behavior than scrolling forward
- Emblem competes with content during Work/Proof/Pricing
- Transitions feel disconnected from scroll position (laggy or anticipatory)
- Theme flip happens without emblem acknowledgment

The overall scroll journey should feel like one continuous choreographed experience, not disconnected animations.
