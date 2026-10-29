// Every material of the watch, grouped by what drives it: the case finish (polished, satin, accent metal),
// the dial (lacquer, print, strap leather) or nothing (the movement). Config changes cross-fade the numbers.
import { Color, CustomBlending, MeshPhysicalMaterial, OneFactor, OneMinusSrcAlphaFactor, Vector2, Vector3 } from 'three';
import { gsap, EASE } from '../core/motion.js';

// Clearcoat and anisotropy never cross zero at runtime: that would recompile the shader mid-transition.
const EPS = 0.001;

export const FINISH_PRESETS = {
  steel: {
    polished: { color: '#cdd0d4', metalness: 1, roughness: 0.06, clearcoat: EPS, clearcoatRoughness: 0.1, ior: 1.5, specularIntensity: 1 },
    satin: { color: '#c3c6ca', metalness: 1, roughness: 0.27, clearcoat: EPS, clearcoatRoughness: 0.1, ior: 1.5, specularIntensity: 1, anisotropy: 0.7 },
    accent: { color: '#e6e8ea', metalness: 1, roughness: 0.07, clearcoat: EPS, clearcoatRoughness: 0.1, ior: 1.5, specularIntensity: 1 },
  },
  rosegold: {
    polished: { color: '#ebb397', metalness: 1, roughness: 0.07, clearcoat: EPS, clearcoatRoughness: 0.1, ior: 1.5, specularIntensity: 1 },
    satin: { color: '#e2a98d', metalness: 1, roughness: 0.26, clearcoat: EPS, clearcoatRoughness: 0.1, ior: 1.5, specularIntensity: 1, anisotropy: 0.7 },
    accent: { color: '#eeb79c', metalness: 1, roughness: 0.07, clearcoat: EPS, clearcoatRoughness: 0.1, ior: 1.5, specularIntensity: 1 },
  },
  ceramic: {
    polished: { color: '#0c0c0e', metalness: 0, roughness: 0.05, clearcoat: 1, clearcoatRoughness: 0.025, ior: 1.9, specularIntensity: 1 },
    satin: { color: '#0e0e10', metalness: 0, roughness: 0.34, clearcoat: 0.35, clearcoatRoughness: 0.22, ior: 1.9, specularIntensity: 1, anisotropy: 0.15 },
    accent: { color: '#dcc28c', metalness: 1, roughness: 0.08, clearcoat: EPS, clearcoatRoughness: 0.1, ior: 1.5, specularIntensity: 1 },
  },
};

export const DIAL_PRESETS = {
  midnight: {
    dial: { color: '#1a2a4a', metalness: 0.62, roughness: 0.3, anisotropy: 0.92, clearcoat: 1, clearcoatRoughness: 0.05, normalScale: 0.32, map: 'sunburst' },
    flange: { color: '#18263f', metalness: 0.4, roughness: 0.4 },
    print: '#f1ece2',
    leather: { color: '#1f2839', sheenColor: '#56627e' },
    stitch: { color: '#56617a' },
  },
  ivory: {
    dial: { color: '#ece2cc', metalness: EPS, roughness: 0.52, anisotropy: EPS, clearcoat: 0.75, clearcoatRoughness: 0.1, normalScale: 0.5, map: 'grain' },
    flange: { color: '#e3d8bf', metalness: 0, roughness: 0.5 },
    print: '#191714',
    leather: { color: '#8e5229', sheenColor: '#d49a66' },
    stitch: { color: '#c79a69' },
  },
  malachite: {
    dial: { color: '#1f4d3a', metalness: 0.62, roughness: 0.3, anisotropy: 0.92, clearcoat: 1, clearcoatRoughness: 0.05, normalScale: 0.32, map: 'sunburst' },
    flange: { color: '#1a4030', metalness: 0.4, roughness: 0.4 },
    print: '#f1ece2',
    leather: { color: '#1e382b', sheenColor: '#58806a' },
    stitch: { color: '#4f6b5b' },
  },
};

const NUMERIC = ['metalness', 'roughness', 'clearcoat', 'clearcoatRoughness', 'ior', 'specularIntensity', 'anisotropy', 'normalScale'];

function toState(preset) {
  const state = {};
  for (const [key, value] of Object.entries(preset)) {
    state[key] = typeof value === 'string' && value.startsWith('#') ? new Color(value) : value;
  }
  return state;
}

function lerpState(out, a, b, t) {
  for (const key of Object.keys(b)) {
    if (b[key]?.isColor) out[key].lerpColors(a[key], b[key], t);
    else if (NUMERIC.includes(key)) out[key] = a[key] + (b[key] - a[key]) * t;
  }
}

function copyState(state) {
  const out = {};
  for (const [key, value] of Object.entries(state)) out[key] = value?.isColor ? value.clone() : value;
  return out;
}

const DIAL_SHADER_HEAD = /* glsl */ `
varying vec2 vDialPos;
uniform sampler2D uPrint;
uniform vec3 uPrintColor;
uniform float uDialRadius;
uniform vec3 uHands;      // hour, minute, seconds angles (clockwise from twelve)
uniform vec3 uShadow;     // strength, offset x / y per unit of height

float capsule(vec2 p, vec2 a, vec2 b, float r0, float r1) {
  vec2 pa = p - a;
  vec2 ba = b - a;
  float h = clamp(dot(pa, ba) / dot(ba, ba), 0.0, 1.0);
  return length(pa - ba * h) - mix(r0, r1, h);
}

float handShadow(vec2 p, float angle, float height, float tail, float len, float w0, float w1) {
  vec2 dir = vec2(sin(angle), cos(angle));
  vec2 q = p - uShadow.yz * height;
  float d = capsule(q, -dir * tail, dir * len, w0, w1);
  float soft = 0.004 + height * 0.42;
  return 1.0 - smoothstep(-soft, soft, d);
}
`;

const DIAL_SHADER_SHADOW = /* glsl */ `
float shade = printSample.g * 0.5;
shade = max(shade, handShadow(vDialPos, uHands.x, 0.028, 0.06, 0.5, 0.036, 0.004) * 0.6);
shade = max(shade, handShadow(vDialPos, uHands.y, 0.042, 0.06, 0.75, 0.03, 0.003) * 0.55);
shade = max(shade, handShadow(vDialPos, uHands.z, 0.056, 0.17, 0.79, 0.006, 0.002) * 0.45);
outgoingLight *= 1.0 - shade * uShadow.x;
`;

/**
 * @param {{ tier: 'high'|'low', textures: object, dialRadius: number }} options
 */
export function createMaterials({ tier, textures, dialRadius }) {
  const hi = tier !== 'low';
  const all = new Set();
  const byKind = new Map();
  const cache = new Map();

  function register(material, kind) {
    all.add(material);
    if (kind) {
      if (!byKind.has(kind)) byKind.set(kind, new Set());
      byKind.get(kind).add(material);
    }
    return material;
  }

  // ---------- config-driven state ----------
  let finishId = 'steel';
  let dialId = 'midnight';
  const state = {
    polished: toState(FINISH_PRESETS.steel.polished),
    satin: toState(FINISH_PRESETS.steel.satin),
    accent: toState(FINISH_PRESETS.steel.accent),
    dial: toState(DIAL_PRESETS.midnight.dial),
    flange: toState(DIAL_PRESETS.midnight.flange),
    leather: toState(DIAL_PRESETS.midnight.leather),
    stitch: toState(DIAL_PRESETS.midnight.stitch),
    print: new Color(DIAL_PRESETS.midnight.print),
  };

  const dialUniforms = {
    uPrint: { value: textures.dialPrint },
    uPrintColor: { value: state.print },
    uDialRadius: { value: dialRadius },
    uHands: { value: new Vector3() },
    uShadow: { value: new Vector3(0.62, 0.32, -0.42) },
  };

  // ---------- factories ----------

  function metal(kind, extra = {}) {
    if (!Object.keys(extra).length && cache.has(kind)) return cache.get(kind);
    const s = state[kind];
    const material = new MeshPhysicalMaterial({
      color: s.color.clone(),
      metalness: s.metalness,
      roughness: s.roughness,
      clearcoat: s.clearcoat,
      clearcoatRoughness: s.clearcoatRoughness,
      ior: s.ior,
      specularIntensity: s.specularIntensity,
      ...extra,
    });
    if (kind === 'satin' && hi) material.anisotropy = s.anisotropy;
    register(material, kind);
    if (!Object.keys(extra).length) cache.set(kind, material);
    return material;
  }

  const dial = register(
    new MeshPhysicalMaterial({
      color: state.dial.color.clone(),
      metalness: state.dial.metalness,
      roughness: state.dial.roughness,
      clearcoat: state.dial.clearcoat,
      clearcoatRoughness: state.dial.clearcoatRoughness,
      anisotropy: state.dial.anisotropy,
      anisotropyMap: textures.sunburstAniso,
      normalMap: textures.sunburstLines,
      normalScale: new Vector2(state.dial.normalScale, state.dial.normalScale),
    }),
    'dial',
  );
  dial.onBeforeCompile = (shader) => {
    Object.assign(shader.uniforms, dialUniforms);
    shader.vertexShader = shader.vertexShader
      .replace('#include <common>', '#include <common>\nvarying vec2 vDialPos;')
      .replace('#include <begin_vertex>', '#include <begin_vertex>\nvDialPos = position.xy;');
    shader.fragmentShader = shader.fragmentShader
      .replace('#include <common>', `#include <common>\n${DIAL_SHADER_HEAD}`)
      .replace(
        '#include <color_fragment>',
        `#include <color_fragment>
        vec4 printSample = texture2D(uPrint, vDialPos / (2.0 * uDialRadius) + 0.5);
        float ink = printSample.r;
        diffuseColor.rgb = mix(diffuseColor.rgb, uPrintColor, ink);`,
      )
      .replace('#include <roughnessmap_fragment>', '#include <roughnessmap_fragment>\nroughnessFactor = mix(roughnessFactor, 0.45, ink);')
      .replace('#include <metalnessmap_fragment>', '#include <metalnessmap_fragment>\nmetalnessFactor = mix(metalnessFactor, 0.0, ink);')
      .replace('#include <opaque_fragment>', `${DIAL_SHADER_SHADOW}\n#include <opaque_fragment>`);
  };
  dial.customProgramCacheKey = () => 'oriel-dial';

  const flange = register(
    new MeshPhysicalMaterial({
      color: state.flange.color.clone(),
      metalness: state.flange.metalness,
      roughness: state.flange.roughness,
      clearcoat: 0.6,
      clearcoatRoughness: 0.12,
    }),
    'flange',
  );

  const lume = register(
    new MeshPhysicalMaterial({
      color: '#ece4c8',
      emissive: new Color('#c9d6b0'),
      emissiveIntensity: 0.07,
      roughness: 0.55,
      metalness: 0,
    }),
  );

  const tip = register(
    new MeshPhysicalMaterial({ color: '#cdb07a', metalness: 1, roughness: 0.16 }),
  );

  // Calfskin: soft sheen, fine grain.
  textures.leather.repeat.set(1.6, 1.6);
  const leather = register(
    new MeshPhysicalMaterial({
      color: state.leather.color.clone(),
      roughness: 0.56,
      metalness: 0,
      sheen: 1,
      sheenRoughness: 0.42,
      sheenColor: state.leather.sheenColor.clone(),
      normalMap: textures.leather,
      normalScale: new Vector2(0.45, 0.45),
      clearcoat: hi ? 0.18 : EPS,
      clearcoatRoughness: 0.45,
    }),
    'leather',
  );
  const stitch = register(
    new MeshPhysicalMaterial({ color: state.stitch.color.clone(), roughness: 0.7, metalness: 0, sheen: 0.6, sheenRoughness: 0.6 }),
    'stitch',
  );

  // Sapphire: reflections added over what lies beneath (black diffuse), which the glass dims by its opacity. A thin
  // flat crystal barely refracts, so this matches transmission without re-rendering the scene every frame.
  function sapphire() {
    const material = new MeshPhysicalMaterial({
      color: '#000000',
      metalness: 0,
      roughness: 0.035,
      ior: 1.77,
      specularIntensity: 0.5,
      specularColor: new Color('#c6d6ff'),
      transparent: true,
      opacity: 0.07,
      blending: CustomBlending,
      blendSrc: OneFactor,
      blendDst: OneMinusSrcAlphaFactor,
      depthWrite: false,
    });
    return register(material, 'glass');
  }

  // ---------- movement (fixed finishes) ----------
  textures.perlage.repeat.set(9, 9);
  textures.cotes.repeat.set(2.4, 2.4);
  textures.cotes.rotation = 0.42;
  textures.cotes.center.set(0.5, 0.5);

  const physical = (params) => register(new MeshPhysicalMaterial(params));
  const movement = {
    plate: physical({ color: '#d2d5d8', metalness: 1, roughness: 0.34, normalMap: textures.perlage, normalScale: new Vector2(0.55, 0.55) }),
    bridge: physical({ color: '#dfe2e5', metalness: 1, roughness: 0.2, normalMap: textures.cotes, normalScale: new Vector2(0.65, 0.65) }),
    anglage: physical({ color: '#e4e6e8', metalness: 1, roughness: 0.08 }),
    gilt: physical({ color: '#dcb46c', metalness: 1, roughness: 0.24, normalMap: textures.circular, normalScale: new Vector2(0.4, 0.4) }),
    steel: physical({ color: '#d3d6d9', metalness: 1, roughness: 0.1 }),
    snailed: physical({ color: '#d7dadd', metalness: 1, roughness: 0.16, normalMap: textures.circular, normalScale: new Vector2(0.7, 0.7) }),
    ruby: physical({
      color: '#8c0a1d',
      metalness: 0,
      roughness: 0.05,
      ior: 1.77,
      specularIntensity: 1,
      clearcoat: 1,
      clearcoatRoughness: 0.02,
      emissive: new Color('#5a0410'),
      emissiveIntensity: 0.35,
    }),
    chaton: physical({ color: '#e9c47e', metalness: 1, roughness: 0.1 }),
    blued: physical({ color: '#2b4fb8', metalness: 1, roughness: 0.2, clearcoat: hi ? 0.4 : EPS, clearcoatRoughness: 0.1 }),
    balance: physical({ color: '#dcbb7a', metalness: 1, roughness: 0.14 }),
    hairspring: physical({ color: '#b9c3d6', metalness: 1, roughness: 0.18 }),
    rotor: physical({
      color: '#e9c57f',
      metalness: 1,
      roughness: 0.18,
      normalMap: textures.rotor.normal,
      normalScale: new Vector2(0.9, 0.9),
      aoMap: textures.rotor.ao,
      aoMapIntensity: 0.9,
    }),
    rotorRim: physical({ color: '#ebc883', metalness: 1, roughness: 0.1 }),
  };

  // The hairspring breathes: inner coils turn with the balance, the outer end stays pinned at the stud.
  const springUniforms = { uBalance: { value: 0 } };
  movement.hairspring.onBeforeCompile = (shader) => {
    shader.uniforms.uBalance = springUniforms.uBalance;
    shader.vertexShader = shader.vertexShader
      .replace('#include <common>', '#include <common>\nattribute float aCoil;\nuniform float uBalance;')
      .replace(
        '#include <begin_vertex>',
        `#include <begin_vertex>
        float spin = uBalance * aCoil;
        float cs = cos(spin);
        float sn = sin(spin);
        transformed.xy = mat2(cs, sn, -sn, cs) * transformed.xy;`,
      );
  };
  movement.hairspring.customProgramCacheKey = () => 'oriel-hairspring';

  // ---------- transitions ----------

  function applyKind(kind) {
    const s = state[kind];
    const set = byKind.get(kind);
    if (!set) return;
    for (const m of set) {
      m.color.copy(s.color);
      if ('metalness' in s) m.metalness = s.metalness;
      if ('roughness' in s) m.roughness = s.roughness;
      if ('clearcoat' in s) m.clearcoat = s.clearcoat;
      if ('clearcoatRoughness' in s) m.clearcoatRoughness = s.clearcoatRoughness;
      if ('ior' in s) m.ior = s.ior;
      if ('specularIntensity' in s) m.specularIntensity = s.specularIntensity;
      if ('anisotropy' in s && m.anisotropy > 0) m.anisotropy = Math.max(EPS, s.anisotropy);
      if ('sheenColor' in s) m.sheenColor.copy(s.sheenColor);
    }
  }

  function applyAll() {
    for (const kind of ['polished', 'satin', 'accent', 'dial', 'flange', 'leather', 'stitch']) applyKind(kind);
    dial.normalScale.setScalar(state.dial.normalScale);
  }

  function targets(finish, dialKey) {
    const f = FINISH_PRESETS[finish];
    const d = DIAL_PRESETS[dialKey];
    return {
      polished: toState(f.polished),
      satin: toState(f.satin),
      accent: toState(f.accent),
      dial: toState(d.dial),
      flange: toState(d.flange),
      leather: toState(d.leather),
      stitch: toState(d.stitch),
      print: new Color(d.print),
    };
  }

  const mapFor = (key) => (key === 'grain' ? textures.grain : textures.sunburstLines);
  if (DIAL_PRESETS[dialId].dial.map === 'grain') dial.normalMap = textures.grain;

  let tween = null;
  const progress = { t: 0 };

  /** Cross-fades every config-driven material. Resolves when the transition ends. */
  function setConfig({ finish = finishId, dial: dialKey = dialId } = {}, { immediate = false, duration = 0.6 } = {}) {
    if (!FINISH_PRESETS[finish]) finish = finishId;
    if (!DIAL_PRESETS[dialKey]) dialKey = dialId;
    const fromMap = DIAL_PRESETS[dialId].dial.map;
    const toMap = DIAL_PRESETS[dialKey].dial.map;
    finishId = finish;
    dialId = dialKey;

    const to = targets(finish, dialKey);
    const from = {};
    for (const key of Object.keys(to)) from[key] = key === 'print' ? state.print.clone() : copyState(state[key]);
    tween?.kill();

    const step = (t) => {
      for (const key of Object.keys(to)) {
        if (key === 'print') state.print.lerpColors(from.print, to.print, t);
        else lerpState(state[key], from[key], to[key], t);
      }
      applyAll();
      // Swap the dial's surface texture at the midpoint, where its strength passes through zero.
      if (fromMap !== toMap) {
        const away = t < 0.5;
        dial.normalMap = mapFor(away ? fromMap : toMap);
        const scale = away ? from.dial.normalScale * (1 - t * 2) : to.dial.normalScale * (t * 2 - 1);
        dial.normalScale.setScalar(Math.max(0, scale));
      }
    };

    if (immediate) {
      step(1);
      return Promise.resolve();
    }
    progress.t = 0;
    return new Promise((resolve) => {
      tween = gsap.to(progress, {
        t: 1,
        duration,
        ease: EASE.inOut,
        onUpdate: () => step(progress.t),
        onComplete: resolve,
        onInterrupt: resolve,
      });
    });
  }

  return {
    metal,
    sapphire,
    dial,
    flange,
    lume,
    tip,
    leather,
    stitch,
    movement,
    dialUniforms,
    springUniforms,
    setConfig,
    getConfig: () => ({ finish: finishId, dial: dialId }),
    register,
    all,
    dispose() {
      tween?.kill();
      all.forEach((m) => m.dispose());
    },
  };
}
