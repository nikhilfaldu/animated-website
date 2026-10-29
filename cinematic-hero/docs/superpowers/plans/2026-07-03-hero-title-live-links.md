# Hero Headline + LIVE Links Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Show "MICHAEL STYLIANOU" over the hero particles (fading out on early scroll) and add a LIVE ↗ chip to deployed projects (Paper Alpha only, for now).

**Architecture:** New `src/ui/heroTitle.js` module returning `{ el, setProgress }`, driven from the existing `onHeroProgress` callback (no new ScrollTrigger). LIVE links are an optional `live` field on the existing `PROJECTS` data array with a conditional sibling anchor.

**Tech Stack:** Vanilla JS/CSS, Vite. **No new dependencies.**

**Spec:** `docs/superpowers/specs/2026-07-03-hero-title-live-links-design.md`

## Global Constraints

- No automated test suite — verification is manual/visual: `npm run dev` → http://localhost:5173; headless Chromium at `/home/michael/.cache/ms-playwright/chromium-1208/chrome-linux64/chrome` (`--headless=new --no-sandbox`, reduced motion via `--force-prefers-reduced-motion`).
- No new npm dependencies. No changes to `src/scene/`.
- Exact copy: headline `MICHAEL STYLIANOU`, tagline `QUANTITATIVE TOOLS FOR REAL MARKETS`, live URL `https://paper-alpha-navy.vercel.app/`.
- Fade contract: `t = min(progress / 0.35, 1)`, `opacity = 1 - t`, `translateY(-${t * 30}px)`; progress is the [0, 3] shader progress.
- Nested anchors are invalid HTML — the LIVE chip must be a sibling of the title anchor, not a child.
- Commits end with `Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>`.

---

### Task 1: Hero headline

**Files:**
- Create: `src/ui/heroTitle.js`
- Modify: `src/main.js` (import, create, drive from callback)
- Modify: `src/styles/main.css` (hero-title styles)

**Interfaces:**
- Consumes: `onHeroProgress(progress)` in `main.js` with progress in [0, 3]; `#hero` section in `index.html`.
- Produces: `createHeroTitle()` → `{ el, setProgress(progress) }`.

- [ ] **Step 1: Create `src/ui/heroTitle.js`**

```js
export function createHeroTitle() {
  const el = document.createElement('div');
  el.className = 'hero-title';
  el.innerHTML = `
    <h1>MICHAEL STYLIANOU</h1>
    <p>QUANTITATIVE TOOLS FOR REAL MARKETS</p>
  `;
  document.getElementById('hero').appendChild(el);

  return {
    el,
    // progress is the [0,3] shader progress; the title is fully gone by
    // 0.35 (~12% of the pin) so the name owns the first screen only.
    setProgress(progress) {
      const t = Math.min(progress / 0.35, 1);
      el.style.opacity = 1 - t;
      el.style.transform = `translateY(${t * -30}px)`;
    },
  };
}
```

- [ ] **Step 2: Wire up in `src/main.js`**

Add the import:

```js
import { createHeroTitle } from './ui/heroTitle.js';
```

After the `createNavbar(...)` line (and its reduced-motion HUD block), add:

```js
const heroTitle = createHeroTitle();
```

Inside the `onHeroProgress` callback, after `particleField.setProgress(progress);`, add:

```js
      heroTitle.setProgress(progress);
```

(Under reduced motion the callback never runs — the headline stays visible over the static ring. `createHeroTitle()` is deliberately unconditional.)

- [ ] **Step 3: Styles in `src/styles/main.css`**

Add after the `#scene` rule:

```css
.hero-title {
  position: absolute;
  inset: 0;
  z-index: 5;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  text-align: center;
  padding: 0 20px;
  pointer-events: none;
}

.hero-title h1 {
  font-size: clamp(40px, 8vw, 120px);
  font-weight: 700;
  letter-spacing: -0.02em;
}

.hero-title p {
  margin-top: 12px;
  font-size: 13px;
  letter-spacing: 0.15em;
  color: #6f93b8;
}
```

- [ ] **Step 4: Visual verification**

1. Desktop screenshot at page top: name + tagline centered over the ring, navbar unobstructed.
2. Screenshot after scrolling ~0.6 viewport heights into the pin: headline gone (or nearly), ring→cube morph unobscured.
3. Reduced-motion screenshot: headline fully visible over the static ring.
4. 390×844 screenshot: headline wraps/fits with the clamp, no overflow.
5. Dump-dom: exactly one `<h1>` on the page.

- [ ] **Step 5: Commit**

```bash
git add src/ui/heroTitle.js src/main.js src/styles/main.css
git commit -m "Add hero headline that fades out on scroll

Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>"
```

---

### Task 2: LIVE links on project rows

**Files:**
- Modify: `src/ui/contentSection.js`
- Modify: `src/styles/main.css`

**Interfaces:**
- Consumes: `PROJECTS` array and `projectRow()` in `contentSection.js`; `.pill-list li` styling conventions.
- Produces: optional `live` field on PROJECTS entries; `.project-row__head` / `.project-row__live` classes.

- [ ] **Step 1: Add the live field and header wrapper in `src/ui/contentSection.js`**

In the `PROJECTS` array, add to the PAPER ALPHA entry (after `href`):

```js
    live: 'https://paper-alpha-navy.vercel.app/',
```

Replace `projectRow()` with:

```js
function projectRow({ title, href, tags, desc, live }, index) {
  const num = String(index + 1).padStart(2, '0');
  const liveLink = live
    ? `<a class="project-row__live" href="${live}" target="_blank" rel="noopener noreferrer">LIVE ↗</a>`
    : '';
  return `
    <li class="project-row">
      <div class="project-row__head">
        <a class="project-row__link" href="${href}" target="_blank" rel="noopener noreferrer">
          <span class="project-row__num">${num}</span>
          <span class="project-row__title">${title}</span>
        </a>
        ${liveLink}
      </div>
      <ul class="pill-list project-row__tags">${tags.map((t) => `<li>${t}</li>`).join('')}</ul>
      <p class="project-row__desc">${desc}</p>
    </li>
  `;
}
```

- [ ] **Step 2: Styles in `src/styles/main.css`**

Add after the `.project-row__link` rule:

```css
.project-row__head {
  display: flex;
  align-items: baseline;
  gap: 16px;
}

.project-row__live {
  font-family: 'SF Mono', 'Consolas', monospace;
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

.project-row__live:hover,
.project-row__live:focus-visible {
  background: rgba(191, 230, 255, 0.12);
}
```

- [ ] **Step 3: Visual verification**

1. Content-section screenshot: LIVE ↗ chip beside PAPER ALPHA only; other four rows chip-free; row hover states unchanged.
2. Dump-dom: `project-row__live` appears exactly once, with `href="https://paper-alpha-navy.vercel.app/"`, `target="_blank"`, `rel="noopener noreferrer"`; the chip is a sibling of `.project-row__link` inside `.project-row__head`, not nested.
3. 390×844: title stacks under number (existing mobile rule), chip stays on the title line or wraps cleanly, no overflow.

- [ ] **Step 4: Commit**

```bash
git add src/ui/contentSection.js src/styles/main.css
git commit -m "Add LIVE link chip to deployed projects (Paper Alpha)

Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>"
```
