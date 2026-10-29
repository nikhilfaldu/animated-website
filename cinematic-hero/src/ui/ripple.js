import * as THREE from 'three';

const Y_AXIS = new THREE.Vector3(0, 1, 0);

export function initClickRipple({ heroEl, mesh, camera, particleField }) {
  const raycaster = new THREE.Raycaster();
  const pointer = new THREE.Vector2();
  const plane = new THREE.Plane(new THREE.Vector3(0, 0, 1), 0);
  const hit = new THREE.Vector3();
  const inverse = new THREE.Matrix4();

  heroEl.addEventListener('pointerdown', (e) => {
    // Rippling the half-scattered cloud during the load-in assembly looks
    // broken rather than playful; ignore clicks until it settles.
    if (particleField.material.uniforms.uAssembly.value < 1) return;
    pointer.x = (e.clientX / window.innerWidth) * 2 - 1;
    pointer.y = -(e.clientY / window.innerHeight) * 2 + 1;
    raycaster.setFromCamera(pointer, camera);
    if (!raycaster.ray.intersectPlane(plane, hit)) return;

    // World -> mesh local: undoes the cursor-parallax mesh rotation.
    mesh.updateMatrixWorld();
    inverse.copy(mesh.matrixWorld).invert();
    hit.applyMatrix4(inverse);

    // The shader spins vertices by Ry(-uTime*0.05) (x' = xc - zs, z' = xs + zc),
    // so map the click into pre-spin space with the inverse, Ry(+angle).
    const angle = particleField.material.uniforms.uTime.value * 0.05;
    hit.applyAxisAngle(Y_AXIS, angle);

    particleField.triggerRipple(hit);
  });
}
