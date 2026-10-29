# Portfolio Polish Pass Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Upgrade the portfolio's typography, color depth, and pill/chip
hierarchy from generic-sans/flat-accent to a real display+mono font system
with differentiated affordances, without touching the particle scene, copy,
or site structure.

**Architecture:** Self-hosted `@fontsource` webfont packages loaded via
`src/main.js`; all visual changes live in `src/styles/main.css` (existing
single stylesheet); one HTML edit in `index.html` to swap arrow-text for an
inline SVG glyph.

**Tech Stack:** Vite 8, vanilla JS/CSS, `@fontsource-variable/*` npm
packages.

## Global Constraints

- CSP is strict: `style-src 'self'; font-src 'self'` (see `vercel.json`) —
  fonts MUST be self-hosted via npm packages, never a Google Fonts `<link>`
  or `@import` from an external origin.
- No changes to `src/scene/*`, `src/scroll/*`, `src/ui/ripple.js`,
  `src/ui/cursor.js`, or any copy text in `index.html` other than the single
  arrow-glyph swap in Task 4.
- No new sections, no layout restructuring, no navigation changes.
- Existing accessibility features (skip link, `prefers-reduced-motion`
  handling, `:focus-visible` states) must remain intact — verify, don't
  remove.
- No automated test suite exists for this project (deliberate) — every
  task's verification is a local `npm run dev` + gstack visual/console
  check, not a unit test.
- Work stays on branch `redesign/portfolio-polish`. No push, no merge to
  `master`, no deploy.

---

### Task 1: Install and load webfonts

**Files:**
- Modify: `package.json` (new dependencies)
- Modify: `src/main.js:1` (add imports at top of file)

**Interfaces:**
- Produces: CSS custom properties `--font-display` and `--font-mono`
  (defined in Task 2/3) that later tasks' CSS rules reference. This task
  only makes the font files available and loaded; it does not apply them to
  any selector yet.

- [ ] **Step 1: Install the font packages**

Run: `cd ~/cinematic-hero && npm install @fontsource-variable/bricolage-grotesque @fontsource-variable/jetbrains-mono`

Expected: both packages added to `dependencies` in `package.json`, present
under `node_modules/@fontsource-variable/`.

- [ ] **Step 2: Load the font CSS in the entry module**

Read `src/main.js` first to find its current top-of-file imports, then add
these two lines as the very first lines of the file (before any existing
imports):

```js
import '@fontsource-variable/bricolage-grotesque';
import '@fontsource-variable/jetbrains-mono';
```

- [ ] **Step 3: Verify fonts load with no console/CSP errors**

Run: `npm run dev` (background)

Use the gstack skill to browse `http://localhost:5173/` and capture the
console log.

Expected: zero console errors (specifically no CSP `font-src`/`style-src`
violations), network log shows the two font files served from
`localhost:5173` (not an external origin).

- [ ] **Step 4: Commit**

```bash
git add package.json package-lock.json src/main.js
git commit -m "build: load self-hosted Bricolage Grotesque + JetBrains Mono webfonts"
```

---

### Task 2: Apply display font to headings and fix footer scale

**Files:**
- Modify: `src/styles/main.css`

**Interfaces:**
- Consumes: `@fontsource-variable/bricolage-grotesque` loaded in Task 1
  (variable font, exposes the family name `"Bricolage Grotesque Variable"`).
- Produces: `--font-display` custom property other tasks don't need but
  future edits can reuse.

- [ ] **Step 1: Add the display font variable and apply it to the three headings**

In `src/styles/main.css`, add to the existing `:root` block (currently at
line 288, `:root { --scene-tint: rgb(42 51 56); }`):

```css
:root {
  --scene-tint: rgb(42 51 56);
  --font-display: 'Bricolage Grotesque Variable', 'Helvetica Neue', Arial, sans-serif;
}
```

Update `.hero-title h1` (currently lines 33–38):

```css
.hero-title h1 {
  max-width: 100%;
  font-family: var(--font-display);
  font-size: clamp(40px, 8vw, 120px);
  font-weight: 700;
  letter-spacing: -0.02em;
}
```

Update `.project-row__title` (currently lines 213–219):

```css
.project-row__title {
  position: relative;
  font-family: var(--font-display);
  font-size: clamp(24px, 4vw, 44px);
  font-weight: 700;
  letter-spacing: 0.02em;
  transition: color 0.25s ease, transform 0.25s ease;
}
```

- [ ] **Step 2: Fix the footer heading scale**

Update `.footer__heading` (currently lines 339–343), which currently uses a
standalone bold-sans rule out of step with the rest of the type system:

```css
.footer__heading {
  font-family: var(--font-display);
  font-size: clamp(32px, 6vw, 72px);
  font-weight: 700;
  letter-spacing: -0.02em;
}
```

(Same declarations as before, but now on the shared display font instead of
the default system sans — this is the "proportion into the same scale
logic" fix from the spec: same `clamp()` range as before, but the family
now matches `.hero-title h1` and `.project-row__title` instead of falling
back to plain Helvetica/Arial.)

- [ ] **Step 3: Verify visually**

Use the gstack skill to browse `http://localhost:5173/` and screenshot: hero
section (top), projects list (scrolled), footer (scrolled to bottom).

Expected: name, project titles, and "GET IN TOUCH" all render in the new
display font (visibly different letterforms from the body/nav text, which
still uses the default sans at this point). No layout breakage (check name
doesn't overflow at 375px viewport width).

- [ ] **Step 4: Commit**

```bash
git add src/styles/main.css
git commit -m "style: apply display webfont to headings, fix footer heading scale"
```

---

### Task 3: Apply mono webfont to numerals, tags, HUD, and nav

**Files:**
- Modify: `src/styles/main.css`

**Interfaces:**
- Consumes: `@fontsource-variable/jetbrains-mono` loaded in Task 1.

- [ ] **Step 1: Add the mono font variable**

In the same `:root` block from Task 2, add:

```css
:root {
  --scene-tint: rgb(42 51 56);
  --font-display: 'Bricolage Grotesque Variable', 'Helvetica Neue', Arial, sans-serif;
  --font-mono: 'JetBrains Mono Variable', 'SF Mono', 'Consolas', monospace;
}
```

- [ ] **Step 2: Replace the system-mono fallback chains**

Update each of these existing rules to use `var(--font-mono)` in place of
the literal `'SF Mono', 'Consolas', monospace` chain:

`.stats-hud` (currently lines 92–103):
```css
.stats-hud {
  position: fixed;
  bottom: 24px; right: 24px;
  z-index: 10;
  display: flex;
  flex-direction: column;
  gap: 4px;
  font-family: var(--font-mono);
  font-size: 11px;
  color: #6f93b8;
  text-align: right;
}
```

`.project-row__live` (currently lines 189–200):
```css
.project-row__live {
  font-family: var(--font-mono);
  font-size: 11px;
  letter-spacing: 0.08em;
  color: #bfe6ff;
  border: 1px solid rgba(191, 230, 255, 0.4);
  border-radius: 999px;
  padding: 3px 10px;
  text-decoration: none;
  white-space: nowrap;
  transition: background 0.25s ease;
}
```

`.project-row__num` (currently lines 207–211):
```css
.project-row__num {
  font-family: var(--font-mono);
  font-size: 13px;
  color: #6f93b8;
}
```

`.pill-list li` (currently lines 259–267):
```css
.pill-list li {
  font-family: var(--font-mono);
  font-size: 11px;
  letter-spacing: 0.08em;
  color: #6f93b8;
  border: 1px solid rgba(111, 147, 184, 0.35);
  border-radius: 999px;
  padding: 3px 10px;
}
```

- [ ] **Step 3: Apply mono to nav links**

Update `.navbar__links a` (currently lines 86–90) to add the mono family
(nav already uses uppercase + letter-spacing on the `.navbar` parent rule,
this just swaps the rendered typeface):

```css
.navbar__links a {
  font-family: var(--font-mono);
  color: #e8f1ff;
  text-decoration: none;
  margin-left: 32px;
}
```

- [ ] **Step 4: Verify visually**

Use the gstack skill to browse `http://localhost:5173/`. Screenshot the
navbar, a project row (numerals + tags + LIVE/GITHUB chips), and the
bottom-right stats HUD.

Expected: all of these now render in JetBrains Mono consistently (previously
these fell back to whatever monospace font happened to be installed on the
OS). No visual regression in spacing/alignment.

- [ ] **Step 5: Commit**

```bash
git add src/styles/main.css
git commit -m "style: apply JetBrains Mono webfont to numerals, tags, HUD, and nav"
```

---

### Task 4: Differentiate CTA / external-link / tag-pill affordances

**Files:**
- Modify: `src/styles/main.css`
- Modify: `index.html`

**Interfaces:**
- Produces: `.icon-arrow` CSS class used by the new inline SVG glyphs.

- [ ] **Step 1: Make the CV button the one filled/solid affordance**

Update `.about__cv-button` (currently lines 144–155):

```css
.about__cv-button {
  align-self: flex-start;
  margin-top: 24px;
  padding: 12px 28px;
  background: #bfe6ff;
  border: 1px solid #bfe6ff;
  border-radius: 999px;
  color: #05060a;
  font-family: var(--font-mono);
  font-size: 13px;
  letter-spacing: 0.15em;
  text-decoration: none;
  transition: background 0.25s ease, border-color 0.25s ease;
}
```

And its hover/focus state (currently lines 157–162), which currently
brightens toward the same accent — now dims slightly instead, since the
button is already at full accent intensity by default:

```css
.about__cv-button:hover,
.about__cv-button:focus-visible {
  background: var(--accent-dim);
  border-color: var(--accent-dim);
}
```

(`--accent-dim` is defined in Task 5 — if executing Task 4 before Task 5,
add `--accent-dim: #7fa9cc;` to the `:root` block now; Task 5 will find it
already present and skip re-adding it.)

- [ ] **Step 2: Replace the arrow-text suffix with an inline SVG glyph**

`index.html` currently has 10 occurrences of the literal string ` ↗</a>`
(one per LIVE/DEMO/GITHUB chip across the 7 project rows). Replace all of
them in a single edit:

old_string: ` ↗</a>`
new_string: ` <svg class="icon-arrow" viewBox="0 0 12 12" aria-hidden="true"><path d="M3 9 9 3M4.5 3H9v4.5" stroke="currentColor" stroke-width="1.3" fill="none" stroke-linecap="round" stroke-linejoin="round"/></svg></a>`
(use `replace_all: true`)

- [ ] **Step 3: Style the new glyph**

Add to `src/styles/main.css`, near `.project-row__live`:

```css
.icon-arrow {
  width: 9px;
  height: 9px;
  margin-left: 3px;
  vertical-align: -1px;
}
```

- [ ] **Step 4: Make tag pills read as inert metadata, not interactive chips**

Add a new rule to `src/styles/main.css`, immediately after `.pill-list li`
(added in Task 3) — this is more specific than the base `.pill-list li`
rule so it overrides border/background only for project tech-tags, leaving
`.about__skills` pills (which share the base `.pill-list` class) unchanged:

```css
.project-row__tags li {
  border: none;
  background: rgba(111, 147, 184, 0.12);
}
```

- [ ] **Step 5: Verify visually**

Use the gstack skill to browse `http://localhost:5173/`. Screenshot the
about section (CV button — should now be a filled ice-blue pill) and two
project rows (one with a LIVE chip, one without — check the arrow glyph
renders crisply at small size, and confirm the tech-tag pills now look
visually distinct from the LIVE/GITHUB chips: no border, filled background).

Expected: three visually distinct affordance types on the page — filled
CTA, outlined external-link chip with a small arrow icon, and borderless
filled metadata tag. Confirm all 7 project rows and the download-CV button
still work (click-test at least one LIVE link and the CV download).

- [ ] **Step 6: Commit**

```bash
git add src/styles/main.css index.html
git commit -m "style: differentiate CTA, external-link, and tag-pill affordances"
```

---

### Task 5: Add accent depth via a dimmer hover/active stop

**Files:**
- Modify: `src/styles/main.css`

- [ ] **Step 1: Define the dim accent token (if not already added in Task 4)**

Ensure the `:root` block contains:

```css
:root {
  --scene-tint: rgb(42 51 56);
  --font-display: 'Bricolage Grotesque Variable', 'Helvetica Neue', Arial, sans-serif;
  --font-mono: 'JetBrains Mono Variable', 'SF Mono', 'Consolas', monospace;
  --accent: #bfe6ff;
  --accent-dim: #7fa9cc;
}
```

(`--accent` is a new alias for the existing literal `#bfe6ff` used
throughout the file — introduced here so the remaining hover rules below
can reference it instead of repeating the literal hex.)

- [ ] **Step 2: Apply the dim accent to secondary hover interactions**

Update `.footer__linkedin:hover, .footer__linkedin:focus-visible` (currently
lines 372–375) — a secondary link, not the page's primary emphasis moment:

```css
.footer__linkedin:hover,
.footer__linkedin:focus-visible {
  color: var(--accent-dim);
}
```

Update `.project-row__live:hover, .project-row__live:focus-visible`
(currently lines 202–205):

```css
.project-row__live:hover,
.project-row__live:focus-visible {
  background: rgba(127, 169, 204, 0.14);
}
```

- [ ] **Step 3: Leave the primary emphasis moment at full accent intensity**

No change needed to `.project-row:hover .project-row__title` /
`.project-row:focus-within .project-row__title` (lines 234–242) — these
stay at full `#bfe6ff` intensity deliberately, per the spec: this is the
page's one "wow" hover moment (project title + underline sweep), and should
stay the brightest interaction on the page rather than being dimmed.

- [ ] **Step 4: Verify visually**

Use the gstack skill to browse `http://localhost:5173/`. Hover/focus the CV
button, a LIVE/GITHUB chip, the footer LinkedIn link, and a project row
title. Screenshot each hover state.

Expected: two distinct intensities visible — project-row title hover stays
bright ice-blue (`#bfe6ff`), while CV button hover and footer link hover
shift to the dimmer `#7fa9cc` — giving the page a sense of depth instead of
one flat color reused identically everywhere.

- [ ] **Step 5: Commit**

```bash
git add src/styles/main.css
git commit -m "style: add dimmer accent stop for secondary hover states"
```

---

### Task 6: Full verification pass

**Files:** none (verification only)

- [ ] **Step 1: Production build check**

Run: `npm run build`

Expected: build succeeds with no errors; check the `dist/` output includes
the font files under `dist/assets/`.

- [ ] **Step 2: Full-site visual/console pass**

Use the gstack skill to browse `http://localhost:5173/` (re-run `npm run
dev` if not already running) at both desktop and 375px mobile viewport
widths. Scroll through the entire page (hero → about → projects → footer).

Expected: zero console errors, zero CSP violations, all text legible, no
layout overflow at 375px, all font-family changes from Tasks 2–3 visible
throughout.

- [ ] **Step 3: `prefers-reduced-motion` check**

Use the gstack skill's `--force-prefers-reduced-motion` capability (or
equivalent) to confirm the site still renders correctly with reduced motion
— this task made no motion changes, so this step confirms no regression.

- [ ] **Step 4: Accessibility spot-check**

Tab through the page with keyboard focus only (skip link → nav → CV button
→ project rows → footer links). Confirm `:focus-visible` outlines are still
visible on all interactive elements, including the newly-restyled CV button
and tag pills (tags are non-interactive, so no focus state needed on them —
confirm they're not in the tab order).

- [ ] **Step 5: Final status check**

```bash
git status
git log --oneline redesign/portfolio-polish -6
```

Expected: working tree clean, 6 commits ahead of `master` on
`redesign/portfolio-polish`, `master` itself unchanged
(`git diff master redesign/portfolio-polish --stat` shows the expected file
set: `package.json`, `package-lock.json`, `src/main.js`,
`src/styles/main.css`, `index.html`).

No push, no merge, no deploy — report back to Styli for local review.
