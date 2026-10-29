// Giant footer wordmark: letters rise out of the baseline crop as the footer scrolls in.
import { gsap } from '../core/motion.js';
import { env } from '../core/env.js';

/**
 * @param {Document|HTMLElement} [root]
 * @returns {() => void} destroy
 */
export function initFooterReveal(root = document) {
  const cleanups = [...root.querySelectorAll('[data-wordmark]')].map(revealWordmark);
  return function destroy() {
    cleanups.forEach((fn) => fn());
  };
}

function revealWordmark(el) {
  const original = el.textContent;
  // The wordmark is already aria-hidden, so the letters need no accessible copy.
  const letters = [...original.trim()].map((char) => {
    const span = document.createElement('span');
    span.className = 'footer__letter';
    span.textContent = char;
    return span;
  });
  el.replaceChildren(...letters);
  el.classList.add('is-split');

  const restore = () => {
    el.textContent = original;
    el.classList.remove('is-split');
  };
  if (env.reducedMotion) return restore;

  const footer = el.closest('footer') ?? el;
  const tween = gsap.fromTo(
    letters,
    { yPercent: 104 },
    {
      yPercent: 0,
      ease: 'none',
      stagger: 0.14,
      scrollTrigger: {
        trigger: el,
        start: 'top bottom',
        endTrigger: footer,
        end: 'bottom bottom',
        scrub: 0.8,
        // Measured after every pin above it, which all change where the footer sits.
        refreshPriority: -1,
      },
    },
  );

  return () => {
    tween.scrollTrigger?.kill();
    tween.kill();
    restore();
  };
}
