// scripts/make-demo-gif.mjs
// Dev-only: renders docs/demo.gif by scrolling the local site in headless Chrome.
// Requires devDependencies: puppeteer-core, pngjs, gifenc
//   npm install
//   python -m http.server 8080        # in another shell (or this opens its own)
//   node scripts/make-demo-gif.mjs
import http from "node:http";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import puppeteer from "puppeteer-core";
import pngjs from "pngjs";
import gifenc from "gifenc";

const { PNG } = pngjs;
const { GIFEncoder, quantize, applyPalette } = gifenc;

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const CHROME = process.env.CHROME_PATH ||
  "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";
const MIME = { ".html": "text/html", ".js": "text/javascript", ".css": "text/css",
  ".mp4": "video/mp4", ".jpg": "image/jpeg", ".svg": "image/svg+xml", ".glb": "model/gltf-binary" };

const server = http.createServer((req, res) => {
  let p = decodeURIComponent(req.url.split("?")[0]); if (p === "/") p = "/index.html";
  const fp = path.join(ROOT, p);
  fs.stat(fp, (e, st) => {
    if (e) { res.writeHead(404); res.end(); return; }
    const t = MIME[path.extname(fp)] || "application/octet-stream";
    const r = req.headers.range;
    if (r) { const m = /bytes=(\d+)-(\d*)/.exec(r); const s = +m[1], en = m[2] ? +m[2] : st.size - 1;
      res.writeHead(206, { "Content-Type": t, "Accept-Ranges": "bytes", "Content-Range": `bytes ${s}-${en}/${st.size}`, "Content-Length": en - s + 1 });
      fs.createReadStream(fp, { start: s, end: en }).pipe(res);
    } else { res.writeHead(200, { "Content-Type": t, "Accept-Ranges": "bytes", "Content-Length": st.size }); fs.createReadStream(fp).pipe(res); }
  });
});

// 2x box downsample (1440x900 -> 720x450), which also anti-aliases
function down2(rgba, w, h) {
  const W = w >> 1, H = h >> 1, out = new Uint8ClampedArray(W * H * 4);
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    let r = 0, g = 0, b = 0, a = 0;
    for (let dy = 0; dy < 2; dy++) for (let dx = 0; dx < 2; dx++) {
      const i = (((y * 2 + dy) * w) + (x * 2 + dx)) * 4;
      r += rgba[i]; g += rgba[i + 1]; b += rgba[i + 2]; a += rgba[i + 3];
    }
    const o = (y * W + x) * 4;
    out[o] = r >> 2; out[o + 1] = g >> 2; out[o + 2] = b >> 2; out[o + 3] = a >> 2;
  }
  return { data: out, width: W, height: H };
}

(async () => {
  await new Promise(r => server.listen(8142, r));
  const browser = await puppeteer.launch({
    executablePath: CHROME, headless: "new",
    args: ["--no-sandbox", "--disable-dev-shm-usage", "--enable-unsafe-swiftshader",
      "--window-size=1440,900"]
  });
  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 900 });

  await page.goto("http://localhost:8142/index.html", { waitUntil: "domcontentloaded", timeout: 30000 });
  await page.waitForFunction(() => {
    const v = document.getElementById("scrubVideo");
    return v && isFinite(v.duration) && v.duration > 0 && v.readyState >= 2;
  }, { timeout: 30000 }).catch(() => console.log("warn: video not ready"));
  await new Promise(r => setTimeout(r, 2500)); // let the blob preload + 3D settle

  const maxY = await page.evaluate(() => document.documentElement.scrollHeight - innerHeight);
  const N = 16;
  const gif = GIFEncoder();
  for (let i = 0; i < N; i++) {
    // ease-in-out across the page
    const t = i / (N - 1);
    const e = t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
    await page.evaluate(y => window.scrollTo(0, y), Math.round(maxY * e));
    await new Promise(r => setTimeout(r, 360));
    const buf = await page.screenshot({ type: "png" });
    const png = PNG.sync.read(buf);
    const d = down2(png.data, png.width, png.height);
    const palette = quantize(d.data, 256);
    const index = applyPalette(d.data, palette);
    gif.writeFrame(index, d.width, d.height, { palette, delay: 110 });
    process.stdout.write(".");
  }
  gif.finish();
  const out = path.join(ROOT, "docs", "demo.gif");
  fs.writeFileSync(out, Buffer.from(gif.bytes()));
  console.log("\nwrote", out, (fs.statSync(out).size / 1024 / 1024).toFixed(2), "MB");

  // social / OG preview (1200x630) — the hero frame
  await page.setViewport({ width: 1200, height: 630 });
  await page.evaluate(() => window.scrollTo(0, 0));
  await new Promise(r => setTimeout(r, 1400));
  const og = path.join(ROOT, "docs", "social-preview.png");
  await page.screenshot({ path: og });
  console.log("wrote", og, (fs.statSync(og).size / 1024).toFixed(0), "KB");

  await browser.close(); server.close();
})().catch(e => { console.error("ERROR", e); process.exit(1); });
