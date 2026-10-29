import { SOUNDTRACK } from '../data.js';

/** Fixed nav: anchor scrolling, active link, mobile menu, progress bar, audio toggle. */
export function initNavigation({ scrollToSection, startJourney }) {
  const menuBtn = document.getElementById('menuBtn');
  const links = document.getElementById('navLinks');
  const bar = document.getElementById('navProgress');

  const closeMenu = () => { links.classList.remove('open'); menuBtn.setAttribute('aria-expanded', 'false'); menuBtn.setAttribute('aria-label', 'Open menu'); };
  menuBtn.addEventListener('click', () => {
    const open = !links.classList.contains('open');
    links.classList.toggle('open', open);
    menuBtn.setAttribute('aria-expanded', String(open));
    menuBtn.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
  });
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape') closeMenu(); });

  document.querySelectorAll('[data-nav]').forEach((a) => {
    a.addEventListener('click', (e) => {
      const id = a.getAttribute('href').slice(1);
      e.preventDefault();
      closeMenu();
      if (a.hasAttribute('data-initiate')) startJourney(a.closest('.hero') ? 'auto' : 'start');
      else scrollToSection(id);
    });
  });

  const navAnchors = [...links.querySelectorAll('a')];
  return {
    setActive(id) { navAnchors.forEach((a) => a.classList.toggle('active', a.getAttribute('href') === `#${id}`)); },
    setProgress(p) { bar.style.width = `${(p * 100).toFixed(1)}%`; },
  };
}

/**
 * Nav audio toggle: streams the soundtrack (SOUNDTRACK in data.js) and fades it in/out.
 * If the track can't load or play, falls back to a generative Web Audio drone. Only starts on click.
 */
export function initAudio() {
  const btn = document.getElementById('audioToggle');
  const link = document.getElementById('soundtrackLink');
  link.href = SOUNDTRACK.page;
  link.textContent = SOUNDTRACK.title;

  const track = new Audio();
  track.src = SOUNDTRACK.src;
  track.loop = true;
  track.preload = 'none';
  track.volume = 0;
  let useTrack = true, on = false, fade = 0;

  let ctx = null, master = null;
  function buildDrone() {
    ctx = new (window.AudioContext || window.webkitAudioContext)();
    master = ctx.createGain(); master.gain.value = 0; master.connect(ctx.destination);
    const filter = ctx.createBiquadFilter(); filter.type = 'lowpass'; filter.frequency.value = 600; filter.connect(master);
    [55, 82.4, 110.2, 164.8].forEach((f, i) => {
      const o = ctx.createOscillator(); o.type = i % 2 ? 'sine' : 'triangle'; o.frequency.value = f;
      const g = ctx.createGain(); g.gain.value = 0.12 / (i + 1);
      const lfo = ctx.createOscillator(); lfo.frequency.value = 0.05 + i * 0.03;
      const lg = ctx.createGain(); lg.gain.value = 0.05 / (i + 1);
      lfo.connect(lg).connect(g.gain); o.connect(g).connect(filter); o.start(); lfo.start();
    });
  }
  async function drone(enable) {
    if (!ctx) buildDrone();
    if (ctx.state === 'suspended') await ctx.resume();
    master.gain.cancelScheduledValues(ctx.currentTime);
    master.gain.linearRampToValueAtTime(enable ? 0.35 : 0, ctx.currentTime + 0.6);
  }

  function fadeTrack(to, done) {
    clearInterval(fade);
    let steps = 0;   // iOS ignores .volume, so never loop forever
    fade = setInterval(() => {
      if (++steps > 30) { clearInterval(fade); done?.(); return; }
      const v = track.volume + (to > track.volume ? 0.05 : -0.05);
      track.volume = Math.min(1, Math.max(0, v));
      if (Math.abs(track.volume - to) < 0.05) { track.volume = to; clearInterval(fade); done?.(); }
    }, 40);
  }

  function setUi() {
    btn.setAttribute('aria-pressed', String(on));
    btn.setAttribute('aria-label', on ? 'Mute soundtrack' : 'Play soundtrack');
    btn.title = on ? `Now playing: ${useTrack ? SOUNDTRACK.title : 'generative ambient'}` : 'Play soundtrack';
  }

  track.addEventListener('error', () => { if (!useTrack) return; useTrack = false; if (on) drone(true).catch(() => {}); setUi(); });

  btn.addEventListener('click', async () => {
    on = !on;
    try {
      if (useTrack) {
        if (on) {
          try { await track.play(); fadeTrack(0.6); }
          catch { useTrack = false; await drone(true); }
        } else fadeTrack(0, () => track.pause());
      } else await drone(on);
      setUi();
    } catch { on = false; btn.disabled = true; btn.title = 'Audio unavailable'; }
  });
}
