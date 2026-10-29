# Implementation Plan: Proof Bloom Surprise Moment

## Overview
A singular, emotionally resonant "aha" moment in the Proof section. When users click-and-hold on the constellation, nodes brighten, lines refract, and a luminous bloom unfolds from the emblem's center. This 3.5-second interaction embodies "70% clarity, 30% magic."

## Story Reference
- **Primary Source**: `docs/stories/6. STORY-surprise-moment-proof-bloom.md`
- **Narrative Act**: Act 4 → Act 5 Transition
- **Goal**: Deliver one perfect surprise moment where data transcends structure and becomes insight
- **User Story**: When I click-and-hold the constellation, the network blooms into a luminous flower, revealing the hidden soul of the system

## Requirements Summary

### Core Interaction
- **Trigger**: Click-and-hold anywhere in Proof section
- **Response**: Constellation expands 60% radially, nodes brighten, emblem pulses, background lightens
- **Duration**: 3.5s total (1.5s expand, 2s fade)
- **Frequency**: Once per session only (preserves mystique)

### Emotional Temperature
From story (lines 19-24):
> Order achieves self-awareness, then lets go.

### Performance Targets
- Single shader uniform update per frame (`uBloom`)
- ≤ 100 particles (already established in PRP-5)
- GPU-only transforms, no React re-renders
- 60 FPS maintained throughout

### Accessibility
- ARIA live region: "Constellation expanded — network aligned momentarily"
- Reduced-motion fallback: Static SVG with text indicator
- No audio (unless explicitly enabled in settings - Phase 3)

## State & Contracts

### OrbitSystem Extension
**New Motion Value**: `bloomSignal` (0-1)
- Drives bloom intensity across system
- Fades from 1 → 0 over 4 seconds via requestAnimationFrame
- Consumed by ThreeConstellation and Emblem

**New Method**: `triggerBloom()`
- Sets `bloomSignal` to 1
- Initiates fade animation
- Guards against re-triggering (once per session)

### Bloom State Model
From story (lines 38-50):
```
bloom: {
  idle       // default constellation
  triggered  // click-hold begins
  peak       // fully expanded (~1.5s)
  fade       // graceful collapse (~2s)
}
```

## Research Findings

### Linked Knowledge Sources
Sources already linked from PRP-5:
- `r3f.docs.pmnd.rs` - useFrame patterns
- `threejs.org` - Shader uniforms
- `motion.dev` - useTransform for motion values
- `e8b453278608f98e` (LearnOpenGL Bloom) - Bloom effect patterns

*Note: These sources are already linked to project ID `3c6aeda4-d65b-40e9-a295-90ad77f2f442`*

### Existing Patterns to Preserve
- **Motion values in OrbitSystem**: Extend with `bloomSignal` (OrbitSystem.tsx:148)
- **Shader uniforms**: Add `uBloom` to existing constellation uniforms
- **Easing**: `[0.33, 1, 0.68, 1]` for bloom expansion (story line 89)

### Reference Code Examples
Story provides complete implementation:
- OrbitSystem extension (lines 104-141): `bloomSignal` motion value and `triggerBloom()`
- ThreeConstellation bloom logic (lines 148-224): Shader-driven radial expansion
- Emblem echo pulse (lines 249-270): Scale and opacity sync with `bloomSignal`
- Proof section trigger (lines 58-97): Pointer event handlers

## Implementation Tasks

### Phase 1: Core Bloom Mechanic
**Goal**: Working click-hold bloom with shader expansion and emblem pulse (MVP)

1. **Add bloomSignal to OrbitSystem**
   - Description: Create `bloomSignal` motion value, implement `triggerBloom()` method
   - Files: `src/context/OrbitSystem.tsx`
   - Story guidance: Lines 104-141 (context extension pattern)
   - Dependencies: None
   - Acceptance: `bloomSignal` animates 1 → 0 over 4s when triggered
   - Estimated effort: 1 hour

2. **Add uBloom Uniform to Constellation**
   - Description: Extend `useConstellation` hook with `uBloom` uniform
   - Files: `src/hooks/useConstellation.ts` (create if not exists)
   - Story guidance: Lines 231-243 (uniform structure)
   - Dependencies: Task 1, PRP-5 constellation
   - Acceptance: `uBloom` uniform exists and updates via `bloomSignal`
   - Estimated effort: 30 minutes

3. **Implement Shader Radial Expansion**
   - Description: Modify constellation shaders to expand nodes and brighten on `uBloom`
   - Files: `src/components/ThreeConstellation.tsx`
   - Story guidance: Lines 202-223 (VERT/FRAG shaders with bloom logic)
   - Dependencies: Task 2
   - Acceptance: Particles expand 60%, brighten, and point size increases
   - Estimated effort: 1.5 hours

4. **Add Emblem Echo Pulse**
   - Description: Use `useTransform` to scale/brighten emblem with `bloomSignal`
   - Files: `src/components/emblem/Emblem.tsx`
   - Story guidance: Lines 249-270 (motion transforms)
   - Dependencies: Task 1
   - Acceptance: Emblem scales 1 → 1.3, opacity 1 → 1.5 in sync
   - Estimated effort: 45 minutes

5. **Wire Pointer Events in Proof**
   - Description: Add `onPointerDown`/`onPointerUp` handlers, call `triggerBloom()`
   - Files: `src/sections/Proof.tsx`
   - Story guidance: Lines 58-97 (event handler pattern)
   - Dependencies: Tasks 1-4
   - Acceptance: Click-hold triggers bloom, releases early stops expansion
   - Estimated effort: 1 hour

6. **Add Session Guard**
   - Description: Prevent re-triggering bloom after first activation
   - Files: `src/sections/Proof.tsx`
   - Story guidance: Line 50 (once-per-session note)
   - Dependencies: Task 5
   - Acceptance: Bloom only triggers once per page load
   - Estimated effort: 30 minutes

7. **Add Reduced-Motion Fallback**
   - Description: Show static "Bloom Triggered" SVG when `prefers-reduced-motion`
   - Files: `src/sections/Proof.tsx`
   - Story guidance: Lines 290-304 (StaticProofBloom component)
   - Dependencies: Task 5
   - Acceptance: Users with reduced motion see static indicator
   - Estimated effort: 45 minutes

### Phase 2: Polish & Feedback (Optional)
**Goal**: Enhanced visual feedback and background modulation

8. **Add Background Light Modulation**
   - Description: Blur and brighten background during bloom via Framer Motion
   - Files: `src/sections/Proof.tsx`
   - Story guidance: Lines 86-90 (filter animation)
   - Dependencies: Phase 1 complete
   - Acceptance: Background subtly lightens during bloom
   - Estimated effort: 1 hour

### Phase 3: Audio Enhancement (Future)
**Goal**: Optional harmonic hum on trigger (deferred)

9. **Integrate Tone.js Audio Cue**
   - Description: Play subtle harmonic hum on bloom trigger
   - Files: Create audio utility, wire to `triggerBloom()`
   - Story guidance: Line 345 (audio cue mention)
   - Dependencies: User settings for audio enabled
   - Acceptance: Soft audio plays if enabled
   - Estimated effort: 2 hours

## Files to Touch

### Modified Files
- `src/context/OrbitSystem.tsx` - Add `bloomSignal` motion value and `triggerBloom()` method
- `src/hooks/useConstellation.ts` - Add `uBloom` uniform (or create if doesn't exist)
- `src/components/ThreeConstellation.tsx` - Modify shaders for radial expansion
- `src/components/emblem/Emblem.tsx` - Add bloom pulse transforms
- `src/sections/Proof.tsx` - Add pointer handlers, session guard, fallback

### No New Files Required
All functionality extends existing components from PRP-5.

## Motion Language

### Easing
- **Bloom expansion**: `[0.33, 1, 0.68, 1]` (orbital perpetual motion)
- **Fade return**: Linear via `requestAnimationFrame` (natural decay)

### Duration
- **Expand phase**: 1.5s to peak
- **Fade phase**: 2s return to stillness
- **Total**: 3.5-4s

### Shader Animation
From story vertex shader (lines 207-213):
```glsl
pos.xy *= 1.0 + uBloom * 0.6;  // 60% radial expansion
vIntensity = 0.6 + (uBloom * 1.4);  // Brightness surge
gl_PointSize = 2.0 + uBloom * 8.0;  // Size increase
```

## Technical Architecture

### Component Flow
```
User Click-Hold
  ↓
Proof.onPointerDown → triggerBloom()
  ↓
OrbitSystem.bloomSignal → 1
  ↓
├── ThreeConstellation.useFrame → uniforms.uBloom.lerp()
│   └── Shader radial expansion + brightening
└── Emblem.useTransform → scale & opacity sync
  ↓
requestAnimationFrame fade (4s)
  ↓
bloomSignal → 0 (return to stillness)
```

### Motion Value Synchronization
From story (lines 114, 164):
```typescript
// OrbitSystem broadcasts
bloomSignal.set(1);

// Constellation consumes (lerped for smoothness)
uniforms.uBloom.value = THREE.MathUtils.lerp(
  uniforms.uBloom.value,
  bloomSignal.get(),
  0.08
);

// Emblem transforms
scale = useTransform(bloomSignal, [0, 1], [1, 1.3]);
opacity = useTransform(bloomSignal, [0, 1], [1, 1.5]);
```

## Performance Guardrails

From story (lines 318-324):
- Single shader uniform update per frame (`uBloom`)
- Particle count already capped at ≤ 100
- GPU-only transforms (no buffer reallocation)
- Transition duration ≤ 4s
- No post-processing bloom (additive blending only)

## Accessibility Requirements

From story (lines 308-316):
- **ARIA live**: Polite announcement "Constellation expanded — network aligned momentarily"
- **Reduced motion**: Static SVG with text "Bloom Triggered"
- **No audio by default**: Avoid sound unless user enables
- **Decorative only**: All meaning conveyed through text overlay

## Acceptance Criteria

From story (lines 328-335):
- [ ] Click-and-hold triggers bloom, one-time per session
- [ ] Constellation expands 60% radially, nodes brighten, emblem pulses
- [ ] Total duration ~3.5-4s with smooth easing and return to stillness
- [ ] ARIA live announcement, reduced-motion fallback with static SVG
- [ ] 60 FPS maintained; no main-thread spikes; GPU-only transforms
- [ ] Bloom occurs only in Proof phase; gracefully transitions to Vortex act

## Dependencies and Libraries

Already installed (from PRP-5):
- `three`: ^0.169.0
- `@react-three/fiber`: ^8.17.10
- `framer-motion`: ^11.11.0

Optional Phase 3:
- `tone`: For audio cue (not required for MVP)

## Notes and Considerations

### Implementation Notes
- **Phase 1 is complete feature**: Click-hold bloom with visual feedback
- **Phase 2 is polish**: Background modulation enhances but not required
- **Phase 3 is optional**: Audio requires user preference settings
- **Once per session**: Use local state flag to prevent re-triggering
- **No test files**: Per PRD, manual QA only

### Integration with PRP-5
This feature **requires PRP-5 constellation to be implemented first**:
- Depends on `ThreeConstellation` component
- Depends on `useConstellation` hook with uniforms
- Extends existing shader with `uBloom` logic

If PRP-5 not complete, tasks 2-3 will create basic constellation scaffold.

### Potential Challenges
- **Shader complexity**: Keep GLSL simple (avoid complex calculations)
- **Session guard**: Use React state or sessionStorage for once-per-session
- **Mobile touch**: Ensure `onPointerDown` works on touch devices

### Future Enhancements (Phase 3)
- Audio harmonic hum via Tone.js
- Particle color shift (cyan → gold during bloom)
- Per-node staggered bloom ripple (currently uniform)

## Related Documentation
- Story file: `docs/stories/6. STORY-surprise-moment-proof-bloom.md`
- PRD: `docs/PRD-ORBIT-SYSTEM.md` (Phase 4: Add one surprise moment perfectly)
- PRP-5: `PRPs/5-proof-data-constellation.md` (prerequisite constellation)
- OrbitSystem: `src/context/OrbitSystem.tsx` (motion value patterns)

---
*This plan is ready for execution. Requires PRP-5 constellation to be implemented first.*