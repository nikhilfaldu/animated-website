// Index page entry: boots the shared UI, the WebGL stage and the scroll story.
import '@fontsource/instrument-serif/400.css';
import '@fontsource/instrument-serif/400-italic.css';
import '@fontsource-variable/hanken-grotesk/wght.css';
import '@fontsource/dm-mono/400.css';
import './styles/tokens.css';
import './styles/base.css';
import './styles/ui-chrome.css';
import './styles/ui-commerce.css';
import './styles/sections-story.css';
import './styles/sections-shop.css';

import { env } from './core/env.js';
import { initSmoothScroll, onReducedMotionChange, refreshOnLayoutChanges } from './core/motion.js';
import { bootChrome, loadStage, settle, registerCleanup } from './core/boot.js';
import { createPreloader } from './ui/preloader.js';
import { initSections } from './sections/index.js';

async function boot() {
  const root = document.documentElement;
  if (env.poster) return bootPosterMode();

  const arriving = root.classList.contains('is-arriving');
  const preloader = arriving ? null : createPreloader({ short: root.classList.contains('is-returning') });
  if (preloader) registerCleanup(preloader.destroy);

  const smooth = initSmoothScroll();
  registerCleanup(smooth.destroy);
  smooth.lenis?.stop();

  const { cart, transitions } = bootChrome();

  const stage = await loadStage(document.getElementById('stage'), {
    onProgress: (p) => preloader?.setProgress(0.15 + p * 0.7),
  });
  await settle(document.fonts?.ready, 2500);
  preloader?.setProgress(0.95);

  const sections = initSections({ stage, cart });
  registerCleanup(sections.destroy);
  registerCleanup(refreshOnLayoutChanges());
  registerCleanup(onReducedMotionChange(() => location.reload()));

  preloader?.setProgress(1);
  await (preloader ? preloader.finish() : transitions.reveal());
  smooth.lenis?.start();
  try {
    sessionStorage.setItem('oriel:visited', '1');
  } catch {}
  sections.playIntro();
}

/** Minimal boot used by scripts/render-posters.mjs: only the stage, exposed on window. */
async function bootPosterMode() {
  const canvas = document.getElementById('stage');
  const stage = await loadStage(canvas, { force: true });
  window.__oriel = { stage };
  document.documentElement.dataset.posterReady = stage ? 'true' : 'failed';
}

boot().catch((err) => {
  console.error('[oriel] boot failed', err);
  document.documentElement.classList.remove('is-loading', 'is-arriving');
});
