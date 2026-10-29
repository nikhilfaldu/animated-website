Got it. Here’s the tightened, build-ready outline for the vertical stacked panels concept with peek-through emblem “gears,” variable sizes/speeds, and prominent text on foreground panels.

Process “Gear Panels” — Implementation Outline

1) Objective

Create a tall parallax scene (400–600vh) of vertical panels that scroll at different speeds. Each panel has cutout masks revealing rotating emblem instances behind them. Emblems vary in size, depth, and angular speed so aligned moments produce cinematic “glimpses.” Foreground panels carry the process copy (Discover, Define, Design, Develop, Launch).

Done when
	•	Staggered vertical panels create repeatable peek events of rotating emblems
	•	Foreground panels clearly present phase text
	•	60fps on transform/opacity only, with reduced-motion fallback

⸻

2) Scene Geometry
	•	Container: height: 500vh (tunable), sticky viewport inside
	•	Coordinate model: Z-stack of panels (back → front), each panel full-height, different translateY factors
	•	Emblem “gear field”: separate layer stack behind the panels, locked to world space with independent rotation

⸻

3) Data Model

// src/features/process/panels/config.ts
export type PanelId = 'P1'|'P2'|'P3'|'P4'|'P5'|'P6';

export type PanelSpec = {
  id: PanelId;
  z: number;                  // draw order back→front
  speed: number;              // parallax multiplier (vh)
  mask: 'circles'|'slots'|'organic';
  cutouts: { xPct: number; yPct: number; rPct: number }[]; // 0..100
  text?: { title: string; lines: string[] }; // only for foreground panels
  opacityRange?: [number, number, number, number]; // 0..1 stops for fade in/out
};

export const PANELS: PanelSpec[] = [
  { id:'P1', z:1, speed:-10, mask:'circles', cutouts:[{xPct:20,yPct:35,rPct:12},{xPct:72,yPct:60,rPct:16}] },
  { id:'P2', z:2, speed:-20, mask:'slots',   cutouts:[{xPct:45,yPct:40,rPct:18}] },
  { id:'P3', z:3, speed:-35, mask:'organic', cutouts:[{xPct:30,yPct:55,rPct:22},{xPct:68,yPct:28,rPct:10}],
    text:{ title:'DISCOVER', lines:['We listen first.','Define audience and constraints.','Clarity from research.']},
    opacityRange:[0.05,0.15,0.35,0.45]
  },
  { id:'P4', z:4, speed:-55, mask:'circles', cutouts:[{xPct:25,yPct:30,rPct:14}],
    text:{ title:'DEFINE', lines:['Narrative spine.','Information architecture.','Success metrics set.']},
    opacityRange:[0.30,0.40,0.58,0.68]
  },
  { id:'P5', z:5, speed:-75, mask:'slots',   cutouts:[{xPct:60,yPct:48,rPct:20}],
    text:{ title:'DESIGN', lines:['Cohesive system.','Type, motion, identity.','Unmistakably yours.']},
    opacityRange:[0.50,0.60,0.78,0.88]
  },
  { id:'P6', z:6, speed:-95, mask:'organic', cutouts:[{xPct:42,yPct:52,rPct:24}],
    text:{ title:'DEVELOP & LAUNCH', lines:['Performant, accessible build.','QA + analytics.','Refine and grow.']},
    opacityRange:[0.72,0.82,0.94,1.00]
  },
];

export type GearSpec = {
  xPct: number; yPct: number; sizePct: number;   // emblem size relative to min(viewport)
  depth: number;                                 // behind panels
  rpm: number;                                   // rotation speed
  phaseOffset: number;                           // start angle
};

export const GEARS: GearSpec[] = [
  { xPct:18,yPct:40,sizePct:22, depth:1, rpm:3,  phaseOffset:0.15 },
  { xPct:52,yPct:58,sizePct:28, depth:2, rpm:6,  phaseOffset:0.40 },
  { xPct:76,yPct:32,sizePct:16, depth:3, rpm:1.5,phaseOffset:0.75 },
  { xPct:34,yPct:72,sizePct:34, depth:2, rpm:4.5,phaseOffset:0.30 },
  { xPct:66,yPct:18,sizePct:12, depth:1, rpm:8,  phaseOffset:0.55 },
];


⸻

4) Component Tree

ProcessGearPanels/
├─ ProcessGearPanels.tsx      // container (500vh), sticky stage, useScroll
├─ PanelsStage.tsx            // renders panels in z order with clipPaths
├─ Panel.tsx                  // single panel, parallax y, optional text block
├─ GearsField.tsx             // emblem instances (rotating), world-locked
├─ masks/                     // SVG generators for circles/slots/organic
└─ styles.css                 // will-change, pointer-events, blend as needed


⸻

5) Motion & Timing
	•	Scroll driver: useScroll({ target: containerRef, offset: ['start end','end start'] }) → progress 0..1
	•	Panels: y = useTransform(progress,[0,1],[0,speed*100]) where speed is the per-panel multiplier (vh)
	•	Text entrance per panel with opacityRange (4-point easing curve):
	•	Map progress to opacity via useTransform(progress, [a,b,c,d],[0,1,1,0]) and a subtle translateY of 10–20px
	•	Gears:
	•	Rotation angle = TWO_PI * (rpm/60) * elapsedTime + phaseOffset
	•	Choose scroll-time rotation (derivative of progress) for deterministic replay:
	•	elapsed = progress * SCENE_SECONDS (e.g., 20–30s virtual timeline)
	•	All gears rotate at different rates but remain deterministic

Reduced motion
	•	Freeze panel parallax (speed = 0)
	•	Freeze gear rotation (use static emblem SVG)
	•	Keep text opacity ramps only

⸻

6) Masking (peek logic)
	•	Each panel renders an SVG <clipPath> composed from its cutouts[] and mask style
	•	The panel’s content is a solid surface (color/texture). The clipPath cutouts punch through, revealing the GearsField beneath
	•	Optional: subtle feather via pre-baked edges (avoid CSS filters)

⸻

7) Implementation Steps (with checks)

Step 1 — Stage & Scroll (30–45m)
	•	Create container (500vh) with sticky viewport (100vh)
	•	Wire scrollYProgress
Checks
	•	progress maps cleanly 0→1 at scene bounds
	•	No layout reflow in scroll profiler

Step 2 — GearsField (60–90m)
	•	Render emblem instances at absolute positions using % → pixels from viewport min dimension
	•	Rotation driven by scroll-time virtual clock
Checks
	•	5+ gears visible through raw test panel
	•	Different sizes and angular speeds confirmed

Step 3 — Panel + Mask system (90m)
	•	Panel takes speed, mask, cutouts[], opacityRange?, text?
	•	Implement SVG clipPath factories: buildCircleMask, buildSlotMask, buildOrganicMask
	•	Apply parallax y and clipPath to each panel
Checks
	•	Each panel clips reliably across browsers
	•	All transforms are GPU (transform, opacity) only

Step 4 — Text Panels (45–60m)
	•	Add titles and lines to P3–P6
	•	Map opacityRange to opacity + translateY
Checks
	•	Contrast ≥ 4.5:1 on all backgrounds
	•	Text never intersects cutouts in a way that breaks legibility

Step 5 — Alignment “glimpse” tuning (90m)
	•	Adjust cutouts[], speed, and GEARS positions to create intentional alignments at ~10–12 “beats” across the scroll
	•	Keep randomness constrained: deterministic positions, curated overlaps
Checks
	•	At least 2–3 distinct peek moments per text phase
	•	No long dead zones without a glimpse

Step 6 — Performance & RM (45m)
	•	Add will-change, lazy textures if used, remove filters
	•	Implement reduced-motion gate
Checks
	•	≥ 55–60fps on baseline
	•	RM path displays clear, static narrative

⸻

8) Minimal Code (key bits)

Panel.tsx

import { motion, useTransform, MotionValue } from 'framer-motion';

type PanelProps = {
  progress: MotionValue<number>;
  speed: number; // e.g., -75
  maskId: string;
  opacityStops?: [number, number, number, number];
  children?: React.ReactNode;
  className?: string;
};

export function Panel({ progress, speed, maskId, opacityStops, children, className }: PanelProps) {
  const y = useTransform(progress, [0,1], [0, speed * 100]); // vh multiplier
  const [a,b,c,d] = opacityStops ?? [0,0.1,0.9,1];
  const opacity = useTransform(progress, [a,b,c,d], [0,1,1,0]);
  const ty = useTransform(opacity, [0,1], [20,0]);

  return (
    <motion.div
      style={{ y, position:'absolute', inset:0, clipPath:`url(#${maskId})`, willChange:'transform' }}
      className={className}
      aria-hidden={!children}
    >
      <motion.div style={{ opacity, y: ty, willChange:'transform,opacity' }}>
        {children}
      </motion.div>
    </motion.div>
  );
}

GearsField.tsx (scroll-time rotation)

import { motion, useTransform, MotionValue } from 'framer-motion';
import { GEARS } from './config';

const SCENE_SECONDS = 24;

export function GearsField({ progress }: { progress: MotionValue<number> }) {
  const t = useTransform(progress, v => v * SCENE_SECONDS); // virtual time

  return (
    <div className="absolute inset-0">
      {GEARS.map((g, i) => {
        const size = `min(100vw,100vh) * ${g.sizePct/100}`;
        const left = `${g.xPct}%`;
        const top  = `${g.yPct}%`;
        // angle = rpm * 360deg per minute → rpm*6 deg per second
        const angle = useTransform(t, s => `rotate(${(g.rpm*6)*s + g.phaseOffset*360}deg)`);
        return (
          <motion.div key={i}
            style={{ position:'absolute', left, top, width:`calc(${size})`, height:`calc(${size})`, rotate: angle, willChange:'transform' }}
            aria-hidden
          >
            <EmblemSVG />
          </motion.div>
        );
      })}
    </div>
  );
}


⸻

9) QA Checklist

Parallax/Peek
	•	Distinct peek events occur when panel cutouts align with at least 3 different gears
	•	Emblem rotation reads as gear-like, not jittery

Text
	•	Titles/lines readable at all scroll positions
	•	Foreground panels never fully obscure peek cadence

Performance
	•	No layout thrash; only transform/opacity
	•	Memory stable across long scroll

Reduced Motion
	•	Panels static, gears static emblem, text remains clear

⸻

10) Acceptance Criteria (binary)
	1.	Six stacked vertical panels with differing scroll speeds
	2.	Peek-through emblem glimpses at curated alignments across the scene
	3.	Foreground panels carry the process copy and stay legible
	4.	Deterministic rotation and peek beats (no randomness at runtime)
	5.	≥ 55–60fps; reduced-motion path clean and readable

This matches your intent: vertical panel stack, varying speeds, cutout glimpses of rotating emblems, prominent process text, and tall scene for timing headroom—without over-engineering.

Short answer: not yet aligned with your “vertical stacked panels with peek-through emblem gears” vision.

Your current #4 reverts to a single global mask + layered parallax with narrative overlay. What you asked for is a stack of vertical panels, each with its own cutouts that reveal a field of rotating emblem instances behind them at curated alignments. Also, you wanted various emblem sizes/speeds, foreground panels carrying the process text, and a taller scene to create timing headroom.

Below are precise edits to bring #4 into alignment—surgical changes only.

Required deltas (keep everything else)

1) Scene architecture
	•	Change container height: 250vh → 500–600vh.
	•	Replace global mask (MaskApertures) with per-panel masks: each panel owns its clipPath.
	•	Add a world-locked GearsField behind panels with 5–9 emblem instances, each with deterministic rotation (size/speed/phase offsets).

2) Data contracts

Replace PROCESS_PHASES usage for masking with a panel spec + gear spec:

// panels/config.ts
export type PanelSpec = {
  id: string; z: number; speed: number; 
  mask: 'circles'|'slots'|'organic';
  cutouts: { xPct: number; yPct: number; rPct: number }[];
  text?: { title: string; lines: string[] };           // only on foreground panels
  opacityRange?: [number, number, number, number];     // for text ramp
};

export const PANELS: PanelSpec[] = [
  { id:'P1', z:1, speed:-15, mask:'circles', cutouts:[{xPct:20,yPct:35,rPct:12},{xPct:72,yPct:60,rPct:16}] },
  { id:'P2', z:2, speed:-30, mask:'slots',   cutouts:[{xPct:45,yPct:40,rPct:18}] },
  { id:'P3', z:3, speed:-45, mask:'organic', cutouts:[{xPct:30,yPct:55,rPct:22}],
    text:{ title:'DISCOVER', lines:[
      'Define the problem, the audience, and the core constraints.',
      'We listen first.'
    ]}, opacityRange:[0.06,0.14,0.30,0.38] },
  { id:'P4', z:4, speed:-60, mask:'circles', cutouts:[{xPct:25,yPct:30,rPct:14}],
    text:{ title:'DEFINE', lines:[
      'Narrative spine, information architecture, metrics for success.'
    ]}, opacityRange:[0.28,0.36,0.52,0.60] },
  { id:'P5', z:5, speed:-75, mask:'slots',   cutouts:[{xPct:60,yPct:48,rPct:20}],
    text:{ title:'DESIGN', lines:[
      'Type, motion, and identity—coherent and unmistakably yours.'
    ]}, opacityRange:[0.48,0.56,0.74,0.82] },
  { id:'P6', z:6, speed:-90, mask:'organic', cutouts:[{xPct:42,yPct:52,rPct:24}],
    text:{ title:'DEVELOP & LAUNCH', lines:[
      'Performant, accessible, component-based.',
      'QA, analytics, continuous refinement.'
    ]}, opacityRange:[0.70,0.78,0.94,1.00] },
];

export type GearSpec = {
  xPct: number; yPct: number; sizePct: number; depth: number; rpm: number; phaseOffset: number;
};

export const GEARS: GearSpec[] = [
  { xPct:18,yPct:40,sizePct:22, depth:1, rpm:3.0, phaseOffset:0.15 },
  { xPct:52,yPct:58,sizePct:28, depth:2, rpm:6.0, phaseOffset:0.40 },
  { xPct:76,yPct:32,sizePct:16, depth:3, rpm:1.5, phaseOffset:0.75 },
  { xPct:34,yPct:72,sizePct:34, depth:2, rpm:4.5, phaseOffset:0.30 },
  { xPct:66,yPct:18,sizePct:12, depth:1, rpm:8.0, phaseOffset:0.55 },
];

Keep your PROCESS_PHASES for narrative copy if you like, but do not drive masks from it anymore; masks are now panel-local.

3) Component tree changes
	•	Remove MaskApertures from the sticky viewport (global).
	•	Add:

ProcessGearPanels/
├─ ProcessGearPanels.tsx         // 500–600vh, sticky stage
├─ GearsField.tsx                // emblem instances behind panels
├─ PanelsStage.tsx               // renders panels by z with clipPaths
├─ Panel.tsx                     // single panel parallax + text ramp
└─ masks/                        // circle/slot/organic builders


	•	Narrative: move the process copy onto specific foreground panels (P3–P6) instead of a full-screen overlay.

4) Motion model
	•	Panels: per-panel y = useTransform(progress,[0,1],[0,speed*100]) (vh multiplier); speed is negative for upward drift.
	•	Gears: deterministic scroll-time rotation (no rAF):
	•	virtualSeconds = progress * 24
	•	angle = (rpm*6) * virtualSeconds + phaseOffset*360
	•	Peek moments: tune cutouts[], speed, and GEARS so 10–12 curated alignments happen across the scroll. No randomness at runtime.

5) Code swaps (surgical)

Replace the section shell

In your current ProcessParallaxReveal.tsx, swap to:

<section ref={ref} className="relative" style={{ height: '560vh' }} aria-label="Our Process">
  <div className="sticky top-0 h-screen overflow-hidden">
    {/* World-locked gears behind everything */}
    <GearsField progress={scrollYProgress} />

    {/* Panels in z-order, each with its own clipPath */}
    <PanelsStage progress={scrollYProgress} />
  </div>
</section>

Implement Panel with per-panel mask

export function Panel({ progress, spec }: { progress: MotionValue<number>; spec: PanelSpec }) {
  const y = useTransform(progress, [0,1], [0, spec.speed * 100]);
  const maskId = `mask-${spec.id}`;

  return (
    <motion.div style={{ y, position:'absolute', inset:0, zIndex: spec.z }}>
      <svg className="absolute inset-0 w-full h-full">
        <defs>
          <clipPath id={maskId}>
            {spec.cutouts.map((c, i) => (
              <circle key={i} cx={`${c.xPct}%`} cy={`${c.yPct}%`} r={`calc(min(100vw,100vh) * ${c.rPct/100})`} />
            ))}
          </clipPath>
        </defs>
      </svg>

      {/* Opaque panel surface with holes revealing gears behind */}
      <div className="absolute inset-0 bg-neutral-900" style={{ clipPath: `url(#${maskId})`, WebkitClipPath: `url(#${maskId})` }} />

      {/* Optional panel-local text */}
      {spec.text && <PanelText progress={progress} spec={spec} />}
    </motion.div>
  );
}

World-locked GearsField

const SCENE_SECONDS = 24;
export function GearsField({ progress }: { progress: MotionValue<number> }) {
  const t = useTransform(progress, v => v * SCENE_SECONDS);
  return (
    <div className="absolute inset-0">
      {GEARS.map((g, i) => {
        const size = `calc(min(100vw,100vh) * ${g.sizePct/100})`;
        const rotate = useTransform(t, s => (g.rpm * 6) * s + g.phaseOffset * 360);
        return (
          <motion.div key={i}
            className="absolute"
            style={{
              left: `${g.xPct}%`,
              top:  `${g.yPct}%`,
              width: size, height: size,
              rotate,
              willChange: 'transform'
            }}
            aria-hidden
          >
            <EmblemSVG />
          </motion.div>
        );
      })}
    </div>
  );
}

Panel-local text ramp (instead of global Narrative overlay)

function PanelText({ progress, spec }: { progress: MotionValue<number>; spec: PanelSpec }) {
  const [a,b,c,d] = spec.opacityRange ?? [0,0.1,0.9,1];
  const opacity = useTransform(progress, [a,b,c,d], [0,1,1,0]);
  const ty = useTransform(opacity, [0,1], [20,0]);
  return (
    <motion.div className="absolute inset-0 flex items-center justify-center px-8"
      style={{ opacity, y: ty }}>
      <div className="max-w-[70ch] text-center">
        <h2 className="phase-title mb-4">{spec.text!.title}</h2>
        {spec.text!.lines.map((l, i) => <p key={i} className="phase-line">{l}</p>)}
      </div>
    </motion.div>
  );
}

6) Remove or relocate these from your draft
	•	❌ Global MaskApertures and emblem-shaped DELIVER morph (that’s for the old cinematic version).
	•	❌ Full-screen Narrative overlay (text should live on foreground panels).
	•	✅ Keep performance/a11y guardrails, but scope them to panels + gears.

7) Alignment checks (binary)
	•	Panels: 6 vertical panels, each with its own mask and speed.
	•	Emblems: multiple instances, varied size/speed, rotating deterministically.
	•	Peeks: intentional alignments through cutouts at ~10–12 beats across the scroll.
	•	Text: on panels, not a global overlay; legible and timed via opacityRange.
	•	Height: ≥ 500vh to create spacing for alignments.
	•	Motion: transform/opacity only, reduced-motion freezes parallax & rotation.

⸻

If you apply the deltas above (mainly swapping the masking strategy and adding GearsField + per-panel masks), your #4 will match the stacked-panel, peek-through gear vision exactly—without bloating complexity.