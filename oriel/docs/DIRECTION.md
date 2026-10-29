# ORIEL — Art direction & build contract

> ORIEL is a **fictional** independent watchmaker, built as a portfolio concept by Ayoub Benkreira.
> The site never claims awards, partnerships, customers or a real business.

## 1. Direction

**Visual thesis — "a watchmaker's darkroom."** A near-black studio where a single object is lit like a
night-time catalogue shoot. Warm bone-white type, one champagne-gold accent, hairline rules and numbered
callouts borrowed from technical drawings. The page reads like an engineering blueprint printed in an
editorial magazine.

**Story — "Time, taken apart."** The page moves from *whole → parts → heart → whole again*:
the assembled watch (hero) is disassembled layer by layer (anatomy), the camera travels into the movement
(movement), then the visitor re-assembles it in their own metal (configure) and reserves it.

**Hero focal asset.** A procedural Three.js watch (Calibre O-1) showing the visitor's real local time, with a
seconds hand that steps 8 times per second (28,800 vph — the same beat the copy talks about).

| Token | Value | Use |
|---|---|---|
| `--ink-0` | `#0a0908` | page |
| `--ink-1` / `--ink-2` / `--ink-3` | `#11100e` / `#1a1815` / `#26231f` | raised surfaces, panels, hover |
| `--bone` | `#ede6da` | primary text (16:1) |
| `--bone-2` | `#b8b0a3` | secondary text |
| `--bone-3` | `#867f74` | meta / labels (≥ 4.9:1 on ink-0) |
| `--gold` / `--gold-hi` / `--gold-lo` | `#cdb07a` / `#e8d3a6` / `#8f7849` | the one accent |
| `--line` / `--line-strong` | bone @ 12% / 24% | hairlines |

**Type.** Display: *Instrument Serif* (roman + italic; italic gold for emphasis). Text: *Hanken Grotesk*
(variable). Labels, numbers, specs: *DM Mono*, uppercase, tracked +0.08em. All self-hosted via Fontsource.

**Motifs.** `§ 0N — Chapter` marks in mono · numbered callouts `01–07` · hairline rules with small `+`
registration marks at section corners · italic gold words inside serif headlines · the circle (dial, iris,
hold ring) as the one recurring shape.

**Section sequence.**
1. Preloader — 60-tick dial fills with a counter, then irises open.
2. Hero — headline, CTA, live 3D watch, "your time" readout.
3. Manifesto (`#story`) — pinned; words light up as you scroll.
4. Anatomy (`#anatomy`) — pinned + scrubbed exploded view; 7 numbered callouts with leader lines.
5. Movement (`#movement`) — pinned; camera travels escapement → barrel → rotor with 3 text chapters.
6. Configure (`#configure`) — finish + dial picker, live material swap, price odometer, add to bag.
7. Numbers (`#numbers`) — odometer counters.
8. Editions (`#editions`) — pinned horizontal gallery of 3 editions → product page.
9. Reserve (`#reserve`) — hold-to-reserve.
10. Footer — giant wordmark reveal, newsletter (honest: nothing is sent), credits.
11. `product.html` — sticky 3D turntable (drag), view presets, configurator, specs accordion, next edition.

**Motion narrative.** Entrances rise from a mask (words) or iris open (circles). Scroll scrubs only where the
story is spatial (manifesto highlight, exploded view, movement dive, horizontal editions, wordmark). UI
feedback is CSS and short (≤ 240 ms). One smooth-scroll engine: **Lenis**, wired to GSAP ScrollTrigger.

**Three.js decision.** Justified: the product *is* a 3D mechanism, and disassembly is the story. One
renderer, one canvas per page, one responsibility (the watch). Posters rendered from the same model
replace it under reduced motion, WebGL failure, or no JS.

**Asset provenance.** Every image of the watch is rendered from the site's own Three.js model
(`scripts/render-posters.mjs` → `public/media/`). No stock photos, no people, no logos, no generated people.
Icons: Solar by 480 Design (CC BY 4.0) via Iconify, extracted to `src/ui/icons.js`. Fonts: OFL via Fontsource.

## 2. Motion rules (non-negotiable)

- Curves: `--ease-out: cubic-bezier(0.23, 1, 0.32, 1)`, `--ease-in-out: cubic-bezier(0.77, 0, 0.175, 1)`,
  `--ease-drawer: cubic-bezier(0.32, 0.72, 0, 1)`. In GSAP use `EASE.out`, `EASE.inOut`, `EASE.drawer` from
  `src/core/motion.js` (CustomEase with the exact same curves). Never `ease-in` on UI. `linear` for scrubbed
  progress and constant motion only.
- Durations: press 100–160 ms, hover 200 ms, UI ≤ 240 ms, drawers/menus 300–450 ms, marketing reveals may be
  longer (0.8–1.4 s).
- Only `transform`, `opacity`, `clip-path` (and `filter` sparingly). Never `transition: all`. Never `scale(0)`.
- Hover motion only inside `@media (hover: hover) and (pointer: fine)`.
- `prefers-reduced-motion: reduce` → no Lenis, no pinning, no scrubbing, no WebGL; render final states
  immediately (opacity fades ≤ 200 ms allowed). `env.reducedMotion` is the JS source of truth.
- Word reveals use `splitWords()` from `src/core/split.js` (keeps an unsplit accessible copy, never splits
  links). Stagger 30–80 ms.
- Never let two systems animate the same property of the same element.
- Every module returns a `destroy()` that kills its tweens, ScrollTriggers, observers and listeners.

## 3. Build contract

### Ownership (one owner per file — do not edit files you do not own)

| Owner | Files |
|---|---|
| Lead (integration) | `index.html` `<head>`, nav, footer, dialogs; `product.html` `<head>`, nav, footer, dialogs; `src/main.js`, `src/product-main.js`, `src/core/*`, `src/data/*`, `src/ui/icons.js`, `src/styles/{tokens,base}.css`, `vite.config.js`, `package.json`, `scripts/*` |
| 3D | `src/three/**` |
| UI · chrome | `src/ui/{buttons,cursor,nav,chapter-dial,footer,newsletter,toast}.js`, `src/styles/ui-chrome.css` (nav, menu, buttons, links, cursor, chapter dial, footer, newsletter, toast) |
| UI · commerce | `src/ui/{preloader,transition,cart,hold,odometer,configurator}.js`, `src/styles/ui-commerce.css` (preloader, curtain, bag drawer, config chips, hold button, odometer) |
| Story | `src/sections/{index,director,hero,manifesto,anatomy,movement}.js`, `src/styles/sections-story.css`, the hero / manifesto / anatomy / movement `<section>`s of `index.html` |
| Shop | `src/sections/{state,configure,numbers,editions,reserve}.js`, `src/styles/sections-shop.css`, the configure / numbers / editions / reserve `<section>`s of `index.html` |
| Product | `src/pages/**`, `src/styles/product.css`, the `<main>` of `product.html` |

`index.html` is shared by Story and Shop: edit only inside your own `<section>` elements; if an edit fails
because the file changed, re-read it and retry.

Need a change in a file you don't own? Don't make it — list it under "Requests for the lead" in your report.

### Shared modules (lead)

```js
// src/core/env.js
env.reducedMotion   // boolean, prefers-reduced-motion at boot (page reloads on change)
env.finePointer     // (hover: hover) and (pointer: fine)
env.webgl           // WebGL2 available
env.tier            // 'high' | 'low' (small screens, few cores, low memory, save-data)
env.mobile          // max-width: 767px at boot (use matchMedia live where layout depends on it)

// src/core/motion.js
gsap, ScrollTrigger                         // exported (CustomEase registered)
EASE = { out, inOut, drawer }                 // CustomEase names
initSmoothScroll() → { lenis|null, destroy }  // null under reduced motion
getLenis(), scrollToTarget(target, { offset, immediate }), lockScroll(), unlockScroll()
onReducedMotionChange(cb) → unsubscribe

// src/core/split.js
splitWords(el, { mask = true }) → { el, words: HTMLElement[] /* .w-i inner spans */, revert() } | null
// returns null (and leaves el untouched) if el contains links, buttons or form controls.

// src/data/catalog.js
FINISHES, DIALS, EDITIONS
findFinish(id), findDial(id), findEdition(id), editionFor(finish, dial), priceOf(finish, dial),
formatPrice(n), posterFor(finish, dial), productHref({ finish, dial }), DEFAULT_CONFIG
```

### 3D (`src/three/stage.js`)

```js
createStage({ canvas, tier = 'high', time = 'live' }) → Stage   // throws if WebGL context can't be created
Stage.ready: Promise<void>              // geometry built, env map ready, shaders compiled
Stage.setPose(pose: Partial<Pose>, { immediate = false })   // target; the stage damps toward it
Stage.getPose(): Pose                   // current damped pose
Stage.setConfig({ finish, dial }, { immediate = false })    // animated material change (~600 ms)
Stage.setPointer(nx, ny)                // -1..1, subtle tilt; (0,0) on leave/blur/touch
Stage.enableDrag(el) → disable()        // turntable drag with inertia (product page)
Stage.project(anchorId) → { x, y, visible }   // CSS px relative to the canvas box
Stage.onFrame(cb) → unsubscribe         // after each rendered frame
Stage.snapshot({ pose, finish, dial, width, height, type = 'image/webp', quality = 0.9, time = { h: 10, m: 10, s: 32 } }) → Promise<Blob>
Stage.start(), Stage.stop(), Stage.resize(), Stage.dispose()
Stage.onContextLost(cb)                 // the lead swaps in posters
```

`Pose` is all-numeric so it can be interpolated (`lerpPose(a, b, t)` from `src/three/poses.js`):

| Field | Meaning |
|---|---|
| `x`, `y` | where the watch's pivot sits on screen, normalised device coords (-1..1, y up) of the **canvas box** |
| `size` | case diameter as a fraction of `min(canvasWidth, canvasHeight)` |
| `ox`, `oy` | pivot in watch-local units (case radius = 1); use to centre a point of the movement when zoomed |
| `rx`, `ry`, `rz` | watch rotation in radians (0,0,0 = dial facing the camera, 12 o'clock up) |
| `explode` | 0..1 layer separation (crystal, bezel, hands, dial, movement, case, caseback) |
| `movement` | 0..1 hide everything except the movement (for the dive) |
| `strap` | 0..1 strap presence |
| `spin` | radians/second of continuous yaw (turntable) |
| `visibility` | 0..1 whole-watch presence; at 0 the stage skips rendering entirely |

Named poses live in `POSES` (`src/three/poses.js`) and are tuned by the 3D owner: `hero`, `heroMobile`,
`manifesto`, `anatomyStart`, `anatomyEnd`, `movementEscapement`, `movementBarrel`, `movementRotor`,
`configure`, `configureMobile`, `hidden`, `reserve`, `productFront`, `productProfile`, `productBack`,
`productExploded`, plus poster poses `posterHero`, `posterExploded`, `posterMovement`, `posterConfig`.

Anchors for `project()`: `crystal`, `bezel`, `hands`, `dial`, `movement`, `case`, `caseback` (a point on each
layer's rim on the side facing +X), and `escapement`, `barrel`, `rotor`.

### UI (`src/ui/*`)

```js
initButtons(root = document) → destroy      // .btn magnetic + directional fill; .link underline is CSS
initCursor() → destroy                       // fine pointer only; [data-cursor="view|drag|hold"] labels
createPreloader({ short }) → { setProgress(0..1), finish(): Promise<void>, destroy }   // not used when html.is-arriving
initNav({ cart }) → destroy                  // hide on scroll down / show on up, mobile menu dialog #menu,
                                             // bag count + open, and same-page #hash links (scrollToTarget + focus target)
initCart() → cart                            // { add(item), remove(id), setQty(id, n), items(), count(), subtotal(), open(), close(), subscribe(cb), destroy }
initHoldButtons(root = document) → destroy   // [data-hold] dispatches 'hold:complete' on the button
createOdometer(el, { value, format }) → { set(value, { immediate }), destroy }
createConfigurator(form, { initial, onChange }) → { get(), set(config, { silent }), destroy }
initPageTransitions() → { reveal(): Promise<void>, destroy }   // iris curtain for same-origin page links;
                                             // reveal() opens the curtain when html.is-arriving, else resolves at once
initChapterDial() → destroy                  // fixed mini dial, reads [data-chapter] sections (index only)
initFooterReveal(root = document) → destroy  // giant wordmark reveal
initNewsletter(root = document) → destroy    // [data-newsletter] validation + honest success ("nothing was sent")
toast(message, { tone })                     // writes into [data-toast-region] (role=status)
```

Boot order (lead, `src/core/boot.js`): Lenis → cart → transitions → buttons, cursor, nav, hold, footer,
newsletter, chapter dial → stage (`loadStage`) → fonts → `initSections` / `initProductPage` →
`preloader.finish()` or `transitions.reveal()` → `playIntro()`. Lenis is stopped until the intro starts.

Cart item: `{ id, finish, dial, edition|null, reserved: boolean, number|null, qty }`.
`id = finish-dial(-reserved)`. Stored in `localStorage['oriel:bag']` (wrapped in try/catch).

Also exported from `src/three/poses.js`: `LAYER_ORDER` (the 7 layer ids, crystal → caseback) and
`layerReveal(explode, id) → 0..1`, how far a given layer has separated at a given `explode` value (layers
separate in sequence, crystal first), so labels can appear in step with their layer.

### Sections (`src/sections/*`)

```js
// Story (index.js is the entry)
initSections({ stage, cart }) → { playIntro(): gsap.core.Timeline, destroy }   // stage may be null

// Shop (called by index.js)
configState                     // src/sections/state.js: { get(), set(config), subscribe(cb) → unsubscribe }
initConfigure({ stage, cart }) → destroy   // configurator form, stage.setConfig, poster swap, add to bag
initNumbers() → destroy                    // odometers count up once on enter
initEditions() → destroy                   // pinned horizontal gallery (native scroll-snap on touch / reduced motion)
initReserve({ cart }) → destroy            // hold:complete → reserved item in bag
```

`director.js` (Story) owns every `stage.setPose()` call on the index page: it reads section ScrollTriggers
and interpolates between `POSES`, including the poses for configure and reserve. Nothing else on the
index page sets poses (hero may call `setPointer`; configure calls `setConfig`).

### Product (`src/pages/product.js`)

```js
initProductPage({ stage, cart }) → { playIntro(), destroy }   // stage may be null
```

## 4. Markup conventions

- `html.no-js` → `html.js` (inline head script). `html.is-arriving` when a page transition is landing.
  `html.is-returning` after the first page view of the session. `html.has-webgl` once the stage is live.
  `html.is-loading` while the preloader runs.
- Every section: `<section id="…" data-chapter="Name" aria-labelledby="…-title">`.
- Posters (`<img class="… __poster">`) are visible by default and hidden by `.has-webgl`.
- Buttons: `.btn.btn--primary|--ghost|--icon[.btn--sm]` with `<span class="btn__label" data-text="…">`.
  Links: `.link` (animated underline).
- Chapter marks: `<p class="mark"><span class="mark__num">§ 02</span><span class="mark__name">Anatomy</span></p>`.

