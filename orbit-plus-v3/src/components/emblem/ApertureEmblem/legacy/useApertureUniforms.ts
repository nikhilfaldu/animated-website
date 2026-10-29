import { useEffect, useMemo, useRef } from 'react';
import * as THREE from 'three';
import { useMotionValueEvent, useSpring, type MotionValue } from 'framer-motion';
import { createEmblemTexture } from './emblemTexture';

interface ApertureUniforms {
  uTex: { value: THREE.Texture | null };
  uTexLoaded: { value: number };
  uProgress: { value: number };
  uOpacity: { value: number };
  uSwingMax: { value: number };
  uRadialPush: { value: number };
  uHinge: { value: number };
  uDelays: { value: number[] };
  uCenter: { value: THREE.Vector2 };
}

export function useApertureUniforms(
  progress: MotionValue<number>,
  invalidate: () => void
): ApertureUniforms {
  const uniforms = useMemo<ApertureUniforms>(() => {
    const delays = new Float32Array(32);

    const order: number[] = [];
    const quadrants = [
      Array.from({ length: 8 }, (_, i) => i),
      Array.from({ length: 8 }, (_, i) => i + 8),
      Array.from({ length: 8 }, (_, i) => i + 16),
      Array.from({ length: 8 }, (_, i) => i + 24),
    ];

    const stride = 3;
    const shuffled = quadrants.map((q) => q.map((_, i) => q[(i * stride) % q.length]));

    for (let i = 0; i < 8; i++) {
      order.push(shuffled[0][i], shuffled[2][i], shuffled[1][i], shuffled[3][i]);
    }

    order.forEach((rayIdx, i) => {
      const base = i * 0.010;
      const jitter = (rayIdx % 7) * 0.002;
      delays[rayIdx] = Math.min(0.22, base + jitter);
    });

    return {
      uTex: { value: null },
      uTexLoaded: { value: 0 }, // 0 = not loaded, 1 = loaded
      uProgress: { value: 0 },
      // Opacity is controlled by DOM layer (Reveal.tsx webglOpacity), so default to 1
      uOpacity: { value: 1 },

      uSwingMax: { value: Math.PI / 2 },
      uRadialPush: { value: 0.0 }, // unused in angular mask
      uHinge: { value: 0.0 },      // unused in angular mask
      uDelays: { value: Array.from(delays) },
      uCenter: { value: new THREE.Vector2(0.5, 0.5) },
    };
  }, []);

  const spring = useSpring(progress, { stiffness: 180, damping: 22, mass: 1 });

  // Store invalidate in a ref to always have the latest version
  const invalidateRef = useRef(invalidate);
  invalidateRef.current = invalidate;

  const textureLoadedRef = useRef(false);
  useEffect(() => {
    if (textureLoadedRef.current) return;
    textureLoadedRef.current = true;

    (async () => {
      const { texture, center } = await createEmblemTexture(2048);
      uniforms.uTex.value = texture;
      uniforms.uTexLoaded.value = 1;
      uniforms.uCenter.value.set(center.x, center.y);
      invalidateRef.current();
    })().catch((err) => console.error('Failed to load emblem texture:', err));
  }, [uniforms]);

  // Ensure initial render - frameloop="demand" requires explicit invalidate
  useEffect(() => {
    invalidate();
  }, [invalidate]);

  useMotionValueEvent(spring, 'change', (v) => {
    uniforms.uProgress.value = v;
    invalidate();
  });

  return uniforms;
}
