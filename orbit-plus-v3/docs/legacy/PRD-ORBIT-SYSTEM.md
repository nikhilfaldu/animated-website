# Product Requirements Document: Orbit-Plus V3
## "Orbit System" - Awwwards-Worthy Scrollytelling Website

---

## Executive Summary

**Project**: Orbit-Plus V3 - Web Design Studio Portfolio
**Vision**: The emblem isn't just a logo — it's a **living orbital system** representing the creative process
**Target**: Awwwards recognition through cinematic, tactile, interactive narrative-driven experience
**Philosophy**: 80% clarity, 20% magic

### The Reality Check
We're not just building for Awwwards — we're building for clients who need to trust you with their brand. The site needs to demonstrate competence through **restraint**, not complexity. Every unnecessary animation is a potential client thinking "will my site be this overwhelming?"

The sweet spot: **70% clarity, 30% magic**. Every kinetic moment must earn its complexity by enhancing comprehension, not competing with it.

---

## Core Creative Direction

### Conceptual Framework
Each of the 32 emblem radials is a "creative satellite" orbiting around client needs. As users scroll, they witness the creative system in action — transforming, adapting, and responding to their journey through the narrative.

### Design Inspiration
- **Active Theory** - Cinematic transitions and emotional weight
- **Locomotive** - Smooth scroll-driven animations
- **https://motion.zajno.com/** - Surprise moments and great transitions

---

## 5-Act Narrative Structure

### Act 1: ASSEMBLY (Hero Section)
**Narrative**: The creative system awakens and forms
- Radials arrive from deep space, each carrying a fragment of creative manifesto
- Typography emerges from negative space between assembling radials
- **Surprise Moment**: Scroll triggers gravitational pull — radials begin orbiting in 3D space
- **Emotional Temperature**: Anticipation → Recognition

### Act 2: EXPLORATION (Positioning/Services)
**Narrative**: Understanding the creative ecosystem
- **Positioning**: Particle field with device tilt interaction (Story 3.2)
- **Services**: Orbital compass navigation (simplified from kinetic dial)
- Emblem becomes navigational compass responding to user intent
- Hovering sections causes radials to point toward relevant content
- **Surprise Moment**: Click triggers "warp drive" — emblem explodes into particle tunnel
- **Emotional Temperature**: Curiosity → Understanding

### Act 3: PROCESS (The Creative Machine)
**Narrative**: Revealing the methodology
- Emblem transforms into mechanical diagram (gear system implementation)
- Each radial becomes a gear in the creative machine
- User interaction powers the machine, generating output
- **Surprise Moment**: Machine produces miniature emblems that populate as interface elements
- **Emotional Temperature**: Intrigue → Trust

### Act 4: PROOF (Data Constellation)
**Narrative**: Demonstrating impact through results
- Data-viz radials with milestone bursts (Story 3.6)
- Radials become data points in 3D space
- Success metrics orbit around core achievements
- **Surprise Moment**: User can grab and throw radials to rearrange data visualization
- **Emotional Temperature**: Validation → Confidence

### Act 5: CONNECTION (Portal)
**Narrative**: Opening the channel for collaboration
- SVG-to-WebGL dissolution into particle vortex (Story 4.3)
- Emblem opens as portal to contact
- Radials spiral into vortex formation
- **Surprise Moment**: Form submission triggers emblem supernova — entire page transforms
- **Emotional Temperature**: Excitement → Action

---

## Refined Scope Summary

### What We're Building (Simplified from Original Plans)
Based on our conversation and the "80% clarity, 20% magic" principle:

1. **Hero**: Assembly animation with gravitational scroll pull
2. **Positioning**: Particle field with device tilt (Story 3.2)
3. **Services**: Orbital compass navigation (simplified from kinetic dial)
4. **Process**: Emblem as mechanical diagram (gear system)
5. **Proof**: Data-viz radials with milestone bursts (Story 3.6)
6. **Contact**: SVG-to-WebGL dissolution into particle vortex (Story 4.3)

### What We're NOT Building
- ❌ 1000+ particle systems (200 well-choreographed particles instead)
- ❌ Extensive test suites and infrastructure
- ❌ Over-engineered WebGL effects

---

## Technical Architecture

### Emblem State Machine (Simplified from 10 to 5 States)

```typescript
type OrbitState = 'idle' | 'assembly' | 'orbit' | 'data' | 'vortex';

interface OrbitTransform {
  // Core positioning
  position: { x: number, y: number, z: number }
  rotation: { x: number, y: number, z: number }
  scale: number
  opacity: number
  
  // Dynamic origin (FROM V1 - PRESERVE)
  originX: number // 0-100
  originY: number // 0-100
  
  // Radial-specific transforms
  radials: {
    x: number
    y: number
    scale: number
    opacity: number
    rotate: number
  }[]
}
```

### Motion Language

**Easing Curves by State:**
- **Assembly**: `cubic-bezier(0.25, 0.46, 0.45, 0.94)` — Confident arrival
- **Orbit**: `cubic-bezier(0.33, 1, 0.68, 1)` — Perpetual motion
- **Machine**: `cubic-bezier(0.68, -0.55, 0.265, 1.55)` — Mechanical precision
- **Portal**: `cubic-bezier(0.87, 0, 0.13, 1)` — Gravitational pull

**Interaction Principles:**
1. **Scroll Velocity Reactive**: Fast scroll = more dramatic transforms
2. **Parallax Layers**: Radials exist at different z-depths
3. **Magnetic Snap Points**: Sections pull emblem into specific states
4. **Breathing Idle**: Subtle sine wave animation when scroll stops

---

## Elements to Preserve from V1

### 1. Dynamic Emblem Transformations
**Implementation**: Left-pinned expansion in Hero
```typescript
// FROM V1 Hero.tsx - PRESERVE THIS BEHAVIOR
originX.set(lerp(50, 0, eased)); // Transition origin from center to left
originY.set(50); // Keep vertically centered
x.set(lerp(startX, endX, eased)); // Compensate for origin change
scale.set(lerp(4, 12, eased)); // Dramatic scale increase
```

### 2. Theme Flip System
**Implementation**: Global theme switching with section exceptions
- Dark → Light at 52% scroll progress
- Process section handles its own theme
- Pricing section triggers specific inversion
- **File to preserve**: `useThemeFlip.tsx`

### 3. Portal Transitions
**Implementation**: Circular clip-path expansion from emblem position
- Uses CSS vars `--emblem-x` and `--emblem-y` for origin
- Inverts theme at animation midpoint
- Creates seamless color transitions
- **File to preserve**: `PortalTransition.tsx`


---

## Visual Design System

### Color Palette
```css
:root {
  --bg: 10 10 10;        /* #0A0A0A - near black */
  --fg: 245 245 245;     /* #F5F5F5 - near white */
  --accent: 0 255 255;   /* #00FFFF - cyan (surgical use) */
}
```

### Typography Scale
- `.h0`: `clamp(48px, 10vw, 128px)` - Hero headlines
- `.h1`: `clamp(34px, 6.8vw, 72px)` - Section titles
- `.h2`: `clamp(24px, 3.4vw, 40px)` - Subsections
- `.p`: `clamp(16px, 1.4vw, 18px)` - Body text

---

## Performance Requirements

### Core Metrics
- **60 FPS** minimum for all animations
- **< 100ms** interaction response time
- **200 particles max** (well-choreographed over quantity)
- **5 emblem states** 

### Optimization Strategies
- GPU-accelerated transforms only
- Intersection Observer for scroll detection
- RequestAnimationFrame for animations
- Progressive enhancement fallbacks
- Lazy loading for heavy assets

---

## Technology Stack

### Core
- **Framework**: React 18+ with TypeScript
- **Build**: Vite 5 (no excessive testing infrastructure)
- **Styling**: Tailwind CSS + CSS Modules
- **Animation**: Framer Motion 11

### 3D/WebGL (Simplified Implementation)
- **Library**: Three.js (broader community support)
- **React Integration**: react-three-fiber (React integration)
- **Helpers**: drei (pre-built helpers)
*This stack provides same capabilities with 70% less code than OGL*

### Utilities
- **Scroll**: Lenis for smooth scrolling
- **State**: React Context (no external state library)
- **Types**: TypeScript strict mode

### NO Testing Infrastructure
- No test files or testing frameworks
- Focus on production code only
- Manual QA through user testing

---

## Implementation Phases

### Phase 1: Core Scrollytelling Experience (2 Days)
- [ ] Set up project with all dependencies
- [ ] Create base section structure with smooth scrolling
- [ ] Implement basic scroll-driven animations
- [ ] Port theme flip and portal transitions from V1

### Phase 2: Emblem State Machine with 5 States (2 Days)
- [ ] Implement OrbitSystem context
- [ ] Create 5 core animation states
- [ ] Add scroll-driven state transitions
- [ ] Implement velocity-based responses

### Phase 3: Particle Field + Data Viz (3 Days)
- [ ] Integrate Three.js with react-three-fiber
- [ ] Create particle field for Positioning section
- [ ] Build data visualization for Proof section
- [ ] Implement SVG-to-WebGL handoff

### Phase 4: ADD ONE Surprise Moment Perfectly (1 Day)
- [ ] Choose highest-impact surprise moment
- [ ] Perfect the timing and execution
- [ ] Ensure it enhances rather than distracts
- [ ] Polish the interaction feedback

### Phase 5: User Testing with Non-Technical Users (1 Day)
- [ ] Observe real users navigating the site
- [ ] Identify confusion points
- [ ] Document unexpected behaviors
- [ ] Gather feedback on emotional impact

### Phase 6: Polish Based on Confusion Points (2 Days)
- [ ] Simplify overwhelming sections
- [ ] Clarify navigation affordances
- [ ] Optimize performance bottlenecks
- [ ] Refine timing and easing

**Total: 11 Days to MVP** (not 3 weeks to perfection)

---

## Success Criteria

### Functional Requirements
- [ ] All 5 narrative acts implemented with unique emblem behaviors
- [ ] Navigation system matches V2 positioning and behavior exactly
- [ ] Theme flip and portal transitions work as in V1
- [ ] 60 FPS maintained throughout all animations
- [ ] Fully keyboard navigable
- [ ] Screen reader compatible

### Experience Requirements
- [ ] Each section has a clear "surprise moment"
- [ ] Emblem transformations feel purposeful and connected to content
- [ ] Scroll experience feels smooth and responsive
- [ ] Interface demonstrates technical competence through restraint
- [ ] Site tells a coherent story about the creative process

### Quality Benchmarks
- [ ] Lighthouse Performance score > 90
- [ ] Zero accessibility violations (manual audit)
- [ ] Works on all modern browsers (Chrome, Firefox, Safari, Edge)
- [ ] Responsive from 320px to 4K displays
- [ ] No memory leaks or performance degradation over time
- [ ] Real user feedback validates clarity over complexity

---

## Risk Mitigation

### Technical Risks
- **WebGL Performance**: Implement progressive enhancement with CSS fallbacks
- **Mobile Performance**: Reduce particle counts and simplify animations on mobile
- **Browser Compatibility**: Test early and often, provide graceful degradation

### UX Risks
- **Cognitive Overload**: Follow 80/20 rule - 80% clarity, 20% magic
- **Motion Sickness**: Respect prefers-reduced-motion
- **Navigation Confusion**: Maintain clear visual hierarchy and affordances

---

## Appendix: Key File References

### From V1 (orbit-plus)
- `/src/hooks/useThemeFlip.tsx` - Theme switching logic
- `/src/hooks/useThemePortal.ts` - Portal transition hook
- `/src/components/animations/PortalTransition.tsx` - Portal animation component
- `/src/sections/original/Hero.tsx` - Dynamic emblem transformation reference

### From V2 (orbit-plus-v2)
- `/src/components/navigation/GlobalNav.tsx` - Navigation implementation
- `/src/components/navigation/KineticDialNav.tsx` - Dial navigation component
- `/src/assets/emblemPaths.ts` - SVG path data for 32 radials
- `/docs/stories/` - Complete feature specifications

### V3 Current State (orbit-plus-v3)
- `/src/context/OrbitSystem.tsx` - Central state management
- `/src/components/emblem/Emblem.tsx` - Core emblem component
- `/src/components/navigation/GlobalNav.tsx` - Navigation (needs updating)
- `/src/components/ScrollController.tsx` - Scroll orchestration

---

## Document Version
- **Version**: 1.1
- **Date**: October 2025
- **Author**: Development Team
- **Status**: Active Development
- **Updates**: Incorporated refined scope, removed test infrastructure, clarified client focus

---

END OF PRD