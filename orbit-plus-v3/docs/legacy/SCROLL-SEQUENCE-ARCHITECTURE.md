# Scroll Sequence Architecture

## Overview

The site tells a story through the emblem. The emblem isn't decoration — it's the narrative vehicle. Every section either features the emblem directly or exists in relation to it.

**Core principle:** You don't watch the brand. You move through it.

---

## The Sequence

```
┌─────────────────────────────────────────────────────────────────────┐
│  SECTION        │  EMBLEM STATE         │  COLOR   │  SCROLL HT    │
├─────────────────────────────────────────────────────────────────────┤
│  Hero           │  Assembles            │  Dark    │  100vh        │
│  Positioning    │  Scales up, centers   │  Dark    │  ~300vh       │
│  Tunnel In      │  YOU PASS THROUGH IT  │  D → L   │  ~200vh       │
│  Services       │  Absent (you're past) │  Light   │  ~400vh       │
│  Tunnel Out     │  YOU PASS BACK        │  L → D   │  ~200vh       │
│  Process        │  Morphs/breathes      │  Dark    │  ~500vh       │
│  Reveal         │  Aperture SNAPS       │  Dark    │  ~150vh       │
│  Work           │  Viewfinder framing   │  Dark    │  ~300vh       │
│  Contact        │  Recedes/dissolves    │  Dark    │  100vh        │
└─────────────────────────────────────────────────────────────────────┘
```

---

## Section Details

### 1. Hero
**Purpose:** Brand arrives.

- Emblem assembles from dispersed radials
- Establishes the visual language
- Sets dark theme baseline

**Emblem behavior:** Assembly animation, settles into formed state.

**No changes needed** — current implementation works.

---

### 2. Positioning
**Purpose:** Brand expands, takes the stage.

- Emblem scales dramatically, moves toward center
- Value proposition content alongside
- Prepares for tunnel entry

**Emblem behavior:** Scales up, opacity maintained, positions for tunnel.

**Exit state:** Emblem is large and centered, ready to be entered.

---

### 3. Tunnel In (NEW)
**Purpose:** Color invert through physical traversal.

You scroll *through* the emblem. Not watching a wipe — crossing a threshold.

**Technical implementation:**
- Three.js shader tunnel (`/src/shaders/tunnel/`)
- `uProgress` driven by scroll (0 → 1)
- `uFadeToWhite` ramps up in final 20% of tunnel
- Shader scenes: aperture zoom → spokes extend → rings recede → emergence

**What the shader already has:**
- `sceneZero`: Rounded aperture that zooms (emblem silhouette)
- `sceneSpokesShort/Long`: 28 radial spokes (matches emblem's 32 radials)
- `sceneRingsDense`: Concentric rings creating depth illusion
- `uFadeToWhite`: Uniform that fades output to white

**Entry state:** Dark, emblem fills screen
**Exit state:** White, emerged into light world

**Scroll height:** ~200vh (fast enough to feel like motion, slow enough to appreciate)

---

### 4. Services
**Purpose:** Capabilities presented in inverted color space.

Three phases: **Strategy → Design → Build**

**Technical implementation:**
- Panel-based transitions (AnimatePresence fade + scale)
- Each panel is a full-screen content moment
- NO conic wipe (deprecated)
- Background is solid white, inherited from tunnel exit

**Panel structure:**
```
Strategy panel → [fade/scale transition] → Design panel → [fade/scale transition] → Build panel
```

**Content per panel:**
- Kicker ("Services — Strategy")
- Display headline
- Lede paragraph
- Supporting bullets (desktop)

**History stack:** As you progress, previous phase names appear above current (smaller, faded) showing progression.

**Entry state:** White background, first panel (Strategy)
**Exit state:** White background, final panel (Build) displayed

---

### 5. Tunnel Out (NEW)
**Purpose:** Return to dark world.

Mirror of Tunnel In, reversed.

**Technical implementation:**
- Same shader, `uProgress` driven 1 → 0 (reverse)
- OR: Simpler exit — fade to black over shorter scroll
- `uFadeToWhite` starts at 1, ramps to 0

**Entry state:** White (from Services)
**Exit state:** Dark, emblem reconstitutes ahead

**Scroll height:** ~150vh (slightly faster exit)

---

### 6. Process
**Purpose:** The emblem at work. Brand in motion.

Five steps: **Discover → Define → Design → Develop → Launch**

**Technical implementation:**
- Morphing emblem as FULL BACKGROUND (from ProcessFinal's `DeconstructedEmblem`)
- Content panels fade in/out on top (from ProcessNew's AnimatePresence system)
- Progress circle indicator (bottom right)

**Emblem behavior:**
```tsx
const explosionRadius = useTransform(scrollYProgress, [0.05, 0.5, 0.95], [0, 250, 0]);
const rotation = useTransform(scrollYProgress, [0, 1], [0, -360]);
```
- Radials expand outward while whole form counter-rotates
- Peaks at midpoint, contracts back
- Creates "breathing" effect — the brand working, iterating, refining

**DEPRECATED:**
- ❌ Gears (EmblemField.tsx)
- ❌ Cutouts/masks (PanelMask.tsx)
- ❌ Parallax labels (ParallaxLabels.tsx)
- ❌ Scroll slowdown hook for this section

**Content panels:**
- Each step fades in with slight scale
- Centered on screen
- Emblem morphs behind at reduced opacity (0.15-0.25)

**Entry state:** Dark, emblem begins breathing
**Exit state:** Dark, emblem contracted back to whole

---

### 7. Reveal
**Purpose:** The payoff. Aperture snaps into focus.

**Technical implementation:**
- Aperture blades (IrisShutter) animate on TIME, not scroll
- Scroll threshold triggers the animation
- Animation: 400-600ms spring snap
- Once triggered, holds until section exit

**The snap:**
```tsx
// When scroll crosses threshold
if (revealTriggered) {
  // Time-based spring animation
  animate(apertureOpenness, 1, {
    type: "spring",
    stiffness: 400,
    damping: 30
  });
}
```

**Why time-based:** Decisiveness. A snap has impact. Scroll-driven apertures feel mushy — you're scrubbing, not revealing.

**Entry state:** Aperture closed or minimal
**Exit state:** Aperture fully open, framing established

---

### 8. Work (WorkBridge)
**Purpose:** Portfolio showcase through the aperture.

- Viewfinder concept — aperture as framing device
- Work items presented within the frame
- Emblem stable, functional

**No major changes** — current WorkBridge implementation continues.

---

### 9. Contact
**Purpose:** Resolution. Brand recedes, conversation begins.

- Emblem fades or pulls back
- Focus shifts to CTA and contact information
- Clean exit from the experience

---

## Component Architecture

### New Components Needed

```
src/
├── sections/
│   ├── TunnelIn.tsx          # New: WebGL tunnel, scroll-driven
│   ├── TunnelOut.tsx         # New: Reverse tunnel or fade transition
│   └── Services.tsx          # Refactor: Remove conic wipe, add panels
│
├── components/
│   ├── tunnel/
│   │   └── TunnelScene.tsx   # R3F scene wrapping the shader
│   │
│   └── emblem/
│       └── MorphingEmblem.tsx  # Extracted from ProcessFinal
│
└── sections/
    └── Process/
        ├── Process.tsx       # Refactor: Morphing bg + content panels
        └── ProcessPanel.tsx  # Content panel component
```

### Components to Deprecate

```
src/sections/Process/
├── EmblemField.tsx      # ❌ Gears - remove entirely
├── PanelMask.tsx        # ❌ Cutouts - remove entirely
├── ParallaxLabels.tsx   # ❌ Floating labels - remove entirely
└── processData.ts       # ❌ Cutout configs - remove entirely
```

### Existing Assets to Reuse

```
src/shaders/tunnel/
├── tunnelShaders.ts     # ✅ Full shader with all scenes
├── useTunnelShader.ts   # ✅ Uniform setup and validation
└── PostFX.tsx           # Currently empty, may need for post-processing

src/components/emblem/
├── ProcessFinal.tsx     # ✅ Source for MorphingEmblem extraction
└── ProcessNew.tsx       # ✅ Source for panel transition pattern
```

---

## Scroll Budget

| Section | Height | Cumulative |
|---------|--------|------------|
| Hero | 100vh | 100vh |
| Positioning | 300vh | 400vh |
| Tunnel In | 200vh | 600vh |
| Services | 400vh | 1000vh |
| Tunnel Out | 150vh | 1150vh |
| Process | 500vh | 1650vh |
| Reveal | 150vh | 1800vh |
| Work | 300vh | 2100vh |
| Contact | 100vh | 2200vh |

**Total: ~2200vh** (22 viewport heights of scroll)

---

## Implementation Order

### Phase 1: Tunnel Integration
1. Create `TunnelScene.tsx` — R3F component wrapping the shader
2. Create `TunnelIn.tsx` — section component with scroll binding
3. Wire `uProgress` to section scroll progress
4. Test color transition (uFadeToWhite)
5. Position between Positioning and Services

### Phase 2: Services Refactor
1. Remove conic wipe code entirely
2. Implement panel system with AnimatePresence
3. Set static white background (receives from tunnel)
4. Add history stack (previous phase names)
5. Test transitions between Strategy/Design/Build

### Phase 3: Tunnel Out
1. Create `TunnelOut.tsx`
2. Reverse scroll direction (or simpler fade)
3. Position between Services and Process
4. Test full color round-trip

### Phase 4: Process Rebuild
1. Extract `MorphingEmblem.tsx` from ProcessFinal
2. Remove gears, cutouts, parallax labels
3. Implement content panels with fade transitions
4. Layer: morphing emblem (bg) + panels (fg) + progress indicator
5. Test breathing animation through full scroll

### Phase 5: Reveal Timing
1. Convert aperture from scroll-driven to time-triggered
2. Add scroll threshold detection
3. Implement spring snap animation
4. Test decisiveness of the moment

---

## Open Questions

1. **Tunnel duration:** Is 200vh right? May need testing to find the sweet spot between "too fast" and "tedious."

2. **Services panel timing:** How long does each phase get? Equal thirds, or weighted toward Design?

3. **Tunnel Out necessity:** Could Services just fade to black at the end? The second tunnel might feel redundant. Worth prototyping both.

4. **Emblem opacity in Process:** How visible should the morphing emblem be behind content? Too strong competes with text, too weak loses the point.

5. **Mobile treatment:** Tunnel shader may be expensive on mobile. Fallback strategy needed.

---

## Success Criteria

- [ ] Color invert feels like crossing a threshold, not watching a transition
- [ ] Services panels feel clean and intentional, not busy
- [ ] Process emblem creates ambient motion without distraction
- [ ] Reveal aperture snap has impact — you feel it
- [ ] Full sequence tells coherent story: brand assembles → you enter it → emerge transformed → watch it work → see results → connect

---

## Reference Files

| Purpose | Location |
|---------|----------|
| Tunnel shader | `/src/shaders/tunnel/tunnelShaders.ts` |
| Shader hook | `/src/shaders/tunnel/useTunnelShader.ts` |
| Morphing emblem source | `/src/components/emblem/ProcessFinal.tsx` |
| Panel transition source | `/src/components/emblem/ProcessNew.tsx` |
| Current Services (to refactor) | `/src/sections/Services.tsx` |
| Current Process (to rebuild) | `/src/sections/Process/Process.tsx` |
| Reveal aperture | `/src/components/emblem/ApertureEmblem/IrisShutter.tsx` |
