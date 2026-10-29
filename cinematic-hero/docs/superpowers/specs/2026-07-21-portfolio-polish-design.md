# Portfolio Polish Pass — Design Spec

## Problem

The Three.js/GSAP particle hero is distinctive and stays as-is. Everything
below the fold reads generically once you scroll past it: system sans-serif
only (`'Helvetica Neue', Arial`), a single flat ice-blue accent on near-black
(a very common dark-mode palette), four visually-identical pill/chip styles
(CV button, LIVE chip, GITHUB chip, tag pills — all "border + radius:999px")
with no affordance hierarchy, ad-hoc spacing values, and a footer heading
(72px bold sans) that jumps out of step with the rest of the type scale.

This is a **polish pass**: upgrade execution, keep the core concept (particle
morph hero, content structure, all copy, all links) untouched. No behavioral
or structural changes — visual/CSS only, plus new webfont loading.

## Direction

Keep the cool near-black + ice-blue identity (already distinctive once the
generic-sans problem is fixed). Bring in the typographic technique Styli
responded well to on a sibling project (Neural Option Pricer's "Observatory"
UI) — a real display face for headings paired with monospace for numerals/
labels — applied to this site's own palette, not that project's warm colors.

### Typography

- **Display**: load **Bricolage Grotesque** (variable, weights 400–800) for
  `h1` (name), `.project-row__title`, `.footer__heading`. Sharp/geometric,
  suits the existing uppercase-bold treatment, and is a genuine upgrade over
  the Helvetica/Arial fallback chain currently in place.
- **Mono**: replace the system fallback chain
  (`'SF Mono', 'Consolas', monospace`) with a loaded **JetBrains Mono**
  webfont for `.project-row__num`, `.pill-list li`, `.stats-hud`, nav links —
  renders identically across OSes instead of varying per-device.
- Both loaded via `@fontsource` packages (self-hosted, npm-installed — no
  external font CDN request, keeps the CSP `font-src 'self'` policy intact
  and avoids adding a new third-party origin).

### Color / depth

- No new hues. Add a second, darker ice-blue stop
  (`--accent-dim: #6fa3c9` or similar, exact value tuned during
  implementation) for hover/active states that currently reuse the same
  `#bfe6ff` at full intensity everywhere — gives depth without changing the
  palette identity.

### Component hierarchy fix

Currently `.about__cv-button`, `.project-row__live`, and `.pill-list li` are
all "1px border, radius:999px, transparent fill" — differing only in border
color/text color. Redesign as three distinct affordance types:

1. **Primary CTA** (`.about__cv-button`, "DOWNLOAD CV"): solid filled
   ice-blue background, near-black text — the one filled element on the
   page, signaling "this is an action."
2. **External-link chips** (`.project-row__live`, LIVE/GITHUB): stay
   outlined, but replace the arrow-text suffix (`LIVE ↗`) with a small inline
   SVG arrow-glyph to reduce label noise while keeping the external-link
   affordance clear.
3. **Metadata tags** (`.pill-list.project-row__tags li`): drop the border
   entirely, use a subtle filled background (`rgba(111,147,184,0.12)`) — reads
   as inert metadata, not an interactive element.

### Footer heading

`.footer__heading` moves off its standalone 72px/bold-sans rule and onto the
same display-font + `clamp()` scale logic already used by `.project-row__title`
(large, but proportioned against the rest of the scale rather than an
outlier).

### Spacing

No full spacing-scale system introduction (out of scope for a polish pass —
would touch every rule). Only the specific inconsistencies called out above
(footer heading) get fixed; existing ad-hoc margins elsewhere are left alone
since they're not visibly broken, just informal.

## Out of scope

- Particle/scene code (`src/scene/*`), scroll timeline, cursor/ripple
  interactions — untouched.
- Copy content in `index.html` — untouched.
- Any new sections, layout restructuring, or navigation changes.
- Accessibility features already in place (skip link, reduced-motion,
  focus-visible states) — preserved as-is, not re-audited here.

## Verification

- `npm run dev` locally; gstack browse to confirm zero console/CSP errors
  after adding the two `@fontsource` packages (self-hosted fonts must not
  trip the existing `font-src 'self'` CSP rule in `vercel.json`).
- Visual check at desktop + mobile (375px) breakpoints.
- `prefers-reduced-motion` behavior unaffected (no motion changes in this
  pass).
- No push, no merge to `master`, no deploy — work stays on
  `redesign/portfolio-polish` until Styli reviews locally and decides.
