Below is a surgical rewrite of your “Visual Reference” file so it matches the vertical stacked panels + peek-through emblem gears concept. Drop-in replacement.

⸻

Process Gear Panels — Visual Reference (Aligned)

Quick guide to the stacked panel architecture: multiple vertical panels at different parallax speeds; each panel has its own mask cutouts. Behind them sits a world-locked field of rotating emblem “gears” at varied sizes/speeds. When panel cutouts align with gears, users get cinematic “glimpses.” Foreground panels carry the process text.

⸻

Layer Stack (Back → Front)

┌─────────────────────────────────────────────────────────────┐
│                    VIEWPORT (100vh, sticky)                 │
│  ┌──────────────────────────────────────────────────────┐  │
│  │ GearsField (world-locked, no parallax)              │  │
│  │   ⬢  ⬢     ⬢      (varied sizes/speeds)            │  │
│  └──────────────────────────────────────────────────────┘  │
│  ┌──────────────────────────────────────────────────────┐  │
│  │ Panel P1 (slow) — has its own clipPath cutouts       │  │
│  │  ◯      ◯                                            │  │
│  └──────────────────────────────────────────────────────┘  │
│  ┌──────────────────────────────────────────────────────┐  │
│  │ Panel P2 (slow+) — different cutouts (slots/organic) │  │
│  │   ────   ────                                        │  │
│  └──────────────────────────────────────────────────────┘  │
│  ┌──────────────────────────────────────────────────────┐  │
│  │ Panel P3 (mid) — foreground + PROCESS TEXT (DISCOVER)│  │
│  │   ◯                                            Text  │  │
│  └──────────────────────────────────────────────────────┘  │
│  ┌──────────────────────────────────────────────────────┐  │
│  │ Panel P4 (mid+) — PROCESS TEXT (DEFINE)              │  │
│  │  slot       ◯                                  Text  │  │
│  └──────────────────────────────────────────────────────┘  │
│  ┌──────────────────────────────────────────────────────┐  │
│  │ Panel P5 (fast) — PROCESS TEXT (DESIGN)              │  │
│  │      organic ◯                                 Text │  │
│  └──────────────────────────────────────────────────────┘  │
│  ┌──────────────────────────────────────────────────────┐  │
│  │ Panel P6 (fast+) — PROCESS TEXT (DELIVER)            │  │
│  │     ◯         slot                            Text   │  │
│  └──────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘

Key
	•	No global mask. Each panel owns its own clipPath.
	•	GearsField is behind all panels, rotates deterministically (scroll-time), not tied to any single panel.
	•	Parallax = per-panel translateY speeds. Peek moments happen when cutouts align with gear positions.

⸻

Peek Flow Timeline (Beats, not mask size)

Scroll:   0%        15%       28%       40%       55%       70%       85%      100%
          │          │         │         │         │         │         │         │
Beats:  P1◎       P2─┐      P3◎◎     P3→P4     P4◎◎      P4→P5      P5◎◎      P6◎
                     │        (double)          (double)              (double)
                     └ align w/ small+mid gears

Narrative:
  DISCOVER (P3 text) ──────────────
                        DEFINE (P4 text) ───────────────
                                   DESIGN (P5 text) ───────────────
                                               DELIVER (P6 text) ───────────────

	•	Beat = intentional peek alignment (panel cutout crosses an emblem at a chosen moment).
	•	Plan ~10–12 beats across full scroll, distributed across P1–P6.

⸻

Panel Specs (example)

P1  (z=1, speed=-15): circles cutouts at TL, BR → early small peeks
P2  (z=2, speed=-30): slot cutout across MR    → horizontal sweep peek
P3* (z=3, speed=-45): organic + circles        → text: DISCOVER (foreground)
P4* (z=4, speed=-60): circles                   → text: DEFINE
P5* (z=5, speed=-75): slots + organic           → text: DESIGN
P6* (z=6, speed=-90): circles                   → text: DELIVER (final emphasis)
(* foreground panels carry narrative)


⸻

GearsField (emblem instances)
	•	Count: 5–9 instances.
	•	Props: { xPct, yPct, sizePct, depth, rpm, phaseOffset }.
	•	Rotation: scroll-time deterministic (no rAF):
	•	virtualSeconds = progress * 24
	•	angle = (rpm * 6) * virtualSeconds + phaseOffset * 360
	•	Variety: mix sizes (12–36% of min(vw,vh)) and speeds (1.5–8 rpm) for layered cadence.

⸻

Cutout Types (per panel)

CIRCLES   : ◯  ◯  (primary; stable, gear-like)
SLOTS     : ────  (dynamic sweeps across gears)
ORGANIC   : ~~~   (irregular peeks; use sparsely for punctuation)

	•	Use 2–3 cutouts per panel.
	•	Avoid center; leave room for panel text.
	•	Feathered edges should be pre-baked in SVG; avoid runtime filters.

⸻

Text Placement (on panels, not global overlay)
	•	Foreground panels (P3–P6) carry the process text block.
	•	Legibility: centered or grid-aligned; maintain safe area; shadow/backdrop as needed.
	•	Timing: panel-local opacity ramps (e.g., [a,b,c,d] → [0,1,1,0]) so text appears during that panel’s read window.

⸻

Responsive Strategy
	•	Height: 500–600vh (desktop), 275–300vh (tablet), 300–320vh (mobile).
	•	Mobile: disable parallax + rotation (RM or <768px). Panels stack; peeks become static imagery.
	•	Tablet: reduced parallax intensity; fewer cutouts per panel if necessary.

⸻

Performance Notes
	•	Transforms only: translateY, rotate, opacity.
	•	will-change on animating elements only.
	•	Inline SVG for clipPaths; no CSS filter animations.
	•	Target ≥ 55–60fps.
	•	Deterministic math → identical peeks on every pass.

⸻

Quick Implementation Checklist (panels version)

Foundation
  [ ] Container 560vh, sticky viewport 100vh
  [ ] useScroll(progress 0..1)
  [ ] GearsField behind panels (instances from GEARS[])
  [ ] PanelsStage renders P1..P6 in z-order

Panels & Masks
  [ ] Per-panel clipPath (circles/slots/organic)
  [ ] 2–3 cutouts per panel; avoid center
  [ ] Per-panel parallax speed mapping (vh multiplier)

Text
  [ ] Narrative lives on P3..P6 (panel-local)
  [ ] Opacity/translateY ramps via panel.opacityRange
  [ ] Contrast/shadow pass for legibility

Beats
  [ ] Tune GEARS positions/speeds vs panel cutouts
  [ ] Curate ~10–12 alignments (notes in comments)
  [ ] Remove dead zones (>15% scroll without peek)

A11y & RM
  [ ] RM: parallax=0, rotation=0, text still readable
  [ ] aria-hidden on decorative layers; semantic headings

QA
  [ ] Snapshots at key beats (0/15/28/40/55/70/85%)
  [ ] Cross-browser clipPath (Safari/Firefox)
  [ ] Mobile fallback verified


⸻

ASCII Peek Map (concept)

Viewport grid (avoid MC for text):

┌── TL ┬── TC ┬── TR ┐
│  ◯   │      │  ◯   │   P3 (DISCOVER): cutouts at TL, TR
├──────┼──────┼──────┤
│  ML  │ MC   │  MR  │   Gears (behind): big@ML, mid@MR, small@TR
├──────┼──────┼──────┤
│  BL  │  BC  │  BR  │   P4 (DEFINE): slot across MR→BR sweep
└──────┴──────┴──────┘


⸻

File Structure (panels version)

src/sections/ProcessGearPanels/
├── ProcessGearPanels.tsx        # container (560vh), sticky stage, useScroll
├── PanelsStage.tsx              # renders P1..P6 with masks + parallax
├── Panel.tsx                    # per-panel parallax + text ramp + clipPath
├── GearsField.tsx               # emblem instances + scroll-time rotation
├── panels/config.ts             # PANELS[], GEARS[] specs
└── masks/                       # builders: circles/slots/organic


⸻

What changed vs your previous doc
	•	Removed global mask + “aperture border” layer.
	•	Added per-panel masks and GearsField layer.
	•	Moved narrative from full-screen overlay to panel-local blocks (P3–P6).
	•	Reframed timeline from “mask size over phases” to peek beats created by alignment.

⸻

This version mirrors your intended layered animation: stacked panels, varied speeds, multiple emblem gears peeking through at curated moments, with the process story living on foreground panels.