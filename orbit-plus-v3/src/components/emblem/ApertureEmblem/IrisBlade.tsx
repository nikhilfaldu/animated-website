import { useRef, useMemo, useEffect } from 'react';
import { useThree } from '@react-three/fiber';
import { useMotionValueEvent, type MotionValue } from 'framer-motion';
import * as THREE from 'three';
import { createBladeGeometry, DEFAULT_BLADE_GEOMETRY } from './createBladeGeometry';

interface IrisBladeProps {
  /** Progress value 0-1 (0=closed, 1=open) */
  progress: MotionValue<number>;
  /** Which blade this is (0-based index) */
  bladeIndex: number;
  /** Total number of blades in iris */
  totalBlades: number;
  /** Maximum rotation in radians when closed */
  maxRotation: number;
  /** Individual blade length multiplier (0-1, default 1) */
  lengthScale?: number;
  /** Custom angle in radians (overrides calculated angle) */
  customAngle?: number;
  /** Distance from center to blade's inner edge (pivot point) */
  innerRadius?: number;
}

/**
 * IrisBlade - Single blade in the camera iris shutter.
 *
 * Positioned at a specific angle around the iris circle,
 * rotates around its pivot point as aperture opens/closes.
 */
export function IrisBlade({
  progress,
  bladeIndex,
  totalBlades,
  maxRotation,
  lengthScale = 1,
  customAngle,
  innerRadius = 0.37,
}: IrisBladeProps) {
  const meshRef = useRef<THREE.Mesh>(null);
  const { invalidate } = useThree();

  // Create blade geometry with scaled length
  const geometry = useMemo(() => {
    return createBladeGeometry({
      ...DEFAULT_BLADE_GEOMETRY,
      length: DEFAULT_BLADE_GEOMETRY.length * lengthScale,
    });
  }, [lengthScale]);

  // Calculate this blade's angular position in the iris circle
  // Use custom angle if provided, otherwise calculate evenly spaced
  const bladeAngle = useMemo(() => {
    if (customAngle !== undefined) {
      return customAngle;
    }
    return (2 * Math.PI / totalBlades) * bladeIndex;
  }, [bladeIndex, totalBlades, customAngle]);

  // Calculate blade position (pivot point at blade's inner edge)
  const position = useMemo<[number, number, number]>(() => {
    const x = Math.cos(bladeAngle) * innerRadius;
    const y = Math.sin(bladeAngle) * innerRadius;
    return [x, y, 0];
  }, [bladeAngle, innerRadius]);

  // Update blade rotation based on progress
  useMotionValueEvent(progress, 'change', (value) => {
    if (meshRef.current) {
      // Progress 0 = closed (blades point at center, no rotation)
      // Progress 1 = open (blades rotated outward, revealing center)
      // Negative rotation to flip direction
      const rotation = -value * maxRotation;

      // Rotate around blade's local Z axis (perpendicular to blade surface)
      // This swings the blade tip outward to open the aperture
      meshRef.current.rotation.z = rotation;

      invalidate();
    }
  });

  // Set initial rotation on mount
  useEffect(() => {
    if (meshRef.current) {
      const initialProgress = progress.get();
      const rotation = -initialProgress * maxRotation;
      meshRef.current.rotation.z = rotation;
    }
  }, [progress, maxRotation]);

  return (
    <group position={position} rotation={[0, 0, bladeAngle + Math.PI]}>
      <mesh ref={meshRef} geometry={geometry}>
        <meshBasicMaterial
          color="#ffffff"
          side={THREE.DoubleSide}
        />
      </mesh>
    </group>
  );
}
