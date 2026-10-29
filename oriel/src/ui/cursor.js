// Cursor for fine pointers: a gold dot on the pointer and a trailing hairline ring that turns into a
// labelled disc over [data-cursor="view|drag|hold"]. It replaces the system arrow (html.has-cursor);
// text fields keep their caret.
import { gsap, EASE } from '../core/motion.js';
import { env } from '../core/env.js';

const LABELS = { view: 'View', drag: 'Drag', hold: 'Hold' };
const INTERACTIVE = 'a[href], button, label, summary, select, [role="button"], [role="link"], [tabindex]:not([tabindex="-1"])';
const TEXT_ENTRY =
  'input:not([type="button"], [type="submit"], [type="reset"], [type="checkbox"], [type="radio"], [type="range"], [type="color"], [type="file"], [type="image"]), textarea, [contenteditable=""], [contenteditable="true"]';

/** @returns {() => void} destroy */
export function initCursor() {
  if (!env.finePointer || env.reducedMotion) return () => {};

  const { root, ring, dot, label } = build();
  document.body.append(root);
  const topLayer = typeof root.showPopover === 'function';
  if (topLayer) {
    root.popover = 'manual';
    try {
      root.showPopover();
    } catch {}
  }

  document.documentElement.classList.add('has-cursor');
  // The dot is the pointer itself, so it sits exactly under it; only the ring trails.
  const dotX = gsap.quickSetter(dot, 'x', 'px');
  const dotY = gsap.quickSetter(dot, 'y', 'px');
  const ringX = gsap.quickTo(ring, 'x', { duration: 0.5, ease: EASE.out });
  const ringY = gsap.quickTo(ring, 'y', { duration: 0.5, ease: EASE.out });

  const ac = new AbortController();
  const { signal } = ac;
  let placed = false;
  let mode = '';
  let overText = false;
  let outside = true;

  const setVisible = () => root.classList.toggle('is-hidden', !placed || outside || overText);

  const setMode = (next, text = '') => {
    if (next === mode && label.textContent === text) return;
    mode = next;
    root.classList.toggle('is-hover', next === 'hover');
    root.classList.toggle('is-label', next === 'label');
    if (text) label.textContent = text;
  };

  const readTarget = (target) => {
    const el = target instanceof Element ? target : null;
    overText = Boolean(el?.closest(TEXT_ENTRY));
    const labelled = el?.closest('[data-cursor]');
    const key = labelled?.getAttribute('data-cursor') ?? '';
    if (labelled && key) {
      setMode('label', LABELS[key] ?? key.charAt(0).toUpperCase() + key.slice(1));
    } else {
      const interactive = el?.closest(INTERACTIVE);
      setMode(interactive && !interactive.matches(':disabled') ? 'hover' : '');
    }
    setVisible();
  };

  addEventListener(
    'pointermove',
    (e) => {
      if (e.pointerType === 'touch') return;
      if (!placed) {
        gsap.set([dot, ring], { x: e.clientX, y: e.clientY });
        placed = true;
        readTarget(e.target);
      }
      outside = false;
      dotX(e.clientX);
      dotY(e.clientY);
      ringX(e.clientX);
      ringY(e.clientY);
      setVisible();
    },
    { passive: true, signal },
  );

  document.addEventListener('pointerover', (e) => e.pointerType !== 'touch' && readTarget(e.target), { signal });
  document.addEventListener(
    'pointerout',
    (e) => {
      if (e.relatedTarget) return;
      outside = true;
      setVisible();
    },
    { signal },
  );
  document.addEventListener(
    'pointerdown',
    (e) => {
      if (e.pointerType === 'touch') {
        outside = true;
        setVisible();
        return;
      }
      root.classList.add('is-down');
    },
    { signal },
  );
  addEventListener('pointerup', () => root.classList.remove('is-down'), { signal });
  addEventListener(
    'blur',
    () => {
      outside = true;
      root.classList.remove('is-down');
      setVisible();
    },
    { signal },
  );

  // A modal dialog joins the top layer above us; re-enter it so the cursor stays on top.
  const modals = topLayer
    ? new MutationObserver((records) => {
        if (!records.some((r) => r.target.localName === 'dialog' && r.target.open)) return;
        try {
          root.hidePopover();
          root.showPopover();
        } catch {}
      })
    : null;
  modals?.observe(document.body, { attributes: true, attributeFilter: ['open'], subtree: true });

  return function destroy() {
    ac.abort();
    modals?.disconnect();
    gsap.killTweensOf([dot, ring]);
    root.remove();
    document.documentElement.classList.remove('has-cursor');
  };
}

function build() {
  const root = document.createElement('div');
  root.className = 'cursor is-hidden';
  root.setAttribute('aria-hidden', 'true');
  root.innerHTML = `
    <div class="cursor__ring">
      <div class="cursor__line"></div>
      <div class="cursor__disc"><span class="cursor__label"></span></div>
    </div>
    <div class="cursor__dot"><div class="cursor__dot-inner"></div></div>`;
  return {
    root,
    ring: root.querySelector('.cursor__ring'),
    dot: root.querySelector('.cursor__dot'),
    label: root.querySelector('.cursor__label'),
  };
}
