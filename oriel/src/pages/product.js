// Product page: resolves the configuration from the URL, keeps every label, price and spec in sync with
// the configurator, and drives the turntable viewer (view presets + drag).
import { gsap, EASE } from '../core/motion.js';
import { env } from '../core/env.js';
import { createConfigurator } from '../ui/configurator.js';
import { createOdometer } from '../ui/odometer.js';
import { toast } from '../ui/toast.js';
import { POSES } from '../three/poses.js';
import {
  DEFAULT_CONFIG,
  DIALS,
  EDITIONS,
  FINISHES,
  describe,
  editionFor,
  findDial,
  findEdition,
  findFinish,
  formatPrice,
  posterFor,
  priceOf,
  productHref,
} from '../data/catalog.js';

function configFromUrl() {
  const params = new URLSearchParams(location.search);
  const edition = findEdition(params.get('edition'));
  if (edition) return { finish: edition.finish, dial: edition.dial };
  const finish = FINISHES.some((f) => f.id === params.get('finish')) ? params.get('finish') : DEFAULT_CONFIG.finish;
  const dial = DIALS.some((d) => d.id === params.get('dial')) ? params.get('dial') : DEFAULT_CONFIG.dial;
  return { finish, dial };
}

export function initProductPage({ stage, cart }) {
  const page = document.querySelector('[data-product]');
  const $ = (selector) => page.querySelector(selector);
  const nameEls = page.querySelectorAll('[data-product-name]');
  const crumb = $('[data-product-crumb]');
  const tagline = $('[data-product-tagline]');
  const desc = $('[data-product-desc]');
  const poster = $('[data-product-poster]');
  const viewport = $('[data-product-viewport]');
  const hint = $('[data-product-hint]');
  const form = $('[data-configurator]');
  const nextLink = $('[data-next-link]');
  const nextName = $('[data-next-name]');
  const cleanups = [];

  let config = configFromUrl();
  const price = createOdometer($('[data-product-price]'), { value: priceOf(config.finish), format: formatPrice });

  function render({ finish, dial }, { first = false } = {}) {
    const edition = editionFor(finish, dial);
    const name = edition?.name ?? 'Calibre O-1';
    nameEls.forEach((el) => (el.textContent = name));
    if (crumb) crumb.textContent = name;
    if (tagline) tagline.textContent = edition?.tagline ?? 'Made to order.';
    if (desc) desc.textContent = edition?.description ?? `${describe({ finish, dial })}: a combination outside the three editions, built to order.`;
    document.title = `${name} · Calibre O-1 — ORIEL`;

    const f = findFinish(finish);
    const d = findDial(dial);
    page.querySelector('[data-spec-material]').textContent = f.material;
    page.querySelector('[data-spec-dial]').textContent = `${d.name}, ${d.description.toLowerCase()}`;
    page.querySelector('[data-spec-strap]').textContent = `${d.strap}, 20 mm, pin buckle`;

    price.set(priceOf(finish), { immediate: first });

    if (poster) {
      poster.src = posterFor(finish, dial);
      poster.alt = `${name}: ${describe({ finish, dial })}.`;
    }

    // The next edition after this one (or the first, for made-to-order combinations).
    const index = EDITIONS.findIndex((e) => e.id === edition?.id);
    const next = EDITIONS[(index + 1) % EDITIONS.length];
    if (nextLink) {
      nextLink.href = productHref(next);
      nextLink.dataset.poster = posterFor(next.finish, next.dial);
    }
    if (nextName) nextName.textContent = next.name;
  }

  const configurator = createConfigurator(form, {
    initial: config,
    onChange(next) {
      config = next;
      render(config);
      stage?.setConfig(config);
      history.replaceState(null, '', productHref(config));
    },
  });
  configurator.set(config, { silent: true });
  render(config, { first: true });
  cleanups.push(() => configurator.destroy(), () => price.destroy());

  const onSubmit = (event) => {
    event.preventDefault();
    const added = cart.add({ ...configurator.get(), reserved: false });
    if (!added) return;
    toast(`Added to your bag: ${describe(added)}.`, { tone: 'success' });
    cart.open();
  };
  form.addEventListener('submit', onSubmit);
  cleanups.push(() => form.removeEventListener('submit', onSubmit));

  // Turntable viewer.
  if (stage) {
    stage.setConfig(config, { immediate: true });
    stage.setPose({ ...POSES.productFront, spin: 0 }, { immediate: true });
    const buttons = [...page.querySelectorAll('[data-view]')];
    const onView = (event) => {
      const button = event.currentTarget;
      const pose = POSES[button.dataset.view];
      if (!pose) return;
      stage.setPose(pose);
      buttons.forEach((b) => b.setAttribute('aria-pressed', String(b === button)));
    };
    buttons.forEach((b) => b.addEventListener('click', onView));
    cleanups.push(() => buttons.forEach((b) => b.removeEventListener('click', onView)));

    cleanups.push(stage.enableDrag(viewport));
    const onFirstDrag = () => {
      hint?.classList.add('is-done');
      viewport.removeEventListener('pointerdown', onFirstDrag);
    };
    viewport.addEventListener('pointerdown', onFirstDrag);
    cleanups.push(() => viewport.removeEventListener('pointerdown', onFirstDrag));
  }

  // Next edition: a small poster follows the pointer while hovering the big link.
  if (nextLink && env.finePointer && !env.reducedMotion) {
    const thumb = document.createElement('img');
    thumb.className = 'next__thumb';
    thumb.alt = '';
    thumb.setAttribute('aria-hidden', 'true');
    nextLink.append(thumb);
    const x = gsap.quickTo(thumb, 'x', { duration: 0.5, ease: EASE.out });
    const y = gsap.quickTo(thumb, 'y', { duration: 0.5, ease: EASE.out });
    const move = (e) => {
      const r = nextLink.getBoundingClientRect();
      x(e.clientX - r.left);
      y(e.clientY - r.top);
    };
    const enter = (e) => {
      thumb.src = nextLink.dataset.poster;
      const r = nextLink.getBoundingClientRect();
      gsap.set(thumb, { x: e.clientX - r.left, y: e.clientY - r.top });
      nextLink.classList.add('is-hovered');
    };
    const leave = () => nextLink.classList.remove('is-hovered');
    nextLink.addEventListener('pointerenter', enter);
    nextLink.addEventListener('pointermove', move);
    nextLink.addEventListener('pointerleave', leave);
    cleanups.push(() => {
      nextLink.removeEventListener('pointerenter', enter);
      nextLink.removeEventListener('pointermove', move);
      nextLink.removeEventListener('pointerleave', leave);
      thumb.remove();
    });
  }

  // Intro: everything stays readable and usable; it only settles into place.
  const parts = [$('.crumbs'), $('.product__info .mark'), $('.product__title'), tagline, desc, $('.product__price'), ...form.querySelectorAll('.config__group, .config__actions'), $('.assurances'), $('.specs')].filter(Boolean);
  const media = $('.product__media');
  if (!env.reducedMotion) {
    gsap.set(parts, { autoAlpha: 0, y: 20 });
    gsap.set(media, { autoAlpha: 0, scale: 0.96 });
  }
  cleanups.push(() => gsap.set([...parts, media], { clearProps: 'all' }));

  return {
    playIntro() {
      const tl = gsap.timeline();
      if (env.reducedMotion) return tl;
      tl.to(media, { autoAlpha: 1, scale: 1, duration: 1.2, ease: EASE.out }, 0)
        .to(parts, { autoAlpha: 1, y: 0, duration: 0.8, ease: EASE.out, stagger: 0.05 }, 0.15);
      return tl;
    },
    destroy() {
      cleanups.forEach((fn) => fn());
    },
  };
}
