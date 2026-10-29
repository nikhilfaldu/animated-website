import { gsap } from '../libs.js';

const BOOT_LINES = ['> INITIALIZING CHRONOS CORE', '> STABILIZING TEMPORAL FIELD', '> CALIBRATING CHRONO-RINGS', '> TIME ENGINE ONLINE'];

/** Short boot sequence, shown once per session. Resolves when the site is revealed. */
export function runBoot(reduced) {
  const boot = document.getElementById('boot');
  const log = document.getElementById('bootLog');
  const skip = document.getElementById('bootSkip');
  let seen = false;
  try { seen = sessionStorage.getItem('chronos-booted') === '1'; } catch {}

  return new Promise((resolve) => {
    let done = false;
    const timers = [];
    const finish = () => {
      if (done) return; done = true;
      timers.forEach(clearTimeout);
      try { sessionStorage.setItem('chronos-booted', '1'); } catch {}
      document.body.classList.remove('is-booting');
      gsap.to(boot, { opacity: 0, duration: reduced ? 0.01 : 0.9, ease: 'power2.inOut', onComplete: () => boot.remove() });
      resolve();
    };
    skip.addEventListener('click', finish);
    if (seen || reduced) { finish(); return; }
    BOOT_LINES.forEach((line, i) => timers.push(setTimeout(() => {
      const p = document.createElement('p'); p.textContent = line; log.appendChild(p);
    }, 250 + i * 520)));
    timers.push(setTimeout(finish, 250 + BOOT_LINES.length * 520 + 400));
  });
}

/** Hero entrance after boot. */
export function revealHero(reduced) {
  if (reduced) return;
  const tl = gsap.timeline({ defaults: { ease: 'expo.out' } });
  tl.from('.hero-title .line > span', { yPercent: 110, duration: 1.3, stagger: 0.12 })
    .from('.hero .eyebrow, .hero-sub, .hero-ctas, .tagline', { y: 30, opacity: 0, duration: 1, stagger: 0.1 }, '-=0.9')
    .from('.hero-hud, .nav', { opacity: 0, y: -20, duration: 1 }, '-=0.8');
}

/** Full-screen flash used on jumps and era entry. */
export function flash(intensity = 1) {
  gsap.fromTo('#flash', { opacity: 0.85 * intensity }, { opacity: 0, duration: 1.1, ease: 'power2.out' });
}
