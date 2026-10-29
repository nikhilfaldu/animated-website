# Spatial content anchoring — content that lives in the scene

The default page puts content in scrolling sections *over* the film. Anchoring is
different: panels are pinned to **coordinates inside the video frame**, so a
product card sits beside the tree the camera is on, a price tag floats next to a
plant, etc. As the film scrubs, the anchors stay glued, so the site reads as if
the content lives in the world of the footage.

**The decision fork is camera motion.** Ask it before choosing a level:

> During the beat this panel belongs to, does the subject move in frame?

- Subject roughly still → **Level 1** (a single coordinate holds).
- Camera pans/tracks the subject → **Level 2** (store a track over time).
- You want occlusion/depth (foliage in front of the text) → **Level 3**.

Default to **Level 1**. It delivers the requested experience for well-shot footage
and costs almost nothing. Levels 2–3 are upgrades, not requirements.

Everything here rides on the fixed film layer from the main skill. Anchors are a
**fixed overlay layer** (`.anchor-stage`) above `.stage3d` and below scrolling
content.

---

## Level 1 — Anchored hotspots (default)

Author each panel at a normalized coordinate in the **video frame**:
`u` = 0..1 left→right, `v` = 0..1 top→bottom. Reveal it over a scroll window and
place it on screen every frame with the cover-inverse transform.

### Data (`assets/data/anchors.json`)

```json
{
  "beats": [
    { "t": 0.18, "u": 0.66, "v": 0.44, "side": "right",
      "kicker": "In the clearing",
      "title": "Monstera Deliciosa",
      "price": "$38",
      "body": "Bright, indirect light. Water when the top inch dries out." },

    { "t": 0.42, "u": 0.34, "v": 0.58, "side": "left",
      "title": "Fiddle-Leaf Fig", "price": "$64", "body": "Loves a bright corner." }
  ]
}
```

- `t` = scroll progress (0..1) at the **center** of the panel's life; it fades in
  ~0.06 before and out ~0.06 after (window configurable).
- `u,v` are the **anchor point**; `side` positions the card (`left|right|top|bottom`)
  relative to that point with a fixed pixel gap.
- Add `"window": [0.14, 0.24]` to override the fade window explicitly.

### The cover-inverse transform (the only real math)

The film is `object-fit: cover`, so the visible crop depends on the window aspect
ratio. Compute where a video-frame point lands on screen for the current crop:

```js
var film = { VW: 0, VH: 0 };
function coverTransform() {
  var CW = innerWidth, CH = innerHeight;
  var s = Math.max(CW / film.VW, CH / film.VH); // cover scale
  return {
    s: s,
    dw: film.VW * s, dh: film.VH * s,
    ox: (CW - film.VW * s) / 2,
    oy: (CH - film.VH * s) / 2
  };
}
function anchorToScreen(u, v) {
  var c = coverTransform();
  return { x: c.ox + u * c.dw, y: c.oy + v * c.dh };
}
// off-crop test — hide the panel when the anchor leaves the visible crop
function inCrop(u, v) { var c = coverTransform();
  var x = c.ox + u * c.dw, y = c.oy + v * c.dh;
  return x > 8 && x < innerWidth - 8 && y > 8 && y < innerHeight - 8; }
```

Read `film.VW/VH` from the video once metadata is known:
`video.videoWidth`, `video.videoHeight`.

### Per-frame placement + reveal (runs in the rAF loop)

```js
function placeAnchors(progress) {
  var c = coverTransform();
  anchors.forEach(function (a) {
    var el = a.el;
    var p = anchorToScreen(a.u, a.v);
    // hide if anchor is outside the visible crop for this aspect ratio
    if (!inCrop(a.u, a.v)) { el.style.opacity = 0; return; }
    el.style.transform = "translate(-50%,-50%) translate(" + p.x + "px," + p.y + "px)";
    // reveal window around t
    var half = (a.window ? (a.window[1] - a.window[0]) / 2 : 0.06);
    var tt = a.window ? (a.window[0] + a.window[1]) / 2 : a.t;
    var d = Math.abs(progress - tt);
    var o = d >= half ? 0 : 1 - d / half;      // linear fade; ease as desired
    el.style.opacity = o.toFixed(3);
    el.style.pointerEvents = o > 0.6 ? "auto" : "none";
  });
}
```
Call `placeAnchors(scrollState.progress)` from the tick (alongside the 3D stage).
Because it uses CSS `transform`, it stays on the compositor and is cheap.

### Authoring: the hotspot picker (ship it behind a flag)

Guessing `(u,v)` by eye is slow. Add a dev overlay toggled by `?anchors=1`:
hover the film, click to log the coordinate at the current scroll.

```js
if (/[?&]anchors=1/.test(location.search)) {
  var cross = document.createElement("div");
  cross.style.cssText = "position:fixed;z-index:9999;width:18px;height:18px;border:2px solid #0f0;border-radius:50%;transform:translate(-50%,-50%);pointer-events:none";
  addEventListener("pointermove", function (e) {
    cross.style.left = e.clientX + "px"; cross.style.top = e.clientY + "px";
    var c = coverTransform();
    var u = ((e.clientX - c.ox) / c.dw), v = ((e.clientY - c.oy) / c.dh);
    document.title = "u=" + u.toFixed(3) + " v=" + v.toFixed(3) + " t=" + scrollState.progress.toFixed(3);
  });
  document.body.appendChild(cross);
  addEventListener("click", function () {
    var c = coverTransform();
    console.log(JSON.stringify({ t: +scrollState.progress.toFixed(3), u: +((cross.getBoundingClientRect().left - c.ox) / c.dw).toFixed(3), v: +((cross.getBoundingClientRect().top - c.oy) / c.dh).toFixed(3) }));
  });
}
```
Click the subject at a few scroll positions, copy the JSON rows into
`anchors.json`, adjust copy. Minutes per beat.

### Production tip
Direct the footage to the interaction: a slow push-in with the subject held near
center makes Level 1 look flawless. Plan shots for the anchors, not the other way
around.

---

## Level 2 — Tracked anchors (camera moves)

Replace the single `u,v` with a track sampled over scroll, and interpolate.

```json
{ "track": [
    { "t": 0.30, "u": 0.62, "v": 0.42 },
    { "t": 0.34, "u": 0.57, "v": 0.43 },
    { "t": 0.38, "u": 0.52, "v": 0.45 }
  ],
  "side": "right", "title": "Ficus Lyrata", "price": "$64" }
```

```js
function trackAt(track, t) {
  if (t <= track[0].t) return track[0];
  var last = track[track.length - 1];
  if (t >= last.t) return last;
  for (var i = 1; i < track.length; i++) {
    if (t <= track[i].t) {
      var a = track[i - 1], b = track[i];
      var k = (t - a.t) / (b.t - a.t);
      return { u: a.u + (b.u - a.u) * k, v: a.v + (b.v - a.v) * k };
    }
  }
  return last;
}
```

Author the track with the same picker, clicking the object at several scroll
positions; or motion-track it externally (Blender's tracker / After Effects
point tracker → export X/Y per frame → normalize by `videoWidth/Height`).

---

## Level 3 — Depth compositing (content inside the scene)

Content can be **occluded** by foreground and gain true parallax. Two routes:

### 3a. 2.5D matte layers (lighter, CSS/HTML-friendly)
Split the shot into a **background layer** and a **foreground cut-out** (foliage,
frame). Rotoscope in Blender/AE or use an AI matte tool. Stack, all fixed:

```
.film-bg__video     (background plate)
.anchor-stage       (your content)
.film-fg            (foreground cut-out PNG/WebM with alpha, pointer-events:none)
```
The foreground covers the panels → they read as behind the leaves. Animate the
foreground with a tiny scroll parallax for depth.

### 3b. Depth-displaced plane (most convincing, heavier)
Estimate a **depth map** for the clip (monocular depth model), then in the
existing Three.js scene:
- Add a video-textured plane with a parallax/occlusion shader driven by the depth
  map (or a displaced mesh).
- Place panels as **3D sprites/planes at the depth of the subject's pixel**, so
  they move with correct parallax and are occluded by nearer geometry.
- Keep the camera animation scroll-linked exactly like the hero object.

Asset prep is the cost: a depth map per frame (or a single depth clip) plus GPU
budget. Only reach for this when the "text behind the tree" effect is the point.

---

## Blending polish (apply at every level — this is what sells it)

1. **Tonal match.** Sample the film behind each anchor and tint the glass to it,
   so the panel feels lit by the scene. Read from the film canvas:

   ```js
   function tintAt(x, y) {
     var d = fctx.getImageData(x * dpr, y * dpr, 1, 1).data;   // film canvas
     return "rgb(" + d[0] + "," + d[1] + "," + d[2] + ")";
   }
   // set el.style.setProperty("--tint", tintAt(p.x, p.y)) when the beat changes
   ```
   Panel CSS: `background: color-mix(in oklab, rgba(10,14,18,.55), var(--tint) 22%);`
   (recompute only on beat change — not every frame).

2. **Material match.** `backdrop-filter: blur(14px) saturate(1.1)` for glass, a
   1px light edge, soft shadow.

3. **Grain + grade match.** Apply the *same* film grain overlay and per-act
   `filter: brightness()/saturate()` to the panels, so they share the footage's
   texture. **Matching grain is the single biggest tell** between "overlaid" and
   "in the scene."

4. **Motion cue.** Ease panels along the camera's motion — push-in → panel scales
   from 0.96→1; pan → panel slides a few px against the pan. Subtle (≤ 8px).

5. **Scene-cut beats.** Detect cuts in the clip and align chapters to them, so
   content changes exactly when the shot does. Frame-difference scan (Blender):

   ```python
   # render tiny frames every 2 frames, then diff consecutive luminance
   import bpy, numpy as np
   # ... set clip + strip, 48x27, PNG, as in asset-pipeline.md ...
   prev = None
   for f in range(1, dur + 1, 2):
       sc.frame_set(f); sc.render.filepath = out + "/f%04d" % f
       bpy.ops.render.render(write_still=True)
       img = bpy.data.images.load(out + "/f%04d.png" % f)
       px = np.array(img.pixels[:], np.float32).reshape(-1, 4)[:, :3]
       if prev is not None:
           diff = float(np.abs(px - prev).mean())
           if diff > 0.12: print("CUT at t=%.2fs (frame %d) diff=%.3f" % (f / 30, f, diff))
       prev = px; bpy.data.images.remove(img)
   ```
   Cuts become natural section boundaries / beat starts.

---

## Caveats

- **Camera motion is the make-or-break.** Level 1 on a fast-panning shot visibly
  detaches. Check the shot before promising the effect; upgrade to Level 2/3 if
  needed.
- **Aspect ratios.** The inverse transform handles the cover crop, but an anchor
  can fall outside the visible crop on extreme aspect ratios — always keep the
  `inCrop` guard and hide gracefully.
- **Safe margins.** Keep anchors within roughly `u,v ∈ [0.08, 0.92]` so panels and
  their text don't clip off-screen.
- **Performance.** Anchors are `transform`+`opacity` only (compositor-friendly).
  Never read `getImageData` per frame — only on beat changes.
- **Accessibility.** Anchored panels must also exist as readable DOM in a
  reduced-motion / no-JS fallback (e.g., stacked under the corresponding section).
  The film is decoration; the copy must never be the only copy.
