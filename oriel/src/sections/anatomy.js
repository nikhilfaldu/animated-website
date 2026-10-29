// Anatomy: the section pins while the director explodes the watch. Each label rises as its own layer
// separates, and a leader line runs from the layer's rim to its label.
import { gsap, ScrollTrigger } from '../core/motion.js';
import { env } from '../core/env.js';
import { layerReveal } from '../three/poses.js';
import { revealOnEnter } from './reveal.js';

const SVG = 'http://www.w3.org/2000/svg';

export function initAnatomy({ stage }) {
  const section = document.getElementById('anatomy');
  const pinEl = section.querySelector('[data-anatomy-pin]');
  const items = [...section.querySelectorAll('[data-layer]')];
  const svg = section.querySelector('[data-leaders]');
  const cleanups = [revealOnEnter(section, { title: section.querySelector('.anatomy__title'), items: [section.querySelector('.anatomy__head .mark')] })];

  if (env.reducedMotion || !stage) {
    section.classList.add('is-static');
    return { destroy: () => cleanups.forEach((fn) => fn()) };
  }

  const pin = ScrollTrigger.create({ trigger: section, start: 'top top', end: '+=260%', pin: pinEl, pinSpacing: true });

  // One leader per layer: an elbow path and an anchor dot.
  const leaders = items.map(() => {
    const path = document.createElementNS(SVG, 'path');
    const dot = document.createElementNS(SVG, 'circle');
    dot.setAttribute('r', '3');
    svg.append(path, dot);
    return { path, dot };
  });

  let targets = [];
  const measure = () => {
    const box = svg.getBoundingClientRect();
    targets = items.map((li) => {
      const r = li.querySelector('.layer__index').getBoundingClientRect();
      return { x: r.left - box.left - 14, y: r.top + r.height / 2 - box.top };
    });
  };
  const onRefresh = () => requestAnimationFrame(measure);
  ScrollTrigger.addEventListener('refresh', onRefresh);
  measure();

  const states = items.map(() => -1);
  const offFrame = stage.onFrame(() => {
    const active = pin.isActive || (window.scrollY > pin.start - window.innerHeight && window.scrollY < pin.end + window.innerHeight * 0.5);
    svg.style.opacity = active ? '1' : '0';
    if (!active) return;
    const explode = stage.getPose().explode;
    const box = svg.getBoundingClientRect();
    let current = -1;
    items.forEach((li, i) => {
      const id = li.dataset.layer;
      const t = layerReveal(explode, id);
      if (t > 0.5) current = i;
      const rounded = Math.round(t * 100) / 100;
      if (rounded !== states[i]) {
        states[i] = rounded;
        li.style.opacity = String(0.12 + 0.88 * rounded);
        li.style.transform = `translate3d(${(1 - rounded) * 24}px, 0, 0)`;
      }
      const { path, dot } = leaders[i];
      const p = stage.project(id);
      if (!p.visible || t < 0.02 || !targets[i]) {
        path.style.opacity = dot.style.opacity = '0';
        return;
      }
      const ax = p.x - box.left;
      const ay = p.y - box.top;
      const { x, y } = targets[i];
      const elbow = Math.max(ax + 24, x - 56);
      path.setAttribute('d', `M${ax.toFixed(1)} ${ay.toFixed(1)} L${elbow.toFixed(1)} ${y.toFixed(1)} L${x.toFixed(1)} ${y.toFixed(1)}`);
      dot.setAttribute('cx', ax.toFixed(1));
      dot.setAttribute('cy', ay.toFixed(1));
      path.style.opacity = dot.style.opacity = String(t);
    });
    items.forEach((li, i) => li.classList.toggle('is-current', i === current));
  });

  return {
    pin,
    destroy() {
      offFrame();
      ScrollTrigger.removeEventListener('refresh', onRefresh);
      pin.kill();
      leaders.forEach(({ path, dot }) => (path.remove(), dot.remove()));
      items.forEach((li) => {
        li.style.opacity = li.style.transform = '';
        li.classList.remove('is-current');
      });
      cleanups.forEach((fn) => fn());
      gsap.set(svg, { clearProps: 'opacity' });
    },
  };
}
