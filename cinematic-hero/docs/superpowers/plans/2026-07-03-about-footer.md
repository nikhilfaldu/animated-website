# About Section + Contact Footer Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add an About block (bio, skills pills, CV download) to the content section and a contact footer (email, LinkedIn) with a navbar CONTACT anchor.

**Architecture:** About block slots into the existing `contentSection.js` markup; pill styling is extracted to a shared `.pill-list` class. The footer is a new `src/ui/footer.js` module following the `createContentSection({ animate })` pattern, appended after the content section and wired in `main.js` with the existing reduced-motion gating.

**Tech Stack:** Vanilla JS/CSS, GSAP + ScrollTrigger, Vite. **No new dependencies.**

**Spec:** `docs/superpowers/specs/2026-07-03-about-footer-design.md`

## Global Constraints

- **No automated test suite** — verification is manual/visual: `npm run dev` (http://localhost:5173) + headless Chromium at `/home/michael/.cache/ms-playwright/chromium-1208/chrome-linux64/chrome` (`--headless=new --no-sandbox`; reduced motion via `--force-prefers-reduced-motion`).
- No new npm dependencies. No changes to `src/scene/`.
- Exact bio copy, skills list/order, LinkedIn URL, and CV source path as given in the tasks below — copied verbatim from the spec.
- No GitHub link in the footer (deliberate choice).
- Match existing code style; commits end with `Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>`.

---

### Task 1: About block + shared pill styling + CV asset

**Files:**
- Modify: `src/ui/contentSection.js`
- Modify: `src/styles/main.css`
- Create: `public/cv.pdf` (copied binary)

**Interfaces:**
- Consumes: existing `createContentSection({ animate = true } = {})` and its `animate` gate.
- Produces: `.pill-list` shared CSS class (Task 2 does not use it, but project rows now depend on it); About markup classes `.about__heading`, `.about__bio`, `.about__skills`, `.about__cv-button`.

- [ ] **Step 1: Copy the CV into the site**

```bash
cp "/mnt/c/Users/Michael/Desktop/Michael_Stylianou_CV 19062026 DataAI.pdf" /home/michael/cinematic-hero/public/cv.pdf
```

(The Desktop file stays canonical; this is a snapshot. Vite serves `public/` at the site root.)

- [ ] **Step 2: Add the About block to `src/ui/contentSection.js`**

Below the `PROJECTS` const, add:

```js
const SKILLS = [
  'Python', 'pandas', 'NumPy/SciPy', 'statsmodels', 'R', 'MATLAB', 'Excel',
  'SQL', 'JavaScript/TypeScript', 'Next.js/React', 'Flask', 'Three.js',
  'Claude Code',
];
```

In `section.innerHTML`, between the closing `</ul>` of `content-section__list` and the `<h3 class="projects__heading">` line, insert:

```html
    <h3 class="about__heading">ABOUT</h3>
    <p class="about__bio">Mathematics & Economics undergraduate at the University of Liverpool, building quantitative tools for real markets — from options pricing and delta-hedging backtests to a live recession nowcast. Interested in data-driven finance and AI; everything below was designed, built, and shipped by me.</p>
    <ul class="pill-list about__skills">${SKILLS.map((s) => `<li>${s}</li>`).join('')}</ul>
    <a class="about__cv-button" href="/cv.pdf" download="Michael_Stylianou_CV.pdf">DOWNLOAD CV</a>
```

In `projectRow()`, change the tags line to use the shared class:

```js
      <ul class="pill-list project-row__tags">${tags.map((t) => `<li>${t}</li>`).join('')}</ul>
```

In the animated branch (after the heading `fromTo`, before the project-row `from`), add the About reveal:

```js
  gsap.from(
    section.querySelectorAll('.about__heading, .about__bio, .about__skills, .about__cv-button'),
    {
      autoAlpha: 0,
      y: 30,
      duration: 0.7,
      stagger: 0.1,
      ease: 'power2.out',
      scrollTrigger: { trigger: section.querySelector('.about__heading'), start: 'top 85%' },
    },
  );
```

- [ ] **Step 3: Extract pill styles and add About styles in `src/styles/main.css`**

Replace the two rules

```css
.project-row__tags {
  list-style: none;
  display: flex;
  gap: 8px;
  margin-top: 10px;
}
```

and

```css
.project-row__tags li {
  font-family: 'SF Mono', 'Consolas', monospace;
  font-size: 11px;
  letter-spacing: 0.08em;
  color: #6f93b8;
  border: 1px solid rgba(111, 147, 184, 0.35);
  border-radius: 999px;
  padding: 3px 10px;
}
```

with:

```css
.pill-list {
  list-style: none;
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.pill-list li {
  font-family: 'SF Mono', 'Consolas', monospace;
  font-size: 11px;
  letter-spacing: 0.08em;
  color: #6f93b8;
  border: 1px solid rgba(111, 147, 184, 0.35);
  border-radius: 999px;
  padding: 3px 10px;
}

.project-row__tags { margin-top: 10px; }
```

Then add, after the `.projects__heading` rule:

```css
.about__heading {
  margin-top: 64px;
  font-size: 13px;
  letter-spacing: 0.15em;
  color: #6f93b8;
}

.about__bio {
  max-width: 640px;
  margin-top: 16px;
  font-size: 16px;
  line-height: 1.7;
  color: rgba(232, 241, 255, 0.75);
}

.about__skills {
  max-width: 640px;
  margin-top: 20px;
}

/* content-section is a stretch flex column; without align-self the anchor
   spans full width and the whole row becomes clickable. */
.about__cv-button {
  align-self: flex-start;
  display: inline-block;
  margin-top: 24px;
  padding: 12px 28px;
  border: 1px solid rgba(232, 241, 255, 0.4);
  border-radius: 999px;
  color: #e8f1ff;
  font-size: 13px;
  letter-spacing: 0.15em;
  text-decoration: none;
  transition: border-color 0.25s ease, color 0.25s ease, background 0.25s ease;
}

.about__cv-button:hover,
.about__cv-button:focus-visible {
  border-color: #bfe6ff;
  color: #bfe6ff;
  background: rgba(191, 230, 255, 0.06);
}
```

- [ ] **Step 4: Visual verification**

Dev server running (`npm run dev` if not). Check:
1. `curl -sI http://localhost:5173/cv.pdf | head -1` → `HTTP/1.1 200 OK`.
2. Headless screenshot of the content section (scroll past the hero): ABOUT heading, bio paragraph, 13 skill pills wrapping cleanly, bordered DOWNLOAD CV button sized to its text (not full width).
3. Project-row tags render unchanged (shared class regression check).
4. 390×844 screenshot: pills wrap, button fits, no horizontal overflow.

- [ ] **Step 5: Commit**

```bash
git add src/ui/contentSection.js src/styles/main.css public/cv.pdf
git commit -m "Add About block with bio, skills pills, and CV download

Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>"
```

---

### Task 2: Contact footer + navbar anchor + wiring

**Files:**
- Create: `src/ui/footer.js`
- Modify: `src/ui/navbar.js` (CONTACT href)
- Modify: `src/main.js` (import, create call, magnetic links)
- Modify: `src/styles/main.css` (footer styles, smooth scroll, mobile)

**Interfaces:**
- Consumes: reduced-motion gating pattern in `main.js` (`reducedMotion` const, `animate: !reducedMotion`); `initMagneticLinks(selector)` from `src/ui/cursor.js`.
- Produces: `createFooter({ animate = true } = {})` returning the footer element; `<footer id="contact" class="footer">` anchor target.

- [ ] **Step 1: Create `src/ui/footer.js`**

```js
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

export function createFooter({ animate = true } = {}) {
  const footer = document.createElement('footer');
  footer.id = 'contact';
  footer.className = 'footer';
  footer.innerHTML = `
    <h2 class="footer__heading">GET IN TOUCH</h2>
    <div class="footer__links">
      <a class="footer__email" href="mailto:michael.stylianou7@gmail.com">michael.stylianou7@gmail.com</a>
      <a class="footer__linkedin" href="https://linkedin.com/in/michael-stylianou-185055302" target="_blank" rel="noopener noreferrer">LINKEDIN</a>
    </div>
    <p class="footer__copyright">© 2026 Michael Stylianou</p>
  `;
  document.body.appendChild(footer);

  if (!animate) return footer;

  gsap.from(footer.children, {
    autoAlpha: 0,
    y: 30,
    duration: 0.7,
    stagger: 0.1,
    ease: 'power2.out',
    scrollTrigger: { trigger: footer, start: 'top 85%' },
  });

  return footer;
}
```

- [ ] **Step 2: Point navbar CONTACT at the footer — `src/ui/navbar.js`**

```js
      <a href="#contact">CONTACT</a>
```

(replaces the `mailto:` href; the mailto now lives in the footer.)

- [ ] **Step 3: Wire up in `src/main.js`**

Add the import:

```js
import { createFooter } from './ui/footer.js';
```

Directly after `createContentSection({ animate: !reducedMotion });`, add:

```js
createFooter({ animate: !reducedMotion });
```

Inside the existing `if (!reducedMotion) { … }` block that calls `initCursorParallax`/`initMagneticLinks`, add:

```js
  initMagneticLinks('.footer__links a');
```

- [ ] **Step 4: Footer styles + smooth scroll in `src/styles/main.css`**

Append before the `@media (max-width: 640px)` block:

```css
/* Reduced-motion users get instant jumps; everyone else smooth-scrolls
   the #contact anchor. */
@media (prefers-reduced-motion: no-preference) {
  html { scroll-behavior: smooth; }
}

.footer {
  position: relative;
  z-index: 5;
  background: #05060a;
  display: flex;
  flex-direction: column;
  padding: 96px 40px 48px;
}

.footer__heading {
  font-size: clamp(32px, 6vw, 72px);
  font-weight: 700;
  letter-spacing: -0.02em;
}

.footer__links {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 8px;
  margin-top: 24px;
}

.footer__email {
  font-size: clamp(18px, 3vw, 28px);
  color: #bfe6ff;
  text-decoration: none;
}

.footer__email:hover,
.footer__email:focus-visible {
  text-decoration: underline;
}

.footer__linkedin {
  font-size: 13px;
  letter-spacing: 0.15em;
  color: #e8f1ff;
  text-decoration: none;
  transition: color 0.25s ease;
}

.footer__linkedin:hover,
.footer__linkedin:focus-visible {
  color: #bfe6ff;
}

.footer__copyright {
  margin-top: 48px;
  font-size: 11px;
  color: #6f93b8;
}
```

Inside the existing `@media (max-width: 640px)` block, add:

```css
  .footer { padding: 64px 20px 32px; }
```

- [ ] **Step 5: Visual verification (whole feature)**

1. Desktop headless screenshot at the bottom of the page: GET IN TOUCH heading, email link, LINKEDIN link, copyright line, atmosphere grain/vignette still overlaying (footer is under z-20 overlay, above canvas).
2. `--dump-dom`: navbar contains `href="#contact">CONTACT`, footer has `id="contact"`; project-row tags carry `class="pill-list project-row__tags"`.
3. Reduced motion (`--force-prefers-reduced-motion` + `--dump-dom`): footer children have no hiding inline styles; no `pin-spacer`.
4. 390×844 screenshot: footer stacks with reduced padding, no overflow.
5. No console errors on load.

- [ ] **Step 6: Commit**

```bash
git add src/ui/footer.js src/ui/navbar.js src/main.js src/styles/main.css
git commit -m "Add contact footer and point navbar CONTACT at it

Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>"
```
