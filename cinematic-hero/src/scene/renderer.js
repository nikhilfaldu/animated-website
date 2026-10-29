import * as THREE from 'three';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js';
import { debounce } from './debounce.js';

export function createRenderer(canvas, { bloom }) {
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setSize(window.innerWidth, window.innerHeight);

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(
    50,
    window.innerWidth / window.innerHeight,
    0.1,
    100,
  );
  camera.position.z = 6;

  const composer = new EffectComposer(renderer);
  composer.addPass(new RenderPass(scene, camera));

  let bloomPass = null;
  if (bloom.enabled) {
    bloomPass = new UnrealBloomPass(
      new THREE.Vector2(window.innerWidth, window.innerHeight),
      bloom.strength,
      bloom.radius,
      0.1,
    );
    composer.addPass(bloomPass);
  }

  function resize() {
    const width = window.innerWidth;
    const height = window.innerHeight;
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
    renderer.setSize(width, height);
    composer.setSize(width, height);
    if (bloomPass) bloomPass.resolution.set(width, height);
  }

  window.addEventListener('resize', debounce(resize, 150));

  return { renderer, scene, camera, composer };
}
