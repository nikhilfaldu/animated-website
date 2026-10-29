import { gsap } from '../libs.js';

const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
const EMPTY = [];

/**
 * Journey eras as explorable 3D scenes: drag to look around, beacons track landmarks,
 * clicking a beacon or the mesh itself turns the camera to it and opens an inspect card.
 */
export function initEraInteractions(exp) {
  const { state } = exp;
  const stage = document.querySelector('.journey-pin');
  const layer = document.getElementById('eraHotspots');
  const card = document.getElementById('eraCard');
  const hint = document.getElementById('eraHint');
  const t = { title: document.getElementById('eraCardTitle'), desc: document.getElementById('eraCardDesc'), list: document.getElementById('eraCardList') };
  const dur = (d) => (state.reduced ? 0 : d);

  let landmarks = [];
  let spots = [];
  let current = null;
  let shownFor = null;   // landmarks array the beacons were built for

  function build(list) {
    landmarks = list; shownFor = list;
    layer.innerHTML = list.map((l) => `<button type="button" class="hotspot" data-key="${l.key}" aria-label="Inspect ${l.title}"><i></i><span>${l.title.toUpperCase()}</span></button>`).join('');
    spots = [...layer.querySelectorAll('.hotspot')];
    spots.forEach((s) => s.addEventListener('click', (e) => { e.stopPropagation(); select(s.dataset.key, true); }));
  }

  function select(key, turn) {
    const l = landmarks.find((x) => x.key === key);
    if (!l) return;
    current = key;
    spots.forEach((s) => s.classList.toggle('active', s.dataset.key === key));
    t.title.textContent = l.title; t.desc.textContent = l.desc;
    t.list.innerHTML = Object.entries(l.spec).map(([k, v]) => `<dt>${k}</dt><dd>${v}</dd>`).join('');
    gsap.killTweensOf(card);   // a pending close() must not hide the card we're opening
    card.hidden = false;
    stage.classList.add('inspecting');
    gsap.fromTo(card, { opacity: 0, y: -16 }, { opacity: 1, y: 0, duration: dur(0.5), ease: 'power3.out' });
    if (turn) {
      const a = exp.focusAngles(l.object);
      gsap.to(state, { lookYaw: clamp(a.yaw, -Math.PI, Math.PI), lookPitch: clamp(a.pitch, -0.6, 1.2), duration: dur(1.2), ease: 'power3.inOut', overwrite: true });
    }
    if (!state.reduced) {
      const s = l.object.scale; const base = (l.object.userData.baseScale ??= s.x);
      gsap.killTweensOf(s);
      gsap.timeline().to(s, { x: base * 1.12, y: base * 1.12, z: base * 1.12, duration: 0.25, ease: 'power2.out' })
        .to(s, { x: base, y: base, z: base, duration: 0.9, ease: 'elastic.out(1, .4)' });
    }
  }

  function close() {
    if (card.hidden) return;
    current = null;
    spots.forEach((s) => s.classList.remove('active'));
    stage.classList.remove('inspecting');
    gsap.to(card, { opacity: 0, y: -16, duration: dur(0.25), onComplete: () => (card.hidden = true) });
  }

  function recenter() { gsap.to(state, { lookYaw: 0, lookPitch: 0, duration: dur(1), ease: 'power3.inOut', overwrite: true }); }

  document.getElementById('eraCardClose').addEventListener('click', close);
  document.getElementById('eraRecenter').addEventListener('click', () => { close(); recenter(); });
  card.addEventListener('keydown', (e) => { if (e.key === 'Escape') close(); });

  // Drag to look. Touch only takes horizontal swipes (vertical still scrolls the journey).
  let down = null;
  stage.addEventListener('pointerdown', (e) => {
    if (state.section !== 'journey' || !landmarks.length || e.button > 0) return;
    if (e.target.closest('button, a, .spec-panel, .timeline')) return;
    down = { x: e.clientX, y: e.clientY, yaw: state.lookYaw, pitch: state.lookPitch, moved: false, touch: e.pointerType === 'touch' };
    gsap.killTweensOf(state, 'lookYaw,lookPitch');
  });
  window.addEventListener('pointermove', (e) => {
    if (!down) {
      if (state.section === 'journey' && landmarks.length && e.pointerType === 'mouse' && !e.target.closest('button, a, .spec-panel, .timeline')) {
        stage.style.cursor = exp.pickLandmark(e.clientX, e.clientY) ? 'pointer' : 'grab';
      }
      return;
    }
    const dx = e.clientX - down.x, dy = e.clientY - down.y;
    if (Math.hypot(dx, dy) > 5) { down.moved = true; stage.classList.add('dragging'); }
    state.lookYaw = clamp(down.yaw + dx * 0.004, -Math.PI, Math.PI);
    if (!down.touch) state.lookPitch = clamp(down.pitch - dy * 0.003, -0.6, 1.2);
  });
  const end = (e) => {
    if (!down) return;
    if (!down.moved && e.type === 'pointerup') { const key = exp.pickLandmark(e.clientX, e.clientY); if (key) select(key, true); }
    down = null;
    stage.classList.remove('dragging');
  };
  window.addEventListener('pointerup', end);
  window.addEventListener('pointercancel', end);

  // Keyboard look-around while the journey is on screen and focus isn't in a form field.
  window.addEventListener('keydown', (e) => {
    if (state.section !== 'journey' || !landmarks.length || e.target.closest?.('input, select, textarea')) return;
    const step = { ArrowLeft: [-0.25, 0], ArrowRight: [0.25, 0] }[e.key];
    if (!step) return;
    e.preventDefault();
    gsap.to(state, { lookYaw: clamp(state.lookYaw - step[0], -Math.PI, Math.PI), duration: dur(0.4), ease: 'power2.out', overwrite: true });
  });

  // Beacons follow the projected landmarks; rebuilt whenever the active era changes.
  let lastActive = false;
  function tick() {
    const found = state.section === 'journey' ? exp.activeLandmarks() : EMPTY;
    const list = found.length ? found : EMPTY;
    const active = list.length > 0;
    if (list !== shownFor) {
      close(); build(list);
      if (!active) stage.style.cursor = '';
      gsap.to(state, { lookYaw: 0, lookPitch: 0, duration: dur(0.8), overwrite: true });
    }
    if (active !== lastActive) {
      layer.style.opacity = active ? '1' : '0';
      gsap.to(hint, { opacity: active ? 1 : 0, duration: 0.4 });
      lastActive = active;
    }
    if (!active) return;
    spots.forEach((s, i) => {
      const p = exp.projectLandmark(landmarks[i].object);
      s.style.visibility = p.visible ? 'visible' : 'hidden';
      if (p.visible) s.style.transform = `translate(${(p.x - 9).toFixed(1)}px, ${(p.y - 9).toFixed(1)}px)`;
    });
  }
  gsap.ticker.add(tick);
  return { destroy: () => gsap.ticker.remove(tick) };
}
