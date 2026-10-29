# Implementation Plan: Proof Data Constellation

## Overview
Transform the Proof section into a data-driven 3D constellation where metrics stabilize into a structured, glowing network. This section demonstrates "clarity after creation" by making the invisible architecture of creative ideas visible through WebGL particles.

## Story Reference
- **Primary Source**: `docs/stories/5. STORY-proof-data-constellation.md`
- **Narrative Act**: Act 4 - Proof
- **Goal**: Create satisfaction through pattern recognition - order emerging from motion
- **User Story**: As a visitor scrolls through Proof, they witness creative outputs from Process crystallize into an analytical field, revealing hidden logic through connected data points

## Requirements Summary

### Core Interaction
- **Trigger**: User enters #proof section → emblem transitions to `data` state
- **Response**: 3D particle constellation forms with ~80-100 nodes
- **Scroll Integration**: Particle flicker and connections respond to scroll velocity
- **Exit**: At 95% section progress → transition to `vortex` state

### Emotional Temperature
- Satisfaction through pattern recognition
- Clarity after creation
- Order emerging from creative chaos

### Performance Targets
- **60 FPS** minimum on all interactions
- **≤ 2ms GPU** frame cost on M2 Air baseline
- **≤ 100 particles** for baseline device compatibility
- No dynamic re-allocation in render loop

### Accessibility
- Static SVG fallback for `prefers-reduced-motion`
- Canvas has `role="img"` + descriptive `aria-label`
- All meaning conveyed through overlay text (no motion-only info)
- Semantic clarity equals visual constellation

## State & Contracts

### OrbitSystem Integration
**State**: `data` (already defined in OrbitSystem.tsx:72-83)
- Transform: flattened, luminous emblem pose
- Scale: 1.5
- Rotation: 0° (flat)
- Opacity: 1.0

**Methods Required**:
- `animateTo('data')` - transition emblem into data mode on section enter
- `animateTo('vortex')` - transition to next section on scroll exit
- `scrollProgress` - drive constellation activity and flicker
- `scrollVelocity` - modulate flicker rate (optional Phase 2)

### Constellation State Model
```
constellation: {
  idle        // faint static network (entry state)
  active      // particles flow & connect as user scrolls
  pulse       // on hover/drag, selected node brightens (Phase 2)
  dissolve    // end-of-section fade into vortex
}
```

## Research Findings

### Linked Knowledge Sources (from Supabase)
**Project sources to link in knowledge bank**:
- `r3f.docs.pmnd.rs` - React Three Fiber patterns for useFrame and Canvas setup
- `threejs.org` - BufferGeometry and Points implementation patterns
- `thebookofshaders.com` - Shader optimization and GPU performance
- `motion.dev` - Framer Motion scroll integration with useScroll hook
- `11633a51b3bff34f` (Tympanus instancing tutorial) - Efficient particle rendering patterns

*Note: Link these sources to project ID `3c6aeda4-d65b-40e9-a295-90ad77f2f442` in Supabase project_sources table*

### Existing Patterns to Preserve
From PRD and current codebase:
- **OrbitSystem motion values**: Already integrated in sections (see Proof.tsx:40, Hero.tsx)
- **useReducedMotion hook**: Existing pattern at src/hooks/useReducedMotion.ts:1
- **Section scroll detection**: Use existing `onMouseEnter` pattern (Proof.tsx:89)
- **Motion language**: Use `[0.25, 0.46, 0.45, 0.94]` easing for state transitions

### Reference Code Examples
From story file:
- Proof section scaffold (lines 48-99): React structure with scroll-linked opacity
- ThreeConstellation component (lines 108-182): R3F points/lines with shader material
- useConstellation hook (lines 188-234): Particle position generation and uniform management
- StaticDiagram fallback (lines 241-255): SVG alternative for reduced motion

### Integration Points
- **OrbitSystem**: Emblem transitions to `data` state, uses `scrollProgress` for activity
- **Emblem**: Already has `data` state visual (Emblem.tsx:61-74) - radials represent data points
- **Existing Proof.tsx**: Replace current metrics display with constellation layer (keep overlay text)
- **Canvas**: New Three.js layer behind existing content

## Implementation Tasks

### Phase 1: Static Constellation with Scroll Opacity
**Goal**: Working particle network that fades in/out with scroll (MVP - shippable)

1. **Create ThreeConstellation Component**
   - Description: Build R3F component with points and lines using BufferGeometry
   - Files: Create `src/components/ThreeConstellation.tsx`
   - Story guidance: Lines 108-182 (component scaffold with shader material)
   - Dependencies: None
   - Acceptance: 80 particles render at 60 FPS with additive blending
   - Estimated effort: 2 hours

2. **Create useConstellation Hook**
   - Description: Generate particle positions and link connections using Float32Array
   - Files: Create `src/hooks/useConstellation.ts`
   - Story guidance: Lines 188-234 (data generation pattern)
   - Dependencies: Task 1
   - Acceptance: Returns positions buffer and uniforms object
   - Estimated effort: 1 hour

3. **Integrate Constellation into Proof Section**
   - Description: Add Canvas with ThreeConstellation, wire scroll-linked opacity
   - Files: Modify `src/sections/Proof.tsx`
   - Story guidance: Lines 48-99 (section structure with scroll hooks)
   - Dependencies: Tasks 1-2
   - Acceptance: Constellation appears behind metrics, fades with scroll
   - Estimated effort: 1.5 hours

4. **Wire OrbitSystem State Transitions**
   - Description: Trigger `animateTo('data')` on enter, `animateTo('vortex')` on exit
   - Files: Modify `src/sections/Proof.tsx`
   - Story guidance: Lines 73-76 (useMotionValueEvent pattern)
   - Dependencies: Task 3
   - Acceptance: Emblem transitions to data pose at section boundaries
   - Estimated effort: 1 hour

5. **Add Static SVG Fallback**
   - Description: Render StaticDiagram when useReducedMotion returns true
   - Files: Modify `src/sections/Proof.tsx`
   - Story guidance: Lines 241-255 (SVG fallback component)
   - Dependencies: Task 3
   - Acceptance: Users with reduced motion see static diagram instead of WebGL
   - Estimated effort: 45 minutes

### Phase 2: Velocity Modulation, Process Continuity & Hover (Polish)
**Goal**: Scroll-reactive flicker, visual continuity from Process, and localized brightening

6. **Add scroll velocity-reactive flicker**
   - Description: Feed `scrollVelocity` into uTime multiplier for faster flicker on faster scroll
   - **Implementation approach**:
     - Read `scrollVelocity` from OrbitSystem in ThreeConstellation
     - Map velocity to time multiplier: `timeScale = 1.0 + (abs(velocity) * 0.3)` (30% faster per velocity unit)
     - Update uTime: `uTime += delta * timeScale` instead of `uTime += delta`
     - Clamp timeScale to [1.0, 2.5] to prevent runaway flicker
   - Files: Modify `src/components/ThreeConstellation.tsx`, `src/hooks/useConstellation.ts`
   - Story guidance: Lines 118-120 (useFrame with delta), 262 (velocity modulation)
   - Dependencies: Phase 1 complete
   - Acceptance: Particles flicker faster during scroll, slower when idle; no jank
   - Estimated effort: 1 hour

7. **Add visual continuity from Process outputs**
   - Description: Morph machine output chips into constellation nodes for narrative continuity
   - **Implementation approach**:
     - When Process section emits output chips (ThroughputRail), store in shared context or OrbitSystem
     - On Proof entry, read last ~6-8 outputs from Process
     - Position first 8 constellation nodes at coordinates matching chip final positions (right-side rail)
     - Animate those nodes from chip positions → constellation positions over 800ms
     - Remaining nodes (72+) appear from center with standard animation
     - Use `motion.create()` for smooth position interpolation
   - Files: Modify `src/sections/Proof.tsx`, `src/components/ThreeConstellation.tsx`, potentially `src/context/OrbitSystem.tsx`
   - Story guidance: Lines 297-299 (continuity requirement)
   - Dependencies: Process section implemented with ThroughputRail
   - Acceptance: First 8 nodes morph from chip positions, creates "aha" continuity moment
   - Estimated effort: 2 hours

8. **Implement Hover Raycasting**
   - Description: Detect hovered particle, update uHover uniform for localized brightening
   - Files: Modify `src/components/ThreeConstellation.tsx`
   - Story guidance: Lines 267-272 (raycaster example)
   - Dependencies: Tasks 6-7
   - Acceptance: Nearest particle brightens on hover without frame drop
   - Estimated effort: 2 hours

### Phase 3: Real Process Metadata Integration (Future)
**Goal**: Populate nodes with actual Process output data (deferred)

9. **Connect Process Output to Constellation with metadata**
   - Description: Pass Process section metadata as node labels/tooltips
   - Files: Create data bridge between Process and Proof sections
   - Story guidance: Phase 3 note (line 323)
   - Dependencies: Process section fully implemented, Task 7 complete
   - Acceptance: Node data reflects actual creative outputs with labels
   - Estimated effort: 3 hours

## Files to Touch

### New Files
- `src/components/ThreeConstellation.tsx` - R3F points/lines component with shader material
- `src/hooks/useConstellation.ts` - Particle data generation and uniform management

### Modified Files
- `src/sections/Proof.tsx` - Add Canvas layer, wire scroll detection, add SVG fallback
- `src/context/OrbitSystem.tsx` - No changes needed (`data` state already exists)
- `src/components/emblem/Emblem.tsx` - No changes needed (data mode already implemented)

## Motion Language

### Easing
- **Assembly easing**: `[0.25, 0.46, 0.45, 0.94]` (confident arrival) - used for state transitions
- **Spring config**: `{ stiffness: 80, damping: 16 }` for opacity fade (from story line 69-71)

### Duration
- Opacity fade: 1.2s (via spring)
- Particle flicker: Continuous via shader `uTime`
- Emblem transitions: 0.8s (from existing Proof.tsx:89)

### Shader Animation
- Vertex flicker: `sin(uTime * 2.0 + pos.x * 0.1) * 0.1`
- No stagger (uniform timing for all particles)

## Technical Architecture

### Component Structure
```
<Proof>
  ├── <Canvas> (Three.js layer, z-index: 0)
  │   └── <ThreeConstellation>
  │       ├── <points> (BufferGeometry with shader material)
  │       └── <lineSegments> (BufferGeometry for connections)
  └── <OverlayText> (z-index: 10, pointer-events: none)
      ├── Metrics grid (existing)
      └── Testimonials (existing)
```

### Motion Value Synchronization
```
Scroll Event
  ↓
useScroll → scrollYProgress
  ↓
useMotionValueEvent → animateTo('data' | 'vortex')
  ↓
OrbitSystem.animateTo → emblem motion values
  ↓
Emblem transforms (scale: 1.5, rotateX: 0)
```

### Data Flow
```
useConstellation hook
  ↓
Generate Float32Array positions (80 points × 3)
Generate Float32Array links (80 links × 6)
Create uniforms { uTime: 0 }
  ↓
Pass to ThreeConstellation
  ↓
BufferGeometry attributes
  ↓
GPU rendering (additive blending, no depth write)
```

## Performance Guardrails

From story "Performance" section (lines 285-291):
- **Particle count**: ≤ 100 for baseline devices (using 80)
- **Geometry**: Instanced geometry with single shader material ✓
- **No dynamic allocation**: Float32Arrays created once in useMemo ✓
- **Uniform updates**: Minimal set (uTime only in Phase 2) ✓
- **Post-processing**: Use additive blending instead of bloom for performance ✓
- **Target**: ≤ 2ms GPU frame cost on M2 Air

## Accessibility Requirements

From story "Accessibility" section (lines 277-282):
- **Reduced motion**: StaticDiagram SVG fallback (Task 5)
- **Canvas semantics**: `role="img"` + `aria-label="Constellation visualization of data connections"`
- **No motion-only info**: Overlay text conveys all meaning
- **Keyboard nav**: Not required (non-interactive visualization)
- **Screen reader**: Announces section title and metrics (existing)

## Acceptance Criteria

From story lines 310-316:
- [ ] Constellation forms smoothly as user enters section (60 FPS target)
- [ ] Scroll velocity influences flicker rate and node activity (Phase 2)
- [ ] Hover produces localized brightening without frame-drop (Phase 2)
- [ ] Emblem transition in/out synchronized with section entry/exit via `animateTo`
- [ ] Reduced-motion variant renders static SVG diagram with equal semantic clarity
- [ ] Performance budget: ≤ 2ms GPU frame cost on M2 Air baseline

## Dependencies and Libraries

Already installed (package.json:20-23):
- `three`: ^0.169.0
- `@react-three/fiber`: ^8.17.10
- `@react-three/drei`: ^9.114.0
- `framer-motion`: ^11.11.0

No new dependencies required.

## Notes and Considerations

### Important Implementation Notes
- **Keep it simple**: 80 particles max, no complex shaders
- **Phase 1 is shippable**: Static constellation with scroll opacity is complete feature
- **Phase 2 is polish**: Hover/velocity are nice-to-have enhancements
- **Phase 3 is future**: Process integration requires Process section completion
- **No test files**: Per PRD, manual QA only
- **No bloom effect**: Use additive blending for performance (story line 290)

### Potential Challenges
- **Raycasting performance**: May need spatial partitioning for 100 particles (Phase 2)
- **Mobile performance**: Consider reducing particle count to 50 on mobile detection
- **Z-fighting**: Ensure Canvas z-index < overlay content z-index

### Future Enhancements (Phase 3)
- Node labels with Process output metadata
- Click-hold to lock constellation and increase bloom (story lines 263-264)
- Scroll velocity multiplier on uTime (story line 262)

### Instrumentation
Not required per PRD (no test infrastructure), but useful for debugging:
- Console log particle count on mount
- Log GPU frame time in development (via Chrome DevTools)

## Related Documentation
- Story file: `docs/stories/5. STORY-proof-data-constellation.md`
- PRD: `docs/PRD-ORBIT-SYSTEM.md` (sections: Act 4 Proof, Technical Architecture, Performance Requirements)
- OrbitSystem: `src/context/OrbitSystem.tsx:72-83` (data state definition)
- Emblem data mode: `src/components/emblem/Emblem.tsx:61-74` (radial transform logic)

---
*This plan is ready for execution with `/execute-plan PRPs/5-proof-data-constellation.md`*
