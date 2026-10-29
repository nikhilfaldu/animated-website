# Implementation Plan: Contact Vortex Portal

## Overview
Transform the Contact section from a simple form into an immersive portal experience where the emblem morphs into a stable vortex aperture, focusing attention on a frictionless contact form with GPU-accelerated clip-path animations.

## Story Reference
- **Primary Source**: `docs/stories/7. STORY-contact-vortex-portal.md`
- **Narrative Act**: Act 5 (Connection)
- **Goal**: Transform emblem into stable portal that focuses attention on frictionless contact form with 60 FPS, GPU-only transforms, and reduced-motion parity
- **User Story**: After viewing proof of impact, the user reaches the contact portal where the emblem opens as a channel for collaboration, with the form appearing inside the aperture and subtle animations guiding focus

## Requirements Summary
- **Core Interaction**: Emblem → Portal (ingress) → Stable form (ready) → Focus narrowing → Submit supernova → Confirmation
- **Emotional Temperature**: Excitement → Action
- **Performance Targets**: 60 FPS, GPU-only transforms (clip-path/transform/opacity), single spring per scalar
- **Accessibility**: Reduced motion snaps portal open, form fully keyboard navigable with ARIA labels, error recovery without jank

## State & Contracts
From story's state model:
- **States**: `ingress` | `ready` | `focusing` | `submitting` | `success` | `error`
- **Motion Values Required**: `originX`, `originY`, `bloomSignal` (from OrbitSystem)
- **Methods Required**: `animateTo('vortex')` on entry, `animateTo('orbit')` on exit
- **Transitions**:
  - Entry: `animateTo('vortex', 0.8)` → `ingress` (700ms) → `ready`
  - Focus: `ready` → `focusing` (subtle vignette + portal precession)
  - Submit: `ready` → `submitting` (supernova burst) → `success` or `error`
  - Recovery: `error` → `ready` (gentle shake)

## Research Findings

### Linked Knowledge Sources
- **623eee65f3cccdee** (Smashing Magazine - SVG clip-path animation) - Techniques for animating clipping paths with transform values
- **e7f872fd0b6a840d** (WAI-ARIA Practices) - Form accessibility patterns, ARIA labeling, and role guidance
- **ed1c83548cd0dc97** (Pixel Free Studio - Advanced CSS) - Form validation feedback with shake animations
- **motion.dev** (Framer Motion scroll animations) - useSpring patterns for smooth spring-based motion values

### Existing Patterns to Preserve
- **OrbitSystem integration**: Use `animateTo()` for state transitions, motion values for reactive updates
- **useReducedMotion hook**: Gate animations, provide instant fallback
- **Section structure**: `min-h-[120vh]` with sticky positioning for scroll-driven effects
- **Form patterns**: Existing Contact.tsx has basic form structure to enhance

### Integration Points
- **OrbitSystem**:
  - Current `vortex` state: `{ x: 50, y: 50, z: -500, scale: 0.5, rotateX: 60, rotateZ: 360, opacity: 0.5, originX: 50, originY: 50 }`
  - Need to add `bloomSignal` motion value for brightness effects
- **Emblem**: Portal clips emblem layer with `pointer-events: none`, form sits above
- **Theme/Portal**: Contact section maintains dark theme, portal edge provides visual boundary

## Implementation Tasks

### Phase 1: Core Portal & Accessible Form (MVP)

1. **Add bloomSignal to OrbitSystem**
   - Description: Extend OrbitSystemContext with `bloomSignal` motion value for portal brightness effects
   - Files to modify: `src/context/OrbitSystem.tsx`
   - Story guidance: Portal uses `bloomSignal` for subtle brightness echo during transitions
   - Dependencies: None
   - Acceptance gate: bloomSignal motion value accessible via useOrbitSystem hook
   - Estimated effort: 15 min

2. **Create PortalVortex component**
   - Description: Build animated portal with clip-path circle, swirling ring, and stable edge outline
   - Files to create: `src/components/PortalVortex.tsx`
   - Story guidance: Lines 87-148 provide complete component implementation with spring-based radius/rotation
   - Dependencies: Task 1 (bloomSignal)
   - Acceptance gate: Portal opens from 0 → 0.95 → 1.0 radius over 700ms, reduced-motion snaps instantly
   - Estimated effort: 1 hour

3. **Create accessible form components**
   - Description: Build Input, Textarea, Submit components with proper ARIA labels and focus management
   - Files to create: `src/components/forms/Input.tsx`, `Textarea.tsx`, `Submit.tsx`
   - Story guidance: Lines 240-292 provide complete implementations with required/disabled states
   - Dependencies: None
   - Acceptance gate: All inputs have visible labels, required markers, focus rings, keyboard navigable
   - Estimated effort: 45 min

4. **Refactor Contact section with portal integration**
   - Description: Replace existing Contact.tsx with state machine, portal handoff, and accessible form layout
   - Files to modify: `src/sections/Contact.tsx`
   - Story guidance: Lines 42-234 provide section scaffold with phase management and form card
   - Dependencies: Tasks 2, 3
   - Acceptance gate: Portal morph feels continuous, form stable within 700ms (50ms reduced-motion)
   - Estimated effort: 1.5 hours

5. **Add submit feedback states**
   - Description: Implement submitting/success/error visual feedback with live regions for screen readers
   - Files to modify: `src/sections/Contact.tsx`
   - Story guidance: Lines 171-229 show form states with role="status" and role="alert"
   - Dependencies: Task 4
   - Acceptance gate: Submit shows visual within 1s, success confirmation with aria-live, failure recovers without jank
   - Estimated effort: 30 min

### Phase 2: Focus Narrowing & Supernova (Polish)

6. **Implement focus-linked vignette and portal precession**
   - Description: Deepen background vignette and rotate portal slightly when user focuses any input
   - **Implementation approach**:
     - Track focus state with `onFocus`/`onBlur` handlers on all form inputs
     - When focused: update local state `isFocused = true`
     - **Vignette**: Animate background radial-gradient from weak to stronger (increase opacity by 15%)
     - **Portal precession**: Add +5-10 degrees to portal `swirl` rotation when focused
     - Use Framer Motion `animate` prop to smoothly transition both effects
     - Spring config: `{ stiffness: 100, damping: 18 }` for gentle response
   - Files to modify: `src/sections/Contact.tsx`, `src/components/PortalVortex.tsx`
   - Story guidance: Lines 154, 351 (focus narrowing with portal precession)
   - Dependencies: Phase 1 complete
   - Acceptance gate: Focusing field subtly deepens vignette and rotates portal 5-10°, no legibility loss
   - Estimated effort: 1 hour

7. **Add supernova burst on submit**
   - Description: Brief radial gradient burst overlaid on form during submit phase
   - Files to modify: `src/sections/Contact.tsx`
   - Story guidance: Lines 300-322 provide SVG radial gradient burst implementation
   - Dependencies: Phase 1 complete
   - Acceptance gate: Burst appears during submit, doesn't obscure copy, exits cleanly
   - Estimated effort: 30 min

### Phase 3: Micro-Journey Enhancements (Future)

8. **Add "send another / return to orbit" CTA**
   - Description: After success, provide options to submit another message or navigate away with emblem pulse
   - Files to modify: `src/sections/Contact.tsx`
   - Story guidance: Lines 351-352 mention optional micro-journey with emblem echo pulse
   - Dependencies: Phase 2 complete
   - Acceptance gate: Success state shows clear next actions, emblem pulses on "return to orbit"
   - Estimated effort: 45 min

## Files to Touch
- `src/context/OrbitSystem.tsx` - Add bloomSignal motion value
- `src/components/PortalVortex.tsx` - NEW: Portal clip-path animation component
- `src/components/forms/Input.tsx` - NEW: Accessible text input
- `src/components/forms/Textarea.tsx` - NEW: Accessible textarea
- `src/components/forms/Submit.tsx` - NEW: Animated submit button
- `src/sections/Contact.tsx` - MAJOR REFACTOR: Replace with portal-integrated version

## Motion Language
From story and PRD:
- **Easing**: Portal uses spring physics: `{ stiffness: 140, damping: 18 }` for radius, `{ stiffness: 120, damping: 20 }` for swirl
- **Duration**: Ingress 700ms (50ms reduced), submit burst 280ms, form animations 240ms
- **Portal Phases**:
  - Ingress: r=0.95, swirl=220deg
  - Ready: r=1.0, swirl=260deg
  - Submitting: r=1.1, swirl=360deg
  - Success: r=0.8, swirl=420deg

## Technical Architecture

### State Flow
```
Entry: animateTo('vortex') → ingress (portal opens) → ready (form stable)
  ↓
User focuses input → focusing (optional vignette)
  ↓
Submit clicked → submitting (supernova) → success OR error
  ↓
Success: stay on page with CTA | Error: recover to ready
```

### Component Hierarchy
```
Contact (section shell, state machine)
├── PortalVortex (clip-path animations, brightness)
└── ContactCard (form wrapper)
    ├── Input (name, email, company)
    ├── Textarea (message)
    ├── Submit (animated button)
    ├── Success message (role="status")
    └── Error message (role="alert")
```

### Motion Value Synchronization
OrbitSystem → PortalVortex:
- `originX`, `originY` → Portal center position (always 50%, 50% for this story)
- `bloomSignal` → Portal brightness filter (1.0 → 1.2 during transitions)
- Portal uses local springs for radius and swirl rotation

## Performance Guardrails
- **GPU-only**: transform, opacity, clip-path, filter (brightness) - no layout recalcs
- **Single spring per scalar**: Portal has 2 springs (radius + rotation), form has none (just transitions)
- **No global shadow-DOM filters**: Lightweight blur/brightness in short bursts only
- **Async submit**: Form logic uses async/await with timeout for UX (replace with real API later)

## Accessibility Requirements
- **Reduced motion**: Portal snaps open without swirl, form animates via opacity/scale ≤ 1.02 only
- **Keyboard navigation**: Tab order: name → email → company → message → submit
- **ARIA**:
  - Labels: All inputs have visible `<label>` with `htmlFor`
  - Required: `required` attribute + `<span aria-hidden>*</span>` in label
  - Descriptions: Form has `aria-describedby="contact-desc"` referencing intro paragraph
  - Live regions: Success uses `role="status" aria-live="polite"`, error uses `role="alert"`
- **Focus rings**: Custom sky-300 ring on focus, visible at all zoom levels

## Acceptance Criteria
- [ ] Portal morph: Emblem handoff feels continuous, portal stabilizes within ~700ms (50ms reduced-motion)
- [ ] Focus narrowing: Focusing field subtly deepens vignette, no legibility loss
- [ ] Form A11y: Labels, required markers, error text with role="alert", keyboard order natural, focus rings visible
- [ ] Submit feedback: "submitting" visual ≤ 1s, success confirmation with live region, failure recovers without jank
- [ ] Performance: 60 FPS during ingress/submit burst on modern laptops, no long-running JS on main thread
- [ ] Parity: Reduced-motion delivers equivalent meaning without swirl/expansion travel

## Dependencies and Libraries
All dependencies already in project:
- `framer-motion` - For motion values, springs, useSpring, useTransform
- `react` - For useState, useEffect, useRef
- Existing: `useOrbitSystem`, `useReducedMotion` hooks

## Notes and Considerations
- **No scroll trap**: Page scroll still works, form occupies logical end of journey
- **Emblem layer non-interactive**: `pointer-events: none` on portal, inputs sit above in z-stack
- **Real API integration**: Replace `await new Promise(res => setTimeout(res, 950))` with actual contact endpoint later
- **Optional audio feedback**: Story mentions optional audio on send - defer to Phase 3 or later project
- **Z-index management**: Portal above Proof constellation but non-interactive during transition

## Related Documentation
- Story file: `docs/stories/7. STORY-contact-vortex-portal.md`
- PRD: `docs/PRD-ORBIT-SYSTEM.md` (Act 5: Connection, section lines 65-73)
- Existing: `src/context/OrbitSystem.tsx` (vortex state configuration)
- Existing: `src/hooks/useReducedMotion.ts` (motion preference detection)

---
*This plan is ready for execution with `/execute-plan`*