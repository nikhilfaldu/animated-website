// Site nav: bag count, hide-on-scroll, the full-screen menu dialog, current-section links and
// same-page #hash links (smooth scroll, then focus the target).
import { gsap, EASE, scrollToTarget, lockScroll, unlockScroll, getLenis } from '../core/motion.js';
import { env } from '../core/env.js';

/**
 * @param {{ cart?: { count(): number, open(): void, subscribe(cb: Function): () => void } }} options
 * @returns {() => void} destroy
 */
export function initNav({ cart } = {}) {
  const nav = document.querySelector('[data-nav]');
  if (!nav) return () => {};

  const focus = createFocusManager();
  const menu = createMenu(nav, focus);
  const parts = [
    initBag(nav, cart),
    initAutoHide(nav, menu.isOpen),
    initHashLinks(focus),
    initCurrentSection([...nav.querySelectorAll('.nav__link'), ...menu.links]),
    menu.destroy,
    focus.destroy,
  ];

  return function destroy() {
    parts.forEach((fn) => fn());
  };
}

/* ---------- Bag ---------- */

function initBag(nav, cart) {
  const button = nav.querySelector('[data-bag-open]');
  if (!button || !cart) return () => {};
  const badge = button.querySelector('[data-bag-count]');
  const label = button.querySelector('[data-bag-count-label]');
  let shown = null;

  const render = (animate) => {
    const n = Math.max(0, Number(cart.count()) || 0);
    if (n === shown) return;
    shown = n;
    if (badge) badge.textContent = n > 99 ? '99+' : String(n);
    if (label) label.textContent = n === 0 ? ', empty' : `, ${n} ${n === 1 ? 'item' : 'items'}`;
    button.classList.toggle('has-items', n > 0);
    if (animate && n > 0 && badge && !env.reducedMotion) {
      gsap.fromTo(badge, { scale: 1.55 }, { scale: 1, duration: 0.55, ease: EASE.out, overwrite: true });
    }
  };

  render(false);
  const unsubscribe = cart.subscribe(() => render(true));
  const onClick = () => cart.open();
  button.addEventListener('click', onClick);

  return () => {
    unsubscribe?.();
    button.removeEventListener('click', onClick);
    if (badge) gsap.killTweensOf(badge);
  };
}

/* ---------- Hide on scroll down, reveal on scroll up ---------- */

function initAutoHide(nav, isPinned) {
  const ALWAYS_SHOWN_ABOVE = 120;
  const MIN_DELTA = 8;
  let lastY = Math.max(0, scrollY);
  let hidden = false;
  let focusInside = false;
  let raf = 0;

  const setHidden = (value) => {
    if (value === hidden) return;
    hidden = value;
    nav.classList.toggle('is-hidden', value);
  };

  const check = () => {
    raf = 0;
    const y = Math.max(0, scrollY);
    if (y < ALWAYS_SHOWN_ABOVE || focusInside || isPinned()) {
      setHidden(false);
      lastY = y;
      return;
    }
    if (Math.abs(y - lastY) < MIN_DELTA) return;
    setHidden(y > lastY);
    lastY = y;
  };

  const onScroll = () => (raf ||= requestAnimationFrame(check));
  const onFocusIn = () => {
    focusInside = true;
    setHidden(false);
  };
  const onFocusOut = (e) => {
    focusInside = nav.contains(e.relatedTarget);
  };

  addEventListener('scroll', onScroll, { passive: true });
  nav.addEventListener('focusin', onFocusIn);
  nav.addEventListener('focusout', onFocusOut);

  return () => {
    cancelAnimationFrame(raf);
    removeEventListener('scroll', onScroll);
    nav.removeEventListener('focusin', onFocusIn);
    nav.removeEventListener('focusout', onFocusOut);
    nav.classList.remove('is-hidden');
  };
}

/* ---------- Menu dialog ---------- */

function createMenu(nav, focus) {
  const dialog = document.getElementById('menu');
  const opener = nav.querySelector('[data-menu-open]');
  if (!dialog || !opener || typeof dialog.showModal !== 'function') {
    return { links: [], isOpen: () => false, destroy() {} };
  }

  const ac = new AbortController();
  const { signal } = ac;
  const panel = dialog.querySelector('.menu__inner') ?? dialog;
  const links = [...dialog.querySelectorAll('.menu__link')];
  const wide = matchMedia('(min-width: 900px)');
  const passThrough = new WeakSet();
  let tl = null;
  let locked = false;
  let waiters = [];

  const timeline = () => (tl ??= buildMenuTimeline(dialog, panel, () => dialog.open && dialog.close()));

  function open() {
    if (!dialog.open) dialog.showModal();
    if (!locked) {
      lockScroll();
      locked = true;
    }
    opener.setAttribute('aria-expanded', 'true');
    timeline().timeScale(1).play();
  }

  /** Plays the entry backwards, then closes the dialog. Resolves once it is closed. */
  function close() {
    if (!dialog.open) return Promise.resolve();
    opener.setAttribute('aria-expanded', 'false');
    const closed = new Promise((resolve) => waiters.push(resolve));
    const t = timeline();
    if (t.progress() === 0) dialog.close();
    else t.timeScale(1.8).reverse();
    return closed;
  }

  // Runs for every close, including ones we did not start (dialog.close() from elsewhere).
  function onClosed() {
    tl?.pause(0);
    opener.setAttribute('aria-expanded', 'false');
    if (locked) {
      unlockScroll();
      locked = false;
    }
    const pending = waiters.splice(0);
    if (!pending.length || document.activeElement === document.body) opener.focus({ preventScroll: true });
    pending.forEach((resolve) => resolve());
  }

  opener.addEventListener('click', open, { signal });
  dialog.querySelector('[data-menu-close]')?.addEventListener('click', () => close(), { signal });
  dialog.addEventListener(
    'cancel',
    (e) => {
      e.preventDefault();
      close();
    },
    { signal },
  );
  dialog.addEventListener('close', onClosed, { signal });
  wide.addEventListener('change', (e) => e.matches && close(), { signal });

  // Links close the menu first, then scroll (same page) or carry on to the other page.
  dialog.addEventListener(
    'click',
    (e) => {
      const link = e.target instanceof Element ? e.target.closest('a[href]') : null;
      if (!link || isModifiedClick(e)) return;
      if (passThrough.has(link)) {
        passThrough.delete(link);
        return;
      }
      e.preventDefault();
      e.stopPropagation();
      const url = new URL(link.href, location.href);
      close().then(() => {
        const target = url.hash && isSamePage(url) ? hashTarget(url.hash) : null;
        if (target) {
          goToHash(target, url.hash, focus);
        } else {
          passThrough.add(link);
          link.click();
        }
      });
    },
    { signal },
  );

  return {
    links,
    isOpen: () => dialog.open,
    destroy() {
      ac.abort();
      tl?.kill();
      gsap.set(dialog.querySelectorAll('.menu__inner, .menu__top, .menu__foot, .menu__text, .menu__num'), { clearProps: 'all' });
      if (dialog.open) dialog.close();
      if (locked) unlockScroll();
      locked = false;
      opener.setAttribute('aria-expanded', 'false');
    },
  };
}

function buildMenuTimeline(dialog, panel, onReverseComplete) {
  const tl = gsap.timeline({ paused: true, onReverseComplete });
  if (env.reducedMotion) {
    return tl.fromTo(panel, { opacity: 0 }, { opacity: 1, duration: 0.18, ease: EASE.out });
  }
  const chrome = dialog.querySelectorAll('.menu__top, .menu__foot');
  const texts = dialog.querySelectorAll('.menu__text');
  const nums = dialog.querySelectorAll('.menu__num');
  return tl
    .fromTo(panel, { clipPath: 'inset(0% 0% 100% 0%)' }, { clipPath: 'inset(0% 0% 0% 0%)', duration: 0.45, ease: EASE.drawer })
    .fromTo(chrome, { opacity: 0 }, { opacity: 1, duration: 0.35, ease: EASE.out }, 0.16)
    .fromTo(texts, { yPercent: 110 }, { yPercent: 0, duration: 0.7, ease: EASE.out, stagger: 0.05 }, 0.12)
    .fromTo(nums, { opacity: 0, yPercent: 80 }, { opacity: 1, yPercent: 0, duration: 0.5, ease: EASE.out, stagger: 0.05 }, 0.2);
}

/* ---------- Same-page #hash links ---------- */

function initHashLinks(focus) {
  const onClick = (e) => {
    if (e.defaultPrevented || isModifiedClick(e)) return;
    const link = e.target instanceof Element ? e.target.closest('a[href]') : null;
    if (!link || (link.target && link.target !== '_self') || link.hasAttribute('download')) return;
    const url = new URL(link.href, location.href);
    if (!url.hash || !isSamePage(url)) return;
    const target = hashTarget(url.hash);
    if (!target) return;

    e.preventDefault();
    // A link inside another open dialog (the bag): its owner closes it; scroll once it has.
    const dialog = link.closest('dialog');
    if (dialog?.open) {
      whenClosed(dialog).then((closed) => closed && goToHash(target, url.hash, focus));
    } else {
      goToHash(target, url.hash, focus);
    }
  };

  document.addEventListener('click', onClick);
  return () => document.removeEventListener('click', onClick);
}

async function goToHash(target, hash, focus) {
  await whenScrollable();
  // A pinned section is measured through its spacer, which keeps its place in the flow.
  const anchor = target.parentElement?.classList.contains('pin-spacer') ? target.parentElement : target;
  scrollToTarget(anchor, { immediate: env.reducedMotion });
  if (location.hash !== hash) history.pushState(null, '', hash);
  focus.moveTo(target);
}

function createFocusManager() {
  const FOCUSABLE = 'a[href], button, input, select, textarea, summary, [tabindex]';
  const temporary = new Set();

  const restore = (el) => {
    el.removeAttribute('tabindex');
    el.removeAttribute('data-hash-focus');
    temporary.delete(el);
  };

  return {
    /** Moves focus to `el` without scrolling, adding a temporary tabindex when it needs one. */
    moveTo(el) {
      if (!el.matches(FOCUSABLE)) {
        el.setAttribute('tabindex', '-1');
        el.setAttribute('data-hash-focus', '');
        temporary.add(el);
        el.addEventListener('blur', () => restore(el), { once: true });
      }
      el.focus({ preventScroll: true });
    },
    destroy() {
      temporary.forEach(restore);
    },
  };
}

/** Resolves true when the dialog closes, false if it is still open after `timeout` ms. */
function whenClosed(dialog, timeout = 1500) {
  return new Promise((resolve) => {
    const timer = setTimeout(() => {
      dialog.removeEventListener('close', onClose);
      resolve(!dialog.open);
    }, timeout);
    const onClose = () => {
      clearTimeout(timer);
      requestAnimationFrame(() => resolve(true));
    };
    dialog.addEventListener('close', onClose, { once: true });
  });
}

/** Waits (briefly) until no scroll lock is holding Lenis, so scrollTo is not ignored. */
function whenScrollable(timeout = 1200) {
  return new Promise((resolve) => {
    const started = performance.now();
    const check = () => {
      if (!getLenis()?.isStopped || performance.now() - started > timeout) resolve();
      else requestAnimationFrame(check);
    };
    check();
  });
}

/* ---------- aria-current on the links of the section in view ---------- */

function initCurrentSection(links) {
  const groups = new Map();
  for (const link of links) {
    const url = new URL(link.href, location.href);
    const section = url.hash && isSamePage(url) ? hashTarget(url.hash) : null;
    if (!section) continue;
    if (!groups.has(section)) groups.set(section, []);
    groups.get(section).push(link);
  }
  if (!groups.size) return () => {};

  const sections = [...groups.keys()].sort((a, b) => (a.compareDocumentPosition(b) & Node.DOCUMENT_POSITION_FOLLOWING ? -1 : 1));
  const inView = new Set();
  let current;

  const apply = () => {
    const next = sections.filter((s) => inView.has(s)).pop() ?? null;
    if (next === current) return;
    current = next;
    groups.forEach((list, section) =>
      list.forEach((link) => (section === next ? link.setAttribute('aria-current', 'true') : link.removeAttribute('aria-current'))),
    );
  };

  // A thin band just above the middle of the viewport decides which section is "in view".
  const io = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => (entry.isIntersecting ? inView.add(entry.target) : inView.delete(entry.target)));
      apply();
    },
    { rootMargin: '-45% 0px -54% 0px' },
  );
  sections.forEach((section) => io.observe(section));

  return () => {
    io.disconnect();
    groups.forEach((list) => list.forEach((link) => link.removeAttribute('aria-current')));
  };
}

/* ---------- Helpers ---------- */

const isModifiedClick = (e) => e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey;

const cleanPath = (path) => path.replace(/index\.html$/, '');

function isSamePage(url) {
  return url.origin === location.origin && cleanPath(url.pathname) === cleanPath(location.pathname);
}

function hashTarget(hash) {
  try {
    return document.getElementById(decodeURIComponent(hash.slice(1)));
  } catch {
    return null;
  }
}
