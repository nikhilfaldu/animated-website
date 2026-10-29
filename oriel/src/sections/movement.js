// Movement: pinned while the director flies the camera escapement → barrel → rotor; the three text
// chapters swap in step with the poses and the progress ticks fill.
import { gsap, ScrollTrigger, EASE } from '../core/motion.js';
import { env } from '../core/env.js';
import { revealOnEnter } from './reveal.js';

// Scroll fractions of the pin where each chapter takes over (the director moves the watch in between).
const SWITCH = [0.33, 0.67];

export function initMovement({ stage }) {
  const section = document.getElementById('movement');
  const pinEl = section.querySelector('[data-movement-pin]');
  const chapters = [...section.querySelectorAll('[data-focus]')];
  const ticks = [...section.querySelectorAll('.movement__tick')];
  const cleanups = [revealOnEnter(section, { title: section.querySelector('.movement__title'), items: [section.querySelector('.movement__head .mark')] })];

  if (env.reducedMotion || !stage) {
    section.classList.add('is-static');
    return { destroy: () => cleanups.forEach((fn) => fn()) };
  }

  section.classList.add('is-pinned');
  let index = -1;
  const show = (next) => {
    if (next === index) return;
    const previous = chapters[index];
    index = next;
    chapters.forEach((c, i) => c.setAttribute('aria-hidden', String(i !== next)));
    ticks.forEach((t, i) => t.classList.toggle('is-done', i <= next));
    if (previous) gsap.to(previous, { autoAlpha: 0, y: -24, duration: 0.45, ease: EASE.out, overwrite: true });
    gsap.fromTo(chapters[next], { autoAlpha: 0, y: 32 }, { autoAlpha: 1, y: 0, duration: 0.8, ease: EASE.out, delay: previous ? 0.12 : 0, overwrite: true });
  };
  gsap.set(chapters, { autoAlpha: 0 });
  show(0);

  const pin = ScrollTrigger.create({
    trigger: section,
    start: 'top top',
    end: '+=300%',
    pin: pinEl,
    onUpdate: (self) => show(self.progress < SWITCH[0] ? 0 : self.progress < SWITCH[1] ? 1 : 2),
  });

  return {
    pin,
    destroy() {
      pin.kill();
      gsap.killTweensOf(chapters);
      gsap.set(chapters, { clearProps: 'all' });
      chapters.forEach((c) => c.removeAttribute('aria-hidden'));
      section.classList.remove('is-pinned');
      cleanups.forEach((fn) => fn());
    },
  };
}
