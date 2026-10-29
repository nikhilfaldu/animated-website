import * as THREE from 'three';
import { ring, cubeOutline, starfield, initials } from './shapes.js';
import vertexShader from './particle.vert.glsl?raw';
import fragmentShader from './particle.frag.glsl?raw';

// One stop per shape: ring, cube, monogram, starfield. setProgress() lerps
// between adjacent stops so the color always matches the current morph.
const PALETTE = [
  new THREE.Color(0xbfe6ff),
  new THREE.Color(0xb39dff),
  new THREE.Color(0xffb86b),
  new THREE.Color(0x7f9cff),
];

export class ParticleField {
  constructor({ count, colorHex = 0xbfe6ff } = {}) {
    this.count = count;

    const positionA = ring(count);
    const positionB = cubeOutline(count);
    const positionC = initials(count);
    const positionD = starfield(count);
    const positionScatter = starfield(count, { spread: 14 });

    const phase = new Float32Array(count);
    for (let i = 0; i < count; i += 1) phase[i] = Math.random() * Math.PI * 2;

    this.geometry = new THREE.BufferGeometry();
    // 'position' is required by THREE to know the vertex count for the draw
    // call; the shader ignores it in favor of positionA/B/C below.
    this.geometry.setAttribute('position', new THREE.BufferAttribute(positionA.slice(), 3));
    this.geometry.setAttribute('positionA', new THREE.BufferAttribute(positionA, 3));
    this.geometry.setAttribute('positionB', new THREE.BufferAttribute(positionB, 3));
    this.geometry.setAttribute('positionC', new THREE.BufferAttribute(positionC, 3));
    this.geometry.setAttribute('positionD', new THREE.BufferAttribute(positionD, 3));
    this.geometry.setAttribute('positionScatter', new THREE.BufferAttribute(positionScatter, 3));
    this.geometry.setAttribute('phase', new THREE.BufferAttribute(phase, 1));

    this.material = new THREE.ShaderMaterial({
      uniforms: {
        uProgress: { value: 0 },
        uTime: { value: 0 },
        uColor: { value: new THREE.Color(colorHex) },
        uAssembly: { value: 0 },
        uRippleCenter: { value: new THREE.Vector3() },
        uRippleStart: { value: -1000.0 },
      },
      vertexShader,
      fragmentShader,
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    });

    this.mesh = new THREE.Points(this.geometry, this.material);
  }

  setProgress(progress) {
    this.material.uniforms.uProgress.value = progress;
    const t = Math.min(Math.max(progress, 0), 2.9999);
    const i = Math.floor(t);
    this.material.uniforms.uColor.value.copy(PALETTE[i]).lerp(PALETTE[i + 1], t - i);
  }

  setAssembly(value) {
    this.material.uniforms.uAssembly.value = value;
  }

  triggerRipple(center) {
    this.material.uniforms.uRippleCenter.value.copy(center);
    this.material.uniforms.uRippleStart.value = this.material.uniforms.uTime.value;
  }

  getTintCss(strength = 0.22) {
    const c = this.material.uniforms.uColor.value;
    const r = Math.round(c.r * 255 * strength);
    const g = Math.round(c.g * 255 * strength);
    const b = Math.round(c.b * 255 * strength);
    return `rgb(${r} ${g} ${b})`;
  }

  update(deltaSeconds) {
    this.material.uniforms.uTime.value += deltaSeconds;
  }

  dispose() {
    this.geometry.dispose();
    this.material.dispose();
  }
}
