// Editions: on wide screens the section pins and the gallery travels sideways with the scroll; elsewhere
// it is a native, snapping horizontal scroller. Cards get a pointer spotlight and a gentle tilt.
import { gsap } from '../core/motion.js';
import { env } from '../core/env.js';
import { revealOnEnter } from './reveal.js';

const WIDE = '(min-width: 900px)';

export function initEditions() {
  const section = document.getElementById('editions');
  const pinEl = section.querySelector('[data-editions-pin]');
  const track = section.querySelector('[data-editions-track]');
  const cards = [...track.querySelectorAll('.edition-card')];
  const cleanups = [revealOnEnter(section, { title: section.querySelector('.editions__title'), items: [section.querySelector('.editions__intro .mark'), section.querySelector('.editions__lead')] })];

  const mm = gsap.matchMedia();
  if (!env.reducedMotion) {
    mm.add(WIDE, () => {
      section.classList.add('is-pinned');
      const distance = () => Math.max(0, track.scrollWidth - window.innerWidth);
      const tween = gsap.to(track, {
        x: () => -distance(),
        ease: 'none',
        scrollTrigger: { trigger: section, start: 'top top', end: () => `+=${distance()}`, pin: pinEl, scrub: 0.5, invalidateOnRefresh: true },
      });
      const images = cards.map((card) => card.querySelector('.edition-card__img')).filter(Boolean);
      const parallax = images.map((img) =>
        gsap.fromTo(img, { xPercent: -6 }, { xPercent: 6, ease: 'none', scrollTrigger: { trigger: img.closest('.edition-card'), containerAnimation: tween, start: 'left right', end: 'right left', scrub: true } }),
      );
      return () => {
        parallax.forEach((t) => (t.scrollTrigger?.kill(), t.kill()));
        section.classList.remove('is-pinned');
      };
    });
  }
  cleanups.push(() => mm.revert());

  // Spotlight and tilt follow the pointer (fine pointers, motion allowed).
  if (env.finePointer && !env.reducedMotion) {
    gsap.set(cards, { transformPerspective: 900 });
    const handlers = cards.map((card) => {
      const tiltX = gsap.quickTo(card, 'rotationX', { duration: 0.6, ease: 'power3' });
      const tiltY = gsap.quickTo(card, 'rotationY', { duration: 0.6, ease: 'power3' });
      const move = (e) => {
        const r = card.getBoundingClientRect();
        const u = (e.clientX - r.left) / r.width;
        const v = (e.clientY - r.top) / r.height;
        card.style.setProperty('--mx', `${(u * 100).toFixed(1)}%`);
        card.style.setProperty('--my', `${(v * 100).toFixed(1)}%`);
        tiltY((u - 0.5) * 8);
        tiltX((0.5 - v) * 6);
      };
      const leave = () => {
        tiltX(0);
        tiltY(0);
      };
      card.addEventListener('pointermove', move);
      card.addEventListener('pointerleave', leave);
      return () => {
        card.removeEventListener('pointermove', move);
        card.removeEventListener('pointerleave', leave);
        gsap.set(card, { clearProps: 'transform' });
      };
    });
    cleanups.push(...handlers);
  }

  return () => cleanups.forEach((fn) => fn());
}
