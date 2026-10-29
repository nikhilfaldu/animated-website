import { gsap, ScrollTrigger, Lenis } from '../libs.js';

gsap.registerPlugin(ScrollTrigger);

/** Lenis smooth scroll driven by GSAP's ticker so ScrollTrigger and Lenis share one clock. */
export function initSmoothScroll(reduced) {
  const lenis = new Lenis({ duration: reduced ? 0 : 1.15, smoothWheel: !reduced, syncTouch: false });
  lenis.on('scroll', ScrollTrigger.update);
  const tick = (t) => lenis.raf(t * 1000);
  gsap.ticker.add(tick);
  gsap.ticker.lagSmoothing(0);
  return { lenis, destroy: () => { gsap.ticker.remove(tick); lenis.destroy(); } };
}

const SECTIONS = ['hero', 'journey', 'destinations', 'machine', 'control', 'anomaly', 'log', 'finale'];

/**
 * Wires every scroll-linked behaviour. The journey and anomaly each have exactly one
 * scrubbed trigger, which is the single source of truth for their progress.
 */
export function initScrollScenes({ state, onSection, onJourney, reduced }) {
  SECTIONS.forEach((id) => {
    ScrollTrigger.create({
      trigger: `#${id}`, start: 'top 55%', end: 'bottom 45%',
      onToggle: (self) => { if (self.isActive) { state.section = id; onSection(id); } },
    });
  });

  const journey = ScrollTrigger.create({
    trigger: '#journey', start: 'top top', end: 'bottom bottom', scrub: true,
    onUpdate: (self) => { state.journey = self.progress; onJourney(self.progress); },
  });

  ScrollTrigger.create({
    trigger: '#anomaly', start: 'top top', end: 'bottom bottom', scrub: true,
    onUpdate: (self) => { state.anomaly = self.progress; },
  });

  // Anomaly copy: scrubbed, reversible
  const at = gsap.timeline({ scrollTrigger: { trigger: '#anomaly', start: 'top top', end: 'bottom bottom', scrub: true } });
  at.fromTo('.anomaly-title span', { opacity: 0, letterSpacing: '0.4em', filter: 'blur(10px)' }, { opacity: 1, letterSpacing: '0em', filter: 'blur(0px)', stagger: 0.15, duration: 0.3 })
    .fromTo('.anomaly-text', { opacity: 0, y: 30 }, { opacity: 1, y: 0, duration: 0.2 }, '-=0.1')
    .to('.anomaly-pin', { opacity: 0, duration: 0.15 }, 0.85);

  // Journey intro text scales away as the camera dives
  gsap.timeline({ scrollTrigger: { trigger: '#journey', start: 'top top', end: () => `+=${window.innerHeight * 1.2}`, scrub: true } })
    .to('#journeyIntro', { opacity: 0, y: -60, scale: 1.1, ease: 'none' });

  // Hero parallax out
  gsap.to('.hero-copy', { yPercent: -25, opacity: 0, ease: 'none', scrollTrigger: { trigger: '#hero', start: 'top top', end: 'bottom top', scrub: true } });
  gsap.to('.hero-hud', { yPercent: -60, ease: 'none', scrollTrigger: { trigger: '#hero', start: 'top top', end: 'bottom top', scrub: true } });

  if (!reduced) {
    // Section headings + staggered content reveals
    gsap.utils.toArray('.reveal').forEach((el) => {
      gsap.from(el, { y: 60, opacity: 0, duration: 1.1, ease: 'expo.out', scrollTrigger: { trigger: el, start: 'top 85%', toggleActions: 'play none none reverse' } });
    });
    gsap.from('.dest', { y: 80, opacity: 0, rotateX: -12, stagger: 0.1, duration: 1, ease: 'power3.out', scrollTrigger: { trigger: '#destGrid', start: 'top 80%', toggleActions: 'play none none reverse' } });
    gsap.utils.toArray('.log-item').forEach((el, i) => {
      gsap.from(el, { x: i % 2 ? 60 : -60, opacity: 0, duration: 1, ease: 'power3.out', scrollTrigger: { trigger: el, start: 'top 85%', toggleActions: 'play none none reverse' } });
    });
    gsap.from('.console', { y: 60, opacity: 0, duration: 1, ease: 'power3.out', scrollTrigger: { trigger: '.console', start: 'top 85%', toggleActions: 'play none none reverse' } });
  }

  return { journey };
}
