import * as THREE from 'three';
import gsap from 'gsap';
import { getDeviceTier } from './deviceTier.js';
import { ParticleField } from './ParticleField.js';
import { createRenderer } from './renderer.js';
import { initCursorParallax } from '../ui/cursor.js';
import { initClickRipple } from '../ui/ripple.js';
import { computeFps, createStatsHud } from '../ui/navbar.js';

// Everything that needs three.js lives behind this entry point so the
// library ends up in a lazily loaded chunk (see the dynamic import in
// main.js, which only loads this module for non-reduced-motion visitors).
export function initScene({ canvas, getScrollProgress }) {
  const tier = getDeviceTier({
    width: window.innerWidth,
    cores: navigator.hardwareConcurrency || 4,
  });

  const particleField = new ParticleField({ count: tier.particleCount });
  const { scene, composer, camera } = createRenderer(canvas, { bloom: tier.bloom });
  scene.add(particleField.mesh);

  const hud = createStatsHud({ particleCount: tier.particleCount });
  const clock = new THREE.Clock();

  function animate() {
    const delta = clock.getDelta();
    particleField.update(delta);
    hud.updateStats({ fps: computeFps(delta), scrollProgress: getScrollProgress() });
    composer.render();
    requestAnimationFrame(animate);
  }
  requestAnimationFrame(animate);

  const assembly = { value: 0 };
  const assemblyTween = gsap.to(assembly, {
    value: 1,
    duration: 1.8,
    ease: 'power3.out',
    onUpdate: () => particleField.setAssembly(assembly.value),
  });

  initCursorParallax(particleField.mesh);
  initClickRipple({
    heroEl: document.getElementById('hero'),
    mesh: particleField.mesh,
    camera,
    particleField,
  });

  if (import.meta.hot) {
    import.meta.hot.dispose(() => {
      if (assemblyTween) assemblyTween.kill();
      particleField.dispose();
    });
  }

  return {
    setProgress(progress) {
      particleField.setProgress(progress);
      document.documentElement.style.setProperty('--scene-tint', particleField.getTintCss());
    },
  };
}
