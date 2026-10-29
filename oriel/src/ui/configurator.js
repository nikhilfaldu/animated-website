// Enhances a [data-configurator] radio form (finish + dial): keeps its summary (name, description,
// rolling price, details link) in step with the checked chips. Submitting is left to the page.
import { gsap, EASE } from '../core/motion.js';
import { env } from '../core/env.js';
import { DEFAULT_CONFIG, FINISHES, DIALS, priceOf, formatPrice, productHref, nameFor, describe } from '../data/catalog.js';
import { createOdometer } from './odometer.js';

const VALID = { finish: new Set(FINISHES.map((f) => f.id)), dial: new Set(DIALS.map((d) => d.id)) };
const KEYS = ['finish', 'dial'];

/**
 * @param {HTMLFormElement} form
 * @param {{ initial?: { finish?: string, dial?: string }, onChange?: (config: { finish: string, dial: string }) => void }} [options]
 * @returns {{ get(): { finish: string, dial: string }, set(config: object, options?: { silent?: boolean }): void, destroy(): void }}
 */
export function createConfigurator(form, { initial, onChange } = {}) {
  const nameEl = form.querySelector('[data-config-name]');
  const descEl = form.querySelector('[data-config-desc]');
  const priceEl = form.querySelector('[data-config-price]');
  const linkEl = form.querySelector('[data-config-link]');
  const tweens = new Set();

  const read = () => {
    const config = {};
    for (const key of KEYS) {
      const value = form.elements[key]?.value;
      config[key] = VALID[key].has(value) ? value : DEFAULT_CONFIG[key];
    }
    return config;
  };

  const check = (config = {}) => {
    for (const key of KEYS) {
      const value = config[key];
      if (!VALID[key].has(value)) continue;
      const input = [...form.querySelectorAll(`input[type="radio"][name="${key}"]`)].find((i) => i.value === value);
      if (input) input.checked = true;
    }
  };

  check(initial);
  let current = read();
  const odometer = priceEl ? createOdometer(priceEl, { value: priceOf(current.finish), format: formatPrice }) : null;

  /** Text swap that rises into place; instant under reduced motion or on first render. */
  function swapText(el, text, { animate, delay = 0 }) {
    if (!el || el.textContent === text) return;
    el.textContent = text;
    if (!animate) return;
    const tween = gsap.fromTo(
      el,
      { opacity: 0, y: 8 },
      { opacity: 1, y: 0, duration: 0.5, delay, ease: EASE.out, clearProps: 'opacity,transform', onComplete: () => tweens.delete(tween) },
    );
    tweens.add(tween);
  }

  function render({ immediate = false } = {}) {
    const animate = !immediate && !env.reducedMotion;
    swapText(nameEl, nameFor(current), { animate });
    swapText(descEl, describe(current), { animate, delay: 0.04 });
    odometer?.set(priceOf(current.finish), { immediate });
    if (linkEl) linkEl.href = productHref(current);
  }

  const onFormChange = (event) => {
    if (!KEYS.includes(event.target?.name)) return;
    current = read();
    render();
    onChange?.({ ...current });
  };

  form.addEventListener('change', onFormChange);
  render({ immediate: true });

  return {
    get: () => ({ ...current }),
    set(config, { silent = false } = {}) {
      check(config);
      current = read();
      render();
      if (!silent) onChange?.({ ...current });
    },
    destroy() {
      form.removeEventListener('change', onFormChange);
      tweens.forEach((tween) => tween.kill());
      tweens.clear();
      if (nameEl) gsap.set([nameEl, descEl].filter(Boolean), { clearProps: 'opacity,transform' });
      odometer?.destroy();
    },
  };
}
