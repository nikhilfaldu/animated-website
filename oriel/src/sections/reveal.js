// Section entrances shared by every chapter: a heading rises word by word from its masks, then the
// supporting elements follow. Plays once when the section enters; under reduced motion nothing moves.
import { gsap, ScrollTrigger, EASE } from '../core/motion.js';
import { splitWords } from '../core/split.js';
import { env } from '../core/env.js';

/**
 * @param {Element} section trigger element
 * @param {{ title?: Element | null, items?: Element[], start?: string }} parts
 * @returns {() => void} destroy
 */
export function revealOnEnter(section, { title, items = [], start = 'top 72%' } = {}) {
  if (env.reducedMotion || !section) return () => {};
  const split = title ? splitWords(title) : null;
  const words = split?.words ?? [];
  const rest = items.filter(Boolean);

  gsap.set(words, { yPercent: 110 });
  gsap.set(rest, { autoAlpha: 0, y: 24 });

  const tl = gsap.timeline({ paused: true });
  if (words.length) tl.to(words, { yPercent: 0, duration: 1.1, ease: EASE.out, stagger: 0.06 }, 0);
  if (rest.length) tl.to(rest, { autoAlpha: 1, y: 0, duration: 0.9, ease: EASE.out, stagger: 0.07 }, words.length ? 0.25 : 0);

  const trigger = ScrollTrigger.create({ trigger: section, start, once: true, onEnter: () => tl.play() });

  return () => {
    trigger.kill();
    tl.kill();
    gsap.set([...words, ...rest], { clearProps: 'all' });
    split?.revert();
  };
}
