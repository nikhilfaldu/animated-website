// By the numbers: each figure rolls up from zero like a mechanical counter, once, as the grid arrives.
import { ScrollTrigger } from '../core/motion.js';
import { env } from '../core/env.js';
import { createOdometer } from '../ui/odometer.js';
import { revealOnEnter } from './reveal.js';

export function initNumbers() {
  const section = document.getElementById('numbers');
  const stats = [...section.querySelectorAll('.stat')];
  const odometers = stats.map((stat) => {
    const el = stat.querySelector('[data-odometer]');
    const value = Number(el.dataset.odometer);
    return { value, odometer: createOdometer(el, { value, from: env.reducedMotion ? value : 0, format: String }) };
  });

  const timers = [];
  const trigger = env.reducedMotion
    ? null
    : ScrollTrigger.create({
        trigger: section.querySelector('.numbers__grid'),
        start: 'top 78%',
        once: true,
        onEnter: () => odometers.forEach(({ odometer, value }, i) => timers.push(setTimeout(() => odometer.set(value), i * 90))),
      });

  const destroyReveal = revealOnEnter(section, {
    title: section.querySelector('.numbers__title'),
    items: [section.querySelector('.numbers__head .mark'), ...stats],
  });

  return () => {
    trigger?.kill();
    timers.forEach(clearTimeout);
    odometers.forEach(({ odometer }) => odometer.destroy());
    destroyReveal();
  };
}
