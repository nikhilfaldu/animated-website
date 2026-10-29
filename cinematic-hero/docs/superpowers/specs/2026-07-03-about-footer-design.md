# About Section + Contact Footer — Design

**Date:** 2026-07-03
**Status:** Approved by Styli
**Predecessor:** `2026-07-03-cinematic-hero-v2-design.md` (v2, shipped)

## Goal

Add the two highest-value missing pieces for recruiters: a short About
block (bio, skills, CV download) and a contact footer (email, LinkedIn).
Deployment remains out of scope — Styli deploys manually.

## 1. About block (`src/ui/contentSection.js`)

Placed inside the existing content section, between the
`content-section__list` (WEBSITES/…) and the PROJECTS heading:

- Mini-heading "ABOUT" styled like `.projects__heading`.
- Bio paragraph (max-width 640px), exact copy:

  > Mathematics & Economics undergraduate at the University of Liverpool,
  > building quantitative tools for real markets — from options pricing
  > and delta-hedging backtests to a live recession nowcast. Interested
  > in data-driven finance and AI; everything below was designed, built,
  > and shipped by me.

- Skills strip, exact pills in this order:
  Python · pandas · NumPy/SciPy · statsmodels · R · MATLAB · Excel ·
  SQL · JavaScript/TypeScript · Next.js/React · Flask · Three.js ·
  Claude Code
- "DOWNLOAD CV" bordered button linking to `/cv.pdf` with
  `download="Michael_Stylianou_CV.pdf"`.

**CV asset:** copy
`/mnt/c/Users/Michael/Desktop/Michael_Stylianou_CV 19062026 DataAI.pdf`
to `public/cv.pdf` (Vite serves `public/` at the site root). The Desktop
file stays canonical; re-copy to refresh.

**Shared pill styling:** extract the pill rules currently on
`.project-row__tags` into a generic `.pill-list` class used by both the
project-row tags and the skills strip (markup gains
`class="pill-list project-row__tags"` / `class="pill-list about__skills"`;
the duplicated li styling lives once under `.pill-list li`).

## 2. Contact footer (`src/ui/footer.js`, new module)

New UI module following the `contentSection.js` pattern
(`createFooter({ animate = true })`, appends to `document.body`,
returns the element). Content:

- `<footer id="contact" class="footer">`
- Large "GET IN TOUCH" heading (scaled-down cousin of
  `.content-section__heading`).
- Email as a big mailto link: michael.stylianou7@gmail.com
- LinkedIn link: https://linkedin.com/in/michael-stylianou-185055302
  (target _blank, rel noopener noreferrer)
- Small line: "© 2026 Michael Stylianou"
- No GitHub link (Styli's choice).

**Navbar change (`src/ui/navbar.js`):** CONTACT href changes from
`mailto:…` to `#contact` — keeps visitors on the page; the mailto lives
in the footer.

**Magnetic hover:** `main.js` adds one call
`initMagneticLinks('.footer__links a')` alongside the existing gated
calls (inherits the reduced-motion/touch gating).

## 3. Motion, responsive, reduced motion

- About block elements and footer fade/slide in on scroll like the
  project rows (GSAP `from` + ScrollTrigger), skipped when
  `animate: false` (main.js passes `!reducedMotion`, same as
  `createContentSection`).
- Pills wrap; button full-width-friendly; footer stacks — covered inside
  the existing `@media (max-width: 640px)` block.
- Footer visible without animation under reduced motion.

## Verification

Manual/visual per project convention: dev server + headless Chromium
screenshots at desktop and 390×844; reduced-motion check via
`--force-prefers-reduced-motion` (footer + About visible, no hidden
inline styles); `/cv.pdf` responds 200 and downloads with the right
filename; CONTACT nav link scrolls to the footer.

## Out of scope

- GitHub link in footer (excluded by choice), live-demo links per
  project row, case-study pages, deployment.
