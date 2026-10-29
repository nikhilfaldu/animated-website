import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import type { ShaderMaterial } from 'three';
import type { MotionValue } from 'framer-motion';
import { irisVertexShader, irisFragmentShader } from './irisShader';
import { useIrisUniforms, type UseIrisUniformsOptions } from './useIrisUniforms';

interface IrisOverlayProps {
  progress: MotionValue<number>;
  blades?: number;
  twist?: number;
  feather?: number;
  /** Enable subtle rotation animation for mechanical feel */
  animateRotation?: boolean;
  /** Rotation speed multiplier (default 0.6) */
  rotationSpeed?: number;
}

/**
 * IrisOverlay - Fullscreen quad with polar coordinate iris shader.
 *
 * Renders a camera-shutter-like mask that reveals/hides content behind it.
 * Position at z > 0 to render in front of the logo.
 */
export function IrisOverlay({
  progress,
  blades = 10,
  twist = 0.65,
  feather = 0.02,
  animateRotation = true,
  rotationSpeed = 0.6,
}: IrisOverlayProps) {
  const materialRef = useRef<ShaderMaterial>(null);

  const options: UseIrisUniformsOptions = {
    blades,
    twist,
    feather,
  };

  const uniforms = useIrisUniforms(progress, options);

  // Subtle rotation animation for mechanical shutter feel
  useFrame((state) => {
    if (animateRotation && materialRef.current) {
      materialRef.current.uniforms.uRotation.value = state.clock.elapsedTime * rotationSpeed;
      state.invalidate();
    }
  });

  return (
    <mesh position={[0, 0, 2]} renderOrder={10}>
      {/* Fullscreen quad in clip space (-1 to 1) */}
      <planeGeometry args={[2, 2]} />
      <shaderMaterial
        ref={materialRef}
        vertexShader={irisVertexShader}
        fragmentShader={irisFragmentShader}
        uniforms={uniforms}
        transparent
        depthTest={false}
        depthWrite={false}
      />
    </mesh>
  );
}
