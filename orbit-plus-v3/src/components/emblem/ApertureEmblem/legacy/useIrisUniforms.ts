import { useMemo, useRef, useEffect } from 'react';
import { useThree } from '@react-three/fiber';
import { useSpring, useMotionValueEvent, type MotionValue } from 'framer-motion';
import { IRIS_DEFAULTS } from './irisShader';

export interface IrisUniforms {
  [uniform: string]: { value: number };
  uAperture: { value: number };
  uBlades: { value: number };
  uRotation: { value: number };
  uTwist: { value: number };
  uFeather: { value: number };
  uOpacity: { value: number };
  uRadiusOpen: { value: number };
  uRadiusClosed: { value: number };
  uAspect: { value: number };
}

export interface UseIrisUniformsOptions {
  blades?: number;
  twist?: number;
  feather?: number;
  radiusOpen?: number;
  radiusClosed?: number;
}

/**
 * Hook to manage iris shader uniforms with spring-smoothed progress.
 *
 * Much simpler than the old useApertureUniforms - no delay arrays,
 * no centroid calculation, just direct aperture control.
 */
export function useIrisUniforms(
  progress: MotionValue<number>,
  options: UseIrisUniformsOptions = {}
): IrisUniforms {
  const { invalidate, size } = useThree();
  const invalidateRef = useRef(invalidate);
  invalidateRef.current = invalidate;

  const {
    blades = IRIS_DEFAULTS.blades,
    twist = IRIS_DEFAULTS.twist,
    feather = IRIS_DEFAULTS.feather,
    radiusOpen = IRIS_DEFAULTS.radiusOpen,
    radiusClosed = IRIS_DEFAULTS.radiusClosed,
  } = options;

  // Spring-smooth the progress for natural motion
  const spring = useSpring(progress, {
    stiffness: 180,
    damping: 22,
    mass: 1,
  });

  // Create uniforms once
  const uniforms = useMemo<IrisUniforms>(
    () => ({
      uAperture: { value: IRIS_DEFAULTS.aperture },
      uBlades: { value: blades },
      uRotation: { value: IRIS_DEFAULTS.rotation },
      uTwist: { value: twist },
      uFeather: { value: feather },
      uOpacity: { value: IRIS_DEFAULTS.opacity },
      uRadiusOpen: { value: radiusOpen },
      uRadiusClosed: { value: radiusClosed },
      uAspect: { value: 1.0 },
    }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [] // Intentionally empty - uniforms are stable references, values update in place
  );

  // Update aspect ratio when viewport size changes
  useEffect(() => {
    const aspect = size.width / size.height;
    uniforms.uAspect.value = aspect;
    invalidateRef.current();
  }, [uniforms, size.width, size.height]);

  // Update static uniforms when options change
  useEffect(() => {
    uniforms.uBlades.value = blades;
    uniforms.uTwist.value = twist;
    uniforms.uFeather.value = feather;
    uniforms.uRadiusOpen.value = radiusOpen;
    uniforms.uRadiusClosed.value = radiusClosed;
    invalidateRef.current();
  }, [uniforms, blades, twist, feather, radiusOpen, radiusClosed]);

  // Subscribe to spring changes and update aperture uniform
  useMotionValueEvent(spring, 'change', (value) => {
    // Clamp to [0, 1] to handle any spring overshoot
    uniforms.uAperture.value = Math.max(0, Math.min(1, value));
    invalidateRef.current();
  });

  return uniforms;
}
