# Code templates (copy-paste, then fill the spec)

Replace `{{TOKENS}}`. Bump `?v=N` and the build badge on every change.

---

## index.html

```html
<!DOCTYPE html>
<html lang="en" class="no-js">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
  <title>{{TITLE}}</title>
  <meta name="description" content="{{DESCRIPTION}}" />
  <meta name="theme-color" content="{{INK}}" />

  <link rel="icon" href="assets/favicon.svg" type="image/svg+xml" />
  <link rel="preload" as="video" href="assets/media/scrub-film.mp4" type="video/mp4" />
  <link rel="stylesheet" href="assets/css/styles.css?v=1" />
  <script>document.documentElement.classList.replace('no-js','js');</script>

  <!-- Libraries vendored locally (installed once, copied into assets/vendor/ — see
       references/vendoring.md). No runtime CDN dependency. -->
  <script src="assets/vendor/gsap/gsap.min.js"></script>
  <script src="assets/vendor/gsap/ScrollTrigger.min.js"></script>
  <script src="assets/vendor/lenis/lenis.min.js"></script>
  <script type="importmap">
  {
    "imports": {
      "three": "./assets/vendor/three/build/three.module.js",
      "three/addons/": "./assets/vendor/three/examples/jsm/"
    }
  }
  </script>
</head>
<body>
  <a class="skip-link" href="#main">Skip to main content</a>

  <!-- FIXED fullscreen film: video = decoder, canvas = what you see -->
  <div class="film-bg" aria-hidden="true">
    <video id="scrubVideo"
      class="film-bg__video"
      src="assets/media/scrub-film.mp4"
      poster="assets/media/scrub-poster.jpg"
      muted playsinline preload="auto" disablepictureinpicture
      disableremoteplayback tabindex="-1"></video>
    <canvas id="filmCanvas" class="film-bg__canvas"></canvas>
    <div class="film-bg__scrim"></div>
    <div class="film-bg__grain"></div>
  </div>

  <!-- FIXED centered 3D stage -->
  <div class="stage3d" aria-hidden="true"><canvas id="hero3d"></canvas></div>

  <!-- FIXED anchored-content stage: panels are pinned to video-frame (u,v) coords
       (see references/anchoring.md). Populated from assets/data/anchors.json. -->
  <div class="anchor-stage" aria-hidden="true"></div>

  <!-- Fixed HUD -->
  <div class="film-hud" aria-hidden="true">
    <span class="hud__rec"><i></i> <span id="buildTag">BUILD 1</span> · ALL-INTRA 720P</span>
    <span class="hud__act" id="hudAct">ACT I</span>
    <span class="hud__time" id="hudTime">00:00 / 00:00</span>
  </div>
  <div class="film-progress" aria-hidden="true"><span id="filmProgress"></span></div>

  <header class="site-header" id="top"> ... nav + CTA ... </header>

  <main id="main">
    <section class="hero"> ... hero copy + CTAs ... </section>

    <section class="scrub" id="film">
      <div class="container">
        <figure class="beat" data-beat> ... beat 1 typography ... </figure>
        <figure class="beat" data-beat> ... beat 2 ... </figure>
        <figure class="beat" data-beat> ... beat 3 ... </figure>
        <figure class="beat" data-beat> ... beat 4 ... </figure>
      </div>
    </section>

    <section class="section" id="craft"> ... </section>
    <section class="section" id="metrics"> ... </section>
    <section class="section" id="pricing"> ... </section>
  </main>

  <script src="assets/js/main.js?v=1" defer></script>
</body>
</html>
```

---

## assets/css/styles.css — the layering (the essential part)

```css
:root{
  --ink:#050607; --cream:#f5f5f7; --accent:#0071e3; --accent-2:#2997ff;
  --header-h:64px; --container:1160px;
  --font-sans:-apple-system,BlinkMacSystemFont,"SF Pro Display","Inter","Segoe UI",Roboto,Helvetica,Arial,sans-serif;
  --ease:cubic-bezier(.22,.61,.36,1);
}
*,*::before,*::after{box-sizing:border-box} *{margin:0}
html{scroll-behavior:auto}
html.lenis,html.lenis body{height:auto}.lenis.lenis-smooth{scroll-behavior:auto!important}
body{font-family:var(--font-sans);color:var(--cream);background:var(--ink);line-height:1.6;-webkit-font-smoothing:antialiased;overflow-x:hidden}
img,video,svg,canvas{display:block;max-width:100%}
a{color:inherit;text-decoration:none} button{font:inherit;color:inherit;background:none;border:0;cursor:pointer}
.container{width:min(100% - 2.5rem,var(--container));margin-inline:auto}
.sr-only{position:absolute;width:1px;height:1px;margin:-1px;overflow:hidden;clip:rect(0 0 0 0);white-space:nowrap;border:0}

/* ---- film layer (z0) ---- */
.film-bg{position:fixed;inset:0;z-index:0;overflow:hidden;
  background:#0a0f14 url("../media/scrub-poster.jpg") center/cover no-repeat}
.film-bg__video{position:absolute;inset:0;width:100%;height:100%;object-fit:cover;object-position:center;background:transparent}
.film-bg__canvas{position:absolute;inset:0;width:100%;height:100%;display:block}
.film-bg__scrim{position:absolute;inset:0;background:
  linear-gradient(180deg,rgba(0,0,0,.5) 0%,rgba(0,0,0,.18) 25%,rgba(0,0,0,.22) 60%,rgba(0,0,0,.55) 100%),
  radial-gradient(90% 70% at 50% 45%,transparent 45%,rgba(0,0,0,.35) 100%)}
.film-bg__grain{position:absolute;inset:0;opacity:.14;mix-blend-mode:overlay;background-image:url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='140' height='140'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='.9' numOctaves='2'/%3E%3C/filter%3E%3Crect width='140' height='140' filter='url(%23n)' opacity='.6'/%3E%3C/svg%3E")}

/* ---- 3D stage (z1) — fixed, centered, click-through ---- */
.stage3d{position:fixed;inset:0;z-index:1;pointer-events:none}
.stage3d canvas{width:100%;height:100%;display:block}

/* ---- anchored content (z2) — pinned to video-frame (u,v) ---- */
.anchor-stage{position:fixed;inset:0;z-index:2;pointer-events:none;overflow:hidden}
.anchor-panel{position:absolute;left:0;top:0;width:min(300px,46vw);opacity:0;
  background:color-mix(in oklab, rgba(10,14,18,.62), var(--tint, #223) 18%);
  border:1px solid rgba(255,255,255,.18);border-radius:16px;padding:1rem 1.1rem;
  backdrop-filter:blur(14px) saturate(1.1);-webkit-backdrop-filter:blur(14px) saturate(1.1);
  box-shadow:0 18px 50px rgba(0,0,0,.45);color:#fff;will-change:transform,opacity}
.anchor-panel h3{margin:.15rem 0 .35rem;font-size:1.15rem}
.anchor-panel__kicker{font-size:.72rem;letter-spacing:.16em;text-transform:uppercase;color:#9ecbff;margin:0}
.anchor-panel__price{font-weight:700;color:#d8f26b;margin:.2rem 0 .4rem}
.anchor-panel p{margin:.2rem 0 0;font-size:.9rem;color:rgba(255,255,255,.82)}
.anchor-picker{position:fixed;z-index:9999;width:18px;height:18px;border:2px solid #0f0;border-radius:50%;transform:translate(-50%,-50%);pointer-events:none}

/* ---- content (z3) ---- */
main{position:relative;z-index:3}

/* HUD + progress */
.film-hud{position:fixed;top:calc(var(--header-h) + 10px);left:0;right:0;z-index:60;
  display:flex;justify-content:space-between;align-items:center;
  width:min(100% - 2.5rem,var(--container));margin-inline:auto;
  font-size:.72rem;letter-spacing:.14em;text-transform:uppercase;color:rgba(255,255,255,.78);pointer-events:none}
.film-progress{position:fixed;left:0;right:0;bottom:0;height:3px;z-index:60;background:rgba(255,255,255,.15)}
.film-progress span{display:block;height:100%;width:100%;transform:scaleX(0);transform-origin:0 50%;background:#fff}

/* header, hero, beats, sections per spec — sections use translucent veils so the film shows through */
.site-header{position:fixed;top:0;left:0;right:0;z-index:100;background:rgba(5,6,7,.6);
  backdrop-filter:saturate(1.6) blur(20px);-webkit-backdrop-filter:saturate(1.6) blur(20px);border-bottom:1px solid rgba(255,255,255,.08)}
.section{position:relative;padding:clamp(4rem,8vw,7rem) 0;background:linear-gradient(180deg,rgba(5,6,7,.38),rgba(5,6,7,.22))}
.beat{min-height:88svh;display:grid;place-items:center;text-align:center;padding:2rem 1.5rem}
.beat__title{font-size:clamp(2.4rem,7vw,5.4rem);font-weight:700;letter-spacing:-.045em;line-height:.98;perspective:700px}
.beat__title .w{display:inline-block;will-change:transform,opacity}

@media (prefers-reduced-motion:reduce){
  html{scroll-behavior:auto}
  *,*::before,*::after{animation-duration:.001ms!important;transition-duration:.001ms!important}
  .beat{min-height:auto;padding:3rem 1.5rem}
}
```

---

## assets/js/main.js — full skeleton

```js
/* Scroll-cinema build. Classic script; Three.js via dynamic import. */
(function () {
  "use strict";
  document.documentElement.dataset.enhanced = "true";

  var BUILD = 1;
  try { console.log("%cScroll-cinema build " + BUILD, "background:#0071e3;color:#fff;padding:2px 6px;border-radius:4px"); } catch (e) {}

  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
  var hasGSAP = typeof window.gsap !== "undefined";
  var hasST = typeof window.ScrollTrigger !== "undefined";
  if (hasGSAP && hasST) gsap.registerPlugin(ScrollTrigger);

  /* ---------- Lenis smooth scroll synced to ScrollTrigger ---------- */
  var lenis = null;
  try {
    if (!reduceMotion.matches && typeof window.Lenis !== "undefined" && hasGSAP && hasST) {
      lenis = new Lenis({ smoothWheel: true, lerp: 0.09 });
      lenis.on("scroll", ScrollTrigger.update);
      gsap.ticker.add(function (t) { lenis.raf(t * 1000); });
      gsap.ticker.lagSmoothing(0);
    }
  } catch (e) { lenis = null; }

  /* ---------- header progress ---------- */
  var headerBar = document.getElementById("scrollProgressBar");
  var setHeaderProgress = function (p) { if (headerBar) headerBar.style.transform = "scaleX(" + p.toFixed(4) + ")"; };

  /* ---------- shared scroll clock ---------- */
  var scrollState = { progress: 0 };

  /* ================= FILM ================= */
  var video = document.getElementById("scrubVideo");
  var filmBar = document.getElementById("filmProgress");
  var hudTime = document.getElementById("hudTime");
  var beats = Array.prototype.slice.call(document.querySelectorAll("[data-beat]"));
  var scrubBuilt = false;
  var filmKick = null;

  var fmtTime = function (s) {
    if (!isFinite(s) || s < 0) s = 0;
    var m = Math.floor(s / 60), sec = Math.floor(s % 60);
    return (m < 10 ? "0" + m : "" + m) + ":" + (sec < 10 ? "0" + sec : "" + sec);
  };
  var paintHud = function (t, d, p) {
    if (hudTime) hudTime.textContent = fmtTime(t) + " / " + fmtTime(d);
    if (filmBar) filmBar.style.transform = "scaleX(" + p.toFixed(4) + ")";
    setHeaderProgress(p);
  };

  /* ---------- black-proof canvas renderer ---------- */
  var filmCanvas = document.getElementById("filmCanvas");
  var fctx = filmCanvas ? filmCanvas.getContext("2d") : null;
  var sizeFilmCanvas = function () {
    if (!filmCanvas) return;
    var dpr = Math.min(window.devicePixelRatio || 1, 1.5);
    var cw = Math.round(window.innerWidth * dpr), ch = Math.round(window.innerHeight * dpr);
    if (filmCanvas.width !== cw || filmCanvas.height !== ch) { filmCanvas.width = cw; filmCanvas.height = ch; }
  };
  var drawFilm = function () {
    requestAnimationFrame(drawFilm);
    if (!fctx || !video) return;
    if (video.readyState >= 2 && video.videoWidth) {
      var cw = filmCanvas.width, ch = filmCanvas.height;
      var s = Math.max(cw / video.videoWidth, ch / video.videoHeight);
      var dw = video.videoWidth * s, dh = video.videoHeight * s;
      try { fctx.drawImage(video, (cw - dw) / 2, (ch - dh) / 2, dw, dh); } catch (e) {}
    }
    // else: hold last frame
  };
  if (filmCanvas && fctx) { sizeFilmCanvas(); window.addEventListener("resize", sizeFilmCanvas); drawFilm(); }

  var initScrub = function () {
    if (!video) return;
    var duration = video.duration || 0;
    if (!isFinite(duration) || duration <= 0) return;

    video.loop = false;                 // scroll owns it — never play/loop
    try { video.pause(); } catch (e) {}
    paintHud(video.currentTime || 0, duration, 0);
    if (reduceMotion.matches || !hasGSAP || !hasST) { paintHud(0, duration, 0); return; }

    var target = 0, rafId = 0;
    var applyTarget = function () {
      rafId = 0;
      if (video.readyState < 2 || video.seeking) { rafId = requestAnimationFrame(applyTarget); return; }
      var t = Math.min(Math.max(target, 0), Math.max(duration - 0.04, 0));
      if (Math.abs((video.currentTime || 0) - t) > 1 / 30) {
        try { video.currentTime = t; } catch (e) { rafId = requestAnimationFrame(applyTarget); return; }
      }
      if (applyTarget._live) rafId = requestAnimationFrame(applyTarget);
    };
    applyTarget._live = false;
    var kick = function () {
      applyTarget._live = true;
      if (!rafId) rafId = requestAnimationFrame(applyTarget);
      clearTimeout(kick._t);
      kick._t = setTimeout(function () { applyTarget._live = false; }, 600);
    };
    filmKick = kick;

    ScrollTrigger.create({
      trigger: document.body, start: "top top", end: "bottom bottom", scrub: 1,
      onUpdate: function (self) {
        target = self.progress * duration;
        scrollState.progress = self.progress;
        paintHud(target, duration, self.progress);
        kick();
      }
    });
    video.addEventListener("seeked", function () { if (applyTarget._live) kick(); });
    video.addEventListener("canplay", function () { kick(); });
    kick();

    /* beats: whole-block fade */
    beats.forEach(function (beat) {
      gsap.fromTo(beat, { autoAlpha: 0, y: 80, scale: .985 }, {
        autoAlpha: 1, y: 0, scale: 1, ease: "none",
        scrollTrigger: { trigger: beat, start: "top 88%", end: "top 42%", scrub: 1 }
      });
    });

    /* beats: per-word reveal (manual split, no SplitText) */
    document.querySelectorAll(".beat__title").forEach(function (t) {
      var lines = t.innerHTML.split(/<br\s*\/?>/i);
      t.innerHTML = lines.map(function (line) {
        return line.split(/(\s+)/).map(function (part) {
          return /^\s*$/.test(part) ? part : '<span class="w">' + part + "</span>";
        }).join("");
      }).join("<br>");
    });
    beats.forEach(function (beat) {
      var words = beat.querySelectorAll(".beat__title .w");
      if (words.length) gsap.fromTo(words, { autoAlpha: 0, y: 46, rotateX: -38 }, {
        autoAlpha: 1, y: 0, rotateX: 0, stagger: .06, ease: "none",
        scrollTrigger: { trigger: beat, start: "top 94%", end: "top 46%", scrub: 1 }
      });
    });

    ScrollTrigger.refresh();
    window.addEventListener("load", function () { ScrollTrigger.refresh(); });
  };

  if (video) {
    video.muted = true; video.playsInline = true;
    var SRC = video.getAttribute("src");
    var warmFilm = function () {
      if (!("fetch" in window) || !SRC || /^blob:/.test(video.src)) return;
      fetch(SRC).then(function (res) {
        if (!res.ok) throw new Error(res.status);
        var total = parseInt(res.headers.get("Content-Length") || "0", 10);
        if (!res.body || !total) return res.blob().then(useBlob);
        var reader = res.body.getReader(), chunks = [], got = 0;
        var pump = function () {
          return reader.read().then(function (rd) {
            if (rd.done) { useBlob(new Blob(chunks, { type: "video/mp4" })); return; }
            chunks.push(rd.value); got += rd.value.length;
            if (hudTime) hudTime.textContent = "LOADING FILM · " + Math.round(got / total * 100) + "%";
            return pump();
          });
        };
        return pump();
      }).catch(function () {});
    };
    var useBlob = function (blob) {
      try {
        var url = URL.createObjectURL(blob), keep = 0;
        try { keep = video.currentTime || 0; } catch (e) {}
        video.src = url;
        video.addEventListener("loadedmetadata", function () {
          video.loop = false;
          try { video.pause(); video.currentTime = keep; } catch (e) {}
          if (filmKick) filmKick();
        }, { once: true });
        try { video.load(); } catch (e) {}
      } catch (e) {}
    };
    var ready = function () { if (scrubBuilt) return; scrubBuilt = true; initScrub(); warmFilm(); };
    if (video.readyState >= 1 && isFinite(video.duration) && video.duration > 0) ready();
    else {
      video.addEventListener("loadedmetadata", ready, { once: true });
      // NOTE: no autoplay/loop fallback — scroll owns the film. If metadata never
      // arrives the poster remains, which is correct.
    }
    try { video.load(); } catch (e) {}
  }

  /* ================= ANCHORED CONTENT (optional; Level 1 default) =================
     Panels pinned to video-frame coords (u,v). Full method: references/anchoring.md.
     Data: assets/data/anchors.json -> { "beats":[{ t,u,v,side,kicker,title,price,body }] }
     For panning shots, give a beat a "track":[{t,u,v}...] and interpolate (Level 2). */
  var anchors = [];
  var film = { VW: 0, VH: 0 };
  var coverTransform = function () {
    var s = Math.max(innerWidth / film.VW, innerHeight / film.VH);
    var dw = film.VW * s, dh = film.VH * s;
    return { dw: dw, dh: dh, ox: (innerWidth - dw) / 2, oy: (innerHeight - dh) / 2 };
  };
  var anchorToScreen = function (u, v) { var c = coverTransform(); return { x: c.ox + u * c.dw, y: c.oy + v * c.dh }; };
  var inCrop = function (u, v) { var p = anchorToScreen(u, v); return p.x > 8 && p.x < innerWidth - 8 && p.y > 8 && p.y < innerHeight - 8; };
  var measureAnchors = function () { anchors.forEach(function (a) { a.w = a.el.offsetWidth; a.h = a.el.offsetHeight; }); };
  var placeAnchors = function () {
    var p = scrollState.progress || 0, gap = 18;
    anchors.forEach(function (a) {
      if (!inCrop(a.u, a.v)) { a.el.style.opacity = 0; a.el.style.pointerEvents = "none"; return; }
      var s = anchorToScreen(a.u, a.v), ox = 0, oy = 0;
      if (a.side === "right") ox = a.w / 2 + gap;
      else if (a.side === "left") ox = -(a.w / 2 + gap);
      else if (a.side === "top") oy = -(a.h / 2 + gap);
      else if (a.side === "bottom") oy = a.h / 2 + gap;
      var half = a.window ? (a.window[1] - a.window[0]) / 2 : .06;
      var tc = a.window ? (a.window[0] + a.window[1]) / 2 : a.t;
      var d = Math.abs(p - tc), o = d >= half ? 0 : 1 - d / half;
      a.el.style.transform = "translate(-50%,-50%) translate(" + (s.x + ox) + "px," + (s.y + oy) + "px)";
      a.el.style.opacity = o.toFixed(3);
      a.el.style.pointerEvents = o > .6 ? "auto" : "none";
    });
  };
  var anchorTick = function () { requestAnimationFrame(anchorTick); if (anchors.length) placeAnchors(); };
  var setFilmDims = function () { if (video && video.videoWidth) { film.VW = video.videoWidth; film.VH = video.videoHeight; } };
  if (video) { if (video.videoWidth) setFilmDims(); else video.addEventListener("loadedmetadata", setFilmDims, { once: true }); }
  fetch("assets/data/anchors.json").then(function (r) { return r.ok ? r.json() : null; }).then(function (d) {
    var stage = document.querySelector(".anchor-stage");
    if (!d || !d.beats || !stage) return;
    d.beats.forEach(function (b) {
      var el = document.createElement("article");
      el.className = "anchor-panel";
      el.innerHTML = (b.kicker ? '<p class="anchor-panel__kicker">' + b.kicker + "</p>" : "") +
        "<h3>" + b.title + "</h3>" +
        (b.price ? '<p class="anchor-panel__price">' + b.price + "</p>" : "") +
        (b.body ? "<p>" + b.body + "</p>" : "");
      stage.appendChild(el);
      anchors.push({ el: el, t: b.t, u: b.u, v: b.v, side: b.side, window: b.window, w: 0, h: 0 });
    });
    requestAnimationFrame(measureAnchors);
    addEventListener("resize", measureAnchors);
  }).catch(function () {});
  if (filmCanvas) anchorTick();

  /* hotspot picker: append ?anchors=1 to the URL, click the film to log {t,u,v} */
  if (/[?&]anchors=1/.test(location.search)) {
    var cross = document.createElement("div");
    cross.className = "anchor-picker";
    document.body.appendChild(cross);
    addEventListener("pointermove", function (e) {
      cross.style.left = e.clientX + "px"; cross.style.top = e.clientY + "px";
      if (!film.VW) return;
      var c = coverTransform();
      document.title = "u=" + ((e.clientX - c.ox) / c.dw).toFixed(3) +
        " v=" + ((e.clientY - c.oy) / c.dh).toFixed(3) +
        " t=" + (scrollState.progress || 0).toFixed(3);
    });
    addEventListener("click", function (e) {
      if (!film.VW) return; var c = coverTransform();
      console.log(JSON.stringify({ t: +(scrollState.progress || 0).toFixed(3),
        u: +((e.clientX - c.ox) / c.dw).toFixed(3), v: +((e.clientY - c.oy) / c.dh).toFixed(3), side: "right" }));
    });
  }

  /* ================= HERO 3D ================= */
  var statusEl = document.getElementById("hero3dStatus");
  var say = function (t) { if (statusEl) statusEl.textContent = t; };
  var choreo = { x: 0, y: .1, s: 1, tilt: 0, spin: 0, roll: 0, cx: 0, cy: 0, cz: 0 };

  var initHero3D = async function () {
    var canvas = document.getElementById("hero3d");
    if (!canvas) return;
    var THREE, GLTFLoader, RoomEnvironment;
    try {
      THREE = await import("three");
      GLTFLoader = (await import("three/addons/loaders/GLTFLoader.js")).GLTFLoader;
      RoomEnvironment = (await import("three/addons/environments/RoomEnvironment.js")).RoomEnvironment;
    } catch (e) { say("3D unavailable — copy still shines."); return; }

    var renderer;
    try { renderer = new THREE.WebGLRenderer({ canvas: canvas, antialias: true, alpha: true }); }
    catch (e) { say("WebGL unavailable — copy still shines."); return; }
    renderer.setPixelRatio(Math.min(devicePixelRatio || 1, 2));
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.05;

    var scene = new THREE.Scene();
    var camera = new THREE.PerspectiveCamera(38, 1, 0.1, 100);
    camera.position.set(3.4, 2.1, 5.2);
    var pmrem = new THREE.PMREMGenerator(renderer);
    scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;

    var key = new THREE.DirectionalLight(0xffffff, 2.2); key.position.set(4, 6, 3); scene.add(key);
    var rim = new THREE.DirectionalLight(0x88bbff, 1.6); rim.position.set(-5, 3, -4); scene.add(rim);
    var fill = new THREE.DirectionalLight(0xffd9a8, 0.7); fill.position.set(-2, 1, 5); scene.add(fill);
    scene.add(new THREE.AmbientLight(0xffffff, 0.25));

    var rig = new THREE.Group(); scene.add(rig);
    var spin = new THREE.Group(); rig.add(spin);

    var fitObject = function (obj) {
      var box = new THREE.Box3().setFromObject(obj);
      var size = box.getSize(new THREE.Vector3()), center = box.getCenter(new THREE.Vector3());
      obj.position.sub(center);
      var maxDim = Math.max(size.x, size.y, size.z) || 1;
      obj.scale.multiplyScalar(2.3 / maxDim);
    };

    new GLTFLoader().load("assets/Objects/hero.glb",
      function (gltf) { fitObject(gltf.scene); spin.add(gltf.scene); say("hero · scroll-synced"); },
      undefined,
      function () {
        var mat = new THREE.MeshStandardMaterial({ color: 0x6b5a52, metalness: .85, roughness: .55 });
        spin.add(new THREE.Mesh(new THREE.BoxGeometry(2, 2, 2), mat));
        say("placeholder · export GLB to upgrade");
      });

    var targetRX = .25, targetRY = .6, curRX = .25, curRY = .6, mx = 0, my = 0;
    window.addEventListener("pointermove", function (e) {
      mx = e.clientX / innerWidth - .5; my = e.clientY / innerHeight - .5;
    }, { passive: true });

    /* act choreography: anchor each act to its section's real page position */
    var ACTS = [
      { sel: ".hero",  x: 0,    y: .1,  s: 1,    spin: 0,  tilt: 0,  roll: 0 },
      { sel: "#film",  x: -1.3, y: 0,   s: .8,   spin: 2,  tilt: .12, roll: .06 },
      { sel: "#craft", x: 0,    y: .05, s: 1.15, spin: 10, tilt: .5,  roll: .3 },
      { sel: "#pricing", x: 0,  y: .1,  s: 1.05, spin: 12, tilt: .7,  roll: .4 }
    ];
    var found = [];
    ACTS.forEach(function (a) { var el = document.querySelector(a.sel); if (el) { a.el = el; found.push(a); } });
    if (hasGSAP && hasST && found.length > 1 && !reduceMotion.matches) {
      var max = Math.max(document.documentElement.scrollHeight - innerHeight, 1);
      var pos = found.map(function (a) {
        var r = a.el.getBoundingClientRect();
        return Math.min(Math.max((r.top + scrollY) / max, 0), 1) * 100;
      });
      for (var i = 1; i < pos.length; i++) pos[i] = Math.max(pos[i], pos[i - 1] + 2);
      var ctl = gsap.timeline({ scrollTrigger: { trigger: document.body, start: "top top", end: "bottom bottom", scrub: 1 } });
      var a0 = found[0];
      ctl.set(choreo, { x: a0.x, y: a0.y, s: a0.s, spin: a0.spin, tilt: a0.tilt, roll: a0.roll }, 0);
      for (var k = 1; k < found.length; k++) {
        var gap = Math.max(pos[k] - pos[k - 1], .5);
        ctl.to(choreo, { x: found[k].x, y: found[k].y, s: found[k].s, spin: found[k].spin, tilt: found[k].tilt, roll: found[k].roll, duration: gap, ease: "sine.inOut" }, pos[k - 1]);
      }
    }

    var resize = function () {
      var w = canvas.clientWidth || innerWidth, h = canvas.clientHeight || innerHeight;
      renderer.setSize(w, h, false);
      camera.aspect = w / Math.max(h, 1); camera.updateProjectionMatrix();
    };
    window.addEventListener("resize", resize); resize();

    var clock = new THREE.Clock();
    var tick = function () {
      requestAnimationFrame(tick);
      var t = clock.getElapsedTime();
      if (!reduceMotion.matches) targetRY += 0.0016;
      curRX += (targetRX - curRX) * .06; curRY += (targetRY - curRY) * .06;
      spin.rotation.set(curRX + choreo.tilt, curRY + choreo.spin, choreo.roll);
      var sx = Math.min(1, innerWidth / 1100);
      rig.position.set(choreo.x * sx, choreo.y, 0);
      rig.scale.setScalar(Math.max(choreo.s, .2));
      spin.position.y = Math.sin(t * .9) * .08;
      camera.position.x += ((3.4 + choreo.cx + mx * .7) - camera.position.x) * .04;
      camera.position.y += ((2.1 + choreo.cy - my * .5) - camera.position.y) * .04;
      camera.position.z += ((5.2 + choreo.cz) - camera.position.z) * .06;
      camera.lookAt(0, 0, 0);
      renderer.render(scene, camera);
    };
    if (reduceMotion.matches) renderer.render(scene, camera); else tick();
  };
  if (document.readyState === "complete" || document.readyState === "interactive") initHero3D();
  else document.addEventListener("DOMContentLoaded", initHero3D);
})();
```

> Keep `?v=N` on the two asset links and the matching `BUILD`/badge in sync. That
> pair is how you and the user detect a stale cached copy.
