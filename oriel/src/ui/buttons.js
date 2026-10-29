// Signature buttons: directional fill, rolling label and magnetic pull. The .link underline is pure CSS.
import { gsap, EASE } from '../core/motion.js';
import { env } from '../core/env.js';

const BTN = '.btn';
const MAGNETIC = '.btn--primary, [data-magnetic]';
const INERT = ':disabled, [aria-disabled="true"], [aria-busy="true"]';
// After this long without hover or focus the fill is fully shrunk, so its origin can jump.
const FILL_SETTLE_MS = 320;
const hoverQuery = matchMedia('(hover: hover) and (pointer: fine)');

/**
 * Enhances every .btn under `root`, including buttons added later.
 * @param {Document|HTMLElement} [root]
 * @returns {() => void} destroy
 */
export function initButtons(root = document) {
  const host = root === document ? document.body : root;
  if (!host) return () => {};

  const enhanced = new Map();
  const magnets = env.finePointer && !env.reducedMotion ? createMagnetField() : null;

  const enhance = (btn) => {
    if (enhanced.has(btn) || btn.hasAttribute('data-btn')) return;
    enhanced.set(btn, enhanceButton(btn, magnets));
  };
  const release = (btn) => {
    enhanced.get(btn)?.();
    enhanced.delete(btn);
  };

  queryAll(host, BTN).forEach(enhance);

  const observer = new MutationObserver((records) => {
    let removed = false;
    for (const record of records) {
      if (record.removedNodes.length) removed = true;
      repairLabel(record.target);
      record.addedNodes.forEach((node) => {
        if (node.nodeType === Node.ELEMENT_NODE) queryAll(node, BTN).forEach(enhance);
      });
    }
    if (removed) enhanced.forEach((_, btn) => !btn.isConnected && release(btn));
  });
  observer.observe(host, { childList: true, subtree: true });

  return function destroy() {
    observer.disconnect();
    [...enhanced.keys()].forEach(release);
    magnets?.destroy();
  };
}

function queryAll(node, selector) {
  const found = [...node.querySelectorAll(selector)];
  return node.matches?.(selector) ? [node, ...found] : found;
}

function enhanceButton(btn, magnets) {
  const ac = new AbortController();
  btn.setAttribute('data-btn', '');

  let fill = btn.querySelector(':scope > .btn__fill');
  const addedFill = !fill;
  if (addedFill) {
    fill = document.createElement('span');
    fill.className = 'btn__fill';
    fill.setAttribute('aria-hidden', 'true');
    btn.prepend(fill);
  }

  const labels = [...btn.querySelectorAll(':scope > .btn__label')];
  labels.forEach((label) => rollLabel(label));

  bindFill(btn, fill, ac.signal);
  if (magnets && btn.matches(MAGNETIC)) magnets.add(btn);

  return () => {
    ac.abort();
    magnets?.remove(btn);
    btn.classList.remove('is-filled');
    btn.removeAttribute('data-btn');
    if (addedFill) {
      fill.remove();
    } else {
      fill.style.removeProperty('--x');
      fill.style.removeProperty('--y');
    }
    labels.forEach(unrollLabel);
  };
}

/* ---------- Directional fill ---------- */

function bindFill(btn, fill, signal) {
  let hovered = false;
  let focused = false;
  let releasedAt = -Infinity;

  const isSettled = () => !btn.classList.contains('is-filled') && performance.now() - releasedAt > FILL_SETTLE_MS;

  const setOrigin = (x, y) => {
    fill.style.setProperty('--x', `${x}%`);
    fill.style.setProperty('--y', `${y}%`);
  };

  // A settled fill has radius 0, so its origin moves without a transition; otherwise the origin
  // glides with the radius, which reads as the fill following the pointer.
  const moveOrigin = (x, y) => {
    if (!isSettled()) return setOrigin(x, y);
    fill.style.transition = 'none';
    setOrigin(x, y);
    getComputedStyle(fill).clipPath; // commit the jump before the transition comes back
    fill.style.transition = '';
  };

  const sync = () => {
    const on = (hovered || focused) && !btn.matches(INERT);
    if (!on && btn.classList.contains('is-filled')) releasedAt = performance.now();
    btn.classList.toggle('is-filled', on);
  };

  const pointFrom = (event) => {
    const r = btn.getBoundingClientRect();
    const clamp = (v) => Math.min(100, Math.max(0, v));
    return [clamp(((event.clientX - r.left) / r.width) * 100), clamp(((event.clientY - r.top) / r.height) * 100)];
  };

  const isHoverPointer = (e) => e.pointerType !== 'touch' && hoverQuery.matches;

  btn.addEventListener(
    'pointerenter',
    (e) => {
      if (!isHoverPointer(e) || btn.matches(INERT)) return;
      moveOrigin(...pointFrom(e));
      hovered = true;
      sync();
    },
    { signal },
  );
  btn.addEventListener(
    'pointerleave',
    (e) => {
      if (!hovered) return;
      setOrigin(...pointFrom(e));
      hovered = false;
      sync();
    },
    { signal },
  );
  btn.addEventListener(
    'focus',
    () => {
      if (!btn.matches(':focus-visible')) return;
      if (!hovered) moveOrigin(50, 50);
      focused = true;
      sync();
    },
    { signal },
  );
  btn.addEventListener(
    'blur',
    () => {
      focused = false;
      sync();
    },
    { signal },
  );
}

/* ---------- Rolling label ---------- */

function rollLabel(label, text = label.textContent.replace(/\s+/g, ' ').trim()) {
  if (!text) return;
  const line = document.createElement('span');
  line.className = 'btn__line';
  line.textContent = text;
  const clone = document.createElement('span');
  clone.className = 'btn__line btn__line--clone';
  clone.setAttribute('aria-hidden', 'true');
  clone.textContent = text;
  label.replaceChildren(line, clone);
  label.setAttribute('data-rolled', '');
}

function unrollLabel(label) {
  if (!label.hasAttribute('data-rolled')) return;
  const line = label.querySelector(':scope > .btn__line:not(.btn__line--clone)');
  label.textContent = line?.textContent ?? label.dataset.text ?? '';
  label.removeAttribute('data-rolled');
}

/** Re-rolls a label whose text was replaced by other code (e.g. label.textContent = 'Added'). */
function repairLabel(node) {
  const label = node.nodeType === Node.ELEMENT_NODE ? node.closest('.btn__label[data-rolled]') : null;
  if (!label) return;
  const [line, clone] = label.children;
  const intact =
    label.childNodes.length === 2 && line?.matches('.btn__line') && clone?.matches('.btn__line--clone') && line.textContent === clone.textContent;
  if (intact) return;
  // Someone replaced either the whole label or just the visible line.
  const source = line?.matches('.btn__line:not(.btn__line--clone)') ? line : label;
  const text = source.textContent.replace(/\s+/g, ' ').trim();
  label.dataset.text = text;
  rollLabel(label, text);
}

/* ---------- Magnetic pull ---------- */

const PULL = { x: 10, y: 7 }; // px the button travels at the edge of its field
const PARALLAX = { x: 5, y: 3 }; // extra px for the label and icon
const FIELD = 28; // px the field reaches beyond the button
const RECT_TTL = 300; // ms before a cached rect is measured again

function createMagnetField() {
  const items = new Map();
  const ac = new AbortController();
  const { signal } = ac;
  let pointer = null;
  let raf = 0;

  const io = new IntersectionObserver((entries) => {
    for (const entry of entries) {
      const item = items.get(entry.target);
      if (!item) continue;
      item.inView = entry.isIntersecting;
      item.rect = null;
      if (!entry.isIntersecting) settle(item);
    }
  });

  const to = (el, prop) => gsap.quickTo(el, prop, { duration: 0.6, ease: EASE.out });

  function add(btn) {
    const inner = [...btn.querySelectorAll(':scope > .btn__label, :scope > .btn__icon')];
    items.set(btn, {
      btn,
      inner,
      inView: false,
      active: false,
      rect: null,
      measuredAt: 0,
      x: to(btn, 'x'),
      y: to(btn, 'y'),
      ix: inner.map((el) => to(el, 'x')),
      iy: inner.map((el) => to(el, 'y')),
    });
    io.observe(btn);
  }

  function remove(btn) {
    const item = items.get(btn);
    if (!item) return;
    io.unobserve(btn);
    items.delete(btn);
    gsap.killTweensOf([btn, ...item.inner]);
    gsap.set([btn, ...item.inner], { clearProps: 'transform' });
  }

  function settle(item) {
    if (!item.active) return;
    item.active = false;
    item.x(0);
    item.y(0);
    item.ix.forEach((fn) => fn(0));
    item.iy.forEach((fn) => fn(0));
  }

  // The rect is cached without the button's own pull so the field doesn't chase itself.
  function measure(item, now) {
    const r = item.btn.getBoundingClientRect();
    const tx = Number(gsap.getProperty(item.btn, 'x')) || 0;
    const ty = Number(gsap.getProperty(item.btn, 'y')) || 0;
    item.rect = { cx: r.left + r.width / 2 - tx, cy: r.top + r.height / 2 - ty, hw: r.width / 2, hh: r.height / 2 };
    item.measuredAt = now;
  }

  function update() {
    raf = 0;
    if (!pointer) return;
    const now = performance.now();
    for (const item of items.values()) {
      if (!item.inView) continue;
      if (item.btn.matches(INERT)) {
        settle(item);
        continue;
      }
      if (!item.rect || now - item.measuredAt > RECT_TTL) measure(item, now);
      const { cx, cy, hw, hh } = item.rect;
      const nx = (pointer.x - cx) / (hw + FIELD);
      const ny = (pointer.y - cy) / (hh + FIELD);
      if (Math.abs(nx) > 1 || Math.abs(ny) > 1) {
        settle(item);
        continue;
      }
      item.active = true;
      item.x(nx * PULL.x);
      item.y(ny * PULL.y);
      item.ix.forEach((fn) => fn(nx * PARALLAX.x));
      item.iy.forEach((fn) => fn(ny * PARALLAX.y));
    }
  }

  const settleAll = () => items.forEach(settle);

  addEventListener(
    'pointermove',
    (e) => {
      if (e.pointerType === 'touch') return;
      pointer = { x: e.clientX, y: e.clientY };
      raf ||= requestAnimationFrame(update);
    },
    { passive: true, signal },
  );
  // Scrolling releases the pull; the next pointer move picks it up again with fresh rects.
  addEventListener(
    'scroll',
    () => {
      items.forEach((item) => (item.rect = null));
      settleAll();
    },
    { passive: true, capture: true, signal },
  );
  addEventListener('resize', () => items.forEach((item) => (item.rect = null)), { passive: true, signal });
  addEventListener('blur', settleAll, { signal });
  document.addEventListener(
    'pointerout',
    (e) => {
      if (e.relatedTarget) return;
      pointer = null;
      settleAll();
    },
    { signal },
  );

  return {
    add,
    remove,
    destroy() {
      ac.abort();
      cancelAnimationFrame(raf);
      io.disconnect();
      [...items.keys()].forEach(remove);
    },
  };
}
