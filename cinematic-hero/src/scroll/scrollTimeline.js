import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

// The entire scroll-to-shader contract lives in this one function: GSAP's
// normalized 0..1 scroll progress through the pin maps to the shader's
// 0..3 uProgress range (see particle.vert.glsl). To add a 5th scene, change
// the multiplier here AND extend the shader's clamp/segment logic to match.
export function heroProgressToShaderProgress(scrollProgress) {
  return scrollProgress * 3;
}

export function createScrollTimeline({ heroEl, onHeroProgress }) {
  return ScrollTrigger.create({
    trigger: heroEl,
    start: 'top top',
    end: '+=350%',
    scrub: true,
    pin: true,
    onUpdate: (self) => onHeroProgress(heroProgressToShaderProgress(self.progress)),
  });
}
