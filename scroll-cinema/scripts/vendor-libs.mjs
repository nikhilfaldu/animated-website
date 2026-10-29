// scripts/vendor-libs.mjs — copy browser runtime files into assets/vendor/
// Usage: npm install gsap@3 three@0.160.0 lenis@1.1.14 && node scripts/vendor-libs.mjs
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
const firstExisting = (list) => list.map((p) => path.join(nm, p)).find(fs.existsSync);

console.log("gsap:");
copy(path.join(nm, "gsap/dist/gsap.min.js"), path.join(out, "gsap/gsap.min.js"));
copy(path.join(nm, "gsap/dist/ScrollTrigger.min.js"), path.join(out, "gsap/ScrollTrigger.min.js"));

console.log("lenis:");
const lenis = firstExisting([
  "lenis/dist/lenis.min.js",
  "lenis/dist/lenis.js",
  "@studio-freight/lenis/dist/lenis.min.js"
]);
if (lenis) copy(lenis, path.join(out, "lenis/lenis.min.js"));
else { console.error("  Lenis UMD build not found — inspect node_modules/lenis/dist"); failed = true; }

console.log("three:");
copy(path.join(nm, "three/build/three.module.js"), path.join(out, "three/build/three.module.js"));
copy(path.join(nm, "three/examples/jsm/loaders/GLTFLoader.js"), path.join(out, "three/examples/jsm/loaders/GLTFLoader.js"));
copy(path.join(nm, "three/examples/jsm/environments/RoomEnvironment.js"), path.join(out, "three/examples/jsm/environments/RoomEnvironment.js"));
copy(path.join(nm, "three/examples/jsm/utils/BufferGeometryUtils.js"), path.join(out, "three/examples/jsm/utils/BufferGeometryUtils.js"));

if (failed) { console.error("\nSome files were missing — fix paths and rerun."); process.exit(1); }
console.log("\nDone. Vendored into assets/vendor/");
