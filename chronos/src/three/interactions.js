import { gsap } from '../libs.js';
import { COMPONENTS } from '../data.js';

/** Machine section: DOM hotspots tracking 3D parts, raycast picking, drag-rotate, spec panel. */
export function initMachineInteractions(exp) {
  const { state } = exp;
  const stage = document.getElementById('machineStage');
  const layer = document.getElementById('hotspots');
  const panel = document.getElementById('specPanel');
  const t = { code: document.getElementById('specCode'), title: document.getElementById('specTitle'), desc: document.getElementById('specDesc'), list: document.getElementById('specList') };

  layer.innerHTML = COMPONENTS.map((c) => `<button type="button" class="hotspot" data-id="${c.id}" aria-label="Inspect ${c.title}"><i></i><span>${c.title.toUpperCase()}</span></button>`).join('');
  const spots = [...layer.querySelectorAll('.hotspot')];

  function select(id) {
    const c = COMPONENTS.find((x) => x.id === id);
    if (!c) return;
    state.machineFocus = id;
    spots.forEach((s) => s.classList.toggle('active', s.dataset.id === id));
    t.code.textContent = c.code; t.title.textContent = c.title; t.desc.textContent = c.desc;
    t.list.innerHTML = Object.entries(c.spec).map(([k, v]) => `<dt>${k}</dt><dd>${v}</dd>`).join('');
    panel.hidden = false;
    gsap.fromTo(panel, { opacity: 0, x: 30 }, { opacity: 1, x: 0, duration: 0.5, ease: 'power3.out' });
  }
  function close() {
    state.machineFocus = null;
    spots.forEach((s) => s.classList.remove('active'));
    gsap.to(panel, { opacity: 0, x: 30, duration: 0.3, onComplete: () => (panel.hidden = true) });
  }

  spots.forEach((s) => s.addEventListener('click', (e) => { e.stopPropagation(); select(s.dataset.id); }));
  document.getElementById('specClose').addEventListener('click', close);
  document.getElementById('resetView').addEventListener('click', () => { close(); gsap.to(state, { machineRot: 0, duration: 1, ease: 'power3.inOut' }); });
  document.getElementById('rotLeft').addEventListener('click', () => gsap.to(state, { machineRot: state.machineRot - 0.8, duration: 0.8, ease: 'power2.out' }));
  document.getElementById('rotRight').addEventListener('click', () => gsap.to(state, { machineRot: state.machineRot + 0.8, duration: 0.8, ease: 'power2.out' }));
  const labelsBtn = document.getElementById('toggleLabels');
  labelsBtn.addEventListener('click', () => {
    const on = layer.classList.toggle('no-labels');
    labelsBtn.setAttribute('aria-pressed', String(!on));
    labelsBtn.textContent = `LABELS: ${on ? 'OFF' : 'ON'}`;
  });
  panel.addEventListener('keydown', (e) => { if (e.key === 'Escape') close(); });

  // drag to rotate; a click without drag raycasts the actual 3D meshes
  let down = null;
  stage.addEventListener('pointerdown', (e) => {
    if (e.target.closest('button, .spec-panel')) return;
    down = { x: e.clientX, y: e.clientY, rot: state.machineRot, moved: false };
  });
  window.addEventListener('pointermove', (e) => {
    if (!down) return;
    const dx = e.clientX - down.x;
    if (Math.abs(dx) > 4) down.moved = true;
    state.machineRot = down.rot - dx * 0.006;
  });
  window.addEventListener('pointerup', (e) => {
    if (!down) return;
    if (!down.moved) { const id = exp.pick(e.clientX, e.clientY); if (id) select(id); }
    down = null;
  });

  // hotspot positions follow projected 3D parts — only while the section is active
  let lastVisible = false;
  function tick() {
    const active = state.section === 'machine';
    if (active !== lastVisible) { layer.style.opacity = active ? '1' : '0'; lastVisible = active; }
    if (!active) return;
    const rect = stage.getBoundingClientRect();
    spots.forEach((s) => {
      const p = exp.projectComponent(s.dataset.id);
      if (!p) return;
      s.style.transform = `translate(${(p.x - rect.left - 9).toFixed(1)}px, ${(p.y - rect.top - 9).toFixed(1)}px)`;
    });
  }
  gsap.ticker.add(tick);
  return { destroy: () => gsap.ticker.remove(tick) };
}
