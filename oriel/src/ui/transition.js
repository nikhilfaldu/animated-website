// Page transitions: an ink curtain closes as a circle grown from the click point, the next page
// opens it as an iris from the centre. html.is-arriving (set by the inline head script from
// sessionStorage) keeps the curtain closed from the first paint until reveal() runs.
import { gsap, EASE } from '../core/motion.js';
import { env } from '../core/env.js';

const FLAG = 'oriel:arriving';
const CLOSE_S = 0.65;
const OPEN_S = 0.9;
const FADE_S = 0.2;
/** reveal() runs after the stage and fonts settle (≤ ~12 s); past that, open anyway. */
const SAFETY_MS = 14000;
const SVG_NS = 'http://www.w3.org/2000/svg';

const round = (n) => Math.round(n * 100) / 100;

/** clip-path keeping everything outside a circular hole of radius r centred on (cx, cy). */
export function irisHole(w, h, cx, cy, r) {
  const x = round(cx);
  const y = round(cy);
  const rr = round(Math.max(0, r));
  return `path(evenodd, "M0 0H${w}V${h}H0Z M${round(x - rr)} ${y}A${rr} ${rr} 0 1 0 ${round(x + rr)} ${y}A${rr} ${rr} 0 1 0 ${round(x - rr)} ${y}Z")`;
}

/** Distance from (x, y) to the farthest corner of a w × h box, plus a hairline of margin. */
const coverRadius = (w, h, x, y) => Math.hypot(Math.max(x, w - x), Math.max(y, h - y)) + 4;

/** A gold hairline that rides the edge of an iris. Created on first draw, removed with the tween. */
function createEdge(host) {
  let svg = null;
  let circle = null;
  return {
    draw(cx, cy, r, alpha) {
      if (!svg) {
        svg = document.createElementNS(SVG_NS, 'svg');
        svg.setAttribute('class', 'iris-edge');
        svg.setAttribute('aria-hidden', 'true');
        circle = document.createElementNS(SVG_NS, 'circle');
        svg.append(circle);
        host.append(svg);
      }
      circle.setAttribute('cx', round(cx));
      circle.setAttribute('cy', round(cy));
      circle.setAttribute('r', round(Math.max(0, r)));
      svg.style.opacity = String(Math.max(0, alpha));
    },
    remove() {
      svg?.remove();
      svg = null;
    },
  };
}

/**
 * Opens a full-screen panel as an iris: a circular hole grows from (x, y) until nothing is left.
 * Returns a paused-safe GSAP tween (add it to a timeline or let it play).
 */
export function openIris(el, { duration = OPEN_S, x, y } = {}) {
  const w = el.clientWidth;
  const h = el.clientHeight;
  const cx = x ?? w / 2;
  const cy = y ?? h / 2;
  const radius = coverRadius(w, h, cx, cy);
  const edge = createEdge(el);
  const state = { r: 0 };
  const draw = () => {
    el.style.clipPath = irisHole(w, h, cx, cy, state.r);
    if (state.r > 0) edge.draw(cx, cy, state.r + 0.5, 1 - state.r / radius);
  };
  el.style.clipPath = irisHole(w, h, cx, cy, 0);
  return gsap.to(state, {
    r: radius,
    duration,
    ease: EASE.inOut,
    onUpdate: draw,
    onComplete: edge.remove,
    onInterrupt: edge.remove,
  });
}

/** Grows a filled circle from (x, y) until the panel covers the screen. */
function closeIris(el, { duration = CLOSE_S, x, y }) {
  const w = el.clientWidth;
  const h = el.clientHeight;
  const radius = coverRadius(w, h, x, y);
  const edge = createEdge(el);
  const state = { r: 0 };
  const draw = () => {
    el.style.clipPath = `circle(${round(state.r)}px at ${round(x)}px ${round(y)}px)`;
    if (state.r > 0) edge.draw(x, y, state.r - 0.5, 1 - state.r / radius);
  };
  draw();
  return gsap.to(state, {
    r: radius,
    duration,
    ease: EASE.inOut,
    onUpdate: draw,
    onComplete: edge.remove,
    onInterrupt: edge.remove,
  });
}

function readFlag() {
  try {
    return sessionStorage.getItem(FLAG) === '1';
  } catch {
    return false;
  }
}

function writeFlag(on) {
  try {
    if (on) sessionStorage.setItem(FLAG, '1');
    else sessionStorage.removeItem(FLAG);
  } catch {}
}

/** Same-origin http(s) link to another document, opened in this tab, without a download. */
function isTransitionLink(link) {
  if (!(link instanceof HTMLAnchorElement)) return false;
  if (link.target && link.target !== '_self') return false;
  if (link.hasAttribute('download') || link.dataset.transition === 'off') return false;
  if (/\bexternal\b/.test(link.rel)) return false;
  let url;
  try {
    url = new URL(link.href, location.href);
  } catch {
    return false;
  }
  if (url.origin !== location.origin || !/^https?:$/.test(url.protocol)) return false;
  const samePage = url.pathname === location.pathname && url.search === location.search;
  return !(samePage && url.hash);
}

/** Click point, or the link's centre for keyboard activation (detail 0 / no coordinates). */
function originOf(event, link) {
  if (event.detail > 0 && (event.clientX || event.clientY)) return { x: event.clientX, y: event.clientY };
  const rect = link.getBoundingClientRect();
  return { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 };
}

export function initPageTransitions() {
  const root = document.documentElement;
  const curtain = document.querySelector('[data-curtain]');
  let timeline = null;
  let leaving = false;
  let revealing = null;
  let safety = 0;

  const resetCurtain = () => {
    timeline?.kill();
    timeline = null;
    if (curtain) {
      curtain.removeAttribute('style');
      curtain.querySelectorAll('.iris-edge').forEach((node) => node.remove());
    }
  };

  function reveal() {
    writeFlag(false);
    clearTimeout(safety);
    if (revealing) return revealing;
    if (!root.classList.contains('is-arriving') || !curtain) {
      root.classList.remove('is-arriving');
      return Promise.resolve();
    }

    revealing = new Promise((resolve) => {
      const done = () => {
        root.classList.remove('is-arriving');
        resetCurtain();
      };
      // JS owns the curtain from here: hold the closed state inline and drop the CSS failsafe.
      curtain.style.animation = 'none';
      gsap.set(curtain, { visibility: 'visible', '--curtain-mark': 1 });

      if (env.reducedMotion) {
        resolve();
        timeline = gsap.timeline({ onComplete: done }).to(curtain, { opacity: 0, duration: FADE_S, ease: EASE.out });
        return;
      }
      timeline = gsap
        .timeline({ onComplete: done })
        .to(curtain, { '--curtain-mark': 0, duration: 0.3, ease: EASE.out }, 0)
        .add(openIris(curtain, { duration: OPEN_S }), 0.16)
        .call(resolve, null, 0.16);
    });
    return revealing;
  }

  function leave(href, origin) {
    leaving = true;
    writeFlag(true);
    const go = () => location.assign(href);
    if (!curtain) return go();

    resetCurtain();
    curtain.style.animation = 'none';
    gsap.set(curtain, { visibility: 'visible', pointerEvents: 'auto', '--curtain-mark': 0 });
    if (env.reducedMotion) {
      gsap.set(curtain, { '--curtain-mark': 1 });
      timeline = gsap.timeline({ onComplete: go }).fromTo(curtain, { opacity: 0 }, { opacity: 1, duration: FADE_S, ease: EASE.out });
      return;
    }
    timeline = gsap
      .timeline({ onComplete: go })
      .add(closeIris(curtain, { duration: CLOSE_S, ...origin }), 0)
      .to(curtain, { '--curtain-mark': 1, duration: 0.32, ease: EASE.out }, CLOSE_S - 0.22)
      // A short hold so the mark registers before the browser swaps documents.
      .to({}, { duration: 0.08 });
  }

  // Window-level bubbling listener: runs after every other click handler, so anything that
  // called preventDefault (nav hash links, the bag drawer…) keeps control of its own clicks.
  const onClick = (event) => {
    if (event.defaultPrevented || event.button !== 0) return;
    if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    const link = event.target instanceof Element ? event.target.closest('a[href]') : null;
    if (!link || !isTransitionLink(link)) return;
    event.preventDefault();
    if (leaving) return;
    leave(link.href, originOf(event, link));
  };

  // Restored from the back/forward cache: the curtain was left closed, open the page instantly.
  const onPageShow = (event) => {
    if (!event.persisted) return;
    leaving = false;
    revealing = null;
    writeFlag(false);
    root.classList.remove('is-arriving');
    resetCurtain();
  };

  if (root.classList.contains('is-arriving') || readFlag()) {
    writeFlag(false);
    if (curtain && root.classList.contains('is-arriving')) {
      // JS is alive: replace the 4 s CSS failsafe with a longer one that still opens the page.
      curtain.style.animation = 'none';
      safety = window.setTimeout(reveal, SAFETY_MS);
    }
  }

  window.addEventListener('click', onClick);
  window.addEventListener('pageshow', onPageShow);

  return {
    reveal,
    destroy() {
      clearTimeout(safety);
      window.removeEventListener('click', onClick);
      window.removeEventListener('pageshow', onPageShow);
      // Mid-navigation (pagehide) the closed curtain must stay painted until the next page arrives.
      if (leaving) timeline?.kill();
      else resetCurtain();
    },
  };
}
