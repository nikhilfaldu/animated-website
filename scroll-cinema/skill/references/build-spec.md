# Build spec template

Fill this from the Discovery Interview (§2 of SKILL.md), read it back to the user,
and get a yes before writing code. Keep it short — it is the contract.

---

```yaml
project:
  name:            # e.g. "Meadow"
  one_liner:       # the promise
  feeling:         # Apple-calm / Stripe-technical / luxury / kinetic / editorial
  references:      # sites or brands to echo
  avoid:           # anything to stay away from

objects:           # 3D hero
  source:          # path to .blend / .glb, or "none"
  hero_object:     # object name INSIDE the .blend (confirmed via inspection)
  interaction:     # scroll-spin | mouse-parallax | drag-orbit | combos
  behaviour:       # stays centered | travels between sections | scale changes

background:
  type:            # video-scrub | video-loop | images | gradient
  video:           # path to source file
  scrub:           # true (scroll drives currentTime) | false
  poster:          # path to still / "extract from video"
  treatment:       # grain on/off, scrim colours, vignette

content_anchoring: # optional — content that lives in the scene (references/anchoring.md)
  enabled:         # true | false
  level:           # 1 anchored hotspots (default) | 2 tracked | 3 depth compositing
  items:           # what to anchor -> to what in the shot
                   #   e.g. "Monstera card -> the big tree at the clearing (~t 0.34)"
  tone_match:      # sample + tint panels to the footage (default true)
  scene_cut_beats: # align content changes to scene cuts (true|false)
  fallback:        # anchored copy also as readable DOM (default true)

motion:
  transitions:     # between sections: fade/slide beats | pins | morph | parallax
  beats:           # number of full-screen scenes and what each shows
  intensity:       # subtle | medium | cinematic
  easing:          # ease-out | sine | power2 …
  scrub_smoothing: # e.g. 1
  reduced_motion:  # static poster + readable copy (default)

colors:
  ink:             # #______
  cream:           # #______
  accent:          # #______
  accent_2:        # #______
  base:            # dark | light
  surfaces:        # solid | glass/blur | none

fonts:
  sans:            # family stack
  display:         # optional
  weights:         # available weights
  overlay_type:    # per-scene headlines, and which words get the accent/gradient

layout:
  container:       # max width
  sections:        # ordered list
  cards:           # treatment
  header:          # nav items + primary CTA

content:           # per section
  hero:            # eyebrow, h1, lede, CTAs
  beats:           # kicker + headline + sub for each
  craft:           # eyebrow, title, lede, cards
  metrics:         # KPI labels/values, chart/bento content
  pricing:         # tiers, prices, features, CTA
  cta:             # headline, sub, button
  footer:          # links

technical:
  build_step:      # none (static) — this skill assumes none
  cdns_ok:         # true
  browsers:        # target
  perf_budget:     # optional
  can_verify_locally: # can a headless browser be run? (recommended: true)

deliverable:
  root:            # repo root
  media_dir:       # e.g. assets/media/
  objects_dir:     # e.g. assets/Objects/
  entry:           # index.html
```

## Derived build decisions (agent fills these, not the user)

- `film.mp4` = all-intra 720p transcode of `background.video` (§3 asset-pipeline).
- `film-poster.jpg` = extracted mid-clip frame.
- `hero.glb` = `use_selection=True` export of `objects.hero_object`.
- build number / cache-bust token = increments each iteration.
- act choreography = one entry per section in `layout.sections`.

## Confirmed?  (read back to the user)

> "Here's what I'll build: <one-paragraph summary>. The background is
> <video ×N s scrubbed across the full page>; the hero object is
> <name> from <file>, <behaviour>; colours <…>; fonts <…>; sections <…>.
> Shall I proceed?"

Only build after a yes.
