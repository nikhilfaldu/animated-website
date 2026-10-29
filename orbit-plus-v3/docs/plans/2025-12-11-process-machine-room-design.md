# Process Section: Machine Room Design

**Date:** 2025-12-11
**Status:** Approved for implementation

## Concept

The Process section reveals glimpses of an ever-running machine through scrolling panel cutouts. The gears (emblems) exist whether you see them or not—you're catching fragments through rectangular windows as panels scroll past.

## Layer Architecture

| Layer | Z-Index | Scroll Behavior | Content |
|-------|---------|-----------------|---------|
| EmblemField | 10 | Pinned (sticky) | Multiple EmblemSVG instances, always spinning |
| PanelMask | 20 | Normal (1x) | SVG with 9 rectangular cutouts |
| ParallaxLabels | 30 | Parallax (0.6x) | 3 staggered labels |

## Emblem Field

- Uses existing `EmblemSVG` component
- Multiple instances at various sizes filling the background
- Rotation based on scroll progress (some CW, some CCW)
- Depth-based opacity/scale for visual layering
- Should look like gears in a watch or clock

## Panel Mask

Single SVG mask (section height configurable, starting at 400vh) with 9 rectangular cutouts:

| Scroll | Cutout | Purpose |
|--------|--------|---------|
| 6-14% | A | Appetizer |
| 16-32% | B | Major reveal + Label 1 |
| 28-40% | C | Texture |
| 38-48% | D | Accent |
| 44-62% | E | Largest window + Label 2 |
| 58-70% | F | Texture |
| 68-84% | G | Major reveal + Label 3 |
| 78-88% | H | Floor texture |
| 88-96% | I | Farewell |

## Labels (Sequential & Staggered)

1. **"Discover & Define"** (right side) @ 16-32%
   - "We lock the brief: audience, constraints, and the measurable win. Clarity first so motion has purpose."

2. **"Design the System"** (left side) @ 44-62%
   - "Type, motion, and interaction language snap into a coherent kit—distinctive but durable."

3. **"Build & Launch"** (center) @ 68-84%
   - "We ship performant, accessible components with instrumentation baked in, ready to iterate."

Labels move at 0.6x scroll speed for depth effect.

## Component Structure

```
src/sections/Process/
├── Process.tsx           # Section shell, scroll hooks
├── EmblemField.tsx       # Pinned emblem layer (z-10)
├── PanelMask.tsx         # Scrolling SVG mask (z-20)
├── ParallaxLabels.tsx    # Staggered labels (z-30)
├── processData.ts        # EMBLEMS, CUTOUTS, LABELS constants
└── index.ts              # Export
```

## Files to Delete

- `src/sections/Process.tsx`
- `src/sections/ProcessGearPanels/` (entire directory)
- `src/sections/ProcessParallaxReveal/` (entire directory)
- `src/sections/ProcessCreativeMachine.tsx`

## Reused Components

- `EmblemSVG` from `@/components/EmblemSVG`
- `useReducedMotion` hook

## Notes

- Main emblem already off-screen before Process section (no integration needed)
- Section height configurable (may need > 400vh)
- Entry: Emblem field fades in 0-5%
- Exit: Emblem field fades out 92-100%

## Acceptance Criteria

1. Gears visible only through rectangular cutouts
2. Gears always spinning regardless of cutout visibility
3. Labels appear sequentially with parallax depth
4. 60 FPS performance
5. Reduced motion support
