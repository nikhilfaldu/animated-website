import { gsap } from '../libs.js';
import { ERAS } from '../data.js';

/** Mission control console: validation, calculation, diagnostics, jump. */
export function initMissionControl({ state, goToEra }) {
  const form = document.getElementById('console');
  const dest = document.getElementById('mcDest');
  const year = document.getElementById('mcYear');
  const power = document.getElementById('mcPower');
  const powerOut = document.getElementById('mcPowerOut');
  const stab = document.getElementById('mcStab');
  const stabTxt = document.getElementById('mcStabTxt');
  const coord = document.getElementById('mcCoord');
  const log = document.getElementById('mcLog');
  const calc = document.getElementById('mcCalc');
  const jump = document.getElementById('mcJump');
  const blip = document.getElementById('radarBlip');
  let calculated = null, busy = false;

  dest.insertAdjacentHTML('beforeend', ERAS.map((e, i) => `<option value="${i}">ERA ${e.num} — ${e.name}</option>`).join(''));

  const stability = () => {
    const p = +power.value;
    return Math.max(5, Math.round(100 - Math.abs(p - 72) * 1.5));
  };
  function refresh() {
    powerOut.textContent = `${power.value}%`;
    const s = stability();
    stab.style.width = `${s}%`;
    stab.style.background = s > 70 ? 'var(--cyan)' : s > 40 ? 'var(--amber)' : '#ff5a6a';
    stabTxt.textContent = `${s}% ${s > 70 ? 'STABLE' : s > 40 ? 'FLUCTUATING' : 'CRITICAL'}`;
    if (calculated) { calculated = null; jump.disabled = true; }
  }
  [dest, year, power].forEach((el) => el.addEventListener('input', () => { el.classList.remove('invalid'); refresh(); }));
  dest.addEventListener('change', () => {
    const e = ERAS[+dest.value];
    if (e && !year.value) year.value = e.year;
    refresh();
  });
  refresh();

  const setLog = (txt, cls = '') => { log.textContent = txt; log.className = `console-log mono ${cls}`; };

  function validate() {
    const errs = [];
    dest.classList.remove('invalid'); year.classList.remove('invalid');
    if (dest.value === '') { errs.push('DESTINATION NOT SELECTED'); dest.classList.add('invalid'); }
    const y = Number(year.value);
    if (year.value === '' || !Number.isFinite(y)) { errs.push('TARGET YEAR REQUIRED'); year.classList.add('invalid'); }
    else if (y < -70000000 || y > 5000) { errs.push('YEAR OUTSIDE NAVIGABLE RANGE (-70,000,000 … 5000)'); year.classList.add('invalid'); }
    if (stability() < 30) errs.push('STABILITY CRITICAL — ADJUST REACTOR POWER TOWARD 72%');
    return errs;
  }

  calc.addEventListener('click', () => {
    if (busy) return;
    const errs = validate();
    if (errs.length) { setLog(`✕ CALCULATION FAILED\n${errs.join('\n')}`, 'err'); jump.disabled = true; return; }
    const i = +dest.value; const y = +year.value;
    const delta = y - 2026;
    const lat = (12.3 + i * 9.7 + (y % 7)).toFixed(3), lon = (31.1 - i * 7.4 + (y % 11) / 3).toFixed(3);
    coord.textContent = `COORD: T${delta >= 0 ? '+' : ''}${delta.toLocaleString()}y · ${lat} / ${lon} (FICTIONAL)`;
    const angle = (i / ERAS.length) * Math.PI * 2;
    const rr = 15 + i * 7;
    gsap.to(blip, { opacity: 1, left: `${50 + Math.cos(angle) * rr}%`, top: `${50 + Math.sin(angle) * rr}%`, duration: 0.8 });
    calculated = i;
    jump.disabled = false;
    setLog(`✓ JUMP VECTOR LOCKED\nTARGET: ${ERAS[i].name}\nΔT: ${delta.toLocaleString()} YEARS\nREADY TO INITIATE`, 'ok');
  });

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    if (busy) return;
    if (calculated === null) { setLog('✕ CALCULATE JUMP FIRST', 'err'); return; }
    const i = calculated;
    busy = true; jump.disabled = true; calc.disabled = true;
    const steps = ['> PRE-JUMP DIAGNOSTIC', '> REACTOR SPIN-UP ........ OK', '> QUANTUM STABILIZER ...... OK', '> REALITY ANCHOR ........ LOCKED', `> JUMPING TO ${ERAS[i].date}`];
    setLog('');
    state.jumpHold = true;
    gsap.to(state, { jumpBoost: 1, duration: 2.2, ease: 'power2.in' });
    steps.forEach((s, k) => setTimeout(() => { log.textContent += (k ? '\n' : '') + s; }, k * 450));
    setTimeout(() => {
      state.jumpHold = false;
      goToEra(i, { flash: true, fast: true });
      setLog(`✓ ARRIVED: ${ERAS[i].name}`, 'ok');
      busy = false; calc.disabled = false; calculated = null;
    }, steps.length * 450 + 300);
  });
}
