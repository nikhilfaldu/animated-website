// The bag: a small persisted store (localStorage 'oriel:bag') and its drawer, the <dialog id="bag">.
// ORIEL is a concept store: checkout is switched off and says so, it never fakes a success.
import { gsap, EASE, lockScroll, unlockScroll, scrollToTarget } from '../core/motion.js';
import { env } from '../core/env.js';
import { FINISHES, DIALS, editionFor, priceOf, formatPrice, posterFor, nameFor, describe } from '../data/catalog.js';
import { icon } from './icons.js';
import { toast } from './toast.js';
import { createOdometer } from './odometer.js';

const STORAGE_KEY = 'oriel:bag';
const MAX_QTY = 3;
const EDITION_SIZE = 300;
const CLOSE_FALLBACK_MS = 560;
const CHECKOUT_MESSAGE = 'ORIEL is a concept store. Checkout is switched off and nothing is charged.';

const finishIds = new Set(FINISHES.map((f) => f.id));
const dialIds = new Set(DIALS.map((d) => d.id));

export const bagItemId = (finish, dial, reserved = false) => `${finish}-${dial}${reserved ? '-reserved' : ''}`;

/** Returns a clean cart item, or null when the input does not describe a real configuration. */
function normalize(input) {
  if (!input || typeof input !== 'object') return null;
  const { finish, dial } = input;
  if (!finishIds.has(finish) || !dialIds.has(dial)) return null;
  const reserved = input.reserved === true;
  const number = reserved && Number.isInteger(input.number) && input.number >= 1 && input.number <= EDITION_SIZE ? input.number : null;
  const qty = reserved ? 1 : Math.min(MAX_QTY, Math.max(1, Math.round(Number(input.qty) || 1)));
  return { id: bagItemId(finish, dial, reserved), finish, dial, edition: editionFor(finish, dial)?.id ?? null, reserved, number, qty };
}

function sanitize(raw) {
  if (!Array.isArray(raw)) return [];
  const seen = new Set();
  const items = [];
  for (const entry of raw) {
    const item = normalize(entry);
    if (!item || seen.has(item.id)) continue;
    seen.add(item.id);
    items.push(item);
  }
  return items;
}

function parse(json) {
  try {
    return json ? sanitize(JSON.parse(json)) : [];
  } catch {
    return [];
  }
}

function load() {
  try {
    return parse(localStorage.getItem(STORAGE_KEY));
  } catch {
    return [];
  }
}

function save(items) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  } catch {}
}

const copy = (items) => items.map((item) => ({ ...item }));
const lineTotal = (item) => priceOf(item.finish) * item.qty;
const piecesLabel = (n) => (n === 0 ? 'Empty' : `${String(n).padStart(2, '0')} ${n === 1 ? 'piece' : 'pieces'}`);

/* -------------------------------------------------------------------------- */
/* Drawer view                                                                */
/* -------------------------------------------------------------------------- */

function createLine(item) {
  const li = document.createElement('li');
  li.className = 'bag-line';
  li.dataset.id = item.id;
  li.innerHTML = `
    <div class="bag-line__media"><img class="bag-line__img" alt="" width="1200" height="1500" loading="lazy" decoding="async" /></div>
    <div class="bag-line__body">
      <p class="bag-line__badge mono" hidden>${icon('lock')}<span data-line-badge></span></p>
      <h3 class="bag-line__name" data-line-name></h3>
      <p class="bag-line__desc mono" data-line-desc></p>
      <div class="bag-line__controls">
        <div class="qty" role="group" data-line-stepper>
          <button class="qty__btn" type="button" data-qty-step="-1" aria-label="Decrease quantity">${icon('minus')}</button>
          <span class="qty__value mono" data-line-qty></span>
          <button class="qty__btn" type="button" data-qty-step="1" aria-label="Increase quantity">${icon('plus')}</button>
        </div>
        <p class="qty qty--fixed mono" data-line-fixed hidden>Qty 1</p>
        <button class="bag-line__remove mono" type="button" data-line-remove>${icon('trash')}<span>Remove</span></button>
      </div>
    </div>
    <p class="bag-line__price">
      <span class="bag-line__total mono" data-line-total></span>
      <span class="bag-line__unit mono" data-line-unit hidden></span>
    </p>`;
  const img = li.querySelector('img');
  img.addEventListener('error', () => img.remove(), { once: true });
  return {
    el: li,
    img,
    badge: li.querySelector('.bag-line__badge'),
    badgeText: li.querySelector('[data-line-badge]'),
    name: li.querySelector('[data-line-name]'),
    desc: li.querySelector('[data-line-desc]'),
    stepper: li.querySelector('[data-line-stepper]'),
    fixed: li.querySelector('[data-line-fixed]'),
    qty: li.querySelector('[data-line-qty]'),
    minus: li.querySelector('[data-qty-step="-1"]'),
    plus: li.querySelector('[data-qty-step="1"]'),
    remove: li.querySelector('[data-line-remove]'),
    total: li.querySelector('[data-line-total]'),
    unit: li.querySelector('[data-line-unit]'),
  };
}

function updateLine(line, item) {
  const name = nameFor(item);
  const poster = posterFor(item.finish, item.dial);
  if (line.img.isConnected && line.img.getAttribute('src') !== poster) line.img.src = poster;
  line.name.textContent = name;
  line.desc.textContent = describe(item);
  line.badge.hidden = !item.reserved;
  line.badgeText.textContent = item.number ? `Reserved · No. ${item.number} of ${EDITION_SIZE}` : 'Reserved';
  line.stepper.hidden = item.reserved;
  line.fixed.hidden = !item.reserved;
  line.stepper.setAttribute('aria-label', `Quantity, ${name}`);
  line.qty.textContent = String(item.qty);
  line.minus.setAttribute('aria-disabled', String(item.qty <= 1));
  line.plus.setAttribute('aria-disabled', String(item.qty >= MAX_QTY));
  line.remove.setAttribute('aria-label', `Remove ${name}${item.reserved ? ', reserved' : ''}, ${describe(item)}, from your bag`);
  line.total.textContent = formatPrice(lineTotal(item));
  line.unit.hidden = item.qty < 2;
  line.unit.textContent = `${formatPrice(priceOf(item.finish))} each`;
}

function createDrawer(dialog, store) {
  const panel = dialog.querySelector('.drawer__panel') ?? dialog;
  const list = dialog.querySelector('[data-bag-items]');
  const empty = dialog.querySelector('[data-bag-empty]');
  const subtotalEl = dialog.querySelector('[data-bag-subtotal]');
  const note = dialog.querySelector('[data-checkout-note]');
  const title = dialog.querySelector('.drawer__title') ?? dialog.querySelector('h2');
  const closeButton = dialog.querySelector('.drawer__head [data-bag-close]') ?? dialog.querySelector('button[data-bag-close]');
  const lines = new Map();
  const tweens = new Set();
  const added = [];

  let opener = null;
  let shown = false;
  let closing = false;
  let locked = false;
  let restoreFocus = true;
  let pendingHash = null;
  let closeTimer = 0;
  let downOnBackdrop = false;
  let exiting = 0;

  // Polite status inside the dialog: content outside a modal dialog is inert to assistive tech.
  const live = document.createElement('p');
  live.className = 'sr-only';
  live.setAttribute('role', 'status');
  panel.append(live);
  added.push(live);

  const count = document.createElement('p');
  count.className = 'drawer__count mono';
  title?.after(count);
  if (title) added.push(count);

  const hadTabindex = title?.hasAttribute('tabindex');
  if (title && !hadTabindex) title.setAttribute('tabindex', '-1');

  const odometer = subtotalEl
    ? createOdometer(subtotalEl, { value: store.subtotal(), format: formatPrice, turns: 0, duration: 0.6, stagger: 0.03 })
    : null;

  const track = (tween) => {
    tweens.add(tween);
    tween.eventCallback('onInterrupt', () => tweens.delete(tween));
    return tween;
  };
  const animating = () => dialog.open && !env.reducedMotion;
  let announceTimer = 0;
  const announce = (message) => {
    live.textContent = '';
    // Clearing first, then writing a beat later, makes a repeated message announce again.
    clearTimeout(announceTimer);
    announceTimer = window.setTimeout(() => {
      live.textContent = message;
    }, 60);
  };

  function syncEmpty() {
    const isEmpty = store.count() === 0;
    const showEmpty = isEmpty && exiting === 0;
    if (empty && empty.hidden === showEmpty) {
      empty.hidden = !showEmpty;
      if (showEmpty && animating()) {
        track(gsap.fromTo(empty, { opacity: 0, y: 12 }, { opacity: 1, y: 0, duration: 0.5, ease: EASE.out, clearProps: 'opacity,transform' }));
      }
    }
    dialog.classList.toggle('is-empty', isEmpty);
  }

  function enterLine(el) {
    track(gsap.fromTo(el, { opacity: 0, x: 24 }, { opacity: 1, x: 0, duration: 0.5, ease: EASE.out, clearProps: 'opacity,transform' }));
  }

  /** Fades the line out, then lets the lines below it glide up into the gap (FLIP). */
  function exitLine(el) {
    el.inert = true;
    el.classList.add('is-exiting');
    if (!animating()) {
      el.remove();
      return;
    }
    exiting += 1;
    track(
      gsap.to(el, {
        opacity: 0,
        x: 24,
        duration: 0.22,
        ease: EASE.out,
        onComplete: () => {
          const below = [];
          for (let next = el.nextElementSibling; next; next = next.nextElementSibling) below.push(next);
          const before = below.map((node) => node.getBoundingClientRect().top);
          el.remove();
          exiting -= 1;
          below.forEach((node, i) => {
            const dy = before[i] - node.getBoundingClientRect().top;
            if (dy) track(gsap.fromTo(node, { y: dy }, { y: 0, duration: 0.42, ease: EASE.out, clearProps: 'transform' }));
          });
          syncEmpty();
        },
      }),
    );
  }

  function render(items) {
    const ids = new Set(items.map((item) => item.id));
    for (const [id, line] of lines) {
      if (ids.has(id)) continue;
      lines.delete(id);
      exitLine(line.el);
    }
    for (const item of items) {
      let line = lines.get(item.id);
      if (!line) {
        line = createLine(item);
        lines.set(item.id, line);
        list?.prepend(line.el);
        if (animating()) enterLine(line.el);
      }
      updateLine(line, item);
    }
    count.textContent = piecesLabel(store.count());
    odometer?.set(store.subtotal(), { immediate: !animating() });
    syncEmpty();
  }

  function staggerLinesIn() {
    if (env.reducedMotion || !list) return;
    const els = [...list.children];
    if (!els.length) return;
    track(
      gsap.fromTo(
        els,
        { opacity: 0, x: 32 },
        { opacity: 1, x: 0, duration: 0.6, delay: 0.12, stagger: 0.05, ease: EASE.out, clearProps: 'opacity,transform' },
      ),
    );
  }

  function finishClose() {
    clearTimeout(closeTimer);
    panel.removeEventListener('transitionend', onTransitionEnd);
    if (!closing) return;
    if (dialog.open) dialog.close();
    // Blink dispatches 'close' on the next animation frame; tidy up now rather than wait for it.
    onClose();
  }

  function onTransitionEnd(event) {
    if (event.target === panel) finishClose();
  }

  function open() {
    if (dialog.open) {
      if (closing) {
        // Re-opened mid-exit: turn around from where the panel is.
        closing = false;
        clearTimeout(closeTimer);
        panel.removeEventListener('transitionend', onTransitionEnd);
        dialog.classList.add('is-open');
      }
      return;
    }
    if (shown) onClose(); // the browser closed it and its 'close' event has not landed yet
    const active = document.activeElement;
    opener = active instanceof HTMLElement && active !== document.body ? active : document.querySelector('[data-bag-open]');
    restoreFocus = true;
    pendingHash = null;
    dialog.showModal();
    shown = true;
    if (!locked) {
      lockScroll();
      locked = true;
    }
    void panel.offsetWidth; // commit the closed pose so the class change transitions
    dialog.classList.add('is-open');
    closeButton?.focus({ preventScroll: true });
    staggerLinesIn();
  }

  function close({ returnFocus = true } = {}) {
    if (!dialog.open || closing) return;
    closing = true;
    restoreFocus = returnFocus;
    dialog.classList.remove('is-open');
    panel.addEventListener('transitionend', onTransitionEnd);
    closeTimer = window.setTimeout(finishClose, CLOSE_FALLBACK_MS);
  }

  /** The dialog closed (our exit, Esc forced by the browser, or anyone calling dialog.close()). */
  function onClose() {
    if (!shown) return;
    shown = false;
    clearTimeout(closeTimer);
    panel.removeEventListener('transitionend', onTransitionEnd);
    closing = false;
    dialog.classList.remove('is-open');
    note?.classList.remove('is-flagged');
    tweens.forEach((tween) => tween.progress(1));
    tweens.clear();
    if (locked) {
      unlockScroll();
      locked = false;
    }
    if (pendingHash) {
      const target = document.getElementById(decodeURIComponent(pendingHash.slice(1)));
      pendingHash = null;
      if (target) scrollToTarget(target);
    } else if (restoreFocus && opener?.isConnected) {
      opener.focus({ preventScroll: true });
    }
    opener = null;
  }

  // A late 'close' event for a dialog that has since re-opened is stale.
  const onCloseEvent = () => {
    if (!dialog.open) onClose();
  };

  const onCancel = (event) => {
    event.preventDefault();
    close();
  };

  const onPointerDown = (event) => {
    downOnBackdrop = event.target === dialog;
  };

  function onClick(event) {
    // The panel fills the dialog box, so a click whose target is the dialog itself hit the backdrop.
    if (event.target === dialog) {
      if (downOnBackdrop) close();
      return;
    }
    const target = event.target instanceof Element ? event.target : null;
    if (!target) return;

    const closer = target.closest('[data-bag-close]');
    if (closer) {
      if (closer instanceof HTMLAnchorElement) {
        const url = new URL(closer.href, location.href);
        const samePage = url.origin === location.origin && url.pathname === location.pathname && url.search === location.search;
        if (samePage && url.hash) {
          // Scroll is locked until the drawer is gone; scroll to the section once it is.
          event.preventDefault();
          pendingHash = url.hash;
        }
        close({ returnFocus: false });
      } else {
        close();
      }
      return;
    }

    const step = target.closest('[data-qty-step]');
    const remove = target.closest('[data-line-remove]');
    const id = target.closest('.bag-line')?.dataset.id;
    if (step && id) {
      if (step.getAttribute('aria-disabled') === 'true') return;
      const item = store.items().find((i) => i.id === id);
      if (!item) return;
      const next = store.setQty(id, item.qty + Number(step.dataset.qtyStep));
      if (next) announce(`${nameFor(next)}, quantity ${next.qty}. Subtotal ${formatPrice(store.subtotal())}.`);
      return;
    }
    if (remove && id) {
      const item = store.items().find((i) => i.id === id);
      store.remove(id);
      title?.focus({ preventScroll: true });
      if (item) announce(`Removed ${nameFor(item)} from your bag. Subtotal ${formatPrice(store.subtotal())}.`);
      return;
    }

    if (target.closest('[data-checkout]')) {
      toast(CHECKOUT_MESSAGE, { tone: 'neutral' });
      announce(CHECKOUT_MESSAGE);
      if (note) {
        note.classList.remove('is-flagged');
        void note.offsetWidth;
        note.classList.add('is-flagged');
      }
    }
  }

  dialog.addEventListener('cancel', onCancel);
  dialog.addEventListener('close', onCloseEvent);
  dialog.addEventListener('pointerdown', onPointerDown);
  dialog.addEventListener('click', onClick);

  render(store.items());

  return {
    open,
    close,
    render,
    destroy() {
      clearTimeout(announceTimer);
      dialog.removeEventListener('cancel', onCancel);
      dialog.removeEventListener('pointerdown', onPointerDown);
      dialog.removeEventListener('click', onClick);
      restoreFocus = false;
      if (dialog.open) dialog.close();
      onClose();
      dialog.removeEventListener('close', onCloseEvent);
      tweens.forEach((tween) => tween.kill());
      lines.forEach((line) => line.el.remove());
      lines.clear();
      list?.querySelectorAll('.bag-line').forEach((node) => node.remove());
      added.forEach((node) => node.remove());
      if (title && !hadTabindex) title.removeAttribute('tabindex');
      if (empty) empty.hidden = false;
      dialog.classList.remove('is-empty');
      odometer?.destroy();
    },
  };
}

/* -------------------------------------------------------------------------- */
/* Store                                                                      */
/* -------------------------------------------------------------------------- */

/**
 * @returns {{ add(item): object|null, remove(id: string): void, setQty(id: string, n: number): object|null,
 *   items(): object[], count(): number, subtotal(): number, open(): void, close(): void,
 *   subscribe(cb: (items: object[]) => void): () => void, destroy(): void }}
 */
export function initCart() {
  let items = load();
  const subscribers = new Set();

  const emit = () => {
    const snapshot = copy(items);
    for (const cb of [...subscribers]) {
      try {
        cb(copy(snapshot));
      } catch (err) {
        console.error('[oriel] cart subscriber failed', err);
      }
    }
  };

  const commit = (next) => {
    items = next;
    save(items);
    drawer?.render(copy(items));
    emit();
  };

  const find = (id) => items.find((item) => item.id === id);

  const store = {
    /** Adds a piece. Identical non-reserved pieces merge (up to 3); a reserved piece is unique. */
    add(input) {
      const item = normalize({ qty: 1, ...input });
      if (!item) {
        console.warn('[oriel] cart.add ignored an invalid item', input);
        return null;
      }
      const existing = find(item.id);
      if (!existing) {
        commit([...items, item]);
        return { ...item };
      }
      if (existing.reserved) return { ...existing };
      const qty = Math.min(MAX_QTY, existing.qty + item.qty);
      if (existing.qty + item.qty > MAX_QTY) toast(`Each order is limited to ${MAX_QTY} pieces of one configuration.`, { tone: 'neutral' });
      if (qty !== existing.qty) commit(items.map((i) => (i.id === item.id ? { ...i, qty } : i)));
      return { ...find(item.id) };
    },
    remove(id) {
      if (find(id)) commit(items.filter((item) => item.id !== id));
    },
    /** Sets a line's quantity (clamped to 1–3); 0 or less removes it. Reserved pieces stay at 1. */
    setQty(id, n) {
      const item = find(id);
      if (!item) return null;
      const qty = Math.round(Number(n));
      if (!Number.isFinite(qty)) return { ...item };
      if (qty < 1) {
        store.remove(id);
        return null;
      }
      if (item.reserved) return { ...item };
      const clamped = Math.min(MAX_QTY, qty);
      if (clamped !== item.qty) commit(items.map((i) => (i.id === id ? { ...i, qty: clamped } : i)));
      return { ...find(id) };
    },
    items: () => copy(items),
    count: () => items.reduce((sum, item) => sum + item.qty, 0),
    subtotal: () => items.reduce((sum, item) => sum + lineTotal(item), 0),
    open: () => drawer?.open(),
    close: () => drawer?.close(),
    /** Calls cb(items) after every change (not immediately). Returns an unsubscribe function. */
    subscribe(cb) {
      if (typeof cb !== 'function') return () => {};
      subscribers.add(cb);
      return () => subscribers.delete(cb);
    },
    destroy() {
      window.removeEventListener('storage', onStorage);
      subscribers.clear();
      drawer?.destroy();
    },
  };

  // Another tab changed the bag: follow it without writing back.
  const onStorage = (event) => {
    if (event.key !== STORAGE_KEY && event.key !== null) return;
    items = event.key === null ? [] : parse(event.newValue);
    drawer?.render(copy(items));
    emit();
  };
  window.addEventListener('storage', onStorage);

  const dialog = document.getElementById('bag');
  const drawer = dialog instanceof HTMLDialogElement ? createDrawer(dialog, store) : null;

  return store;
}
