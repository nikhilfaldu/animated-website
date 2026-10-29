import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

// All content markup lives in index.html so it is present in the initial
// HTML response; this module only wires up the scroll-reveal animations.
export function initContentAnimations({ animate = true } = {}) {
  const section = document.getElementById('content');
  if (!animate) return section;

  gsap.from(
    section.querySelectorAll('.about__heading, .about__bio, .about__skills, .about__cv-button'),
    {
      autoAlpha: 0,
      y: 30,
      duration: 0.7,
      stagger: 0.1,
      ease: 'power2.out',
      scrollTrigger: { trigger: section.querySelector('.about__heading'), start: 'top 85%' },
    },
  );

  gsap.from(section.querySelectorAll('.project-row'), {
    autoAlpha: 0,
    y: 40,
    duration: 0.8,
    stagger: 0.12,
    ease: 'power2.out',
    scrollTrigger: { trigger: section.querySelector('.projects__list'), start: 'top 80%' },
  });

  return section;
}
