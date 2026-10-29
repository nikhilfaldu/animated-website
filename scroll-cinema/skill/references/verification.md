# Verification — prove it works, don't assume

Run this **before** telling the user it's done. It drives a real headless browser
against a local static server and asserts the five properties that matter. This is
what turns "looks fine" into evidence.

Setup (once):
```bash
npm install puppeteer-core --no-audit --no-fund     # no browser download
```
Find a browser: `C:\Program Files\Google\Chrome\Application\chrome.exe`
or `C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe`.

Write the test as `_verify.cjs` in the project root, run `node _verify.cjs`,
then **delete it and `npm uninstall puppeteer-core`** so tooling isn't shipped.

```js
const http = require("http"), fs = require("fs"), path = require("path");
const puppeteer = require("puppeteer-core");

const MIME = { ".html":"text/html", ".js":"text/javascript", ".css":"text/css",
  ".mp4":"video/mp4", ".jpg":"image/jpeg", ".svg":"image/svg+xml", ".glb":"model/gltf-binary" };

// Static server WITH Range support (video seeks need 206s)
const server = http.createServer((req, res) => {
  let p = decodeURIComponent(req.url.split("?")[0]); if (p === "/") p = "/index.html";
  const fp = path.join(__dirname, p);
  fs.stat(fp, (e, st) => {
    if (e) { res.writeHead(404); res.end(); return; }
    const type = MIME[path.extname(fp)] || "application/octet-stream";
    const range = req.headers.range;
    if (range) {
      const m = /bytes=(\d+)-(\d*)/.exec(range);
      const start = +m[1], end = m[2] ? +m[2] : st.size - 1;
      res.writeHead(206, { "Content-Type": type, "Accept-Ranges": "bytes",
        "Content-Range": `bytes ${start}-${end}/${st.size}`, "Content-Length": end - start + 1 });
      fs.createReadStream(fp, { start, end }).pipe(res);
    } else {
      res.writeHead(200, { "Content-Type": type, "Accept-Ranges": "bytes", "Content-Length": st.size });
      fs.createReadStream(fp).pipe(res);
    }
  });
});

(async () => {
  await new Promise(r => server.listen(8123, r));
  const browser = await puppeteer.launch({
    executablePath: "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
    headless: "new", args: ["--no-sandbox", "--disable-dev-shm-usage", "--window-size=1440,900"]
  });
  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 900 });
  page.on("pageerror", e => console.log("PAGEERROR:", e.message));

  // Instrument: count play()/loop, record video events
  await page.evaluateOnNewDocument(() => {
    window.__log = [];
    const push = (type, d) => window.__log.push({ type, d });
    const vp = HTMLMediaElement.prototype, op = vp.play, oq = vp.pause;
    vp.play  = function () { push("play()", this.id); return op.apply(this, arguments); };
    vp.pause = function () { push("pause()", this.id); return oq.apply(this, arguments); };
    const hook = () => {
      const v = document.getElementById("scrubVideo"); if (!v) return;
      ["seeking","seeked","loop","play","error"].forEach(ev =>
        v.addEventListener(ev, () => push("v:" + ev, { ct: +v.currentTime.toFixed(3), rs: v.readyState, loop: v.loop })));
    };
    if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", hook); else hook();
  });

  await page.goto("http://localhost:8123/index.html", { waitUntil: "domcontentloaded", timeout: 30000 });
  await page.waitForFunction(() => {
    const v = document.getElementById("scrubVideo"); return v && isFinite(v.duration) && v.duration > 0;
  }, { timeout: 25000 }).catch(() => console.log("FAIL: video metadata never arrived"));

  const build = await page.evaluate(() => (document.getElementById("buildTag") || {}).textContent);
  console.log("build badge:", build);

  const N = 24, maxY = await page.evaluate(() => document.documentElement.scrollHeight - innerHeight);
  let prevCt = -1, monotonic = true, worstLum = 1, blackFrames = 0, seekSlow = 0;
  let seekingAt = 0;
  for (let i = 0; i <= N; i++) {
    await page.evaluate(y => window.scrollTo(0, y), Math.round(maxY * i / N));
    await new Promise(r => setTimeout(r, 320));
    const s = await page.evaluate(() => {
      const v = document.getElementById("scrubVideo"), c = document.getElementById("filmCanvas");
      let lum = null;
      try { const d = c.getContext("2d").getImageData(0, 0, c.width, c.height).data;
        let sum = 0, n = 0; for (let p = 0; p < d.length; p += 4 * 97) { sum += (d[p]+d[p+1]+d[p+2])/3; n++; }
        lum = +(sum / n / 255).toFixed(3); } catch (e) { lum = "ERR"; }
      return { y: Math.round(scrollY), ct: +v.currentTime.toFixed(2), dur: +v.duration.toFixed(2),
        rs: v.readyState, seeking: v.seeking, loop: v.loop, lum };
    });
    if (i > 0 && s.ct < prevCt - 0.05) monotonic = false;
    prevCt = s.ct;
    if (typeof s.lum === "number") { worstLum = Math.min(worstLum, s.lum); if (s.lum < 0.1) blackFrames++; }
    console.log(`  ${String(i).padStart(2)} y=${String(s.y).padStart(5)} ct=${String(s.ct).padStart(5)} rs=${s.rs} seeking=${s.seeking} loop=${s.loop} lum=${s.lum}`);
  }

  const log = await page.evaluate(() => window.__log);
  const plays = log.filter(l => l.type === "play()").length;
  const loops = log.filter(l => l.type === "v:loop").length;

  console.log("\nRESULTS");
  console.log("  1 scrub tracks scroll (monotonic):", monotonic ? "PASS" : "FAIL");
  console.log("  2 no native play / loop:", (plays === 0 && loops === 0) ? "PASS" : `FAIL (play=${plays} loop=${loops})`);
  console.log("  3 black-proof canvas: worst lum=" + worstLum, blackFrames === 0 ? "PASS" : `FAIL (${blackFrames} black frames)`);
  console.log("  4 build badge:", build);
  console.log("  (seeks are fast if rs stays 4 between steps)");

  await browser.close(); server.close();
})().catch(e => { console.error("TEST ERROR", e); process.exit(1); });
```

Pass criteria:
1. `ct` increases monotonically with `y` (allow tiny float noise).
2. `play()` calls == 0 **and** `v:loop` events == 0.
3. **Zero** sampled canvas frames below luminance 0.1 (ideally worst > 0.3 for a lit film).
4. `readyState` returns to 4 between steps (all-intra → fast seeks).
5. No `PAGEERROR`; build badge matches the code you just wrote.

If criterion 3 fails with a bare `<video>`, you skipped the canvas renderer (§5 of
SKILL.md). If seeks are slow / `readyState` sits at 1, the film is **not all-intra**
(§3 of asset-pipeline.md).
