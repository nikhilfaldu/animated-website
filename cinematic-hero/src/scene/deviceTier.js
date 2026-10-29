// Pure function: pass width/cores explicitly so this is testable outside a
// browser. main.js calls it with window.innerWidth / navigator.hardwareConcurrency.
export function getDeviceTier({ width, cores }) {
  if (width < 768 || cores < 4) {
    return { name: 'low', particleCount: 3000, bloom: { enabled: false, strength: 0, radius: 0 } };
  }
  if (cores < 8) {
    return { name: 'mid', particleCount: 8000, bloom: { enabled: true, strength: 0.6, radius: 0.4 } };
  }
  return { name: 'high', particleCount: 18000, bloom: { enabled: true, strength: 1.0, radius: 0.5 } };
}
