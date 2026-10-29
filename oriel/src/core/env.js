// Capabilities read once at boot. Layout-dependent code should still use live matchMedia.
const mq = (query) => typeof matchMedia === 'function' && matchMedia(query).matches;

function detectWebGL({ allowSoftware = false } = {}) {
  try {
    const canvas = document.createElement('canvas');
    const gl = canvas.getContext('webgl2', { failIfMajorPerformanceCaveat: !allowSoftware });
    if (!gl) return false;
    gl.getExtension('WEBGL_lose_context')?.loseContext();
    return true;
  } catch {
    return false;
  }
}

function detectTier() {
  const cores = navigator.hardwareConcurrency || 4;
  const memory = navigator.deviceMemory || 8;
  const saveData = navigator.connection?.saveData === true;
  const small = mq('(max-width: 767px)');
  return saveData || cores <= 4 || memory <= 4 || small ? 'low' : 'high';
}

const params = new URLSearchParams(location.search);

export const env = {
  reducedMotion: mq('(prefers-reduced-motion: reduce)') || params.has('reduced'),
  finePointer: mq('(hover: hover) and (pointer: fine)'),
  mobile: mq('(max-width: 767px)'),
  // Poster rendering may run on a software rasteriser; real visitors on one get the posters instead.
  webgl: !params.has('nowebgl') && detectWebGL({ allowSoftware: params.has('poster') }),
  tier: params.get('tier') ?? detectTier(),
  /** Poster-rendering mode used by scripts/render-posters.mjs. */
  poster: params.has('poster'),
};
