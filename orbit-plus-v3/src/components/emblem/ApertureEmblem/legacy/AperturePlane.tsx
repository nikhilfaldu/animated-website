import * as THREE from 'three';
import { useEffect, useMemo, useRef } from 'react';
import { useThree } from '@react-three/fiber';
import type { MotionValue } from 'framer-motion';
import { fragmentShader, vertexShader } from './apertureShader';
import { useApertureUniforms } from './useApertureUniforms';

interface AperturePlaneProps {
  progress: MotionValue<number>;  // 0..1 progress value
  sizeVmin?: number;              // default 56
}

/**
 * AperturePlane - The actual WebGL mesh that renders the aperture animation.
 *
 * Sizes itself based on sizeVmin prop for controlled, predictable sizing.
 * sizeVmin represents percentage of WINDOW viewport's smaller dimension,
 * then scaled to R3F world units using the viewport ratio.
 */
export function AperturePlane({ progress, sizeVmin = 56 }: AperturePlaneProps) {
  const { invalidate, viewport, size } = useThree();
  const uniforms = useApertureUniforms(progress, invalidate);
  const instancedRef = useRef<THREE.InstancedMesh>(null);

  // Shader material with explicit uniform references
  const material = useMemo(() => {
    return new THREE.ShaderMaterial({
      transparent: true,
      depthWrite: false,
      depthTest: false,
      side: THREE.DoubleSide,
      uniforms: {
        uProgress: uniforms.uProgress,
        uSwingMax: uniforms.uSwingMax,
        uDelays: uniforms.uDelays,
        uCenter: uniforms.uCenter,
        uOpacity: uniforms.uOpacity,
        uTex: uniforms.uTex,
        uTexLoaded: uniforms.uTexLoaded,
      },
      vertexShader,
      fragmentShader,
    });
  }, [uniforms]);

  const geometry = useMemo(() => {
    const geo = new THREE.PlaneGeometry(1, 1, 1, 1);

    const count = 32;
    const angles = new Float32Array(count);
    const inners = new Float32Array(count);
    const outers = new Float32Array(count);
    const halfWs = new Float32Array(count);

    const inner = 0.02;  // normalized radial start
    const outer = 0.5;   // normalized radial end (maps to UV radius ~0.5)
    const halfW = 0.03;  // blade half-width

    for (let i = 0; i < count; i++) {
      angles[i] = (i / count) * Math.PI * 2;
      inners[i] = inner;
      outers[i] = outer;
      halfWs[i] = halfW;
    }

    geo.setAttribute('aAngle', new THREE.InstancedBufferAttribute(angles, 1));
    geo.setAttribute('aInner', new THREE.InstancedBufferAttribute(inners, 1));
    geo.setAttribute('aOuter', new THREE.InstancedBufferAttribute(outers, 1));
    geo.setAttribute('aHalfW', new THREE.InstancedBufferAttribute(halfWs, 1));

    return geo;
  }, []);

  // Calculate plane size based on actual window viewport, not R3F's viewport
  // size.width/height = canvas pixel dimensions
  // viewport.width/height = R3F world units
  const planeArgs = useMemo<[number, number]>(() => {
    const canvasVmin = Math.min(size.width, size.height);
    const targetPx = canvasVmin * (sizeVmin / 100);
    const pxToWorld = viewport.width / size.width;
    const overscan = 1.4;
    const s = targetPx * pxToWorld * overscan;
    const safe = Number.isFinite(s) ? Math.max(1.1, s) : 1.1;
    return [safe, safe];
  }, [size.width, size.height, viewport.width, sizeVmin]);

  useEffect(() => {
    const inst = instancedRef.current;
    if (!inst) return;
    const m = new THREE.Matrix4();
    for (let i = 0; i < 32; i++) {
      m.identity();
      inst.setMatrixAt(i, m);
    }
    inst.instanceMatrix.needsUpdate = true;
  }, []);

  const [scaleX, scaleY] = planeArgs;

  return (
    <instancedMesh
      ref={instancedRef}
      args={[geometry, material, 32]}
      position={[0, 0, 0]}
      scale={[scaleX, scaleY, 1]}
    />
  );
}
