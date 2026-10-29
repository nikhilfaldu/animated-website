// Renders the site's still images from its own Three.js model into public/media/.
// Usage: npm run posters   (needs Microsoft Edge or Chrome installed; uses playwright-core, no browser download)
import { mkdirSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { createServer } from 'vite';
import { chromium } from 'playwright-core';

const root = fileURLToPath(new URL('..', import.meta.url));
const out = fileURLToPath(new URL('../public/media/', import.meta.url));
mkdirSync(out, { recursive: true });

const FINISHES = ['steel', 'rosegold', 'ceramic'];
const DIALS = ['midnight', 'ivory', 'malachite'];

const jobs = [
  { file: 'hero.webp', pose: 'posterHero', finish: 'steel', dial: 'midnight', width: 1600, height: 1600 },
  { file: 'exploded.webp', pose: 'posterExploded', finish: 'steel', dial: 'midnight', width: 1600, height: 1600 },
  { file: 'movement.webp', pose: 'posterMovement', finish: 'steel', dial: 'midnight', width: 1600, height: 1600 },
  ...FINISHES.flatMap((finish) =>
    DIALS.map((dial) => ({ file: `config-${finish}-${dial}.webp`, pose: 'posterConfig', finish, dial, width: 1200, height: 1500 })),
  ),
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
const base = server.resolvedUrls.local[0];
const browser = await launch();

try {
  const page = await browser.newPage({ viewport: { width: 1280, height: 800 }, deviceScaleFactor: 1 });
  page.on('console', (msg) => msg.type() === 'error' && console.error('[page]', msg.text()));
  await page.goto(`${base}?poster`, { waitUntil: 'load' });
  await page.waitForFunction(() => document.documentElement.dataset.posterReady, null, { timeout: 120_000 });
  const state = await page.evaluate(() => document.documentElement.dataset.posterReady);
  if (state !== 'true') throw new Error('The stage failed to start in poster mode.');

  for (const job of jobs) {
    const dataUrl = await page.evaluate(async ({ pose, finish, dial, width, height }) => {
      const { POSES } = await import('/src/three/poses.js');
      const blob = await window.__oriel.stage.snapshot({ pose: POSES[pose], finish, dial, width, height, type: 'image/webp', quality: 0.9 });
      return new Promise((resolve) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result);
        reader.readAsDataURL(blob);
      });
    }, job);
    writeFileSync(out + job.file, Buffer.from(dataUrl.split(',')[1], 'base64'));
    console.log('rendered', job.file);
  }

  // Social card: the hero render on the studio background with the headline set in the site's fonts.
  const og = await page.evaluate(async () => {
    await Promise.all([
      document.fonts.load('400 96px "Instrument Serif"'),
      document.fonts.load('italic 400 96px "Instrument Serif"'),
      document.fonts.load('400 22px "DM Mono"'),
    ]);
    const img = new Image();
    img.src = '/media/hero.webp';
    await img.decode();
    const c = document.createElement('canvas');
    c.width = 1200;
    c.height = 630;
    const g = c.getContext('2d');
    const bg = g.createRadialGradient(860, 315, 40, 860, 315, 520);
    bg.addColorStop(0, '#1a1815');
    bg.addColorStop(1, '#0a0908');
    g.fillStyle = bg;
    g.fillRect(0, 0, 1200, 630);
    g.drawImage(img, 560, 5, 620, 620);
    g.fillStyle = '#867f74';
    g.font = '400 20px "DM Mono"';
    g.fillText('ORIEL · CALIBRE O-1', 72, 150);
    g.fillStyle = '#ede6da';
    g.font = '400 104px "Instrument Serif"';
    g.fillText('Time,', 68, 290);
    g.fillStyle = '#cdb07a';
    g.font = 'italic 400 104px "Instrument Serif"';
    g.fillText('taken apart.', 68, 392);
    g.fillStyle = '#867f74';
    g.font = '400 18px "DM Mono"';
    g.fillText('A CONCEPT BY AYOUB BENKREIRA', 72, 520);
    return c.toDataURL('image/jpeg', 0.88);
  });
  writeFileSync(out + 'og.jpg', Buffer.from(og.split(',')[1], 'base64'));
  console.log('rendered og.jpg');
} finally {
  await browser.close();
  await server.close();
}
