# Emblem Scroll Choreography Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Implement scroll-driven emblem choreography that creates visual continuity across all sections, from Hero assembly through Contact vortex collapse.

**Architecture:** All scroll transforms live in ScrollController.tsx using Framer Motion's `useTransform` for breakpoint interpolation. Position values (x, y, originX, originY) are direct; scale/opacity/rotateZ are spring-smoothed. OrbitSystem's `setCustomTransform()` receives computed values on each scroll tick.

**Tech Stack:** React 18, TypeScript, Framer Motion (useTransform, useSpring, useMotionValueEvent), OrbitSystem context

**Design Doc:** `docs/plans/2025-12-10-emblem-scroll-choreography-design.md`

---

## Task 1: Add heroTextReady Flag to OrbitSystem

**Files:**
- Modify: `src/context/OrbitSystem.tsx:152-157` (interface), `src/context/OrbitSystem.tsx:166-168` (state), `src/context/OrbitSystem.tsx:281-300` (effect)

**Step 1: Add heroTextReady to interface**

In `src/context/OrbitSystem.tsx`, add to `OrbitSystemContextValue` interface around line 152:

```typescript
// After line 156 (assemblyProgress)
heroTextReady: boolean;
```

**Step 2: Add state variable**

After line 168 (`const [introComplete, setIntroComplete] = useState(false);`), add:

```typescript
const [heroTextReady, setHeroTextReady] = useState(false);
```

**Step 3: Update runIntro effect to set heroTextReady**

Replace the `runIntro` function in the useEffect (lines 284-291) with:

```typescript
const runIntro = async () => {
  assemblyProgress.set(0);
  await animateTo('assembly', 1.6);
  if (cancelled) return;
  await animateTo('idle', 0.8);
  if (cancelled) return;
  setIntroComplete(true);
  // 300ms delay before hero text is ready
  setTimeout(() => {
    if (!cancelled) setHeroTextReady(true);
  }, 300);
};
```

**Step 4: Add to context value**

In the `useMemo` value object (around line 303), add `heroTextReady`:

```typescript
heroTextReady,
```

And add to the dependency array (around line 333):

```typescript
heroTextReady,
```

**Step 5: Verify compilation**

Run: `npm run type-check`
Expected: No TypeScript errors

**Step 6: Commit**

```bash
git add src/context/OrbitSystem.tsx
git commit -m "feat(OrbitSystem): add heroTextReady flag for text entrance timing"
```

---

## Task 2: Update Hero.tsx to Use heroTextReady

**Files:**
- Modify: `src/sections/Hero.tsx`

**Step 1: Import useOrbitSystem**

At line 3, add import:

```typescript
import { useOrbitSystem } from '@/context/OrbitSystem';
```

**Step 2: Get heroTextReady from context**

Inside the `Hero` function, after line 10, add:

```typescript
const { heroTextReady } = useOrbitSystem();
```

**Step 3: Update stage logic**

Replace the current `stage` state and scroll-based flip logic. The full component becomes:

```typescript
import { motion, useReducedMotion } from "framer-motion";
import { useRef } from "react";
import { HeroLineDropAnimation } from '@/components/animations/HeroLineDropAnimation';
import { useOrbitSystem } from '@/context/OrbitSystem';

export function Hero() {
  const heroRef = useRef<HTMLElement | null>(null);
  const shouldReduceMotion = useReducedMotion();
  const { heroTextReady } = useOrbitSystem();

  return (
    <section ref={heroRef} id="hero" className="section min-h-screen flex items-center justify-center">
      <div className="relative z-10 w-full max-w-6xl mx-auto px-6 text-center">
        {!heroTextReady && (
          <div>
            <HeroLineDropAnimation
              lines={[
                "Creative websites",
                "for brands that",
                "don't fit the mold."
              ]}
              className="h0 display"
              contentVisible={true}
            />
          </div>
        )}

        {heroTextReady && (
          <motion.div
            initial={shouldReduceMotion ? { opacity: 0 } : { opacity: 0, rotateX: -90 }}
            animate={shouldReduceMotion ? { opacity: 1 } : { opacity: 1, rotateX: 0 }}
            transition={{ duration: 0.6 }}
          >
            <h1 className="h0 display mb-8">
              Where brand meets experience.
            </h1>
            <p className="p text-lg max-w-3xl mx-auto">
              Strategic websites that turn visitors into clients.
            </p>
          </motion.div>
        )}
      </div>
    </section>
  );
}
```

**Step 4: Verify in browser**

Run: `npm run dev`
Expected: Assembly plays → 300ms pause → Hero text animates in

**Step 5: Commit**

```bash
git add src/sections/Hero.tsx
git commit -m "feat(Hero): use heroTextReady flag for text entrance timing"
```

---

## Task 3: Add Emblem Fade After Assembly

**Files:**
- Modify: `src/context/OrbitSystem.tsx:281-300` (runIntro effect)

**Step 1: Update runIntro to fade emblem**

The emblem should fade from 1 to 0.6 opacity when heroTextReady triggers. Update the `runIntro` function:

```typescript
const runIntro = async () => {
  assemblyProgress.set(0);
  await animateTo('assembly', 1.6);
  if (cancelled) return;
  await animateTo('idle', 0.8);
  if (cancelled) return;
  setIntroComplete(true);
  // 300ms delay, then fade emblem and trigger hero text
  setTimeout(() => {
    if (!cancelled) {
      // Fade emblem to 0.6 opacity over 400ms
      animate(opacity, 0.6, { duration: 0.4, ease: [0.25, 0.46, 0.45, 0.94] });
      setHeroTextReady(true);
    }
  }, 300);
};
```

**Step 2: Add animate import if missing**

Verify `animate` is imported from framer-motion (should already be at line 14).

**Step 3: Verify in browser**

Run: `npm run dev`
Expected: Assembly → idle → 300ms → emblem fades to 60% opacity while text enters

**Step 4: Commit**

```bash
git add src/context/OrbitSystem.tsx
git commit -m "feat(OrbitSystem): fade emblem to 0.6 opacity when hero text enters"
```

---

## Task 4: Set Up Scroll Choreography in ScrollController

**Files:**
- Modify: `src/components/ScrollController.tsx`

**Step 1: Add useTransform and useSpring imports**

Update line 2:

```typescript
import { useScroll, useMotionValueEvent, useTransform, useSpring } from 'framer-motion';
```

**Step 2: Add setCustomTransform to destructured context**

Update lines 39-46 to uncomment `setCustomTransform`:

```typescript
const {
  scrollProgress,
  scrollVelocity,
  triggerFirstScroll,
  animateTo,
  introComplete,
  setCustomTransform,
} = useOrbitSystem();
```

**Step 3: Define scroll breakpoints and values**

After line 48 (`const { lenis } = useLenis();`), add the choreography transforms:

```typescript
// Scroll choreography breakpoints
const SCROLL_BREAKPOINTS = [0, 0.12, 0.25, 0.30, 0.40, 0.45, 0.55, 0.92, 0.95, 1];

// Position transforms (direct - responsive to scroll)
const emblemX = useTransform(
  scrollYProgress,
  SCROLL_BREAKPOINTS,
  [50, 15, 15, 85, 85, 50, 50, 50, 50, 50]
);

const emblemY = useTransform(
  scrollYProgress,
  SCROLL_BREAKPOINTS,
  [50, 50, 50, 50, 50, 65, 65, 65, 50, 50]
);

const emblemOriginX = useTransform(
  scrollYProgress,
  SCROLL_BREAKPOINTS,
  [50, 0, 0, 0, 100, 100, 50, 50, 50, 50]
);

const emblemOriginY = useTransform(
  scrollYProgress,
  [0, 1],
  [50, 50]  // Always centered vertically
);

// Scale and opacity (will be spring-smoothed)
const emblemScaleRaw = useTransform(
  scrollYProgress,
  SCROLL_BREAKPOINTS,
  [1, 4, 4, 2.5, 2.5, 2, 1.5, 1.5, 1.2, 0.3]
);

const emblemOpacityRaw = useTransform(
  scrollYProgress,
  SCROLL_BREAKPOINTS,
  [0.6, 0.12, 0.07, 0.15, 0.08, 0.15, 0, 0, 0.3, 0]
);

const emblemRotateZRaw = useTransform(
  scrollYProgress,
  [0, 0.95, 1],
  [0, 0, 360]
);

// Spring-smooth scale, opacity, rotateZ for organic feel
const emblemScale = useSpring(emblemScaleRaw, { stiffness: 100, damping: 20 });
const emblemOpacity = useSpring(emblemOpacityRaw, { stiffness: 100, damping: 20 });
const emblemRotateZ = useSpring(emblemRotateZRaw, { stiffness: 80, damping: 15 });
```

**Step 4: Verify compilation**

Run: `npm run type-check`
Expected: No TypeScript errors

**Step 5: Commit**

```bash
git add src/components/ScrollController.tsx
git commit -m "feat(ScrollController): add scroll choreography transforms"
```

---

## Task 5: Apply Scroll Transforms to OrbitSystem

**Files:**
- Modify: `src/components/ScrollController.tsx:94-118`

**Step 1: Update scrollYProgress change handler**

Replace the `useMotionValueEvent(scrollYProgress, "change", ...)` block (lines 94-118) with:

```typescript
// Update scroll progress and apply choreography transforms
useMotionValueEvent(scrollYProgress, "change", (progress) => {
  scrollProgress.set(progress);

  // Only apply scroll choreography after intro is complete
  if (!introComplete) return;

  // Apply scroll-driven transforms
  setCustomTransform({
    x: emblemX.get(),
    y: emblemY.get(),
    originX: emblemOriginX.get(),
    originY: emblemOriginY.get(),
    scale: emblemScale.get(),
    opacity: emblemOpacity.get(),
    rotateZ: emblemRotateZ.get(),
  });
});
```

**Step 2: Verify in browser**

Run: `npm run dev`
Expected:
- Scroll through page
- Emblem expands left during Hero
- Fades during Positioning
- Sweeps right at Services transition
- Centers at Process
- Disappears through Work/Proof/Pricing
- Returns and collapses at Contact

**Step 3: Commit**

```bash
git add src/components/ScrollController.tsx
git commit -m "feat(ScrollController): apply scroll choreography to OrbitSystem"
```

---

## Task 6: Remove IntersectionObserver State Transitions

**Files:**
- Modify: `src/components/ScrollController.tsx:172-220`

**Step 1: Remove the IntersectionObserver useEffect**

The scroll choreography now handles all emblem transforms. Delete or comment out the entire IntersectionObserver effect (lines 172-220):

```typescript
// REMOVED: IntersectionObserver-based state transitions
// Scroll choreography in useTransform now handles all emblem transforms
```

**Step 2: Remove console.log if present**

Search for and remove any `console.log` statements related to section transitions.

**Step 3: Verify in browser**

Run: `npm run dev`
Expected: Same behavior as before, no console logs about section transitions

**Step 4: Commit**

```bash
git add src/components/ScrollController.tsx
git commit -m "refactor(ScrollController): remove IntersectionObserver, use scroll choreography"
```

---

## Task 7: Handle Origin Flip at Destination

**Files:**
- Modify: `src/components/ScrollController.tsx`

**Step 1: Fix origin transitions to flip at destinations**

The current implementation interpolates originX continuously. We need discrete flips at transition endpoints. Update the `emblemOriginX` transform:

```typescript
// Origin flips happen at destinations, not during movement
const emblemOriginX = useTransform(
  scrollYProgress,
  (progress) => {
    // Hero: center origin, transitions to left
    if (progress < 0.12) return 50 - (progress / 0.12) * 50; // 50 → 0
    // Positioning: left origin
    if (progress < 0.25) return 0;
    // Positioning → Services sweep: keep left origin until arrival
    if (progress < 0.30) return 0;
    // Services: flip to right origin at arrival
    if (progress < 0.40) return 100;
    // Services → Process: keep right origin until arrival
    if (progress < 0.45) return 100;
    // Process and beyond: center origin
    return 50;
  }
);
```

**Step 2: Verify bidirectional scroll**

Run: `npm run dev`
Test: Scrub scroll bar back and forth rapidly
Expected: Emblem animates smoothly in both directions, no jarring jumps

**Step 3: Commit**

```bash
git add src/components/ScrollController.tsx
git commit -m "fix(ScrollController): origin flips at destinations, not during movement"
```

---

## Task 8: Gate Scroll Transforms Until After Intro

**Files:**
- Modify: `src/components/ScrollController.tsx`

**Step 1: Ensure transforms don't fight with intro animation**

The transforms should only activate after `introComplete` AND after the emblem has faded to 0.6. Add a check in the scroll handler:

```typescript
// Update scroll progress and apply choreography transforms
useMotionValueEvent(scrollYProgress, "change", (progress) => {
  scrollProgress.set(progress);

  // Only apply scroll choreography after intro is complete
  // and only if we've scrolled past the initial position
  if (!introComplete) return;

  // Don't override the 0.6 opacity fade if we haven't scrolled yet
  if (progress < 0.01) return;

  // Apply scroll-driven transforms
  setCustomTransform({
    x: emblemX.get(),
    y: emblemY.get(),
    originX: emblemOriginX.get(),
    originY: emblemOriginY.get(),
    scale: emblemScale.get(),
    opacity: emblemOpacity.get(),
    rotateZ: emblemRotateZ.get(),
  });
});
```

**Step 2: Verify intro → scroll handoff**

Run: `npm run dev`
Expected:
1. Page loads, assembly plays
2. Emblem fades to 0.6, text enters
3. User scrolls → emblem smoothly transitions to scroll-driven state
4. No jump or flicker at handoff

**Step 3: Commit**

```bash
git add src/components/ScrollController.tsx
git commit -m "fix(ScrollController): gate transforms until intro complete and scroll started"
```

---

## Task 9: Update Emblem.tsx Transform Origin Reactivity

**Files:**
- Modify: `src/components/emblem/Emblem.tsx:290-291`

**Step 1: Make transformOrigin reactive**

The current Emblem.tsx has a static `transformOrigin` that reads motion values once. Update line 291 to use motion template or reactive style:

```typescript
// In the motion.svg style prop, update transformOrigin to be reactive
// Replace the static transformOrigin with useTransform
```

Before the return statement, add:

```typescript
// Reactive transform origin
const transformOrigin = useTransform(
  [originX, originY],
  ([ox, oy]) => `${ox}% ${oy}%`
);
```

Then update the motion.svg style:

```typescript
style={{
  overflow: 'visible',
  scale: finalScale,
  rotateX,
  rotateY,
  rotateZ: finalRotateZ,
  opacity,
  transformOrigin: transformOrigin.get(),
}}
```

**Note:** This may need adjustment based on how Framer Motion handles string motion values. Alternative approach using CSS custom properties may be needed.

**Step 2: Verify origin changes during scroll**

Run: `npm run dev`
Test: Watch emblem during Hero → Positioning → Services transitions
Expected: Transform origin visibly shifts (emblem expands from left edge, then from right edge)

**Step 3: Commit**

```bash
git add src/components/emblem/Emblem.tsx
git commit -m "fix(Emblem): make transformOrigin reactive to scroll changes"
```

---

## Task 10: Final Verification and Polish

**Files:**
- All modified files

**Step 1: Run full test suite**

```bash
npm run type-check && npm run lint && npm run build
```

Expected: All pass

**Step 2: Manual scroll test checklist**

Run: `npm run dev`

Test each transition:
- [ ] Hero load: Assembly → fade → text enters
- [ ] Hero scroll (0-12%): Left-pin expansion
- [ ] Positioning (12-25%): Hold left, fade to 0.07
- [ ] Positioning → Services (25-30%): Cross-screen sweep
- [ ] Services (30-40%): Hold right, fade to 0.08
- [ ] Services → Process (40-45%): Move center
- [ ] Process (45-55%): Hold center, fade to 0
- [ ] Work/Proof/Pricing (55-92%): Hidden
- [ ] Contact (92-95%): Fade in
- [ ] Contact (95-100%): Vortex collapse

**Step 3: Bidirectional scroll test**

Scrub scroll bar back and forth through each transition
Expected: Smooth reversibility, no jumps

**Step 4: Reduced motion test**

Enable reduced motion in OS settings
Expected: Graceful degradation, no jarring animations

**Step 5: Final commit**

```bash
git add -A
git commit -m "feat: complete emblem scroll choreography implementation

- Hero: assembly → fade → left-pin expansion
- Positioning: hold left, fade to background
- Services: cross-screen sweep, hold right
- Process: center, fade out
- Work/Proof/Pricing: hidden
- Contact: return + vortex collapse

Closes emblem scroll choreography implementation"
```

---

## Summary

| Task | Description | Files |
|------|-------------|-------|
| 1 | Add heroTextReady flag | OrbitSystem.tsx |
| 2 | Update Hero to use heroTextReady | Hero.tsx |
| 3 | Add emblem fade after assembly | OrbitSystem.tsx |
| 4 | Set up scroll choreography transforms | ScrollController.tsx |
| 5 | Apply transforms to OrbitSystem | ScrollController.tsx |
| 6 | Remove IntersectionObserver | ScrollController.tsx |
| 7 | Handle origin flip at destination | ScrollController.tsx |
| 8 | Gate transforms until intro complete | ScrollController.tsx |
| 9 | Make Emblem transformOrigin reactive | Emblem.tsx |
| 10 | Final verification | All |

**Total estimated time:** 45-60 minutes for experienced developer
