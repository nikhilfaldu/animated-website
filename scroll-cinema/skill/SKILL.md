---
name: scroll-cinema
description: "When the user wants to build a scroll-driven cinematic website or landing page — a fullscreen background video that scrubs forward and backward with scroll, a 3D hero object (e.g. a Blender model), large typography overlays, and/or content panels anchored to objects in the footage, with Apple/Stripe-grade motion. Also use when the user mentions 'scroll scrub,' 'scroll-driven video,' 'video background synced to scroll,' 'play video on scroll forward and reverse,' 'pin video to scroll,' '3D hero,' 'Three.js hero,' 'GSAP ScrollTrigger,' 'Lenis smooth scroll,' 'cinematic landing page,' 'Apple-style landing page,' 'Stripe-style landing page,' 'scroll-linked animation,' 'scrollytelling,' 'content blends with the background,' 'content beside the tree/object in the video,' 'anchored callouts,' 'floating panel next to a plant/product,' 'background video keeps going black,' 'scroll video stutters,' or 'make my site play a video as I scroll.' Use this for the WHOLE build: discovery interview, asset pipeline (Blender GLB export + all-intra video transcode), implementation, spatial content anchoring, and browser verification. For plain video production see video; for marketing copy see copywriting; for conversion optimization see cro; for product positioning see product-marketing."
metadata:
  version: 1.1.0
---

# Scroll Cinema

You are a build engineer for scroll-driven cinematic web experiences. You produce a page where the **entire scroll position is the timeline**: a fullscreen film scrubs forward when the user scrolls down and reverses when they scroll up, a 3D object stays framed and choreographed to the same clock, and large typography overlays carry the story.

The single most important thing in this skill is the **video pipeline**. Nearly every attempt to "just use a video with `currentTime`" fails with a black or stuttering background, and no amount of CSS/JS fixes it — the footage must be re-encoded. **Read §4 and §8 before writing any code.** This is what makes it work the first time.

**This skill is written to be executed by any model, small or large.** Follow it literally. Do not improvise the video pipeline or skip the verification step.

---

## 0. Non-negotiables (read first, obey always)

These are the rules that prevent the failure modes that actually happen in production:

1. **The video must be ALL-INTRA.** Re-encode so every frame is a keyframe (`gopsize = 1`) and cap resolution at **720p**. A 4K long-GOP H.264 file cannot be scrubbed — every seek re-decodes from the previous keyframe, taking ~0.5–1.3 s, during which the element renders **black**. This is THE bug. See §8.
2. **Scroll owns the video's `currentTime`. Never call `play()`.** Set `currentTime = progress × duration` from a ScrollTrigger. No `autoplay`, no `loop`, no native playback. Native playback is what makes the film "play quickly, end, go black, and repeat."
3. **Render the film to a `<canvas>`, not the bare `<video>`.** The `<video>` is only the decoder. The canvas draws the current frame every rAF and **holds the last good frame** when a seek has no decoded data (`readyState < 2`). This makes the background black-proof across browsers/GPUs.
4. **The 3D object lives in a fixed layer**, never inside a scrolling section — otherwise it scrolls away. Give that layer `pointer-events: none` and drive orbit by mouse position + scroll.
5. **Map the whole page to the whole video**: `currentTime = pageProgress × duration`, ScrollTrigger `start: "top top", end: "bottom bottom"`. So the film length equals the scroll length.
6. **Cache-bust and self-identify.** Put `?v=N` on the CSS/JS links and a visible **build badge** in the HUD. When the user says "still broken," the badge instantly reveals whether they are on a stale copy.
7. **Verify in a real browser before declaring done** (§9). Instrument `play()`/`loop`/`currentTime` and sample the canvas luminance. "Looks fine to me" is not verification.
8. **Vendor the libraries locally.** Install GSAP, Three.js, and Lenis once via npm and copy the runtime files into `assets/vendor/`; the finished page must load them from disk with **no runtime CDN**. Commit `assets/vendor/`, gitignore `node_modules/`. See §8e.

---

## 1. Before starting

If `.agents/product-marketing.md` exists, read it first and don't re-ask what it covers.

Then run the **Discovery Interview** (§2). You cannot build this skill's output without answers to the questions in §2 — the whole point is that the design is the user's, not yours. Ask, then confirm the spec back.

---

## 2. Discovery interview — ask everything, assume nothing

Ask these as a grouped set (use the `question` tool where available). Do not start building until you have answers or explicit "you decide" defaults. Offer defaults for every item so the user can move fast.

### A. Intent
- What is the page for, and who is it for? One-sentence promise?
- What is the desired feeling? (Apple-calm, Stripe-technical, luxury, kinetic, editorial…)
- Reference sites or brands to echo? Anything to avoid?

### B. Objects (3D)
- Is there a **3D object**? If yes, where is it — a `.blend` path, a `.glb`/`.gltf`, or "make one"?
- If a `.blend`: **which object name inside it** is the hero? (List the objects and ask, don't guess.)
- Interaction: scroll-spin only, mouse parallax, drag-orbit, or all three?
- Should it stay centered the whole scroll, or travel between sections? Scale changes?
- Fallback if WebGL unavailable or the vendored Three.js files are missing? (Default: procedural placeholder + copy stays readable.)

### C. Background
- Is there a **background video**? Exact file path. Is it meant to **scrub with scroll**, or loop ambiently?
- If images instead: list, and how they cross-fade or move on scroll.
- Poster/still for first paint and reduced-motion (default: extract a frame from the video).
- Grain, vignette, scrim: on/off and intensity (default: subtle grain + gradient scrim).

### D. Transitions & motion
- How should **sections transition**? (fade/slide between full-screen "beats," pinned scenes, morphing, parallax depth.)
- How many "acts"/"beats"? What happens in each?
- Motion intensity: subtle / medium / cinematic. Easing feel (ease-out, sine, power).
- Scrub smoothing amount (`scrub: 1` is a good default).
- Reduced-motion behaviour (default: static poster, no scrub, all copy readable).

### E. Colors
- Brand palette (hex). Primary/secondary/accent. Ink and cream values if known.
- Dark or light base? Gradient scrim colors for the film?
- Card/surface treatment (solid, glass/blur, none).

### F. Fonts & typography
- Font families (system stack or specific webfonts). Weights available.
- The **large typography overlays** — exact headlines per scene/section, and which words get the gradient/accent.
- Type scale feel (huge display vs restrained). Letter-spacing preference.

### G. Layout & content
- Section list in order (e.g. hero → film beats → craft/specs → metrics → testimonial → pricing → CTA → footer).
- For each section: heading, subcopy, CTA label + link, any metrics/stats.
- Layout system: max-width, cards vs full-bleed, grid columns.
- Header/nav items and the primary CTA.

### H. Technical constraints
- Static hosting? (This skill still ships plain HTML/CSS/JS with **no runtime CDN** — libraries are vendored locally.)
- Node/npm available to install the libraries once? (Default: yes — see §8e.)
- Exact version pins to use, or "latest stable"? (Default: `gsap@3`, `three@0.160.0`, `lenis@1.1.14`.)
- Target browsers/devices, and any performance budget.
- Can you run a headless browser locally for verification? (Strongly recommended.)

### I. Deliverable layout
- Repo root, asset folders (e.g. `assets/media/…`, `assets/Objects/…`), `index.html`.

### J. Content anchoring (only if the user wants content to blend with the film)
Ask this whenever the user wants content to feel like it lives in the footage
("show the plant's details beside the tree as the camera reaches it"). See
`references/anchoring.md` for the full method.
- Which pieces of content should be **anchored** to the film (product cards, plant
  specs, prices, stats, callouts), and to **what in the shot**?
- **Does the camera move relative to that subject during its moment** — still
  (Level 1), panning/tracking (Level 2), or do you want real depth/occlusion
  (Level 3)? Default: **Level 1**.
- Should anchored panels **tone-match** the footage behind them (sample + tint)?
  Default: yes, plus matching grain/grade.
- Should the content change on **scene cuts**? (Can auto-detect cuts.)
- Fallback: anchored content must also exist as readable DOM for no-JS /
  reduced-motion (default: yes).

**Then write the answers into a short spec** (use `references/build-spec.md`) and read it back to the user before coding.

---

## 3. Architecture (the proven stack)

```
<body>
  .film-bg            position:fixed; z-index:0     <- FULLSCREEN film
    video#scrubVideo    decoder only (blob-preloaded)
    canvas#filmCanvas   what you SEE (holds last frame)
    .film-bg__scrim     gradient darkening
    .film-bg__grain     subtle noise
  .stage3d            position:fixed; z-index:1; pointer-events:none  <- 3D hero
    canvas#hero3d       three.js render target
  .anchor-stage       position:fixed; z-index:2; pointer-events:none  <- anchored content
    .anchor-panel          pinned to video-frame (u,v); auto pointer-events
  .film-hud           fixed HUD: build badge, act label, timecode
  .film-progress      fixed bottom bar
  header.site-header  fixed, frosted
  main                position:relative; z-index:3   <- all scrolling content
    section.hero        (transparent; film shows through)
    section.beats       full-screen typography overlays, one per scene
    section.craft
    section.metrics
    section.pricing
</body>
```

- **Libraries vendored locally** under `assets/vendor/` (installed once via npm, then copied in): GSAP + ScrollTrigger, Lenis, Three.js (`build/` + the `examples/jsm/` addons used). **No CDN at runtime.** See §8e and `references/vendoring.md`.
- **No build step.** Plain HTML/CSS/JS. `assets/js/main.js` is a classic script that dynamically `import()`s Three.js from the local `importmap`.
- **Content sections are transparent veils** (translucent dark gradients) so the fixed film stays visible behind them.
- Full boilerplate: `references/code-templates.md`.

---

## 4. Scroll engine (the core mechanic)

One shared progress value drives everything so film + object stay in sync and reverse cleanly:

```js
ScrollTrigger.create({
  trigger: document.body,
  start: "top top",
  end: "bottom bottom",
  scrub: 1,
  onUpdate: function (self) {
    target = self.progress * duration;   // video seek target
    scrollState.progress = self.progress; // shared clock for the 3D stage + HUD
    paintHud(target, duration, self.progress);
    kickSeek();
  }
});
```

Rules:
- **`currentTime = progress × duration`** — page top is frame 0, page bottom is the last frame. This is what "sync video length to scroll length" means.
- Seeks must be **guarded**: only assign `currentTime` when `video.readyState >= 2 && !video.seeking`. Scroll writes a *target*; a rAF loop applies it. Unguarded seeks cause black flashes and can wedge the decoder.
- **Never** `video.play()`, `video.loop = true`, or `autoplay`. If a fallback path exists, it must **refuse to run once the scrub is built** (guard on a `scrubBuilt` flag) and must stand down on a timeout if metadata already arrived.
- Blob-preload the film once (fetch → Blob → `URL.createObjectURL`) so seeks hit memory, not the network. Show `LOADING FILM · n%` in the HUD while it downloads.

---

## 5. Black-proof canvas renderer

Draw the video to a canvas every frame; if there is no decoded frame yet, **do not draw** (keep the previous one):

```js
var drawFilm = function () {
  requestAnimationFrame(drawFilm);
  if (video.readyState >= 2 && video.videoWidth) {
    var s = Math.max(canvas.width / video.videoWidth, canvas.height / video.videoHeight);
    var dw = video.videoWidth * s, dh = video.videoHeight * s;
    ctx.drawImage(video, (canvas.width - dw) / 2, (canvas.height - dh) / 2, dw, dh);
  }
  // else: hold the last frame — never paint black
};
```

- Size the canvas to `innerWidth/innerHeight × min(devicePixelRatio, 1.5)`; re-size on `resize`.
- Leave the canvas **transparent until the first draw** so the CSS poster (`background-image` on `.film-bg`) shows on first paint.
- Because the canvas is opaque once drawing, it also covers any black the `<video>` would paint.

---

## 6. 3D hero stage (Three.js)

- Import via importmap; `WebGLRenderer({canvas, alpha:true})`, `ACESFilmicToneMapping`, `SRGBColorSpace`.
- Light with `RoomEnvironment` via `PMREMGenerator` + a directional key/rim/fill trio (mirror a studio rig).
- **`fitObject()`**: compute `Box3`, recenter to origin, scale so max dimension ≈ a fixed size. Do this so any model from any .blend is framed correctly without hand-tuning.
- Fixed stage + `pointer-events:none` → orbit is **mouse parallax** (`camera.position` lerps toward mouse) plus **scroll-linked rotation** from `scrollState.progress`.
- Choreography: anchor each act to its section's real page position and tween a plain state object (`{x,y,s,tilt,spin,roll,cx,cy,cz}`) with a scrubbed GSAP timeline; the rAF tick reads that state. Compute anchors as `sectionTop / (scrollHeight - innerHeight)` percentages and ensure each is at least slightly greater than the previous.
- Fade side-travel out on narrow screens (`Math.min(1, innerWidth/1100)`) so the object never slides off-canvas.
- Fallback: procedural mesh if `assets/Objects/hero.glb` or the vendored Three.js fails; still render readable copy if WebGL fails.

---

## 7. Typography overlays & premium layout

- Full-screen "beats" over the fixed film: each `min-height: ~88svh`, centered, big display type (`clamp(2.4rem, 7vw, 5.4rem)`), optional per-word reveal (manual split into `<span class="w">`, stagger + `rotateX` — no paid SplitText needed).
- Hero: gradient-clipped display type, a lede, two CTAs, a specs line.
- Sections: translucent dark veils; glass cards for content; KPIs, chart, pricing, CTA, footer as specified in the interview.
- Respect `prefers-reduced-motion`: disable Lenis smoothing, scrub, 3D motion; show a static poster; leave all copy readable.
- Accessibility: skip link, focus-visible, `aria-hidden` on decorative layers, real semantic headings.

---

## 7.5 Spatial content anchoring (content that blends with the film)

Optional, but this is what makes content feel like it **lives in the scene** —
a plant's details float beside the tree; a price tag sits next to the product.
Full method + code: `references/anchoring.md`. Summary:

- Anchors are **normalized coordinates inside the video frame** (`u`,`v` = 0..1),
  not screen coordinates. They live in a fixed `.anchor-stage` above `.stage3d`.
- Because the film is `object-fit: cover`, place panels with the **cover-inverse
  transform** (`s = max(CW/VW, CH/VH)`, then offset by the crop) so a panel stays
  glued to its subject across window sizes; hide it when the anchor leaves the
  visible crop.
- **Level 1 (default):** one `{t,u,v}` per panel + a scroll reveal window. Works
  when the subject is roughly still during its beat.
- **Level 2:** a `{t,u,v}` **track** sampled over scroll, interpolated — for
  panning/tracking shots.
- **Level 3:** matte or depth layers so content can be **occluded** by foreground
  (foliage) and gain true parallax. Heavier asset prep.
- Ship a **hotspot picker** behind `?anchors=1` (click the film to log `{t,u,v}`)
  so authoring is minutes, not guesswork.
- **Blend polish (always):** tone-match panels to the footage behind them, reuse
  the film's grain + per-act grade, use glass `backdrop-filter`, and ease panels
  along the camera's motion. Matching grain is the biggest tell.
- Anchored copy must also exist as readable DOM for no-JS / reduced-motion.

---

## 8. Asset pipeline (do this exactly)

Full scripts: `references/asset-pipeline.md`. Summary:

**8a. GLB export from Blender (headless).**
```python
obj = bpy.data.objects["<HeroObjectName>"]
bpy.ops.object.select_all(action='DESELECT'); obj.select_set(True)
bpy.context.view_layer.objects.active = obj
bpy.ops.export_scene.gltf(filepath="assets/Objects/hero.glb", export_format='GLB',
                          use_selection=True, export_apply=True, export_yup=True, export_materials='EXPORT')
```

**8b. All-intra 720p transcode (the critical step).** Blender's FFmpeg encoder, keyframe every frame:
```python
clip = bpy.data.movieclips.load(src)                 # MovieClip, NOT a path string
strip = sc.sequence_editor_create().strips.new_clip("film", clip, 1, 1)
r = sc.render; r.resolution_x, r.resolution_y = 1280, 720
r.image_settings.media_type = "VIDEO"                # REQUIRED before FFMPEG (Blender 4.5+/5.x)
r.image_settings.file_format = "FFMPEG"
r.ffmpeg.format = "MPEG4"; r.ffmpeg.codec = "H264"
r.ffmpeg.gopsize = 1                                 # <-- keyframe EVERY frame = instant seeks
r.ffmpeg.constant_rate_factor = "MEDIUM"; r.ffmpeg.ffmpeg_preset = "GOOD"
r.ffmpeg.audio_codec = "NONE"; r.filepath = "assets/media/scrub-film"
bpy.ops.render.render(animation=True)
```
Then rename the produced `scrub-film0001-NNNN.mp4` → `scrub-film.mp4`.

**8c. Poster.** Render one representative frame to `assets/media/scrub-poster.jpg` (720p, q~80) and use it as both `poster=` on the video and `background-image` on `.film-bg`.

**8d. Verify the footage is not itself black** before blaming code — sample frames' luminance (see `references/verification.md`).

**8e. Vendor the JS libraries locally (no runtime CDN).** Install once, copy the runtime files into `assets/vendor/`, and point the HTML at them. Full script + notes: `references/vendoring.md`.
```bash
npm install gsap@3 three@0.160.0 lenis@1.1.14 --no-audit --no-fund
node scripts/vendor-libs.mjs        # copies into assets/vendor/ (see references/vendoring.md)
```
Resulting layout the HTML must reference:
```
assets/vendor/gsap/gsap.min.js
assets/vendor/gsap/ScrollTrigger.min.js
assets/vendor/lenis/lenis.min.js
assets/vendor/three/build/three.module.js
assets/vendor/three/examples/jsm/{loaders/GLTFLoader.js,environments/RoomEnvironment.js,utils/BufferGeometryUtils.js}
```
`node_modules/` is gitignored; `assets/vendor/` is committed. If the browser reports a missing module, copy that file too, preserving its path under `assets/vendor/three/examples/jsm/`.

---

## 9. Verification (required before "done")

Run a headless browser (Chrome/Edge + `puppeteer-core`) against a local static server. Full script: `references/verification.md`. Assertions:

1. **Scrub tracks scroll:** `currentTime` increases monotonically with `scrollY`, roughly `scrollY / maxScroll × duration`.
2. **Fast seeks:** each `seeking → seeked` gap is small (all-intra: typically < 50 ms).
3. **No native playback:** instrumented `play()` calls == 0 and `loop == false` throughout.
4. **Black-proof:** sample `filmCanvas` pixel luminance after each scroll step — worst value must be well above black (> ~0.1 for a lit film); **zero near-black frames**.
5. **No page errors**; the build badge reads the expected version.

Clean up test tooling afterwards (remove the test file, uninstall `puppeteer-core`).

---

## 10. Failure modes — symptom → cause → fix

| Symptom | Cause | Fix |
|---|---|---|
| Background is just black | Video not loading (bad src, `crossorigin` on a non-CORS server) or nothing drawn | Remove `crossorigin`; verify src serves 200; ensure poster shows initially |
| Black flashes; video "plays then black, repeating" | 4K **long-GOP** seeking (~1 s per seek, `readyState` drops to 1) | **Re-encode all-intra 720p, `gopsize = 1`** (§8b) |
| Video plays/loops **on its own** | `autoplay`/`loop`/`play()` ran (usually a fallback) | Scroll owns `currentTime`; never play(); guard fallback behind `scrubBuilt` |
| Brief black between frames in **some** browsers | Bare `<video>` paints blank mid-seek | Canvas renderer that **holds the last frame** (§5) |
| 3D object scrolls away / not centered | Canvas sits inside a scrolling section | Move it to a `position:fixed` `.stage3d`; keep it centered all scroll |
| Object blocks clicks on content | Fixed canvas captures pointer | `pointer-events:none` on the stage; orbit via mouse parallax |
| "Still broken after your fix" | Browser served **stale** cached HTML/JS | `?v=N` on CSS/JS + **visible build badge**; hard refresh / incognito |
| Video ends before/after page scroll | Mapping not page-wide | `currentTime = progress × duration`, `end: "bottom bottom"` |
| Blender: `enum "FFMPEG" not found` | Dynamic enum gated behind media type | `render.image_settings.media_type = "VIDEO"` first |
| Blender: `new_clip expected a MovieClip type, not str` | Passed a path | `bpy.data.movieclips.load(path)` then pass the clip object |
| Blender: `.blend` exports whole scene | No selection | `use_selection=True` + set the active object |
| `sed.sequences` / `sequences_all` missing | API renamed (Blender 5.x) | Discover at runtime: `dir(scene.sequence_editor)`; use `strips.new_clip` |

---

## 11. Build checklist

- [ ] Discovery interview complete; spec written and confirmed (`references/build-spec.md`)
- [ ] Assets inventoried; hero object name confirmed from the `.blend`
- [ ] GLB exported; all-intra 720p film transcoded; poster extracted
- [ ] Footage luminance checked (not black)
- [ ] Libraries vendored to `assets/vendor/` (§8e); `index.html` points at local files, **no CDN**; `?v=N`
- [ ] Fixed `.film-bg` (video + canvas + scrim + grain) and fixed `.stage3d`
- [ ] Scroll engine maps page progress → `currentTime`; guarded seeks; **no play/loop**
- [ ] Canvas film renderer holds last frame
- [ ] 3D stage: fitObject, IBL + lights, mouse parallax + scroll rotation, responsive guard, fallbacks
- [ ] Beats/typography overlays and all sections from the spec
- [ ] If anchoring requested (§7.5): `.anchor-stage`, cover-inverse placement, reveal windows, picker, tone/grain match, readable fallback
- [ ] `prefers-reduced-motion` path
- [ ] Visible build badge
- [ ] Headless verification passes (5 assertions in §9)
- [ ] Test tooling removed; build/README notes updated

---

## Related skills
- **video** — for producing the source footage itself
- **copywriting** — for the headlines, ledes, and CTAs that become the overlays
- **cro** — for making the finished page convert
- **product-marketing** — for positioning/ICP context to feed the copy
- **image** — for stills/posters and social previews
