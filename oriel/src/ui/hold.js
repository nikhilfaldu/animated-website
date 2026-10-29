// Hold-to-reserve: a deliberate, linear ring fill while held; a fast spring back on early release.
// On completion the label confirms, one pulse leaves the ring, and 'hold:complete' bubbles up.
import { gsap, EASE } from '../core/motion.js';
import { env } from '../core/env.js';
import { icon } from './icons.js';

const HOLD_S = 1.6;
const RELEASE_S = 0.2;
const RESET_MS = 2400;
const isHoldKey = (event) => event.key === ' ' || event.key === 'Enter';

function setupHold(button) {
  const progress = button.querySelector('.hold__progress');
  const label = button.querySelector('.hold__label');
  const idleHTML = label?.innerHTML ?? '';
  const doneHTML = `${icon('check')}<span>Reserved</span>`;
  const state = { p: 0 };
  /** idle → holding → complete → (drain) → idle */
  let phase = 'idle';
  let source = null;
  let fill = null;
  let swap = null;
  let pulse = null;
  let resetTimer = 0;

  const draw = () => {
    if (progress) progress.style.strokeDashoffset = String(1 - state.p);
  };

  function swapLabel(html) {
    if (!label) return;
    swap?.kill();
    if (env.reducedMotion) {
      label.innerHTML = html;
      return;
    }
    swap = gsap
      .timeline()
      .to(label, { opacity: 0, y: -6, duration: 0.16, ease: EASE.out })
      .call(() => {
        label.innerHTML = html;
      })
      .fromTo(label, { opacity: 0, y: 6 }, { opacity: 1, y: 0, duration: 0.32, ease: EASE.out });
  }

  function emitPulse() {
    if (env.reducedMotion) return;
    pulse?.kill();
    const ring = document.createElement('span');
    ring.className = 'hold__pulse';
    ring.setAttribute('aria-hidden', 'true');
    button.append(ring);
    pulse = gsap.fromTo(
      ring,
      { scale: 1, opacity: 0.7 },
      { scale: 1.28, opacity: 0, duration: 0.9, ease: EASE.out, onComplete: () => ring.remove(), onInterrupt: () => ring.remove() },
    );
  }

  function press(kind) {
    if (phase !== 'idle' || button.disabled) return;
    phase = 'holding';
    source = kind;
    button.classList.add('is-holding');
    fill?.kill();
    fill = gsap.to(state, { p: 1, duration: HOLD_S * (1 - state.p), ease: 'none', onUpdate: draw, onComplete: complete });
  }

  function release() {
    if (phase !== 'holding') return;
    phase = 'idle';
    source = null;
    button.classList.remove('is-holding');
    fill?.kill();
    fill = gsap.to(state, { p: 0, duration: RELEASE_S, ease: EASE.out, onUpdate: draw });
  }

  function complete() {
    phase = 'complete';
    source = null;
    state.p = 1;
    draw();
    button.classList.remove('is-holding');
    button.classList.add('is-complete');
    swapLabel(doneHTML);
    emitPulse();
    if (navigator.vibrate && matchMedia('(pointer: coarse)').matches) {
      try {
        navigator.vibrate(12);
      } catch {}
    }
    button.dispatchEvent(new CustomEvent('hold:complete', { bubbles: true }));
    resetTimer = window.setTimeout(reset, RESET_MS);
  }

  function reset() {
    button.classList.remove('is-complete');
    swapLabel(idleHTML);
    fill?.kill();
    fill = gsap.to(state, {
      p: 0,
      duration: env.reducedMotion ? 0 : 0.6,
      ease: EASE.inOut,
      onUpdate: draw,
      onComplete: () => {
        phase = 'idle';
      },
    });
  }

  const onPointerDown = (event) => {
    if (!event.isPrimary || event.button !== 0) return;
    press('pointer');
  };
  const onPointerEnd = () => {
    if (source === 'pointer') release();
  };
  const onKeyDown = (event) => {
    if (!isHoldKey(event)) return;
    event.preventDefault();
    if (!event.repeat) press('key');
  };
  const onKeyUp = (event) => {
    if (!isHoldKey(event)) return;
    event.preventDefault();
    if (source === 'key') release();
  };
  const onBlur = () => release();
  const onContextMenu = (event) => event.preventDefault();

  const listeners = [
    ['pointerdown', onPointerDown],
    ['pointerup', onPointerEnd],
    ['pointerleave', onPointerEnd],
    ['pointercancel', onPointerEnd],
    ['keydown', onKeyDown],
    ['keyup', onKeyUp],
    ['blur', onBlur],
    ['contextmenu', onContextMenu],
  ];
  listeners.forEach(([type, fn]) => button.addEventListener(type, fn));
  draw();

  return () => {
    listeners.forEach(([type, fn]) => button.removeEventListener(type, fn));
    clearTimeout(resetTimer);
    fill?.kill();
    swap?.kill();
    pulse?.kill();
    button.classList.remove('is-holding', 'is-complete');
    if (label) {
      label.innerHTML = idleHTML;
      gsap.set(label, { clearProps: 'opacity,transform' });
    }
    progress?.style.removeProperty('stroke-dashoffset');
  };
}

/** Enhances every [data-hold] button under `root`. */
export function initHoldButtons(root = document) {
  const cleanups = [...root.querySelectorAll('[data-hold]')].map(setupHold);
  return () => cleanups.forEach((cleanup) => cleanup());
}
