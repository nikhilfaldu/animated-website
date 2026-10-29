// Manifesto: pinned while the reader's scroll lights the sentence word by word (the italic words end gold).
import { gsap } from '../core/motion.js';
import { splitWords } from '../core/split.js';
import { env } from '../core/env.js';

export function initManifesto() {
  if (env.reducedMotion) return () => {};
  const section = document.getElementById('story');
  const text = section.querySelector('[data-manifesto]');
  const split = splitWords(text, { mask: false });
  if (!split) return () => {};

  gsap.set(split.words, { opacity: 0.14 });
  const tl = gsap.timeline({
    scrollTrigger: {
      trigger: section,
      start: 'top top',
      end: '+=130%',
      pin: true,
      scrub: 0.6,
    },
  });
  tl.to(split.words, { opacity: 1, ease: 'none', stagger: 0.1, duration: 0.3 });

  return () => {
    tl.scrollTrigger?.kill();
    tl.kill();
    split.revert();
  };
}
