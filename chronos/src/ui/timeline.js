import { gsap } from '../libs.js';
import { ERAS } from '../data.js';

/** Journey HUD: timeline, era panel, progress — updated only on state change. */
export function initTimeline({ goToEra }) {
  const list = document.getElementById('timeline');
  list.innerHTML = ERAS.map((e, i) => `<li><button type="button" data-era="${i}" aria-label="Jump to era ${e.num}: ${e.name}, ${e.date}"><b>${e.num} · ${e.date}</b><span>${e.name}</span></button></li>`).join('');
  const buttons = [...list.querySelectorAll('button')];
  buttons.forEach((b) => b.addEventListener('click', () => goToEra(+b.dataset.era)));

  const panel = document.getElementById('eraPanel');
  const el = { num: document.getElementById('eraNum'), name: document.getElementById('eraName'), date: document.getElementById('eraDate'), text: document.getElementById('eraText'), coord: document.getElementById('eraCoord') };
  const bar = document.getElementById('journeyBar');
  const pct = document.getElementById('journeyPct');
  let lastPct = -1;

  function setEra(i, inJourney) {
    buttons.forEach((b, j) => { b.classList.toggle('active', j === i); b.setAttribute('aria-current', j === i ? 'step' : 'false'); });
    const root = document.documentElement;
    if (i < 0) {
      gsap.to(panel, { opacity: 0, x: -20, duration: 0.4 });
      root.style.setProperty('--accent', '#3ef2ff');
      return;
    }
    const e = ERAS[i];
    root.style.setProperty('--accent', inJourney ? e.accent : '#3ef2ff');
    el.num.textContent = `ERA ${e.num}`;
    el.name.textContent = e.name;
    el.date.textContent = e.date;
    el.text.textContent = e.text;
    el.coord.textContent = `T-COORD ${String(e.year).padStart(9, ' ')} · LAT ${(12.3 + i * 9.7).toFixed(2)} · LON ${(31.1 - i * 7.4).toFixed(2)} · (FICTIONAL)`;
    gsap.fromTo(panel, { opacity: 0, x: -30 }, { opacity: 1, x: 0, duration: 0.8, ease: 'expo.out' });
    gsap.fromTo([el.name, el.date, el.text, el.coord], { y: 20, opacity: 0 }, { y: 0, opacity: 1, stagger: 0.07, duration: 0.7, ease: 'power3.out' });
  }

  function setProgress(p) {
    const v = Math.round(p * 100);
    if (v === lastPct) return;
    lastPct = v;
    bar.style.width = `${v}%`;
    pct.textContent = `${String(v).padStart(3, '0')}% · JOURNEY`;
  }
  return { setEra, setProgress };
}

/** Destination panels with tilt hover; each travels to its era. */
export function initDestinations({ goToEra, reduced }) {
  const ART = [
    'radial-gradient(ellipse at 50% 110%, #0f5a33 0%, transparent 60%), repeating-linear-gradient(90deg, transparent 0 38px, rgba(5,20,12,.9) 38px 46px), linear-gradient(#0b2a1b, #020805)',
    'radial-gradient(circle at 50% 35%, #ffd28a 0 8%, rgba(255,179,71,.4) 14%, transparent 34%), linear-gradient(135deg, transparent 50%, #7a5226 50%) 30% 100%/50% 45% no-repeat, linear-gradient(225deg, transparent 50%, #9a6a34 50%) 70% 100%/50% 45% no-repeat, linear-gradient(#3a2210, #120802)',
    'repeating-conic-gradient(from 0deg at 70% 40%, #b86b3c 0 6deg, transparent 6deg 15deg), radial-gradient(circle at 70% 40%, transparent 22%, #1c0f08 23%), linear-gradient(#2a1208, #0c0604)',
    'repeating-linear-gradient(90deg, #0c1a30 0 18px, #13284a 18px 22px, transparent 22px 40px), linear-gradient(transparent 55%, rgba(124,199,255,.35) 56%, transparent 58%), linear-gradient(#061226, #01040a)',
    'radial-gradient(circle at 70% 30%, #a77bff 0 12%, transparent 13%), radial-gradient(ellipse at 70% 30%, transparent 18%, rgba(62,242,255,.5) 19%, transparent 21%), radial-gradient(circle at 20% 70%, #3ef2ff33, transparent 40%), linear-gradient(#0b0620, #02010a)',
  ];
  const grid = document.getElementById('destGrid');
  grid.innerHTML = ERAS.map((e, i) => `
    <article class="dest" style="--c:${e.accent};--art:${ART[i]}">
      <p class="num">ERA ${e.num}</p>
      <h3>${e.name}</h3>
      <p class="date">${e.date}</p>
      <p>${e.text}</p>
      <button type="button" class="btn btn-sm" data-era="${i}" aria-label="Travel to ${e.name}">TRAVEL HERE →</button>
    </article>`).join('');
  grid.querySelectorAll('button').forEach((b) => b.addEventListener('click', () => goToEra(+b.dataset.era, { flash: true })));
  if (reduced || matchMedia('(hover: none)').matches) return;
  grid.querySelectorAll('.dest').forEach((card) => {
    card.addEventListener('pointermove', (e) => {
      const r = card.getBoundingClientRect();
      const x = (e.clientX - r.left) / r.width - 0.5, y = (e.clientY - r.top) / r.height - 0.5;
      gsap.to(card, { rotateY: x * 10, rotateX: -y * 10, duration: 0.5, ease: 'power2.out' });
    });
    card.addEventListener('pointerleave', () => gsap.to(card, { rotateX: 0, rotateY: 0, duration: 0.8, ease: 'elastic.out(1, .5)' }));
  });
}
