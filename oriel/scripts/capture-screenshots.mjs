// Captures the README screenshots from the running site into docs/screenshots/.
// Usage: npm run screenshots   (needs Microsoft Edge or Chrome installed; uses playwright-core, no browser download)
import { mkdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { createServer } from 'vite';
import { chromium } from 'playwright-core';

const root = fileURLToPath(new URL('..', import.meta.url));
const out = fileURLToPath(new URL('../docs/screenshots/', import.meta.url));
mkdirSync(out, { recursive: true });

// Scroll targets are a section selector plus a fraction of the way through its scroll range.
const SHOTS = [
  { file: 'hero.jpg', url: '/', at: { y: 0 } },
  { file: 'anatomy.jpg', url: '/', at: { section: '#anatomy', start: 'pin', frac: 0.75 } },
  { file: 'movement.jpg', url: '/', at: { section: '#movement', start: 'pin', frac: 0.3 } },
  { file: 'configure.jpg', url: '/', at: { section: '#configure', start: 'enter', frac: 1 } },
  { file: 'product.jpg', url: '/product.html', at: { y: 0 }, click: '[data-view="productFront"]' },
];

async function launch() {
  const args = ['--ignore-gpu-blocklist', '--enable-unsafe-swiftshader', '--use-angle=d3d11'];
  for (const channel of ['msedge', 'chrome']) {
    try {
      return await chromium.launch({ channel, headless: true, args });
    } catch {
      // try the next installed browser
    }
  }
  throw new Error('No Edge or Chrome found for playwright-core.');
}

const server = await createServer({ root, logLevel: 'error', server: { port: 0, strictPort: false } });
await server.listen();
const base = server.resolvedUrls.local[0].replace(/\/$/, '');
const browser = await launch();

try {
  for (const shot of SHOTS) {
    const page = await browser.newPage({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 1 });
    page.on('console', (msg) => msg.type() === 'error' && console.error('[page]', msg.text()));
    await page.goto(base + shot.url, { waitUntil: 'load' });
    await page.waitForFunction(() => document.documentElement.classList.contains('has-webgl'), null, { timeout: 60_000 });
    await page.waitForTimeout(3500);

    const y = await page.evaluate(({ at }) => {
      if (at.y !== undefined) return at.y;
      const el = document.querySelector(at.section);
      const top = el.getBoundingClientRect().top + window.scrollY;
      const range = el.offsetHeight - (at.start === 'pin' ? innerHeight : 0);
      return at.start === 'enter' ? top - innerHeight * (1 - at.frac) : top + range * at.frac;
    }, shot);
    await page.evaluate((to) => window.scrollTo(0, to), y);
    await page.waitForTimeout(2500);
    if (shot.click) {
      await page.$eval(shot.click, (el) => el.click()); // no mouse move, so the custom cursor stays hidden
      await page.waitForTimeout(1500);
    }
    await page.screenshot({ path: out + shot.file, type: 'jpeg', quality: 88 });
    console.log('captured', shot.file, Math.round(y));
    await page.close();
  }
} finally {
  await browser.close();
  await server.close();
}
