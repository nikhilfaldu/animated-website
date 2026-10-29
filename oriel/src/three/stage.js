// The one WebGL stage per page: renderer, studio light, the watch, and a damped pose system that maps
// resolution-independent poses (docs/DIRECTION.md §3) onto the scene. Pauses itself whenever it can't be seen.
import {
  CustomBlending,
  DirectionalLight,
  Euler,
  HalfFloatType,
  Mesh,
  NeutralToneMapping,
  OneFactor,
  OneMinusConstantAlphaFactor,
  OrthographicCamera,
  PerspectiveCamera,
  PlaneGeometry,
  Scene,
  ShaderMaterial,
  SRGBColorSpace,
  Vector2,
  Vector3,
  WebGLRenderer,
  WebGLRenderTarget,
} from 'three';
import { createWatch } from './watch.js';
import { createStudioEnvironment } from './environment.js';
import { DEFAULT_POSE, POSE_KEYS } from './poses.js';

const FOV = 26;
const CAMERA_Z = 12;
const POSE_DAMPING = 6;
const POINTER_DAMPING = 4;
const TILT = 0.1; // radians at the edge of the screen (≈ 6°)
const SNAPSHOT_TIME = { h: 10, m: 10, s: 32 };
const MIN_WEIGHT = 0.004; // a fade level weighing less than this is not worth its own render
const FADE_DPR = 1.5; // mid-fade the watch renders two or three times, at no more than this pixel ratio
// Adaptive resolution: after two seconds of frames slower than SLOW_FRAME, the pixel ratio drops a step (never back up).
const SLOW_FRAME = 1 / 40;
const DPR_STEP = 0.25;

const clamp = (v, min, max) => (v < min ? min : v > max ? max : v);

// Lays a linear, premultiplied render of the watch over the canvas at a constant weight (the material's
// blendAlpha): canvas = layer * weight + canvas * (1 - weight). Tone mapping and encoding match a direct render.
const LAYER_BLEND = {
  vertexShader: /* glsl */ `
    varying vec2 vUv;
    void main() {
      vUv = uv;
      gl_Position = vec4(position.xy, 0.0, 1.0);
    }`,
  fragmentShader: /* glsl */ `
    uniform sampler2D tLayer;
    uniform float uWeight;
    varying vec2 vUv;
    void main() {
      vec4 texel = texture2D(tLayer, vUv);
      // Tone map the unpremultiplied colour, like a direct render does before its edges are resolved.
      float coverage = texel.a > 0.001 ? texel.a : 1.0;
      gl_FragColor = vec4(texel.rgb / coverage, 1.0);
      #include <tonemapping_fragment>
      #include <colorspace_fragment>
      gl_FragColor = vec4(gl_FragColor.rgb * coverage, texel.a) * uWeight;
    }`,
};

/**
 * @param {{ canvas: HTMLCanvasElement, tier?: 'high' | 'low', time?: 'live' | 'fixed' }} options
 */
export function createStage({ canvas, tier = 'high', time = 'live' }) {
  const hi = tier !== 'low';
  const renderer = new WebGLRenderer({ canvas, antialias: hi, alpha: true, powerPreference: 'high-performance' });
  renderer.setClearColor(0x000000, 0);
  renderer.toneMapping = NeutralToneMapping;
  renderer.toneMappingExposure = 1.05;
  renderer.outputColorSpace = SRGBColorSpace;
  renderer.autoClear = false;
  renderer.debug.checkShaderErrors = import.meta.env.DEV;
  const minDpr = hi ? 1 : 0.75;
  let maxDpr = 1.5; // with 4x MSAA, sharp on high-density screens at under 60% of the pixels of 2x

  const scene = new Scene();
  const camera = new PerspectiveCamera(FOV, 1, 0.5, 60);
  camera.position.set(0, 0, CAMERA_Z);
  const key = new DirectionalLight('#fff1df', 1.4);
  key.position.set(-4, 5, 6);
  const rim = new DirectionalLight('#d4e1ff', 1.0);
  rim.position.set(5, 2, -6);
  const fill = new DirectionalLight('#f3ece2', 0.45);
  fill.position.set(1, -5, 4);
  scene.add(key, rim, fill);

  // Mid-fade, every level renders here and is blended onto the canvas (see draw()). Sized to the drawing buffer.
  const layerTarget = new WebGLRenderTarget(1, 1, { type: HalfFloatType, samples: hi ? 4 : 0 });
  const layerBlend = new ShaderMaterial({
    ...LAYER_BLEND,
    uniforms: { tLayer: { value: layerTarget.texture }, uWeight: { value: 1 } },
    blending: CustomBlending,
    blendSrc: OneFactor,
    blendDst: OneMinusConstantAlphaFactor,
    blendSrcAlpha: OneFactor,
    blendDstAlpha: OneMinusConstantAlphaFactor,
    depthTest: false,
    depthWrite: false,
  });
  const layerQuad = new Mesh(new PlaneGeometry(2, 2), layerBlend);
  layerQuad.frustumCulled = false;
  const quadCamera = new OrthographicCamera();
  const bufferSize = new Vector2();
  const weights = []; // per fade level, see draw()

  const target = { ...DEFAULT_POSE };
  const current = { ...DEFAULT_POSE };
  const pointer = { tx: 0, ty: 0, x: 0, y: 0 };
  const drag = { yaw: 0, velocity: 0, active: false };
  const euler = new Euler(0, 0, 0, 'XYZ');
  const offset = new Vector3();
  const dialAxis = new Vector3();
  const toCamera = new Vector3();
  const projected = new Vector3();
  const results = new Map();
  const clock = { h: 0, m: 0, s: 0 };
  const frameCallbacks = new Set();
  const lostCallbacks = new Set();

  let watch = null;
  let env = null;
  let pendingConfig = null;
  let spinAngle = 0;
  let width = 1;
  let height = 1;
  let running = true;
  let inView = true;
  let lost = false;
  let disposed = false;
  let raf = 0;
  let last = performance.now();
  let opacity = -1;
  let frameTime = 1 / 60; // smoothed seconds per drawn frame
  let slowFor = 0;
  let settling = 3; // seconds before the resolution may drop (loading work makes early frames slow)

  canvas.style.transition = 'none';

  /** Matches the drawing buffer to the canvas box. Reallocating it stalls the GPU, so only when something changed. */
  function resize() {
    const w = Math.max(1, canvas.clientWidth);
    const h = Math.max(1, canvas.clientHeight);
    const ratio = Math.min(window.devicePixelRatio || 1, maxDpr);
    if (w === width && h === height && ratio === renderer.getPixelRatio()) return;
    width = w;
    height = h;
    renderer.setDrawingBufferSize(w, h, ratio);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
  }

  function readClock() {
    if (time === 'fixed') return Object.assign(clock, SNAPSHOT_TIME);
    const d = new Date();
    clock.h = d.getHours();
    clock.m = d.getMinutes();
    clock.s = d.getSeconds() + d.getMilliseconds() / 1000;
    return clock;
  }

  /** Damps the current pose toward the target and places the watch. dt = 0 applies without damping. */
  function applyPose(dt) {
    const k = dt > 0 ? 1 - Math.exp(-POSE_DAMPING * dt) : 1;
    for (const name of POSE_KEYS) current[name] += (target[name] - current[name]) * k;
    spinAngle += current.spin * dt;
    if (!drag.active) {
      drag.yaw += drag.velocity * dt;
      drag.velocity *= Math.exp(-2.5 * dt);
    }
    const kp = dt > 0 ? 1 - Math.exp(-POINTER_DAMPING * dt) : 1;
    pointer.x += (pointer.tx - pointer.x) * kp;
    pointer.y += (pointer.ty - pointer.y) * kp;

    const root = watch.root;
    const viewHeight = 2 * CAMERA_Z * Math.tan((FOV * Math.PI) / 360);
    const viewWidth = viewHeight * camera.aspect;
    const scale = (current.size * (Math.min(width, height) / height) * viewHeight) / 2;
    root.scale.setScalar(scale);
    euler.set(current.rx + pointer.y * TILT, current.ry + spinAngle + drag.yaw + pointer.x * TILT, current.rz);
    root.quaternion.setFromEuler(euler);
    // Put the pivot (ox, oy) at the requested screen point.
    offset.set(current.ox, current.oy, 0).multiplyScalar(scale).applyQuaternion(root.quaternion);
    root.position.set((current.x * viewWidth) / 2 - offset.x, (current.y * viewHeight) / 2 - offset.y, -offset.z);
    // The camera's height above the dial plane, in watch units: the watch hides what the closed case conceals.
    dialAxis.set(0, 0, 1).applyQuaternion(root.quaternion);
    toCamera.copy(camera.position).sub(root.position);
    watch.setLayers(current, toCamera.dot(dialAxis) / scale);

    const visibility = clamp(current.visibility, 0, 1);
    if (Math.abs(visibility - opacity) > 0.002) {
      opacity = visibility;
      canvas.style.opacity = visibility.toFixed(3);
    }
  }

  /**
   * Renders the watch. While parts are fading, it renders once per fade level in play (movement alone, + case,
   * + strap) into the layer target and blends the images by presence, so each set of parts fades out as one piece.
   * Otherwise it renders straight to the canvas. A fade never mixes the two, so materials only switch between
   * their canvas and target shader programs when a fade starts or ends, not on every frame.
   */
  function draw() {
    const { levels } = watch;
    let presence = 1; // of the image showing the first `count` levels
    let images = 0;
    for (let count = 0; count <= levels.length; count++) {
      const next = count < levels.length ? Math.min(presence, levels[count].presence) : 0;
      weights[count] = presence - next < MIN_WEIGHT ? 0 : presence - next;
      if (weights[count]) images++;
      presence = next;
    }
    renderer.setRenderTarget(null);
    renderer.clear();
    if (images > 1) {
      const scale = Math.min(1, FADE_DPR / renderer.getPixelRatio());
      renderer.getDrawingBufferSize(bufferSize);
      layerTarget.setSize(Math.round(bufferSize.x * scale), Math.round(bufferSize.y * scale));
    }
    let drawn = 0; // weight already on the canvas
    weights.forEach((weight, count) => {
      if (!weight) return;
      watch.showLevels(count);
      if (images === 1) {
        renderer.render(scene, camera);
        return;
      }
      renderer.setRenderTarget(layerTarget);
      renderer.clear();
      renderer.render(scene, camera);
      renderer.setRenderTarget(null);
      layerBlend.blendAlpha = layerBlend.uniforms.uWeight.value = weight / (drawn + weight);
      renderer.render(layerQuad, quadCamera);
      drawn += weight;
    });
    watch.showLevels();
  }

  /** Returns whether a frame was drawn. */
  function render(dt) {
    applyPose(dt);
    if (current.visibility < 0.004 && target.visibility < 0.004) return false;
    watch.update(dt, readClock());
    draw();
    frameCallbacks.forEach((cb) => cb(api));
    return true;
  }

  /** Lowers the pixel ratio a step after a sustained run of slow frames. */
  function governResolution(dt) {
    if ((settling -= dt) > 0) return;
    frameTime += (dt - frameTime) * 0.1;
    slowFor = frameTime > SLOW_FRAME ? slowFor + dt : 0;
    const ratio = renderer.getPixelRatio();
    if (slowFor < 2 || ratio <= minDpr) return;
    maxDpr = Math.max(minDpr, ratio - DPR_STEP);
    resize();
    slowFor = 0;
    frameTime = 1 / 60;
    settling = 0.5;
  }

  function loop(now) {
    raf = requestAnimationFrame(loop);
    const dt = Math.min(0.1, (now - last) / 1000);
    last = now;
    if (!watch || lost || !running || !inView || document.hidden) return;
    if (render(dt)) governResolution(dt);
  }

  const resizeObserver = new ResizeObserver(() => resize());
  resizeObserver.observe(canvas);
  const viewObserver = new IntersectionObserver(([entry]) => {
    inView = entry.isIntersecting;
  });
  viewObserver.observe(canvas);

  const onVisibility = () => {
    last = performance.now();
  };
  document.addEventListener('visibilitychange', onVisibility);

  const onLost = (event) => {
    event.preventDefault();
    lost = true;
    lostCallbacks.forEach((cb) => cb());
  };
  canvas.addEventListener('webglcontextlost', onLost);

  const ready = (async () => {
    resize();
    env = createStudioEnvironment(renderer, { size: hi ? 256 : 128 });
    scene.environment = env.texture;
    watch = await createWatch({ tier });
    if (disposed) {
      watch.dispose();
      return;
    }
    scene.add(watch.root);
    if (pendingConfig) watch.setConfig(pendingConfig, { immediate: true });
    applyPose(0);
    // Programs are created when compileAsync is called, for visible objects only: show every part meanwhile.
    // The first frame needs the canvas variants; the layer target's (only used mid-fade, once the visitor
    // scrolls) compile in the background after it.
    const compileAll = (renderTarget) => {
      watch.showAll();
      renderer.setRenderTarget(renderTarget);
      const compiled = renderer.compileAsync(scene, camera);
      renderer.setRenderTarget(null);
      watch.showLevels();
      return compiled;
    };
    await Promise.all([compileAll(null), renderer.compileAsync(layerQuad, quadCamera)]);
    // Draw every part once while the preloader still covers the page: geometry and textures upload on first draw,
    // so nothing stalls when a hidden part (the movement, the strap) first comes into view.
    watch.showAll();
    renderer.render(scene, camera);
    watch.settle();
    render(0);
    last = performance.now();
    raf = requestAnimationFrame(loop);
    compileAll(layerTarget).catch(() => {});
  })();

  const api = {
    ready,

    setPose(pose, { immediate = false } = {}) {
      for (const name of POSE_KEYS) if (typeof pose?.[name] === 'number') target[name] = pose[name];
      if (immediate) Object.assign(current, target);
    },

    getPose: () => ({ ...current }),

    setConfig(config, options) {
      if (!watch) {
        pendingConfig = { ...pendingConfig, ...config };
        return Promise.resolve();
      }
      return watch.setConfig(config, options);
    },

    setPointer(nx, ny) {
      pointer.tx = clamp(nx || 0, -1, 1);
      pointer.ty = clamp(ny || 0, -1, 1);
    },

    enableDrag(el) {
      let id = null;
      let lastX = 0;
      let lastT = 0;
      const previousTouchAction = el.style.touchAction;
      el.style.touchAction = 'pan-y';
      const down = (e) => {
        if (e.button !== 0 || id !== null) return;
        id = e.pointerId;
        el.setPointerCapture?.(id);
        drag.active = true;
        drag.velocity = 0;
        lastX = e.clientX;
        lastT = e.timeStamp;
      };
      const move = (e) => {
        if (e.pointerId !== id) return;
        const dx = e.clientX - lastX;
        const seconds = Math.max(8, e.timeStamp - lastT) / 1000;
        drag.yaw += dx * 0.008;
        drag.velocity = (dx * 0.008) / seconds;
        lastX = e.clientX;
        lastT = e.timeStamp;
      };
      const up = (e) => {
        if (e.pointerId !== id) return;
        el.releasePointerCapture?.(id);
        id = null;
        drag.active = false;
        if (e.timeStamp - lastT > 80) drag.velocity = 0;
      };
      el.addEventListener('pointerdown', down);
      el.addEventListener('pointermove', move);
      el.addEventListener('pointerup', up);
      el.addEventListener('pointercancel', up);
      return () => {
        el.removeEventListener('pointerdown', down);
        el.removeEventListener('pointermove', move);
        el.removeEventListener('pointerup', up);
        el.removeEventListener('pointercancel', up);
        el.style.touchAction = previousTouchAction;
        drag.active = false;
      };
    },

    /** CSS px relative to the canvas box. The returned object is reused per anchor. */
    project(anchorId) {
      let result = results.get(anchorId);
      if (!result) results.set(anchorId, (result = { x: 0, y: 0, visible: false }));
      const anchor = watch?.anchors[anchorId];
      if (!anchor) {
        result.visible = false;
        return result;
      }
      projected.copy(anchor.local).applyMatrix4(anchor.object.matrixWorld).project(camera);
      result.x = ((projected.x + 1) / 2) * width;
      result.y = ((1 - projected.y) / 2) * height;
      result.visible = anchor.object.visible && current.visibility > 0.01 && projected.z < 1;
      return result;
    },

    onFrame(cb) {
      frameCallbacks.add(cb);
      return () => frameCallbacks.delete(cb);
    },

    onContextLost(cb) {
      lostCallbacks.add(cb);
      if (lost) cb();
      return () => lostCallbacks.delete(cb);
    },

    async snapshot({ pose, finish, dial, width: w = 1600, height: h = 1600, type = 'image/webp', quality = 0.9, time: at = SNAPSHOT_TIME } = {}) {
      await ready;
      const saved = { target: { ...target }, current: { ...current }, spinAngle, yaw: drag.yaw, config: watch.getConfig(), running };
      running = false;
      await watch.setConfig({ finish: finish ?? saved.config.finish, dial: dial ?? saved.config.dial }, { immediate: true });
      Object.assign(target, DEFAULT_POSE, pose);
      Object.assign(current, target);
      spinAngle = 0;
      drag.yaw = 0;
      pointer.x = pointer.y = pointer.tx = pointer.ty = 0;
      renderer.setDrawingBufferSize(w, h, 1);
      width = w;
      height = h;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      applyPose(0);
      watch.settle();
      watch.update(0, at);
      draw();
      const blob = await new Promise((resolve) => canvas.toBlob(resolve, type, quality));

      Object.assign(target, saved.target);
      Object.assign(current, saved.current);
      spinAngle = saved.spinAngle;
      drag.yaw = saved.yaw;
      await watch.setConfig(saved.config, { immediate: true });
      resize();
      running = saved.running;
      return blob;
    },

    start() {
      running = true;
      last = performance.now();
    },
    stop() {
      running = false;
    },

    dispose() {
      if (disposed) return;
      disposed = true;
      cancelAnimationFrame(raf);
      resizeObserver.disconnect();
      viewObserver.disconnect();
      document.removeEventListener('visibilitychange', onVisibility);
      canvas.removeEventListener('webglcontextlost', onLost);
      frameCallbacks.clear();
      lostCallbacks.clear();
      watch?.dispose();
      env?.dispose();
      layerTarget.dispose();
      layerBlend.dispose();
      layerQuad.geometry.dispose();
      renderer.dispose();
    },
  };

  return api;
}
