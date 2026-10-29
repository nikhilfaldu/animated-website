// Product page entry: shared chrome, a turntable stage inside the media column, and the product logic.
import '@fontsource/instrument-serif/400.css';
import '@fontsource/instrument-serif/400-italic.css';
import '@fontsource-variable/hanken-grotesk/wght.css';
import '@fontsource/dm-mono/400.css';
import './styles/tokens.css';
import './styles/base.css';
import './styles/ui-chrome.css';
import './styles/ui-commerce.css';
import './styles/product.css';

import { initSmoothScroll, onReducedMotionChange, refreshOnLayoutChanges } from './core/motion.js';
import { bootChrome, loadStage, settle, registerCleanup } from './core/boot.js';
import { initProductPage } from './pages/product.js';

async function boot() {
  const smooth = initSmoothScroll();
  registerCleanup(smooth.destroy);

  const { cart, transitions } = bootChrome({ chapterDial: false });
  const stage = await loadStage(document.querySelector('[data-product-canvas]'));
  await settle(document.fonts?.ready, 2500);

  const page = initProductPage({ stage, cart });
  registerCleanup(page.destroy);
  registerCleanup(refreshOnLayoutChanges());
  registerCleanup(onReducedMotionChange(() => location.reload()));

  await transitions.reveal();
  try {
    sessionStorage.setItem('oriel:visited', '1');
  } catch {}
  page.playIntro();
}

boot().catch((err) => {
  console.error('[oriel] boot failed', err);
  document.documentElement.classList.remove('is-loading', 'is-arriving');
});
