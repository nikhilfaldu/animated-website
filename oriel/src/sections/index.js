// Index page: wires every chapter, then the director (after the pins exist, so their spacing is measured).
import { ScrollTrigger } from '../core/motion.js';
import { initHero } from './hero.js';
import { initManifesto } from './manifesto.js';
import { initAnatomy } from './anatomy.js';
import { initMovement } from './movement.js';
import { initConfigure } from './configure.js';
import { initNumbers } from './numbers.js';
import { initEditions } from './editions.js';
import { initReserve } from './reserve.js';
import { createDirector } from './director.js';

export function initSections({ stage, cart }) {
  const hero = initHero();
  const destroyManifesto = initManifesto();
  const anatomy = initAnatomy({ stage });
  const movement = initMovement({ stage });
  const destroyConfigure = initConfigure({ stage, cart });
  const destroyNumbers = initNumbers();
  const destroyEditions = initEditions();
  const destroyReserve = initReserve({ cart });
  ScrollTrigger.refresh();
  const director = createDirector(stage, { pins: { anatomy: anatomy.pin, movement: movement.pin } });

  return {
    playIntro: () => hero.playIntro(director.intro()),
    destroy() {
      director.destroy();
      destroyReserve();
      destroyEditions();
      destroyNumbers();
      destroyConfigure();
      movement.destroy();
      anatomy.destroy();
      destroyManifesto();
      hero.destroy();
    },
  };
}
