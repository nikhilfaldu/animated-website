# Implementation Plan: Clarity & Magic Guardrails

## Overview
Establish global design, motion, and development standards ensuring every interaction balances **clarity (70%)** and **magic (30%)** across all acts of Orbit-Plus V3. This systemic foundation provides cross-component motion constants, responsiveness principles, interaction physics, and semantic accessibility patterns to preserve visual coherence and performance discipline.

## Story Reference
- **Primary Source**: `docs/stories/8. STORY-clarity-magic-guardrails.md`
- **Narrative Act**: Foundation (spans all 5 acts)
- **Goal**: Create a unified motion language and accessibility framework that ensures every flourish originates from clear intent, every motion pays rent in comprehension, and magic amplifies clarity—it never obscures it.

## Requirements Summary
- **Core Interaction**: System-wide motion constants, physics hooks, and accessibility utilities consumed by all interactive components
- **Emotional Temperature**: Predictable → Trustworthy (clarity) + Surprise → Memorable (magic)
- **Performance Targets**: 60 FPS minimum, ≤16ms main-thread tasks, no layout thrash
- **Accessibility**: Reduced-motion parity, live-region announcements, keyboard navigation support

## State & Contracts
From story's sections:
- **Motion Constants**: Centralized durations (short/base/medium/long), easings (orbit/clarity/spring/softSpring), physics (inertia/scroll sensitivity)
- **OrbitSystem Extensions**: Add `bloomSignal` and `globalFocus` motion values for cross-component coordination
- **Methods Required**: `animateTo()` already exists in OrbitSystem, extend with additional motion values
- **Transitions**: All components consume from shared motion constants

## Research Findings

### Linked Knowledge Sources
**Project sources referenced from knowledge bank**:
- motion.dev - Framer Motion scroll animations and spring physics patterns
- tailwindcss.com - CSS variable theming and custom property systems
- developer.mozilla.org - Accessibility best practices for keyboard navigation and ARIA
- blog.pixelfreestudio.com - Reduced motion implementation patterns
- tympanus.net - Performance optimization techniques for web animations

*Note: These sources informed motion constant structures, accessibility patterns, and CSS variable approaches*

### Existing Patterns to Preserve
From PRD and current codebase:
- OrbitSystem already provides centralized motion values (scrollProgress, scrollVelocity)
- useReducedMotion hook already exists at src/hooks/useReducedMotion.ts
- Dynamic origin system (originX/originY) from V1 preserved in OrbitSystem
- Theme flip and portal transitions rely on consistent motion language

### Reference Code Examples
From story file:
- MOTION constants object with nested d/ease/inertia/scroll namespaces
- useMotionPhysics hook for consistent spring configurations
- CSS variables for clarity/magic mode toggling
- Live region announcement helper function
- Velocity mapping with clamping to prevent runaway animations

### Integration Points
- **OrbitSystem**: Extend with bloomSignal, globalFocus motion values
- **All Sections**: Consume MOTION constants for durations and easings
- **Theme System**: Integrate clarity/magic CSS variables for hover states
- **Accessibility**: Global live-region div in App.tsx, announce() utility

## Implementation Tasks

### Phase 1: Foundation - Motion Constants & Physics
Establish core motion language and physics system.

1. **Create motion constants file**
   - Description: Define MOTION object with durations, easings, physics, scroll sensitivity
   - Files to create: `src/styles/motion.ts`
   - Story guidance: Section 1 provides exact constant values
   - Dependencies: None
   - Acceptance gate: All sections can import and reference MOTION constants
   - Estimated effort: 20 minutes

2. **Extend OrbitSystem with new motion values**
   - Description: Add bloomSignal and globalFocus motion values to context
   - Files to modify: `src/context/OrbitSystem.tsx`
   - Story guidance: Section 3 shows required motion values
   - Dependencies: Task 1 complete
   - Acceptance gate: OrbitSystem exports bloomSignal and globalFocus
   - Estimated effort: 30 minutes

3. **Create motion physics hook**
   - Description: Build useMotionPhysics hook for consistent spring behavior
   - Files to create: `src/hooks/useMotionPhysics.ts`
   - Story guidance: Section 2 provides exact implementation
   - Dependencies: Task 1 complete (imports MOTION)
   - Acceptance gate: Hook returns properly configured spring motion value
   - Estimated effort: 20 minutes

4. **Create motion scale hook**
   - Description: Build useMotionScale hook for responsive motion scaling
   - Files to create: `src/hooks/useMotionScale.ts`
   - Story guidance: Section 4 shows implementation with mobile/reduced motion detection
   - Dependencies: useReducedMotion hook exists
   - Acceptance gate: Returns scaled values based on device and preferences
   - Estimated effort: 20 minutes

4b. **Add velocity mapping utility to OrbitSystem**
   - Description: Create consistent velocity clamping pattern for all sections
   - **Implementation approach**:
     - Add helper to OrbitSystem context: `useClampedVelocity(maxVelocity = 4)`
     - Returns: `useTransform(scrollVelocity, v => Math.min(maxVelocity, Math.abs(v)))`
     - Standardizes velocity clamping across Process, Proof, and other sections
     - Prevents runaway animations from extremely fast scrolling
   - Files to modify: `src/context/OrbitSystem.tsx`
   - Story guidance: Section 8 (Scroll & Velocity Mapping)
   - Dependencies: Task 2 complete (OrbitSystem extended)
   - Acceptance gate: All sections use consistent velocity clamping, no custom implementations
   - Estimated effort: 15 minutes

### Phase 2: Accessibility & Clarity/Magic System
Implement accessibility utilities and visual mode system.

5. **Create accessibility utilities**
   - Description: Build announce() helper and live-region setup
   - Files to create: `src/utils/a11y.ts`
   - Story guidance: Section 7 shows announce function implementation
   - Dependencies: None
   - Acceptance gate: announce() updates live region without blocking
   - Estimated effort: 20 minutes

6. **Add live region to App.tsx**
   - Description: Insert global ARIA live region div
   - Files to modify: `src/App.tsx`
   - Story guidance: Section 7 shows div structure with sr-only class
   - Dependencies: Task 5 complete
   - Acceptance gate: Live region present in DOM, screen-reader accessible
   - Estimated effort: 10 minutes

7. **Create CSS variables for clarity/magic modes**
   - Description: Define CSS custom properties for opacity/scale/blur toggles
   - Files to modify: `src/styles/globals.css` (add theme.css section)
   - Story guidance: Section 5 provides exact variable definitions
   - Dependencies: None
   - Acceptance gate: CSS variables respond to [data-mode] attribute
   - Estimated effort: 20 minutes

8. **Create dev toggle component**
   - Description: Build ClarityMagicToggle button for testing
   - Files to create: `src/components/dev/ClarityMagicToggle.tsx`
   - Story guidance: Section 11 shows complete component code
   - Dependencies: Task 7 complete
   - Acceptance gate: Button toggles body[data-mode] and updates label
   - Estimated effort: 20 minutes

### Phase 3: Audit & Integration
Apply guardrails across all existing components.

9. **Audit Hero section for motion constants**
   - Description: Replace hard-coded easings/durations with MOTION imports
   - Files to modify: `src/sections/Hero.tsx`
   - Story guidance: All transitions must use MOTION.d.* and MOTION.ease.*
   - Dependencies: Phase 1 complete
   - Acceptance gate: No magic numbers in Hero animations
   - Estimated effort: 30 minutes

10. **Audit remaining sections (Positioning → Contact)**
    - Description: Replace hard-coded values with MOTION constants in all sections
    - Files to modify: All section files in `src/sections/`
    - Story guidance: Consistency requirement from acceptance criteria
    - Dependencies: Task 9 complete (pattern established)
    - Acceptance gate: Grep shows no hard-coded duration/easing values
    - Estimated effort: 1 hour

11. **Add reduced-motion parity to all animations**
    - Description: Wrap animations with prefersReducedMotion checks
    - Files to modify: All section files with animations
    - Story guidance: Section 6 shows pattern: `duration: prefersReduced ? 0 : MOTION.d.medium`
    - Dependencies: Phase 2 complete
    - Acceptance gate: All animations respect reduced-motion preference
    - Estimated effort: 45 minutes

## Files to Touch
Directly from story's "Files to Touch" section:
- `src/styles/motion.ts` - Motion constants (CREATE)
- `src/context/OrbitSystem.tsx` - Add bloomSignal, globalFocus motion values (MODIFY)
- `src/hooks/useMotionPhysics.ts` - Spring physics hook (CREATE)
- `src/hooks/useMotionScale.ts` - Responsive motion scaling (CREATE)
- `src/styles/globals.css` - CSS vars for clarity/magic modes (MODIFY)
- `src/hooks/useReducedMotion.ts` - Already exists (REFERENCE)
- `src/utils/a11y.ts` - Live-region helpers, focus management (CREATE)
- `src/components/dev/ClarityMagicToggle.tsx` - Dev testing toggle (CREATE)
- `src/App.tsx` - Global live region div (MODIFY)
- `src/sections/*.tsx` - Audit all for motion constants (MODIFY)

## Motion Language
From story and PRD:

**Durations**:
- short: 0.18s
- base: 0.28s
- medium: 0.44s
- long: 0.72s

**Easings**:
- orbit: [0.33, 1, 0.68, 1] - Natural orbital feel
- clarity: [0.4, 0, 0.2, 1] - Standard UI transition
- spring: { stiffness: 140, damping: 18 } - Emblem/bloom echo
- softSpring: { stiffness: 80, damping: 22 } - Background swells

**Physics**:
- inertia: { friction: 0.85, maxVelocity: 4 }
- scroll: { sensitivity: 0.0025 }

## Technical Architecture

### Component Integration
```
OrbitSystem (central registry)
  ├─ Motion Constants (MOTION object)
  ├─ Motion Values (bloomSignal, globalFocus, scroll*)
  └─ All Sections
       ├─ Import MOTION constants
       ├─ useMotionPhysics() for springs
       ├─ useMotionScale() for responsive values
       └─ useReducedMotion() for accessibility
```

### Motion Value Synchronization
All sections access shared motion values from OrbitSystem:
- `scrollProgress` - Normalized 0-1 scroll position
- `scrollVelocity` - Clamped [-4, 4] scroll speed
- `bloomSignal` - Triggers bloom effects across components
- `globalFocus` - Vignette/focus narrowing coordination

## Performance Guardrails
From story's "Dev & Performance Guardrails" section:
- Main-thread blocking: ≤16ms per frame
- Animation FPS: 60 minimum
- No CPU-intensive hooks in render path
- Max 2 React renders per interaction
- GPU-only transforms (transform, opacity only)
- No layout reads inside rAF loops

## Accessibility Requirements
From story's "Accessibility Guardrails" and "Reduced-Motion Parity" sections:
- **Reduced motion**: Replace orbital rotation with opacity fade, limit spring overshoot
- **Live regions**: Announce non-visual state changes (Proof Bloom, form success)
- **ARIA timing**: Preserve semantic timing even with reduced motion
- **Keyboard navigation**: All interactive elements keyboard accessible
- **Contrast**: UI maintains ≥AA contrast, never sacrifices clarity for spectacle

## Acceptance Criteria
Directly from story's "Acceptance Criteria" section:
- [ ] Consistency: All transitions draw from MOTION constants
- [ ] Parity: Reduced-motion paths implemented for every animation
- [ ] Accessibility: Live-region announcements for non-visual state changes
- [ ] Performance: No animation drops below 55 FPS in baseline test
- [ ] Legibility: UI maintains contrast ≥AA; never sacrifices clarity for spectacle

## Dependencies and Libraries
From story and PRD:
- Framer Motion 11 - useSpring, useMotionValue, useTransform hooks
- React 18 - Context API for OrbitSystem
- TypeScript - Strict typing for motion constants

## Notes and Considerations
- **No testing infrastructure**: Per PRD, no test files or frameworks
- **Manual QA only**: Test reduced-motion with browser DevTools
- **Dev toggle is optional**: ClarityMagicToggle is for development testing, not production
- **CSS variables over JS**: Prefer CSS vars for theme switching (better performance)
- **Future enhancement**: Performance lint rules (Section 10) deferred to later phase

## Related Documentation
- Story file: `docs/stories/8. STORY-clarity-magic-guardrails.md`
- PRD: `docs/PRD-ORBIT-SYSTEM.md` (sections on Motion Language, Performance Requirements)
- OrbitSystem: `src/context/OrbitSystem.tsx` (central state management)
- Existing hook: `src/hooks/useReducedMotion.ts` (accessibility pattern)

---
*This plan is ready for execution with `/execute-plan`*
