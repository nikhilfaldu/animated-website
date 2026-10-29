// Toasts in [data-toast-region]. The region lives in the top layer (popover="manual") so a toast
// stays visible above an open modal dialog such as the bag.
import { gsap, EASE } from '../core/motion.js';
import { env } from '../core/env.js';
import { icon } from './icons.js';

const LIFETIME = 3200;
const EXIT_MS = env.reducedMotion ? 200 : 340;
const MAX = 3;
const ICON = { neutral: 'info', success: 'check', error: 'danger' };

let region = null;
const toasts = [];
let pausedAt = 0;

/**
 * Shows a short status message.
 * @param {string} message
 * @param {{ tone?: 'neutral' | 'success' | 'error' }} [options]
 * @returns {() => void} dismiss
 */
export function toast(message, { tone = 'neutral' } = {}) {
  const host = getRegion();
  if (!host || !message) return () => {};
  if (!(tone in ICON)) tone = 'neutral';

  const active = toasts.filter((t) => !t.leaving);
  active.slice(0, Math.max(0, active.length - MAX + 1)).forEach(dismiss);

  if (document.querySelector('dialog:modal')) raise();

  const el = document.createElement('div');
  el.className = `toast toast--${tone}`;
  el.innerHTML = `<div class="toast__body"><span class="toast__icon" aria-hidden="true">${icon(ICON[tone])}</span><p class="toast__text"></p></div>`;
  const text = el.querySelector('.toast__text');
  if (tone === 'error') {
    const prefix = document.createElement('span');
    prefix.className = 'sr-only';
    prefix.textContent = 'Error: ';
    text.append(prefix);
  }
  text.append(message);

  const before = positions();
  host.append(el);
  glide(before);
  el.getBoundingClientRect(); // commit the hidden start state so the entry transitions
  el.classList.add('is-visible');

  const record = { el, leaving: false, timer: 0, remaining: LIFETIME, startedAt: performance.now() };
  toasts.push(record);
  if (!pausedAt) record.timer = setTimeout(() => dismiss(record), LIFETIME);
  return () => dismiss(record);
}

function dismiss(record) {
  if (record.leaving) return;
  record.leaving = true;
  clearTimeout(record.timer);
  record.el.classList.remove('is-visible');
  setTimeout(() => {
    const index = toasts.indexOf(record);
    if (index >= 0) toasts.splice(index, 1);
    const before = positions();
    gsap.killTweensOf(record.el);
    record.el.remove();
    glide(before);
  }, EXIT_MS);
}

/* ---------- Region ---------- */

function getRegion() {
  if (region?.isConnected) return region;
  region = document.querySelector('[data-toast-region]');
  if (!region) return null;

  if (typeof region.showPopover === 'function') {
    region.popover = 'manual';
    raise();
    // A modal opened after the region sits above it in the top layer; re-enter on top.
    new MutationObserver((records) => {
      if (toasts.length && records.some((r) => r.target.localName === 'dialog' && r.target.open)) raise();
    }).observe(document.body, { attributes: true, attributeFilter: ['open'], subtree: true });
  }

  // Hovering a toast holds every toast, so a message can be read at leisure.
  region.addEventListener('pointerenter', pause);
  region.addEventListener('pointerleave', resume);
  return region;
}

function raise() {
  try {
    if (region.matches(':popover-open')) region.hidePopover();
    region.showPopover();
  } catch {}
}

function pause() {
  if (pausedAt) return;
  pausedAt = performance.now();
  for (const t of toasts) {
    if (t.leaving) continue;
    clearTimeout(t.timer);
    t.remaining -= pausedAt - t.startedAt;
  }
}

function resume() {
  if (!pausedAt) return;
  pausedAt = 0;
  const now = performance.now();
  for (const t of toasts) {
    if (t.leaving) continue;
    t.startedAt = now;
    t.timer = setTimeout(() => dismiss(t), Math.max(600, t.remaining));
  }
}

/* ---------- Stack motion (FLIP on the outer element; the body owns enter / exit) ---------- */

function positions() {
  return new Map(toasts.map((t) => [t.el, t.el.getBoundingClientRect().top]));
}

function glide(before) {
  before.forEach((top, el) => {
    if (!el.isConnected) return;
    const dy = top - el.getBoundingClientRect().top;
    if (Math.abs(dy) < 0.5 || env.reducedMotion) return;
    const from = dy + (Number(gsap.getProperty(el, 'y')) || 0); // keep any glide already in flight
    gsap.fromTo(el, { y: from }, { y: 0, duration: 0.34, ease: EASE.out, overwrite: true });
  });
}
