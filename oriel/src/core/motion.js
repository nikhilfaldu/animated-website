import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { CustomEase } from 'gsap/CustomEase';
import Lenis from 'lenis';
import { env } from './env.js';

gsap.registerPlugin(ScrollTrigger, CustomEase);

// Same curves as the CSS tokens in tokens.css (docs/DIRECTION.md §2).
CustomEase.create('oriel.out', '0.23, 1, 0.32, 1');
CustomEase.create('oriel.inOut', '0.77, 0, 0.175, 1');
CustomEase.create('oriel.drawer', '0.32, 0.72, 0, 1');

export const EASE = Object.freeze({ out: 'oriel.out', inOut: 'oriel.inOut', drawer: 'oriel.drawer' });

gsap.defaults({ ease: EASE.out, duration: 0.8 });
ScrollTrigger.config({ ignoreMobileResize: true });

let lenis = null;
let lockDepth = 0;

/** Starts Lenis and hands its scroll to ScrollTrigger. Returns null under reduced motion. */
export function initSmoothScroll() {
  if (env.reducedMotion || lenis) return { lenis, destroy() {} };

  lenis = new Lenis({ duration: 1.15, easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)), anchors: false });
  const onScroll = () => ScrollTrigger.update();
  const raf = (time) => lenis.raf(time * 1000);

  lenis.on('scroll', onScroll);
  gsap.ticker.add(raf);
  gsap.ticker.lagSmoothing(0);

  return {
    lenis,
    destroy() {
      gsap.ticker.remove(raf);
      lenis?.off('scroll', onScroll);
      lenis?.destroy();
      lenis = null;
    },
  };
}

export const getLenis = () => lenis;

/** Scrolls to an element, selector or y offset through Lenis when present. */
export function scrollToTarget(target, { offset = 0, immediate = false } = {}) {
  const el = typeof target === 'string' ? document.querySelector(target) : target;
  if (lenis) {
    lenis.scrollTo(el ?? target, { offset, immediate, duration: immediate ? 0 : 1.4, easing: (t) => 1 - Math.pow(1 - t, 4) });
    return;
  }
  if (typeof target === 'number') {
    window.scrollTo({ top: target + offset, behavior: immediate || env.reducedMotion ? 'auto' : 'smooth' });
  } else if (el) {
    const top = el.getBoundingClientRect().top + window.scrollY + offset;
    window.scrollTo({ top, behavior: immediate || env.reducedMotion ? 'auto' : 'smooth' });
  }
}

/** Nested-safe scroll lock for dialogs and menus. */
export function lockScroll() {
  lockDepth += 1;
  if (lockDepth > 1) return;
  lenis?.stop();
  document.documentElement.style.overflow = 'hidden';
}

export function unlockScroll() {
  lockDepth = Math.max(0, lockDepth - 1);
  if (lockDepth > 0) return;
  lenis?.start();
  document.documentElement.style.overflow = '';
}

export function onReducedMotionChange(cb) {
  const query = matchMedia('(prefers-reduced-motion: reduce)');
  const handler = (e) => cb(e.matches);
  query.addEventListener('change', handler);
  return () => query.removeEventListener('change', handler);
}

/**
 * Re-measures ScrollTriggers once late layout changes (fonts, page load) settle. Images are left out: they all
 * reserve their box (width/height + aspect-ratio), and a refresh per lazy image stalls the scroll it loads in.
 */
export function refreshOnLayoutChanges() {
  let raf = 0;
  const refresh = () => {
    cancelAnimationFrame(raf);
    raf = requestAnimationFrame(() => ScrollTrigger.refresh());
  };
  document.fonts?.ready.then(refresh);
  window.addEventListener('load', refresh, { once: true });
  return () => {
    cancelAnimationFrame(raf);
    window.removeEventListener('load', refresh);
  };
}

export { gsap, ScrollTrigger };
