// Configure: the finish and dial picker drives the live watch (or swaps the rendered poster) and adds the
// chosen configuration to the bag.
import { gsap, EASE } from '../core/motion.js';
import { env } from '../core/env.js';
import { createConfigurator } from '../ui/configurator.js';
import { toast } from '../ui/toast.js';
import { describe, editionFor, nameFor, posterFor } from '../data/catalog.js';
import { configState } from './state.js';
import { revealOnEnter } from './reveal.js';

export function initConfigure({ stage, cart }) {
  const section = document.getElementById('configure');
  const form = section.querySelector('[data-configurator]');
  const poster = section.querySelector('[data-config-poster]');

  const swapPoster = (config) => {
    if (!poster || stage) return;
    const src = posterFor(config.finish, config.dial);
    if (env.reducedMotion) {
      poster.src = src;
    } else {
      gsap.to(poster, {
        autoAlpha: 0.2,
        duration: 0.18,
        ease: EASE.out,
        overwrite: true,
        onComplete: () => {
          poster.src = src;
          gsap.to(poster, { autoAlpha: 1, duration: 0.35, ease: EASE.out });
        },
      });
    }
    poster.alt = `Calibre O-1, ${describe(config)}.`;
  };

  const configurator = createConfigurator(form, {
    initial: configState.get(),
    onChange(config) {
      configState.set(config);
      stage?.setConfig(config);
      swapPoster(config);
    },
  });

  const onSubmit = (event) => {
    event.preventDefault();
    const config = configurator.get();
    const item = cart.add({ ...config, edition: editionFor(config.finish, config.dial)?.id ?? null, reserved: false });
    if (!item) return;
    toast(`Added to your bag: ${nameFor(config)}, ${describe(config)}.`, { tone: 'success' });
    cart.open();
  };
  form.addEventListener('submit', onSubmit);

  const destroyReveal = revealOnEnter(section, {
    title: section.querySelector('.configure__title'),
    items: [section.querySelector('.configure__panel .mark'), ...section.querySelectorAll('.config__group, .config__summary, .config__actions')],
  });

  return () => {
    form.removeEventListener('submit', onSubmit);
    configurator.destroy();
    destroyReveal();
    if (poster) gsap.killTweensOf(poster);
  };
}
