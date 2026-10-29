import { useRef, useMemo, useEffect, useState } from 'react';
import { useThree } from '@react-three/fiber';
import { useMotionValueEvent, type MotionValue } from 'framer-motion';
import * as THREE from 'three';
import { BLADE_VERTICES } from './bladeVertices';

interface IrisShutterProps {
  progress: MotionValue<number>;
  sizeVmin?: number; // Size as percentage of viewport min dimension
  maxRotation?: number; // Max rotation in radians when closed (default ~288 degrees)
}

/**
 * Pre-calculate the bounding box of all blade vertices.
 * The vertices are NOT symmetrically normalized to -1..+1, so we need
 * the actual bounds to compute correct scaling.
 */
const BLADE_BOUNDS = (() => {
  let minX = Infinity, maxX = -Infinity;
  let minY = Infinity, maxY = -Infinity;

  for (const blade of BLADE_VERTICES) {
    for (const v of blade) {
      minX = Math.min(minX, v.x);
      maxX = Math.max(maxX, v.x);
      minY = Math.min(minY, v.y);
      maxY = Math.max(maxY, v.y);
    }
  }

  return {
    minX,
    maxX,
    minY,
    maxY,
    width: maxX - minX,
    height: maxY - minY,
    // Center offset from origin (0,0) - blades are not centered at origin
    centerX: (minX + maxX) / 2,
    centerY: (minY + maxY) / 2,
  };
})();

/**
 * Calculate the pivot point (center of inner edge) and blade angle for animation.
 */
function getBladeTransform(vertices: { x: number; y: number }[]) {
  // Vertices are wound: inner1, outer1, outer2, inner2
  // Inner edge is between vertices[0] and vertices[3]
  const inner1 = vertices[0];
  const inner2 = vertices[3];

  // Pivot point is the midpoint of inner edge
  const pivotX = (inner1.x + inner2.x) / 2;
  const pivotY = (inner1.y + inner2.y) / 2;

  // Blade angle from center (0,0) to pivot point
  const bladeAngle = Math.atan2(pivotY, pivotX);

  return { pivotX, pivotY, bladeAngle };
}

/**
 * Create a quad geometry from 4 vertex positions, centered at the pivot point.
 * This allows rotation around the pivot.
 */
function createQuadGeometry(
  vertices: { x: number; y: number }[],
  pivotX: number,
  pivotY: number
): THREE.BufferGeometry {
  const geometry = new THREE.BufferGeometry();

  // Offset vertices so pivot point is at origin (for rotation)
  const positions = new Float32Array([
    // Triangle 1: v0, v1, v2
    vertices[0].x - pivotX, vertices[0].y - pivotY, 0,
    vertices[1].x - pivotX, vertices[1].y - pivotY, 0,
    vertices[2].x - pivotX, vertices[2].y - pivotY, 0,
    // Triangle 2: v0, v2, v3
    vertices[0].x - pivotX, vertices[0].y - pivotY, 0,
    vertices[2].x - pivotX, vertices[2].y - pivotY, 0,
    vertices[3].x - pivotX, vertices[3].y - pivotY, 0,
  ]);

  geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  geometry.computeVertexNormals();

  return geometry;
}

/**
 * Create a closed loop line geometry for the blade outline, inset slightly.
 * Vertices are wound: inner1 (v0), outer1 (v1), outer2 (v2), inner2 (v3)
 */
function createOutlineGeometry(
  vertices: { x: number; y: number }[],
  pivotX: number,
  pivotY: number
): THREE.BufferGeometry {
  const geometry = new THREE.BufferGeometry();

  // Create closed loop using exact vertices: v0 -> v1 -> v2 -> v3 -> v0
  const positions = new Float32Array([
    vertices[0].x - pivotX, vertices[0].y - pivotY, 0,
    vertices[1].x - pivotX, vertices[1].y - pivotY, 0,
    vertices[1].x - pivotX, vertices[1].y - pivotY, 0,
    vertices[2].x - pivotX, vertices[2].y - pivotY, 0,
    vertices[2].x - pivotX, vertices[2].y - pivotY, 0,
    vertices[3].x - pivotX, vertices[3].y - pivotY, 0,
    vertices[3].x - pivotX, vertices[3].y - pivotY, 0,
    vertices[0].x - pivotX, vertices[0].y - pivotY, 0,
  ]);

  geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));

  return geometry;
}

/**
 * IrisShutter - Renders the emblem blades with exact SVG geometry and animation.
 * Each blade rotates around its inner edge pivot point as the aperture opens/closes.
 */
export function IrisShutter({ progress, sizeVmin = 56, maxRotation = Math.PI * 1.6 }: IrisShutterProps) {
  const { invalidate } = useThree();
  const groupRefs = useRef<(THREE.Group | null)[]>([]);

  // Track window size for pixel-based calculations
  const [windowSize, setWindowSize] = useState(() => ({
    width: typeof window !== 'undefined' ? window.innerWidth : 1920,
    height: typeof window !== 'undefined' ? window.innerHeight : 1080,
  }));

  useEffect(() => {
    const handleResize = () => {
      setWindowSize({ width: window.innerWidth, height: window.innerHeight });
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Calculate scale to match OrbitSystem emblem size
  //
  // sizeVmin is the target size as % of viewport min dimension
  // We need to scale the blade geometry so it spans exactly that size in pixels.
  //
  // With orthographic camera zoom: 100, 1 world unit = 100 pixels
  // Blade vertices span BLADE_BOUNDS.width/height (NOT -1 to +1 symmetrically)
  //
  // Formula:
  //   targetPixels = sizeVmin% * min(windowWidth, windowHeight)
  //   targetWorldUnits = targetPixels / 100 (camera zoom)
  //   scale = targetWorldUnits / max(BLADE_BOUNDS.width, BLADE_BOUNDS.height)
  //
  const vminPx = Math.min(windowSize.width, windowSize.height);
  const targetPixels = (sizeVmin / 100) * vminPx;
  const bladeSpan = Math.max(BLADE_BOUNDS.width, BLADE_BOUNDS.height);
  const scale = targetPixels / (100 * bladeSpan);

  // Pre-calculate blade transforms and geometries
  const bladeData = useMemo(() => {
    const outlineMaterial = new THREE.LineBasicMaterial({
      color: '#0a0a0a',
      depthTest: true,
      depthWrite: false,
    });
    return BLADE_VERTICES.map((vertices, index) => {
      const { pivotX, pivotY, bladeAngle } = getBladeTransform(vertices);
      const geometry = createQuadGeometry(vertices, pivotX, pivotY);
      const outlineGeometry = createOutlineGeometry(vertices, pivotX, pivotY);
      const outlineLine = new THREE.LineSegments(outlineGeometry, outlineMaterial);
      // Set render order so each blade's outline renders with that blade
      outlineLine.renderOrder = index;
      return { geometry, outlineLine, pivotX, pivotY, bladeAngle, renderOrder: index };
    });
  }, []);

  // Update blade rotations when progress changes
  useMotionValueEvent(progress, 'change', (value) => {
    for (let i = 0; i < bladeData.length; i++) {
      const group = groupRefs.current[i];
      if (group) {
        // Progress 0 = closed (blades rotated inward)
        // Progress 1 = open (blades at rest position)
        const rotation = (1 - value) * maxRotation;
        group.rotation.z = rotation;
      }
    }
    invalidate();
  });

  // Set initial rotation on mount
  useEffect(() => {
    const initialProgress = progress.get();
    for (let i = 0; i < bladeData.length; i++) {
      const group = groupRefs.current[i];
      if (group) {
        const rotation = (1 - initialProgress) * maxRotation;
        group.rotation.z = rotation;
      }
    }
    invalidate();
  }, [bladeData, progress, maxRotation, invalidate]);

  // Offset to center the blade geometry at world origin
  // Since blades aren't centered at (0,0), we shift by the negative of their center
  const centerOffsetX = -BLADE_BOUNDS.centerX * scale;
  const centerOffsetY = -BLADE_BOUNDS.centerY * scale;

  return (
    <group position={[centerOffsetX, centerOffsetY, 2]} scale={[scale, scale, 1]}>
      {bladeData.map((blade, index) => (
        <group
          key={index}
          ref={(el) => { groupRefs.current[index] = el; }}
          position={[blade.pivotX, blade.pivotY, 0]}
        >
          <mesh geometry={blade.geometry} renderOrder={blade.renderOrder}>
            <meshBasicMaterial color="#ffffff" side={THREE.DoubleSide} depthWrite={true} />
          </mesh>
          {/* Inset outline - black line matching background */}
          <primitive object={blade.outlineLine} />
        </group>
      ))}
    </group>
  );
}
