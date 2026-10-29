# Orbit+ Portfolio Site Redesign Plan

## Overview

This document captures the full redesign plan for the Orbit+ portfolio site. The site is technically sophisticated (WebGL transitions, scroll-driven animations, 3D navigation cylinder) but visually anonymous—mechanics say bespoke, surface says template.

**Root Cause:** Aesthetic wrapper, not interaction complexity. Fix the visual surface without touching scroll logic.

**Two Workstreams:**
1. Visual Identity Transformation
2. Mobile Responsiveness

---

## Part 1: Visual Identity Transformation

### Problem Diagnosis

Current state: "Technically distinctive but visually anonymous"
- System fonts (Space Grotesk) blend into SaaS crowd
- Cyan accent indistinguishable from every tech startup
- No texture, no grain, no tactile quality
- Typography has no voice

### Design Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Color scheme | Pure black & white | Confident, craft-focused identity. Removed cyan entirely. |
| Display typeface | Syne (Google Fonts) | Quirky, off-kilter character matches "brands that don't fit the mold" positioning |
| Texture | Subtle grain overlay | Tactile shift from flat digital to film-like quality |

### Implementation Priority Order

#### 1. Typography (60% of visual impact)
**Files:** `index.html`, `tailwind.config.js`, `globals.css`
```html
<!-- index.html <head> -->
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Syne:wght@400;500;600;700;800&display=swap" rel="stylesheet">
```
```js
// tailwind.config.js
fontFamily: {
  display: ['Syne', 'system-ui', 'sans-serif'],
  body: ['Syne', 'system-ui', 'sans-serif'],
}
```
```css
/* globals.css */
body {
  font-family: 'Syne', system-ui, sans-serif;
}

.display {
  font-family: 'Syne', system-ui, sans-serif;
  letter-spacing: -0.02em;
}

.h0 {
  font-weight: 700; /* or 800 for more punch */
  letter-spacing: -0.03em;
}

.h1 {
  font-weight: 600;
  letter-spacing: -0.02em;
}
```

#### 2. Grain Overlay (tactile shift)
**Files:** `globals.css` (CSS-only approach)
```css
/* Grain overlay - subtle texture */
body::before {
  content: '';
  position: fixed;
  inset: 0;
  pointer-events: none;
  z-index: 9999;
  opacity: 0.035;
  background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E");
  background-repeat: repeat;
}
```

**Tuning variables:**
- `opacity: 0.035` — lower (0.02) for barely-there, higher (0.05) for more film-like
- `baseFrequency='0.8'` — lower = larger grain, higher = finer grain

#### 3. Accent Color Removal
**Files:** `globals.css`, grep entire codebase for "accent"
```css
/* globals.css - neutralize accent */
:root {
  --accent: 0 0% 96%; /* Maps to near-white for backwards compat */
}
```

**Primary CTA replacement:**
```css
.btn-primary {
  @apply inline-flex items-center justify-center;
  @apply gap-3 px-6 py-3;
  @apply border border-fg/100 rounded-full;
  @apply transition-all duration-[var(--transition)];
  background: rgb(var(--fg));
  color: rgb(var(--bg));
}

.btn-primary:hover {
  background: transparent;
  color: rgb(var(--fg));
}
```

**Files to audit:**
- `GlobalNav.tsx` — change `className="text-accent"` to `"text-white"` on KineticDialNav
- `Contact.tsx` — `.btn-accent` on submit button
- Any component using `hsl(var(--accent))`

#### 4. Utilitarian Section Labels (rhythm and craft details)
**Pattern:** Add monospace markers to each section
```jsx
<div className="font-mono text-[10px] tracking-[0.3em] uppercase opacity-50 mb-4">
  01 — Introduction
</div>
```

Apply across: Hero, Positioning, Services, Process, Work, Proof, Pricing, Contact

#### 5. Background Depth (final polish)
Subtle radial gradient vignette or geometric grid at opacity 0.02

---

## Part 2: Mobile Responsiveness

### Current State Audit

#### Already Done ✓
- Responsive hooks infrastructure (`useIsMobile`, `useBreakpoint`, `useResponsiveValue`)
- Mobile config values in `MOBILE_TARGETS` (`mobileTargets.ts`)
- GlobalNav: emblem 72px on mobile (vs 96px desktop), cylinder scaled 1.5x for touch
- Hero `.h0`: mobile breakpoint at 640px reduces font size
- Services: bullets hidden on mobile (`hidden md:block`)
- Work: `grid-cols-1 sm:grid-cols-2`
- Pricing: `md:grid-cols-2 lg:grid-cols-4`
- Contact: already mobile-friendly (centered, max-w-2xl)

#### Broken or Missing ✗

**Critical:**
1. KineticDialNav 3D cylinder — drag/wheel assumes desktop
2. Positioning section — `pt-[42vh]` fixed overlay clips on short viewports
3. Process progress circle — absolute positioning overlaps content on mobile
4. Pricing card expansion — `col-span-2` meaningless on single-column mobile grid
5. WebGL performance — tunnels, morphing emblem all running on mobile

**Moderate:**
6. Typography untested at small sizes
7. Touch target audit needed (44px minimum)
8. Safe area insets (notch) not handled
9. No systematic mobile-first class usage

### Mobile Implementation Plan

#### Phase 1: Critical Fixes (Priority: HIGHEST)
**Goal:** Site is usable on mobile without breaking

| Priority | Task | Section | Effort | Details |
|----------|------|---------|--------|---------|
| P0 | Simplify KineticDialNav touch interaction | GlobalNav | 2-3 hrs | Keep cylinder, make tap-to-advance rather than drag-to-rotate on mobile |
| P0 | Fix Positioning overlay dynamic vh | Positioning2.tsx | 30 min | Replace `pt-[42vh]` with dynamic safe positioning using `useBreakpoint` |
| P0 | Move/hide Process progress circle | Process.tsx | 20 min | Reposition or hide on mobile viewports |
| P0 | Disable Pricing card expansion on mobile | Pricing.tsx | 20 min | Skip `col-span-2` expansion when `isMobile` |

**KineticDialNav mobile approach (Option B - simplified touch):**
```tsx
// In KineticDialNav.tsx
const isMobile = useIsMobile();

// On mobile: tap anywhere on cylinder to advance to next item
const handleMobileTap = useCallback(() => {
  if (!isMobile || !isInteractive) return;
  const nextIndex = (activeIndex + 1) % items.length;
  const newRotation = -nextIndex * theta;
  rotationRef.current = newRotation;
  setRotation(newRotation);
  onActiveIndexChange?.(nextIndex);
}, [isMobile, isInteractive, activeIndex, items.length, theta, onActiveIndexChange]);

// Disable drag on mobile, use tap instead
onMouseDown={isMobile ? undefined : handleDragStart}
onTouchStart={isMobile ? undefined : handleDragStart}
onClick={isMobile ? handleMobileTap : undefined}
```

#### Phase 2: Performance (Priority: HIGH)
**Goal:** Site is fast on mobile

| Priority | Task | Section | Effort | Details |
|----------|------|---------|--------|---------|
| P1 | Conditionally disable GlobalCanvas WebGL | GlobalCanvas | 1 hr | Use `useIsMobile()` to skip WebGL render entirely or use static fallback |
| P1 | Reduce/remove tunnel transitions | TunnelIn.tsx, TunnelOut.tsx | 1 hr | Simple fade on mobile instead of 3D tunnel |
| P1 | Simplify MorphingEmblem | Process.tsx | 30 min | Static emblem or reduced animation on mobile |

**Pattern for conditional WebGL:**
```tsx
const isMobile = useIsMobile();

if (isMobile) {
  return null; // Or static fallback
}

return <Canvas>...</Canvas>;
```

#### Phase 3: Polish (Priority: MEDIUM)
**Goal:** Site feels native on mobile

| Priority | Task | Section | Effort | Details |
|----------|------|---------|--------|---------|
| P2 | Audit all touch targets | Global | 1 hr | Ensure 44px minimum on all interactive elements |
| P2 | Add safe-area-inset padding | Layout/globals.css | 30 min | Handle notched devices |
| P2 | Test typography at 320px, 375px, 414px | Global | 1 hr | Verify no overflow or awkward breaks |
| P2 | Mobile-specific section spacing | All sections | 1 hr | Reduce padding, tighten layout |

**Safe area insets:**
```css
/* globals.css */
body {
  padding: env(safe-area-inset-top) env(safe-area-inset-right) env(safe-area-inset-bottom) env(safe-area-inset-left);
}

/* Or on specific elements */
.global-nav {
  padding-top: max(1rem, env(safe-area-inset-top));
}
```

---

## Known Issues (Parking Lot)

These were noted but deferred:

1. **Services section zoom-through color inversion** — currently broken, needs rework
2. **TunnelOut positioned incorrectly on timeline** — requires repositioning
3. **Emblem states during scroll** — some transitions may need refinement after visual changes

**Strategy:** Fix visual surface first. Once site feels right aesthetically, clearer instincts will emerge about whether zoom-through mechanic is worth salvaging.

---

## File Reference

### Key Files for Visual Changes
- `src/styles/globals.css` — typography, colors, grain overlay
- `tailwind.config.js` — font family config
- `index.html` — Google Fonts link
- `src/components/navigation/GlobalNav.tsx` — accent color usage
- `src/components/navigation/KineticDialNav.tsx` — accent color usage
- `src/sections/Contact.tsx` — btn-accent usage

### Key Files for Mobile Changes
- `src/hooks/useResponsive.ts` — responsive hooks (already exists)
- `src/config/mobileTargets.ts` — mobile values (already exists)
- `src/components/navigation/KineticDialNav.tsx` — touch interaction
- `src/sections/Positioning2.tsx` — overlay positioning
- `src/sections/Process/Process.tsx` — progress circle positioning
- `src/sections/Pricing.tsx` — card expansion logic
- `src/components/GlobalCanvas/*` — WebGL performance

---

## Implementation Order (Master Checklist)

### Visual Identity (Do First)
- [ ] Add Syne font to index.html
- [ ] Update tailwind.config.js font family
- [ ] Update globals.css typography classes
- [ ] Add grain overlay to globals.css
- [ ] Neutralize --accent CSS variable
- [ ] Audit and replace all accent color usages
- [ ] Create .btn-primary class
- [ ] Add utilitarian section labels

### Mobile Critical (Do Second)
- [ ] Implement tap-to-advance for KineticDialNav on mobile
- [ ] Fix Positioning2 overlay positioning
- [ ] Fix Process progress circle on mobile
- [ ] Disable Pricing card expansion on mobile

### Mobile Performance (Do Third)
- [ ] Add mobile bypass for GlobalCanvas WebGL
- [ ] Simplify tunnel transitions on mobile
- [ ] Reduce MorphingEmblem animation on mobile

### Mobile Polish (Do Last)
- [ ] Touch target audit (44px minimum)
- [ ] Safe area insets
- [ ] Typography viewport testing
- [ ] Section spacing adjustments

---

## Notes

- Test on actual device after Phase 1 mobile fixes before optimizing
- Typography change (Syne) will have cascading visual effects — may need weight/spacing tweaks
- Grain overlay opacity is subtle; start at 0.035 and adjust by eye
- The cylinder nav is a craft demonstration — worth keeping even if simplified on mobile