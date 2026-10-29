// Shared boot steps for both pages: chrome (nav, cart, cursor…), the WebGL stage, and cleanup.
import { env } from './env.js';
import { initButtons } from '../ui/buttons.js';
import { initCursor } from '../ui/cursor.js';
import { initNav } from '../ui/nav.js';
import { initCart } from '../ui/cart.js';
import { initHoldButtons } from '../ui/hold.js';
import { initPageTransitions } from '../ui/transition.js';
import { initChapterDial } from '../ui/chapter-dial.js';
import { initFooterReveal } from '../ui/footer.js';
import { initNewsletter } from '../ui/newsletter.js';

const cleanups = [];

export function registerCleanup(fn) {
  if (typeof fn === 'function') cleanups.push(fn);
}

function destroyAll() {
  while (cleanups.length) {
    try {
      cleanups.pop()();
    } catch (err) {
      console.warn('[oriel] cleanup failed', err);
    }
  }
}

// Tear down on real unloads only; a page kept in the back/forward cache must stay alive.
addEventListener('pagehide', (event) => {
  if (!event.persisted) destroyAll();
});

/** Resolves with the promise's value, or undefined after `ms`, never rejects. */
export function settle(promise, ms) {
  return Promise.race([Promise.resolve(promise).catch(() => undefined), new Promise((r) => setTimeout(r, ms))]);
}

export function bootChrome({ chapterDial = true } = {}) {
  const cart = initCart();
  const transitions = initPageTransitions();
  registerCleanup(cart.destroy);
  registerCleanup(transitions.destroy);
  registerCleanup(initButtons());
  registerCleanup(initCursor());
  registerCleanup(initNav({ cart }));
  registerCleanup(initHoldButtons());
  registerCleanup(initFooterReveal());
  registerCleanup(initNewsletter());
  if (chapterDial) registerCleanup(initChapterDial());
  return { cart, transitions };
}

/**
 * Creates the stage when WebGL and motion allow it. Returns null (posters stay) on any failure.
 * @param {HTMLCanvasElement} canvas
 */
export async function loadStage(canvas, { onProgress, force = false, timeout = 9000 } = {}) {
  const root = document.documentElement;
  if (!canvas || !env.webgl || (env.reducedMotion && !force)) return null;

  let stage = null;
  try {
    // Three.js loads only for visitors who will actually see the 3D stage.
    const { createStage } = await import('../three/stage.js');
    stage = createStage({ canvas, tier: env.tier, time: env.poster ? 'fixed' : 'live' });
    let done = false;
    // stage.ready has no granular progress; ease the counter toward 90% while it compiles.
    const started = performance.now();
    const tick = () => {
      if (done) return;
      const t = Math.min(1, (performance.now() - started) / 2200);
      onProgress?.(0.9 * (1 - Math.pow(1 - t, 3)));
      requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);

    const ok = await settle(stage.ready.then(() => true), timeout);
    done = true;
    if (!ok) throw new Error('stage timed out');
    onProgress?.(1);

    root.classList.add('has-webgl');
    stage.onContextLost(() => {
      root.classList.remove('has-webgl');
      root.classList.add('webgl-lost');
    });
    registerCleanup(() => {
      root.classList.remove('has-webgl');
      stage.dispose();
    });
    return stage;
  } catch (err) {
    console.warn('[oriel] 3D stage unavailable, showing rendered posters instead.', err);
    try {
      stage?.dispose();
    } catch {}
    return null;
  }
}
