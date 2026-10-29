// Hero: the intro timeline that plays as the preloader's iris opens, and the live "your time" readout
// that matches the watch's hands.
import { gsap, EASE } from '../core/motion.js';
import { splitWords } from '../core/split.js';
import { env } from '../core/env.js';

export function initHero() {
  const section = document.getElementById('top');
  const title = section.querySelector('[data-hero-title]');
  const parts = [
    section.querySelector('.hero__mark'),
    section.querySelector('[data-hero-lead]'),
    ...section.querySelectorAll('[data-hero-actions] > *'),
    section.querySelector('.hero__meta'),
  ].filter(Boolean);

  // Live time, aligned to the second.
  const timeEl = section.querySelector('[data-local-time]');
  const zoneEl = section.querySelector('[data-local-zone]');
  const format = new Intl.DateTimeFormat('en-GB', { hour: '2-digit', minute: '2-digit', second: '2-digit', hourCycle: 'h23' });
  const zone = Intl.DateTimeFormat().resolvedOptions().timeZone ?? '';
  if (zoneEl) zoneEl.textContent = zone.split('/').pop().replace(/_/g, ' ');
  let timer = 0;
  const tick = () => {
    const now = new Date();
    if (timeEl) {
      timeEl.textContent = format.format(now);
      timeEl.dateTime = now.toISOString();
    }
    timer = setTimeout(tick, 1000 - now.getMilliseconds() + 5);
  };
  tick();

  const split = env.reducedMotion ? null : splitWords(title);
  const words = split?.words ?? [];
  if (!env.reducedMotion) {
    gsap.set(words, { yPercent: 110, rotate: 4 });
    gsap.set(parts, { autoAlpha: 0, y: 28 });
  }

  return {
    /** @param {gsap.core.Tween | null} watchIntro */
    playIntro(watchIntro) {
      const tl = gsap.timeline();
      if (env.reducedMotion) return tl;
      tl.to(words, { yPercent: 0, rotate: 0, duration: 1.25, ease: EASE.out, stagger: 0.07 }, 0.1)
        .to(parts, { autoAlpha: 1, y: 0, duration: 1, ease: EASE.out, stagger: 0.08 }, 0.45);
      if (watchIntro) tl.add(watchIntro, 0);
      return tl;
    },
    destroy() {
      clearTimeout(timer);
      gsap.set([...words, ...parts], { clearProps: 'all' });
      split?.revert();
    },
  };
}
