import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

// Footer markup lives in index.html; this only adds the entrance reveal.
export function initFooterAnimations({ animate = true } = {}) {
  const footer = document.getElementById('contact');
  if (!animate) return footer;

  gsap.from(footer.children, {
    autoAlpha: 0,
    y: 30,
    duration: 0.7,
    stagger: 0.1,
    ease: 'power2.out',
    scrollTrigger: { trigger: footer, start: 'top 85%' },
  });

  return footer;
}
