# Vendoring the JS libraries (no runtime CDN)

The page ships as plain static HTML/CSS/JS, but the libraries are **installed
once via npm and copied into `assets/vendor/`** so the finished site has **no
runtime CDN dependency** — it works offline, is version-locked, and won't break
if a CDN is slow or blocked.

`node_modules/` stays gitignored; `assets/vendor/` is committed.

---

## 1. Install (once)

```bash
npm install gsap@3 three@0.160.0 lenis@1.1.14 --no-audit --no-fund
```

If the repo has no `package.json`, `npm init -y` first. Pin exact versions so the
build is reproducible. (`three@0.160.0` is the version this skill is tested
against; newer majors may move files — the script below reports what it finds.)

---

## 2. Copy the runtime files into `assets/vendor/`

Save this as `scripts/vendor-libs.mjs` and run `node scripts/vendor-libs.mjs`.
It is dependency-free and verifies every source file exists.

```js
// scripts/vendor-libs.mjs — copy runtime library files into assets/vendor/
import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const nm = path.join(root, "node_modules");
const out = path.join(root, "assets", "vendor");
let failed = false;

function copy(src, dest) {
  if (!fs.existsSync(src)) { console.error("  MISSING:", path.relative(root, src)); failed = true; return; }
  fs.mkdirSync(path.dirname(dest), { recursive: true });
  fs.copyFileSync(src, dest);
  console.log("  copied", path.relative(root, dest));
}
function copyDir(src, dest) {
  if (!fs.existsSync(src)) { console.error("  MISSING:", path.relative(root, src)); failed = true; return; }
  fs.mkdirSync(dest, { recursive: true });
  for (const e of fs.readdirSync(src, { withFileTypes: true })) {
    const s = path.join(src, e.name), d = path.join(dest, e.name);
    if (e.isDirectory()) copyDir(s, d); else fs.copyFileSync(s, d);
  }
  console.log("  copied dir", path.relative(root, dest));
}
function firstExisting(paths) { return paths.map(p => path.join(nm, p)).find(fs.existsSync); }

console.log("gsap:");
copy(path.join(nm, "gsap/dist/gsap.min.js"), path.join(out, "gsap/gsap.min.js"));
copy(path.join(nm, "gsap/dist/ScrollTrigger.min.js"), path.join(out, "gsap/ScrollTrigger.min.js"));

console.log("lenis:");
const lenisSrc = firstExisting([
  "lenis/dist/lenis.min.js",            // UMD build (classic <script>; sets window.Lenis)
  "lenis/dist/lenis.js",
  "@studio-freight/lenis/dist/lenis.min.js"
]);
if (lenisSrc) copy(lenisSrc, path.join(out, "lenis/lenis.min.js"));
else { console.error("  Lenis UMD build not found — run: ls node_modules/lenis/dist"); failed = true; }

console.log("three:");
copyDir(path.join(nm, "three/build"), path.join(out, "three/build")); // whole build/ (handles three.core.js in newer versions)
copy(path.join(nm, "three/examples/jsm/loaders/GLTFLoader.js"),       path.join(out, "three/examples/jsm/loaders/GLTFLoader.js"));
copy(path.join(nm, "three/examples/jsm/environments/RoomEnvironment.js"), path.join(out, "three/examples/jsm/environments/RoomEnvironment.js"));
copy(path.join(nm, "three/examples/jsm/utils/BufferGeometryUtils.js"), path.join(out, "three/examples/jsm/utils/BufferGeometryUtils.js"));

if (failed) { console.error("\nSome files were missing — fix the paths above and rerun."); process.exit(1); }
console.log("\nDone. Vendored into assets/vendor/");
```

> GLTFLoader imports `../utils/BufferGeometryUtils.js` and both import `three`
> (bare specifier, resolved by the importmap). Those three addon files are all
> this build needs. If the browser later reports a missing module, copy that one
> file too, preserving its path under `assets/vendor/three/examples/jsm/`. The
> verification harness surfaces such failures as a `PAGEERROR`.

---

## 3. Resulting layout

```
assets/vendor/
  gsap/gsap.min.js
  gsap/ScrollTrigger.min.js
  lenis/lenis.min.js
  three/build/three.module.js            (+ any sibling build files)
  three/examples/jsm/loaders/GLTFLoader.js
  three/examples/jsm/environments/RoomEnvironment.js
  three/examples/jsm/utils/BufferGeometryUtils.js
```

---

## 4. Wire the HTML to the local files

```html
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
```

Order matters: load `gsap.min.js` **before** `ScrollTrigger.min.js` (it attaches
to the `gsap` global). Keep these in `<head>` before the deferred `main.js`.

---

## 5. Housekeeping

- `.gitignore`: add `node_modules/`. **Do not** ignore `assets/vendor/` — it must
  be committed so the static host serves it.
- On later upgrades, rerun the install + script and bump the `?v=N` cache-buster
  and the on-page build badge.

## 6. Verify there is no CDN left

Grep the built page and confirm nothing still points at a CDN:

```bash
grep -rEn "cdnjs|unpkg|jsdelivr|googleapis" index.html assets/js assets/css
# expect: no matches
```

Then run the browser verification (`references/verification.md`) — with the
network throttled/offline it must still render, scrub, and show the 3D hero.
