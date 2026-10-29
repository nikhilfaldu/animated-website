// Reserve: holding the button puts a numbered piece of the current configuration into the bag.
import { toast } from '../ui/toast.js';
import { describe, editionFor, formatPrice, priceOf } from '../data/catalog.js';
import { configState } from './state.js';
import { revealOnEnter } from './reveal.js';

const EDITION_SIZE = 300;

/** A piece number not already reserved in this bag. */
function freeNumber(cart) {
  const taken = new Set(cart.items().filter((i) => i.reserved && i.number).map((i) => i.number));
  for (let tries = 0; tries < 50; tries++) {
    const n = 1 + Math.floor(Math.random() * EDITION_SIZE);
    if (!taken.has(n)) return n;
  }
  return null;
}

export function initReserve({ cart }) {
  const section = document.getElementById('reserve');
  const label = section.querySelector('[data-reserve-config]');
  const hold = section.querySelector('[data-hold]');
  const alt = section.querySelector('[data-reserve-add]');

  const render = (config) => {
    if (label) label.textContent = `${describe(config)} · ${formatPrice(priceOf(config.finish))}`;
  };
  render(configState.get());
  const unsubscribe = configState.subscribe(render);

  const item = (reserved) => {
    const config = configState.get();
    return { ...config, edition: editionFor(config.finish, config.dial)?.id ?? null, reserved, number: reserved ? freeNumber(cart) : null };
  };

  const onHold = () => {
    const added = cart.add(item(true));
    if (!added) return;
    toast(added.number ? `Reserved · No. ${added.number} of ${EDITION_SIZE}` : 'Reserved', { tone: 'success' });
    cart.open();
  };
  const onAdd = () => {
    const added = cart.add(item(false));
    if (!added) return;
    toast(`Added to your bag: ${describe(added)}.`, { tone: 'success' });
    cart.open();
  };
  hold?.addEventListener('hold:complete', onHold);
  alt?.addEventListener('click', onAdd);

  const destroyReveal = revealOnEnter(section, {
    title: section.querySelector('.reserve__title'),
    items: [section.querySelector('.reserve__copy .mark'), section.querySelector('.reserve__lead'), section.querySelector('.reserve__config'), section.querySelector('.reserve__action')],
  });

  return () => {
    unsubscribe();
    hold?.removeEventListener('hold:complete', onHold);
    alt?.removeEventListener('click', onAdd);
    destroyReveal();
  };
}
