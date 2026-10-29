// The only code on the index page that sets the watch's pose. It reads the scroll position against a track
// of segments (each a ScrollTrigger range blending one named pose into the next) once per GSAP tick.
import { gsap, ScrollTrigger, EASE } from '../core/motion.js';
import { env } from '../core/env.js';
import { POSES, lerpPose } from '../three/poses.js';

const MOBILE = '(max-width: 767px)';
const easeInOut = gsap.parseEase(EASE.inOut);

/** Portrait phones: the watch sits in the upper part of the screen, the copy below it. */
const MOBILE_OVERRIDES = {
  manifesto: { y: 0.66, size: 0.5, visibility: 0.28 },
  anatomyStart: { y: 0.08, size: 0.6 },
  anatomyEnd: { y: 0.06, size: 0.33 },
  reserve: { visibility: 0 },
};

function forMobile(name, pose) {
  if (POSES[`${name}Mobile`]) return POSES[`${name}Mobile`];
  if (pose.visibility === 0) return pose;
  if (pose.movement > 0.5) return { ...pose, x: 0, y: 0.36, size: pose.size * 0.8 };
  return { ...pose, x: 0, y: 0.36, size: pose.size * 1.45, ...MOBILE_OVERRIDES[name] };
}

/**
 * @param {ReturnType<import('../three/stage.js').createStage>} stage
 * @param {{ pins: { anatomy?: ScrollTrigger, movement?: ScrollTrigger } }} options
 */
export function createDirector(stage, { pins = {} } = {}) {
  if (!stage) return { intro: () => null, destroy() {} };

  const mq = matchMedia(MOBILE);
  let mobile = mq.matches;
  const pose = (name) => (mobile ? forMobile(name, POSES[name]) : POSES[name]);

  const owned = [];
  const range = (trigger, start, end) => {
    const st = ScrollTrigger.create({ trigger, start, end });
    owned.push(st);
    return st;
  };

  // [scroll range, from pose, to pose, fraction of the range used]
  const track = [
    { st: range('#top', 'top top', 'bottom top'), from: 'hero', to: 'manifesto' },
    { st: range('#anatomy', 'top bottom', 'top top'), from: 'manifesto', to: 'anatomyStart' },
    pins.anatomy && { st: pins.anatomy, from: 'anatomyStart', to: 'anatomyEnd', span: [0.05, 0.82] },
    { st: range('#movement', 'top bottom', 'top top'), from: 'anatomyEnd', to: 'movementEscapement' },
    pins.movement && { st: pins.movement, from: 'movementEscapement', to: 'movementBarrel', span: [0.24, 0.42] },
    pins.movement && { st: pins.movement, from: 'movementBarrel', to: 'movementRotor', span: [0.58, 0.76] },
    { st: range('#configure', 'top bottom', 'top 15%'), from: 'movementRotor', to: 'configure' },
    { st: range('#numbers', 'top 85%', 'top 35%'), from: 'configure', to: 'hidden' },
    { st: range('#reserve', 'top 65%', 'top 15%'), from: 'hidden', to: 'reserve' },
    { st: range('.footer', 'top 90%', 'top 40%'), from: 'reserve', to: 'hidden' },
  ].filter(Boolean);

  const out = {};
  const blended = {};
  const intro = { t: 1 };
  let introTween = null;

  function scrollPose() {
    const y = window.scrollY;
    let active = null;
    let t = 0;
    for (const segment of track) {
      const [a, b] = segment.span ?? [0, 1];
      const start = segment.st.start + (segment.st.end - segment.st.start) * a;
      const end = segment.st.start + (segment.st.end - segment.st.start) * b;
      if (y < start) continue;
      if (!active || start >= active.start) {
        active = { segment, start };
        t = end > start ? Math.min(1, (y - start) / (end - start)) : 1;
      }
    }
    if (!active) return lerpPose(pose('hero'), pose('hero'), 0, out);
    return lerpPose(pose(active.segment.from), pose(active.segment.to), easeInOut(t), out);
  }

  function tick() {
    const target = scrollPose();
    if (intro.t < 1) {
      const start = { ...pose('hero'), y: pose('hero').y - 0.18, ry: pose('hero').ry - 1.1, size: pose('hero').size * 0.8, visibility: 0 };
      stage.setPose(lerpPose(start, target, intro.t, blended));
    } else {
      stage.setPose(target);
    }
  }
  gsap.ticker.add(tick);

  const onMedia = () => {
    mobile = mq.matches;
  };
  mq.addEventListener('change', onMedia);

  // Pointer tilt, fine pointers only.
  let raf = 0;
  let px = 0;
  let py = 0;
  const onMove = (e) => {
    px = (e.clientX / window.innerWidth) * 2 - 1;
    py = (e.clientY / window.innerHeight) * 2 - 1;
    if (!raf) raf = requestAnimationFrame(() => {
      raf = 0;
      stage.setPointer(px, py);
    });
  };
  const onLeave = () => stage.setPointer(0, 0);
  const tilt = env.finePointer && !env.reducedMotion;
  if (tilt) {
    window.addEventListener('pointermove', onMove, { passive: true });
    document.documentElement.addEventListener('pointerleave', onLeave);
    window.addEventListener('blur', onLeave);
  }

  // Start fully placed at the current scroll position, then let the intro bring the watch in.
  stage.setPose(scrollPose(), { immediate: true });

  return {
    /** Brings the watch in from below and turned away; returns the tween so the hero intro can nest it. */
    intro() {
      introTween?.kill();
      intro.t = 0;
      tick();
      stage.setPose(blended, { immediate: true });
      introTween = gsap.to(intro, { t: 1, duration: 2.2, ease: EASE.out });
      return introTween;
    },
    destroy() {
      gsap.ticker.remove(tick);
      introTween?.kill();
      owned.forEach((st) => st.kill());
      mq.removeEventListener('change', onMedia);
      cancelAnimationFrame(raf);
      if (tilt) {
        window.removeEventListener('pointermove', onMove);
        document.documentElement.removeEventListener('pointerleave', onLeave);
        window.removeEventListener('blur', onLeave);
      }
    },
  };
}
