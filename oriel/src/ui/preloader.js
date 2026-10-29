// First-visit preloader: a 60-tick dial fills with the counter, then the ink panel opens as an iris.
// The markup ([data-preloader]) is visible from the first paint; JS adds the dial and drives it.
import { gsap, EASE } from '../core/motion.js';
import { env } from '../core/env.js';
import { openIris } from './transition.js';

const TICKS = 60;
const SVG_NS = 'http://www.w3.org/2000/svg';
const IRIS_S = 1.1;
/** Counter speed limits, in progress per second: never stalls, never races. */
const MIN_RATE = 0.35;
const MAX_RATE = { full: 1.15, short: 2.6 };
/** Boot settles in ≤ ~12 s (stage timeout + fonts); past that, open the page regardless. */
const SAFETY_MS = 15000;

const svgEl = (name, attrs) => {
  const node = document.createElementNS(SVG_NS, name);
  for (const [key, value] of Object.entries(attrs)) node.setAttribute(key, value);
  return node;
};

/** 60 hairline ticks (every fifth longer) in two layers: bone base and gold overlay. */
function buildDial() {
  const svg = svgEl('svg', { class: 'preloader__ticks', viewBox: '0 0 200 200', 'aria-hidden': 'true', focusable: 'false' });
  const base = svgEl('g', { class: 'preloader__base' });
  const lit = svgEl('g', { class: 'preloader__lit' });
  const gold = [];
  const bone = [];
  for (let i = 0; i < TICKS; i += 1) {
    const major = i % 5 === 0;
    const attrs = {
      x1: 100,
      y1: major ? 13 : 9,
      x2: 100,
      y2: 3,
      transform: `rotate(${i * 6} 100 100)`,
      'vector-effect': 'non-scaling-stroke',
    };
    const b = svgEl('line', { ...attrs, class: `preloader__tick${major ? ' is-major' : ''}` });
    const g = svgEl('line', { ...attrs, class: 'preloader__tick preloader__tick--gold' });
    base.append(b);
    lit.append(g);
    bone.push(b);
    gold.push(g);
  }
  // A small gold index that runs around the dial with the counter.
  const index = svgEl('g', { class: 'preloader__index' });
  index.append(svgEl('circle', { cx: 100, cy: -4, r: 1.6 }));
  svg.append(base, lit, index);
  return { svg, bone, gold, index };
}

const noop = { setProgress() {}, finish: () => Promise.resolve(), destroy() {} };

/**
 * @param {{ short?: boolean }} [options] short: returning visitor, faster counter and 0.5 s minimum
 * @returns {{ setProgress(p: number): void, finish(): Promise<void>, destroy(): void }}
 */
export function createPreloader({ short = false } = {}) {
  const root = document.documentElement;
  const el = document.querySelector('[data-preloader]');
  if (!el || root.classList.contains('is-arriving')) {
    el?.remove();
    return noop;
  }

  const dialHost = el.querySelector('[data-preloader-dial]');
  const countEl = el.querySelector('[data-preloader-count]');
  const countWrap = countEl?.closest('.preloader__count') ?? countEl;
  const brand = el.querySelector('.preloader__brand');
  const minShowMs = short ? 500 : 1400;
  const maxRate = short ? MAX_RATE.short : MAX_RATE.full;
  const startedAt = performance.now();
  const dial = buildDial();

  let target = 0;
  let shown = 0;
  let litCount = 0;
  let lastCount = -1;
  let finishing = null;
  let resolveFinish = () => {};
  let outro = null;
  let intro = null;
  let done = false;

  root.classList.add('is-loading');
  // JS is alive: the CSS failsafe stands down and a longer JS one takes over (below).
  el.style.animation = 'none';
  dialHost?.append(dial.svg);

  if (!env.reducedMotion) {
    intro = gsap.from(dial.bone, { opacity: 0, duration: 0.5, stagger: short ? 0.003 : 0.008, ease: EASE.out });
  }

  function render() {
    const count = Math.floor(shown * 100 + 1e-6);
    if (count !== lastCount && countEl) {
      lastCount = count;
      const digits = String(count);
      const pad = '0'.repeat(Math.max(0, 3 - digits.length));
      countEl.innerHTML = pad ? `<span class="preloader__pad">${pad}</span>${digits}` : digits;
    }
    const nextLit = Math.min(TICKS, Math.floor(shown * TICKS + 1e-6));
    for (let i = litCount; i < nextLit; i += 1) dial.gold[i].classList.add('is-lit');
    litCount = nextLit;
    dial.index.style.transform = `rotate(${shown * 360}deg)`;
  }

  function tick(_time, deltaMs) {
    const dt = Math.min(deltaMs, 64) / 1000;
    if (shown < target) {
      const eased = (target - shown) * (1 - Math.exp(-dt * 4));
      shown = Math.min(target, shown + Math.min(Math.max(eased, MIN_RATE * dt), maxRate * dt));
      render();
    }
    if (finishing && !outro && shown >= 1 && performance.now() - startedAt >= minShowMs) playOutro();
  }

  function cleanup() {
    if (done) return;
    done = true;
    gsap.ticker.remove(tick);
    observer.disconnect();
    clearTimeout(safety);
    el.remove();
    root.classList.remove('is-loading');
  }

  function playOutro() {
    gsap.ticker.remove(tick);
    intro?.progress(1);
    if (env.reducedMotion) {
      resolveFinish();
      outro = gsap.to(el, { opacity: 0, duration: 0.2, ease: EASE.out, onComplete: cleanup });
      return;
    }
    // A beat on 100, the dial breathes out, then the iris opens on the hero. finish() resolves
    // as the iris starts so the hero intro overlaps it.
    const irisAt = 0.22;
    outro = gsap
      .timeline({ onComplete: cleanup })
      .to(countWrap, { yPercent: -35, opacity: 0, duration: 0.45, ease: EASE.out }, 0.12)
      .to(brand, { opacity: 0, duration: 0.3, ease: EASE.out }, 0.12)
      .to(dial.svg, { scale: 1.14, opacity: 0, duration: 0.8, ease: EASE.out, transformOrigin: '50% 50%' }, 0.14)
      .add(openIris(el, { duration: IRIS_S }), irisAt)
      .call(() => resolveFinish(), null, irisAt);
  }

  // If boot fails, main.js drops html.is-loading: get out of the way quickly.
  const observer = new MutationObserver(() => {
    if (!root.classList.contains('is-loading') && !done) {
      observer.disconnect();
      gsap.ticker.remove(tick);
      resolveFinish();
      outro?.kill();
      outro = gsap.to(el, { opacity: 0, duration: 0.2, ease: EASE.out, onComplete: cleanup });
    }
  });
  observer.observe(root, { attributes: true, attributeFilter: ['class'] });

  const safety = window.setTimeout(() => api.finish(), SAFETY_MS);
  gsap.ticker.add(tick);
  render();

  const api = {
    setProgress(p) {
      const value = Number(p);
      if (Number.isFinite(value)) target = Math.max(target, Math.min(1, value));
    },
    finish() {
      if (!finishing) {
        target = 1;
        finishing = new Promise((resolve) => {
          resolveFinish = resolve;
        });
        if (done) resolveFinish();
      }
      return finishing;
    },
    destroy() {
      intro?.kill();
      outro?.kill();
      resolveFinish();
      dial.svg.remove();
      cleanup();
    },
  };
  return api;
}
