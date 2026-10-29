import { gsap, ScrollTrigger } from './libs.js';
import { createExperience, isWebGLAvailable, eraProgress, ERA_START, ERA_SPAN } from './three/scene.js';
import { initMachineInteractions } from './three/interactions.js';
import { initEraInteractions } from './three/eraInteractions.js';
import { initSmoothScroll, initScrollScenes } from './animations/scroll.js';
import { runBoot, revealHero, flash } from './animations/transitions.js';
import { initNavigation, initAudio } from './ui/navigation.js';
import { initTimeline, initDestinations } from './ui/timeline.js';
import { initMissionControl } from './ui/missionControl.js';
import { LOG, ERAS } from './data.js';

const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
const w = window.innerWidth;
const low = w < 860 || (navigator.hardwareConcurrency || 8) <= 4;
const quality = {
  reduced, low,
  stars: low ? 1500 : 4000, dust: low ? 300 : 900, warp: low ? 250 : 700, anomaly: low ? 6000 : 18000,
};

// Mission log entries
document.getElementById('logList').innerHTML = LOG.map((e, i) => `
  <li class="log-item" style="--h:${e.hue}">
    <span class="log-idx">${String(i + 1).padStart(2, '0')}</span>
    <article class="log-card"><p class="meta"><span>${e.era}</span><span>${e.date}</span></p><h3>${e.title}</h3><p>${e.text}</p></article>
  </li>`).join('');

// 3D experience (or graceful fallback)
let exp = null;
const canvas = document.getElementById('webgl');
if (isWebGLAvailable()) {
  try { exp = createExperience(canvas, quality, { onEraChange: (i) => timeline?.setEra(i, state.section === 'journey') }); }
  catch (err) { console.warn('WebGL init failed, using fallback', err); exp = null; }
}
if (!exp) { canvas.remove(); document.body.classList.add('no-gl'); document.getElementById('noWebgl').hidden = false; }
const state = exp ? exp.state : { section: 'hero', journey: 0, anomaly: 0, machineRot: 0, machineFocus: null, jumpBoost: 0 };

const { lenis } = initSmoothScroll(reduced);
const navH = () => document.getElementById('nav').offsetHeight;

let scenes = null;
let lastEra = -2;
const eraFor = (p) => (p < ERA_START ? -1 : Math.min(ERAS.length - 1, Math.floor((p - ERA_START) / ERA_SPAN)));

function journeyY(p) {
  const st = scenes.journey;
  return st.start + (st.end - st.start) * p;
}

function goToEra(i, opts = {}) {
  const y = journeyY(eraProgress(i));
  const dist = Math.abs(window.scrollY - y);
  if (opts.flash && !reduced) flash(0.9);
  lenis.scrollTo(y, { duration: reduced ? 0 : opts.fast ? 1.2 : Math.min(3.5, 1 + dist / 4000), immediate: reduced || !!opts.fast && dist > window.innerHeight * 4, force: true });
}

function scrollToSection(id) {
  const el = document.getElementById(id);
  if (!el) return;
  const pinned = id === 'journey' || id === 'anomaly' || id === 'hero';
  lenis.scrollTo(el, { offset: pinned ? 0 : -navH() + 1, duration: reduced ? 0 : 1.6 });
}

function startJourney(mode) {
  // From the hero: glide into the sequence and through the portal to ERA 01.
  if (mode === 'auto') lenis.scrollTo(journeyY(eraProgress(0)), { duration: reduced ? 0 : 4.5, easing: (t) => 1 - Math.pow(1 - t, 3) });
  else lenis.scrollTo(journeyY(0), { duration: reduced ? 0 : 2 });
}

const nav = initNavigation({ scrollToSection, startJourney });
const timeline = initTimeline({ goToEra });
initDestinations({ goToEra, reduced });
initMissionControl({ state, goToEra });
initAudio();
if (exp) { initMachineInteractions(exp); initEraInteractions(exp); }
else initStaticMachine();

scenes = initScrollScenes({
  state, reduced,
  onSection: (id) => {
    nav.setActive(id);
    timeline.setEra(id === 'journey' ? eraFor(state.journey) : -1, id === 'journey');
  },
  onJourney: (p) => {
    timeline.setProgress(p);
    if (!exp) { const e = eraFor(p); if (e !== lastEra) { lastEra = e; timeline.setEra(e, true); } }
  },
});

// Global journey progress bar in the nav
ScrollTrigger.create({ start: 0, end: 'max', onUpdate: (self) => nav.setProgress(self.progress) });

// Fictional live readouts in the hero (DOM updated ~4x/sec, not per frame)
const coordEl = document.getElementById('heroCoord');
const fluxEl = document.getElementById('heroFlux');
setInterval(() => {
  if (state.section !== 'hero') return;
  const t = performance.now() / 1000;
  coordEl.textContent = `T+${(t % 9999).toFixed(3).padStart(8, '0')}`;
  fluxEl.textContent = (0.42 + Math.sin(t) * 0.08 + Math.random() * 0.02).toFixed(3);
}, 250);

function initStaticMachine() {
  // No WebGL: list the components as accessible buttons opening the spec panel.
  import('./data.js').then(({ COMPONENTS }) => {
    const layer = document.getElementById('hotspots');
    const panel = document.getElementById('specPanel');
    layer.classList.add('static');
    layer.innerHTML = COMPONENTS.map((c) => `<button type="button" class="hotspot" data-id="${c.id}"><i></i><span>${c.title.toUpperCase()}</span></button>`).join('');
    layer.querySelectorAll('.hotspot').forEach((b) => b.addEventListener('click', () => {
      const c = COMPONENTS.find((x) => x.id === b.dataset.id);
      document.getElementById('specCode').textContent = c.code;
      document.getElementById('specTitle').textContent = c.title;
      document.getElementById('specDesc').textContent = c.desc;
      document.getElementById('specList').innerHTML = Object.entries(c.spec).map(([k, v]) => `<dt>${k}</dt><dd>${v}</dd>`).join('');
      panel.hidden = false;
    }));
    document.getElementById('specClose').addEventListener('click', () => (panel.hidden = true));
    ['rotLeft', 'rotRight', 'resetView', 'toggleLabels'].forEach((id) => (document.getElementById(id).disabled = true));
  });
}

// Boot → reveal
lenis.stop();
runBoot(reduced).then(() => {
  lenis.start();
  revealHero(reduced);
  ScrollTrigger.refresh();
});

window.addEventListener('load', () => ScrollTrigger.refresh());
window.addEventListener('pagehide', () => exp?.dispose());
gsap.config({ nullTargetWarn: false });
