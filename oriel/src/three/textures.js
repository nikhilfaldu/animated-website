// Every texture of the watch is generated here: tangent-space normal maps from height fields, the sunburst
// anisotropy field, and canvas-drawn print and engravings. Nothing is downloaded.
import {
  CanvasTexture,
  DataTexture,
  LinearFilter,
  LinearMipmapLinearFilter,
  RepeatWrapping,
  ClampToEdgeWrapping,
  RGBAFormat,
  UnsignedByteType,
} from 'three';

export const FONTS = {
  serif: '"Instrument Serif", "Iowan Old Style", "Times New Roman", serif',
  sans: '"Hanken Grotesk Variable", "Hanken Grotesk", "Segoe UI", system-ui, sans-serif',
  mono: '"DM Mono", ui-monospace, Consolas, monospace',
};

/** Waits (bounded) for the self-hosted faces the dial and engravings are drawn with. */
export async function loadFonts(timeout = 2500) {
  if (!document.fonts?.load) return;
  const faces = [
    document.fonts.load(`400 120px ${FONTS.serif}`, 'ORIEL'),
    document.fonts.load(`500 60px ${FONTS.sans}`, 'AUTOMATIQUE'),
    document.fonts.load(`400 60px ${FONTS.mono}`, 'CALIBRE O-1 001/300'),
  ];
  await Promise.race([Promise.all(faces).catch(() => {}), new Promise((r) => setTimeout(r, timeout))]);
}

// ---------- small numeric helpers ----------

const clamp01 = (x) => (x < 0 ? 0 : x > 1 ? 1 : x);
const smoothstep = (a, b, x) => {
  const t = clamp01((x - a) / (b - a));
  return t * t * (3 - 2 * t);
};

function hash2(x, y, seed = 0) {
  const h = Math.sin(x * 127.1 + y * 311.7 + seed * 74.7) * 43758.5453123;
  return h - Math.floor(h);
}

/** Tileable value noise with integer period. */
function valueNoise(x, y, period, seed) {
  const xi = Math.floor(x);
  const yi = Math.floor(y);
  const xf = x - xi;
  const yf = y - yi;
  const x0 = ((xi % period) + period) % period;
  const y0 = ((yi % period) + period) % period;
  const x1 = x0 + 1 < period ? x0 + 1 : x0 + 1 - period;
  const y1 = y0 + 1 < period ? y0 + 1 : y0 + 1 - period;
  const a = hash2(x0, y0, seed);
  const b = hash2(x1, y0, seed);
  const c = hash2(x0, y1, seed);
  const d = hash2(x1, y1, seed);
  const u = xf * xf * (3 - 2 * xf);
  const v = yf * yf * (3 - 2 * yf);
  return a + (b - a) * u + (c - a) * v + (a - b - c + d) * u * v;
}

function finishTexture(texture, { wrap = false, anisotropy = 4 } = {}) {
  texture.wrapS = texture.wrapT = wrap ? RepeatWrapping : ClampToEdgeWrapping;
  texture.magFilter = LinearFilter;
  texture.minFilter = LinearMipmapLinearFilter;
  texture.generateMipmaps = true;
  texture.anisotropy = anisotropy;
  texture.needsUpdate = true;
  return texture;
}

function rgbaTexture(data, size, options) {
  return finishTexture(new DataTexture(data, size, size, RGBAFormat, UnsignedByteType), options);
}

/** Height field (row 0 = v 0) → tangent-space normal map, +Y up. */
function normalMapFromHeight(height, size, strength, { wrap = false, anisotropy } = {}) {
  const data = new Uint8Array(size * size * 4);
  const last = size - 1;
  // Neighbours wrap round (tileable maps) or clamp at the edges.
  const after = (v) => (v === last ? (wrap ? 0 : last) : v + 1);
  const before = (v) => (v === 0 ? (wrap ? last : 0) : v - 1);
  for (let y = 0; y < size; y++) {
    const row = y * size;
    const up = after(y) * size;
    const down = before(y) * size;
    for (let x = 0; x < size; x++) {
      const dx = (height[row + after(x)] - height[row + before(x)]) * strength;
      const dy = (height[up + x] - height[down + x]) * strength;
      const inv = 1 / Math.sqrt(dx * dx + dy * dy + 1);
      const i = (row + x) * 4;
      data[i] = (-dx * inv * 0.5 + 0.5) * 255;
      data[i + 1] = (-dy * inv * 0.5 + 0.5) * 255;
      data[i + 2] = (inv * 0.5 + 0.5) * 255;
      data[i + 3] = 255;
    }
  }
  return rgbaTexture(data, size, { wrap, anisotropy });
}

function heightField(size, fn) {
  const h = new Float32Array(size * size);
  for (let y = 0; y < size; y++) for (let x = 0; x < size; x++) h[y * size + x] = fn(x, y);
  return h;
}

// ---------- surface finishes ----------

/** Perlage: overlapping circular-grained spots, drawn row by row like the real tool. Tileable. */
function perlage(size) {
  const cells = 6;
  const g = size / cells;
  const radius = g * 0.78;
  const height = heightField(size, (x, y) => {
    let best = -1;
    let value = 0;
    const row = Math.floor(y / g);
    for (let r = row - 1; r <= row + 1; r++) {
      const offset = (((r % 2) + 2) % 2) * g * 0.5;
      const col = Math.floor((x - offset) / g);
      for (let c = col - 1; c <= col + 1; c++) {
        const cx = c * g + offset + g * 0.5;
        const cy = r * g + g * 0.5;
        const dx = x - cx;
        const dy = y - cy;
        const d = Math.sqrt(dx * dx + dy * dy);
        const priority = r * 64 + c;
        if (d < radius && priority > best) {
          best = priority;
          const t = d / radius;
          // Shallow cone (the light/dark "bow tie" of each spot) plus fine concentric grain.
          value = (1 - t) * 0.9 + Math.sin(t * 46 + hash2(r, c) * 6) * 0.06 * (1 - t * 0.5);
        }
      }
    }
    return value;
  });
  return normalMapFromHeight(height, size, 2.2, { wrap: true });
}

/** Côtes de Genève: parallel convex bands with arced striations. Tileable; bands run along u. */
function cotesDeGeneve(size) {
  const bands = 4;
  const w = size / bands;
  const height = heightField(size, (x, y) => {
    const f = (y % w) / w;
    const arc = Math.sqrt(Math.max(0, 1 - (2 * f - 1) ** 2));
    const s = Math.sin(((x / size) * 26 + (f - 0.5) ** 2 * 3.2) * Math.PI * 2) * 0.035;
    return arc * 1.6 + s + valueNoise(x / 3, y / 24, size / 3, 3) * 0.02;
  });
  return normalMapFromHeight(height, size, 2.4, { wrap: true });
}

/** Concentric circular graining centred on the texture (wheels, ratchet, rotor bearing). */
function circularGrain(size) {
  const c = size / 2;
  const height = heightField(size, (x, y) => {
    const r = Math.hypot(x + 0.5 - c, y + 0.5 - c) / c;
    return Math.sin(r * 190) * 0.25 + Math.sin(r * 61 + 1.3) * 0.18 + valueNoise(r * 900, 0.5, 4096, 5) * 0.2;
  });
  return normalMapFromHeight(height, size, 1.4);
}

/** Fine frosted grain for the ivory dial. Tileable. */
function grain(size) {
  const height = heightField(size, (x, y) => {
    return valueNoise(x / 1.3, y / 1.3, Math.round(size / 1.3), 9) * 0.6 + valueNoise(x / 3.2, y / 3.2, Math.round(size / 3.2), 4) * 0.4;
  });
  return normalMapFromHeight(height, size, 0.9, { wrap: true });
}

/** Radial brushing lines of a sunburst dial (normal), height varies with angle only. */
function sunburstLines(size) {
  const c = size / 2;
  const bins = 720;
  // The brushing depends on angle only: sample it once into a fine lookup table instead of per pixel.
  const steps = bins * 16;
  const lut = new Float32Array(steps + 1);
  for (let i = 0; i <= steps; i++) {
    const a = (i / steps) * bins;
    lut[i] = valueNoise(a, 0.5, bins, 11) * 0.7 + valueNoise(a * 3.1, 7.5, bins * 3, 2) * 0.3;
  }
  const height = heightField(size, (x, y) => {
    const f = (Math.atan2(y + 0.5 - c, x + 0.5 - c) / (Math.PI * 2) + 0.5) * steps;
    const i = Math.floor(f);
    const n = lut[i] + (lut[Math.min(steps, i + 1)] - lut[i]) * (f - i);
    const r = Math.hypot(x + 0.5 - c, y + 0.5 - c) / c;
    return n * smoothstep(0.02, 0.25, r);
  });
  return normalMapFromHeight(height, size, 1.6);
}

/**
 * Direction field for MeshPhysicalMaterial.anisotropyMap: highlights stretch along the circles around the
 * centre, which is what radial brushing does to light. B channel = strength (eases out near the centre).
 */
function sunburstAnisotropy(size) {
  const data = new Uint8Array(size * size * 4);
  const c = size / 2;
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const dx = (x + 0.5 - c) / c;
      const dy = (y + 0.5 - c) / c;
      const r = Math.hypot(dx, dy) || 1e-6;
      const i = (y * size + x) * 4;
      data[i] = (-dy / r * 0.5 + 0.5) * 255;
      data[i + 1] = (dx / r * 0.5 + 0.5) * 255;
      data[i + 2] = smoothstep(0.015, 0.12, r) * 255;
      data[i + 3] = 255;
    }
  }
  return rgbaTexture(data, size, { anisotropy: 8 });
}

/** Smooth calfskin: soft pebbles and fine pores. Tileable. */
function leather(size) {
  const cells = 22;
  const g = size / cells;
  const height = heightField(size, (x, y) => {
    const cx = Math.floor(x / g);
    const cy = Math.floor(y / g);
    let f1 = 9;
    let f2 = 9;
    for (let j = -1; j <= 1; j++) {
      for (let i = -1; i <= 1; i++) {
        const gx = cx + i;
        const gy = cy + j;
        const wx = ((gx % cells) + cells) % cells;
        const wy = ((gy % cells) + cells) % cells;
        const px = (gx + hash2(wx, wy, 1)) * g;
        const py = (gy + hash2(wx, wy, 2)) * g;
        const d = Math.hypot(x - px, y - py) / g;
        if (d < f1) {
          f2 = f1;
          f1 = d;
        } else if (d < f2) f2 = d;
      }
    }
    const crease = smoothstep(0, 0.32, f2 - f1);
    return crease * 0.7 + valueNoise(x / 1.5, y / 1.5, Math.round(size / 1.5), 6) * 0.18;
  });
  return normalMapFromHeight(height, size, 1.1, { wrap: true });
}

// ---------- canvas drawing ----------

function makeCanvas(size) {
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = size;
  return canvas;
}

/** Draws text one glyph at a time with explicit tracking (canvas letterSpacing is not universal). */
function trackedText(ctx, text, x, y, tracking) {
  const widths = [...text].map((ch) => ctx.measureText(ch).width);
  const total = widths.reduce((a, b) => a + b, 0) + tracking * (text.length - 1);
  let cursor = x - total / 2;
  [...text].forEach((ch, i) => {
    ctx.fillText(ch, cursor + widths[i] / 2, y);
    cursor += widths[i] + tracking;
  });
}

/** Text around a circle. `dir` 1 = clockwise with tops outward (ring), -1 = smile along the bottom (rotor). */
function arcText(ctx, text, cx, cy, radius, centreAngle, tracking, dir = 1) {
  const chars = [...text];
  const widths = chars.map((ch) => ctx.measureText(ch).width + tracking);
  const total = widths.reduce((a, b) => a + b, 0) - tracking;
  let a = centreAngle - (dir * (total / 2)) / radius;
  chars.forEach((ch, i) => {
    const half = widths[i] - tracking;
    a += (dir * half) / 2 / radius;
    ctx.save();
    ctx.translate(cx + Math.cos(a) * radius, cy + Math.sin(a) * radius);
    ctx.rotate(dir > 0 ? a + Math.PI / 2 : a - Math.PI / 2);
    ctx.fillText(ch, 0, 0);
    ctx.restore();
    a += (dir * (half / 2 + tracking)) / radius;
  });
}

/** ORIEL mark from the site nav: a circle, a tick at twelve and a centre dot. */
function drawMark(ctx, x, y, r, lineWidth) {
  ctx.save();
  ctx.lineWidth = lineWidth;
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(x, y - r);
  ctx.lineTo(x, y - r * 0.54);
  ctx.stroke();
  ctx.beginPath();
  ctx.arc(x, y, r * 0.15, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

/**
 * Dial print. R = ink coverage, G = soft contact shadow of the applied indices.
 * Covers the dial disc of radius `dialRadius` edge to edge.
 */
function dialPrint(size, { dialRadius, indices }) {
  const canvas = makeCanvas(size);
  const ctx = canvas.getContext('2d');
  const k = size / (2 * dialRadius); // px per watch unit
  const c = size / 2;
  ctx.fillStyle = '#000';
  ctx.fillRect(0, 0, size, size);
  ctx.globalCompositeOperation = 'lighter';

  // Soft shadows of the applied batons, light from the upper left. The shapes themselves are drawn far off
  // the canvas; only their shadows (offset back into view, in device space) land on it.
  const shift = size * 4;
  ctx.save();
  ctx.shadowColor = 'rgba(0, 255, 0, 0.85)';
  ctx.shadowBlur = 0.014 * k;
  ctx.shadowOffsetX = 0.008 * k + shift;
  ctx.shadowOffsetY = 0.011 * k;
  ctx.fillStyle = '#fff';
  for (const { angle, x, width, inner, outer } of indices) {
    const cos = Math.cos(angle);
    const sin = Math.sin(angle);
    const corners = [[x - width / 2, inner], [x + width / 2, inner], [x + width / 2, outer], [x - width / 2, outer]];
    ctx.beginPath();
    corners.forEach(([lx, ly], i) => {
      const px = c + (lx * cos + ly * sin) * k - shift;
      const py = c - (-lx * sin + ly * cos) * k;
      if (i) ctx.lineTo(px, py);
      else ctx.moveTo(px, py);
    });
    ctx.closePath();
    ctx.fill();
  }
  ctx.restore();

  ctx.fillStyle = '#f00';
  ctx.strokeStyle = '#f00';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';

  // Railway minute track.
  const rIn = 0.792 * k;
  const rOut = 0.812 * k;
  ctx.lineWidth = 0.0016 * k;
  for (const r of [rIn, rOut]) {
    ctx.beginPath();
    ctx.arc(c, c, r, 0, Math.PI * 2);
    ctx.stroke();
  }
  for (let i = 0; i < 60; i++) {
    const a = (i / 60) * Math.PI * 2;
    const five = i % 5 === 0;
    const w = (five ? 0.0042 : 0.0019) * k;
    const r0 = five ? 0.786 * k : rIn;
    ctx.save();
    ctx.translate(c, c);
    ctx.rotate(a);
    ctx.fillRect(-w / 2, -rOut, w, rOut - r0);
    ctx.restore();
  }

  // Brand mark and wordmark under twelve.
  drawMark(ctx, c, c - 0.5 * k, 0.028 * k, 0.0034 * k);
  ctx.font = `400 ${0.112 * k}px ${FONTS.serif}`;
  trackedText(ctx, 'ORIEL', c, c - 0.385 * k, 0.03 * k);

  // Above six.
  ctx.font = `500 ${0.036 * k}px ${FONTS.sans}`;
  trackedText(ctx, 'AUTOMATIQUE', c, c + 0.345 * k, 0.0105 * k);
  ctx.font = `400 ${0.03 * k}px ${FONTS.mono}`;
  trackedText(ctx, 'CALIBRE O-1', c, c + 0.41 * k, 0.008 * k);

  return finishTexture(new CanvasTexture(canvas), { anisotropy: 8 });
}

/** Text canvas for engravings: white field, black letters. Returns the canvas and a blurred height field. */
function engravingCanvas(size, draw) {
  const canvas = makeCanvas(size);
  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  ctx.fillStyle = '#fff';
  ctx.fillRect(0, 0, size, size);
  ctx.fillStyle = '#000';
  ctx.strokeStyle = '#000';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  // Mirror: these faces are seen from the back of the watch.
  ctx.translate(size, 0);
  ctx.scale(-1, 1);
  draw(ctx, size);
  const pixels = ctx.getImageData(0, 0, size, size).data;
  // Canvas rows run top-down, data textures bottom-up.
  const height = new Float32Array(size * size);
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) height[(size - 1 - y) * size + x] = pixels[(y * size + x) * 4] / 255;
  }
  return { canvas, height: boxBlur(height, size, 1) };
}

/** Box blur as two 1D passes (rows, then columns); samples past the edges are skipped. */
function boxBlur(src, size, radius) {
  const pass = (input, stride, step) => {
    const out = new Float32Array(input.length);
    for (let line = 0; line < size; line++) {
      const base = line * stride;
      for (let k = 0; k < size; k++) {
        const from = Math.max(0, k - radius);
        const to = Math.min(size - 1, k + radius);
        let sum = 0;
        for (let j = from; j <= to; j++) sum += input[base + j * step];
        out[base + k * step] = sum / (to - from + 1);
      }
    }
    return out;
  };
  return pass(pass(src, size, 1), 1, size);
}

/** Caseback ring engraving, mapped to the ring's planar UVs over [-extent, extent]. */
function casebackEngraving(size, extent) {
  const k = size / (2 * extent);
  const { canvas, height } = engravingCanvas(size, (ctx, s) => {
    const c = s / 2;
    ctx.font = `400 ${0.052 * k}px ${FONTS.mono}`;
    const text = 'ORIEL · CALIBRE O-1 · 001/300 · SAPPHIRE · 100 M ·';
    arcText(ctx, text, c, c, 0.765 * k, -Math.PI / 2 + 0.02, 0.03 * k, 1);
    ctx.lineWidth = 0.004 * k;
    ctx.beginPath();
    ctx.arc(c, c, 0.71 * k, 0, Math.PI * 2);
    ctx.stroke();
  });
  return {
    ao: finishTexture(new CanvasTexture(canvas), { anisotropy: 8 }),
    normal: normalMapFromHeight(height, size, 2.2, { anisotropy: 8 }),
  };
}

/** Rotor: circular graining plus engraved text along the bottom arc, read from the back. */
function rotorEngraving(size, extent) {
  const k = size / (2 * extent);
  const { canvas, height } = engravingCanvas(size, (ctx, s) => {
    const c = s / 2;
    ctx.font = `400 ${0.06 * k}px ${FONTS.serif}`;
    arcText(ctx, 'ORIEL', c, c, 0.47 * k, Math.PI / 2, 0.035 * k, -1);
    ctx.font = `400 ${0.034 * k}px ${FONTS.mono}`;
    arcText(ctx, 'CALIBRE O-1 · AUTOMATIQUE · 31 JEWELS', c, c, 0.37 * k, Math.PI / 2, 0.012 * k, -1);
  });
  const c = size / 2;
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const r = Math.hypot(x + 0.5 - c, y + 0.5 - c) / c;
      const i = y * size + x;
      height[i] = height[i] * 0.9 + Math.sin(r * 150) * 0.05;
    }
  }
  return {
    ao: finishTexture(new CanvasTexture(canvas), { anisotropy: 8 }),
    normal: normalMapFromHeight(height, size, 2.0, { anisotropy: 8 }),
  };
}

/** Crown end: the ORIEL mark in relief. */
function crownMark(size) {
  const canvas = makeCanvas(size);
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = '#fff';
  ctx.fillRect(0, 0, size, size);
  ctx.fillStyle = '#000';
  ctx.strokeStyle = '#000';
  drawMark(ctx, size / 2, size / 2, size * 0.3, size * 0.05);
  return finishTexture(new CanvasTexture(canvas));
}

const yieldToMain = () => new Promise((resolve) => setTimeout(resolve, 0));

/**
 * Builds every texture the watch needs, yielding between maps so the preloader keeps animating.
 * @param {{ tier: 'high' | 'low', dialRadius: number, indices: Array }} options
 */
export async function createTextures({ tier, dialRadius, indices }) {
  const hi = tier !== 'low';
  const jobs = {
    perlage: () => perlage(hi ? 256 : 192),
    cotes: () => cotesDeGeneve(256),
    circular: () => circularGrain(hi ? 512 : 256),
    grain: () => grain(256),
    sunburstLines: () => sunburstLines(hi ? 1024 : 512),
    sunburstAniso: () => sunburstAnisotropy(hi ? 512 : 256),
    leather: () => leather(256),
    dialPrint: () => dialPrint(hi ? 2048 : 1024, { dialRadius, indices }),
    caseback: () => casebackEngraving(hi ? 768 : 512, 0.92),
    rotor: () => rotorEngraving(hi ? 768 : 512, 0.8),
    crown: () => crownMark(128),
  };
  const textures = {};
  for (const [name, build] of Object.entries(jobs)) {
    textures[name] = build();
    await yieldToMain();
  }
  textures.dispose = () => {
    for (const value of Object.values(textures)) {
      if (value?.isTexture) value.dispose();
      else if (value && typeof value === 'object') Object.values(value).forEach((t) => t?.isTexture && t.dispose());
    }
  };
  return textures;
}
