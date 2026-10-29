import * as THREE from 'three';

export interface BladeGeometryOptions {
  /** Blade length from pivot to tip */
  length: number;
  /** Width at pivot (base) end */
  widthBase: number;
  /** Width at tip end */
  widthTip: number;
  /** Arc curvature factor (0 = straight, 1 = heavily curved) */
  curvature: number;
  /** Number of segments along length for smooth curve */
  segments: number;
}

/**
 * Create a curved trapezoid blade geometry for camera iris.
 *
 * Geometry is oriented with:
 * - Pivot point at origin (0, 0, 0)
 * - Blade extends along +X axis
 * - Width along Y axis
 *
 * This allows rotating around Z axis to swing blade open/closed.
 */
export function createBladeGeometry(options: BladeGeometryOptions): THREE.BufferGeometry {
  const {
    length,
    widthBase,
    widthTip,
    curvature,
    segments,
  } = options;

  const positions: number[] = [];
  const normals: number[] = [];
  const uvs: number[] = [];
  const indices: number[] = [];

  // Generate vertices along blade length
  for (let i = 0; i <= segments; i++) {
    const t = i / segments; // 0 to 1 along length

    // X position (distance from pivot)
    const x = t * length;

    // Width interpolation (trapezoid taper)
    const width = THREE.MathUtils.lerp(widthBase, widthTip, t);

    // Y curvature (arc following iris circle)
    // Blade curves slightly inward to follow circular aperture
    const curveOffset = Math.sin(t * Math.PI) * curvature * length * 0.15;

    // Create two vertices at this segment (top and bottom edge)
    const yTop = width / 2 - curveOffset;
    const yBottom = -width / 2 + curveOffset;

    // Top vertex
    positions.push(x, yTop, 0);
    normals.push(0, 0, 1); // Facing viewer (+Z)
    uvs.push(t, 1);

    // Bottom vertex
    positions.push(x, yBottom, 0);
    normals.push(0, 0, 1);
    uvs.push(t, 0);
  }

  // Generate triangle indices
  for (let i = 0; i < segments; i++) {
    const baseIndex = i * 2;

    // Two triangles per segment (quad)
    // Triangle 1
    indices.push(baseIndex, baseIndex + 1, baseIndex + 2);
    // Triangle 2
    indices.push(baseIndex + 1, baseIndex + 3, baseIndex + 2);
  }

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  geometry.setAttribute('normal', new THREE.Float32BufferAttribute(normals, 3));
  geometry.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
  geometry.setIndex(indices);

  return geometry;
}

/**
 * Default blade geometry parameters for standard iris
 */
export const DEFAULT_BLADE_GEOMETRY: BladeGeometryOptions = {
  length: 0.9,        // Longer blades to cover center when closed
  widthBase: 0.08,    // Match emblem blade width
  widthTip: 0.08,     // Same width (straight rectangular blade)
  curvature: 0,       // Straight blade, no curve
  segments: 2,        // Only need 2 for straight blade
};
