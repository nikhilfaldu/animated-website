export function computeFps(deltaSeconds) {
  if (deltaSeconds <= 0) return 0;
  return Math.round(1 / deltaSeconds);
}

// The nav itself is static HTML; only the decorative stats HUD is
// JS-created, since it is meaningless without a running render loop.
export function createStatsHud({ particleCount }) {
  const hud = document.createElement('div');
  hud.className = 'stats-hud';
  hud.setAttribute('aria-hidden', 'true');
  hud.innerHTML = `
    <span data-stat="fps">FPS --</span>
    <span data-stat="particles">PTS ${particleCount}</span>
    <span data-stat="scroll">SCROLL 0%</span>
  `;
  document.body.appendChild(hud);

  const fpsEl = hud.querySelector('[data-stat="fps"]');
  const scrollEl = hud.querySelector('[data-stat="scroll"]');

  let smoothedFps = 0;
  let framesSinceWrite = 0;
  const WRITE_EVERY_N_FRAMES = 10; // ~6 DOM writes/sec at 60fps instead of 60

  return {
    updateStats({ fps, scrollProgress }) {
      // Exponential moving average smooths the frame-to-frame flicker in
      // the raw instantaneous fps reading.
      smoothedFps = smoothedFps === 0 ? fps : smoothedFps * 0.9 + fps * 0.1;

      framesSinceWrite += 1;
      if (framesSinceWrite < WRITE_EVERY_N_FRAMES) return;
      framesSinceWrite = 0;

      fpsEl.textContent = `FPS ${Math.round(smoothedFps)}`;
      scrollEl.textContent = `SCROLL ${Math.round(scrollProgress * 100)}%`;
    },
  };
}
