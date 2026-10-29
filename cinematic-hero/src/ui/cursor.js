import gsap from 'gsap';

function isTouchDevice() {
  return window.matchMedia('(pointer: coarse)').matches;
}

// Eases the particle mesh a few degrees toward the pointer. Composes with
// the shader's own uTime rotation, which operates on vertex positions —
// this rotates the whole mesh on top of it.
export function initCursorParallax(mesh, { maxAngle = 0.12 } = {}) {
  if (isTouchDevice()) return;
  const target = { x: 0, y: 0 };
  window.addEventListener('pointermove', (e) => {
    target.x = (e.clientX / window.innerWidth - 0.5) * 2;
    target.y = (e.clientY / window.innerHeight - 0.5) * 2;
  });
  gsap.ticker.add(() => {
    mesh.rotation.y += (target.x * maxAngle - mesh.rotation.y) * 0.05;
    mesh.rotation.x += (target.y * maxAngle - mesh.rotation.x) * 0.05;
  });
}

export function initMagneticLinks(selector, { strength = 0.35 } = {}) {
  if (isTouchDevice()) return;
  document.querySelectorAll(selector).forEach((el) => {
    el.addEventListener('pointermove', (e) => {
      const r = el.getBoundingClientRect();
      const dx = e.clientX - (r.left + r.width / 2);
      const dy = e.clientY - (r.top + r.height / 2);
      gsap.to(el, { x: dx * strength, y: dy * strength, duration: 0.3 });
    });
    el.addEventListener('pointerleave', () => {
      gsap.to(el, { x: 0, y: 0, duration: 0.5, ease: 'elastic.out(1, 0.4)' });
    });
  });
}
