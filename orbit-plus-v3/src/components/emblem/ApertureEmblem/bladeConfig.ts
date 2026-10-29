/**
 * Blade configuration extracted from EMBLEM_PATHS SVG data.
 * Each blade has a specific angle and length that matches the emblem design.
 *
 * The emblem has 32 blades with varying lengths:
 * - Shortest blades (~0.32-0.34) near 0°, 180°, and 360° (horizontal axis)
 * - Longest blades (~0.84-0.88) near 90° and 270° (vertical axis)
 *
 * This creates the distinctive pattern where blades are longer on the
 * vertical axis and shorter on the horizontal axis.
 */

export interface BladeConfig {
  /** Index in original EMBLEM_PATHS array */
  index: number;
  /** Angle in degrees from center (0° = right, 90° = down) */
  angleDeg: number;
  /** Inner radius (0-1, distance from center where blade starts) */
  innerRadius: number;
  /** Outer radius (0-1, distance from center where blade ends) */
  outerRadius: number;
  /** Blade length (outerRadius - innerRadius) */
  length: number;
}

// Blade data extracted from EMBLEM_PATHS, maintaining original array order
export const BLADE_CONFIGS: BladeConfig[] = [
  { index: 0,  angleDeg: 294, innerRadius: 0.49, outerRadius: 1.01, length: 0.52 },
  { index: 1,  angleDeg: 65,  innerRadius: 0.47, outerRadius: 1.00, length: 0.52 },
  { index: 2,  angleDeg: 180, innerRadius: 0.12, outerRadius: 1.00, length: 0.88 },
  { index: 3,  angleDeg: 1,   innerRadius: 1.00, outerRadius: 1.32, length: 0.32 },
  { index: 4,  angleDeg: 248, innerRadius: 0.27, outerRadius: 1.00, length: 0.74 },
  { index: 5,  angleDeg: 30,  innerRadius: 0.62, outerRadius: 1.00, length: 0.38 },
  { index: 6,  angleDeg: 113, innerRadius: 0.26, outerRadius: 1.00, length: 0.74 },
  { index: 7,  angleDeg: 329, innerRadius: 0.62, outerRadius: 1.00, length: 0.38 },
  { index: 8,  angleDeg: 213, innerRadius: 0.16, outerRadius: 1.00, length: 0.84 },
  { index: 9,  angleDeg: 15,  innerRadius: 0.66, outerRadius: 1.00, length: 0.34 },
  { index: 10, angleDeg: 86,  innerRadius: 0.37, outerRadius: 1.00, length: 0.62 },
  { index: 11, angleDeg: 312, innerRadius: 0.56, outerRadius: 1.00, length: 0.44 },
  { index: 12, angleDeg: 144, innerRadius: 0.16, outerRadius: 1.00, length: 0.84 },
  { index: 13, angleDeg: 345, innerRadius: 0.66, outerRadius: 1.00, length: 0.34 },
  { index: 14, angleDeg: 48,  innerRadius: 0.56, outerRadius: 1.00, length: 0.44 },
  { index: 15, angleDeg: 274, innerRadius: 0.38, outerRadius: 1.00, length: 0.63 },
  { index: 16, angleDeg: 284, innerRadius: 0.45, outerRadius: 1.00, length: 0.56 },
  { index: 17, angleDeg: 58,  innerRadius: 0.52, outerRadius: 1.00, length: 0.48 },
  { index: 18, angleDeg: 162, innerRadius: 0.12, outerRadius: 1.00, length: 0.88 },
  { index: 19, angleDeg: 353, innerRadius: 0.67, outerRadius: 1.00, length: 0.33 },
  { index: 20, angleDeg: 229, innerRadius: 0.21, outerRadius: 1.00, length: 0.79 },
  { index: 21, angleDeg: 22,  innerRadius: 0.64, outerRadius: 1.00, length: 0.36 },
  { index: 22, angleDeg: 198, innerRadius: 0.13, outerRadius: 1.00, length: 0.87 },
  { index: 23, angleDeg: 7,   innerRadius: 0.67, outerRadius: 1.00, length: 0.33 },
  { index: 24, angleDeg: 74,  innerRadius: 0.45, outerRadius: 1.00, length: 0.54 },
  { index: 25, angleDeg: 303, innerRadius: 0.52, outerRadius: 1.00, length: 0.48 },
  { index: 26, angleDeg: 130, innerRadius: 0.21, outerRadius: 1.00, length: 0.79 },
  { index: 27, angleDeg: 338, innerRadius: 0.64, outerRadius: 1.00, length: 0.36 },
  { index: 28, angleDeg: 39,  innerRadius: 0.59, outerRadius: 1.00, length: 0.41 },
  { index: 29, angleDeg: 262, innerRadius: 0.32, outerRadius: 1.00, length: 0.68 },
  { index: 30, angleDeg: 99,  innerRadius: 0.32, outerRadius: 1.00, length: 0.68 },
  { index: 31, angleDeg: 321, innerRadius: 0.59, outerRadius: 1.00, length: 0.41 },
];

// Simple array of lengths for quick access (normalized 0-1 based on max length 0.88)
export const BLADE_LENGTHS = BLADE_CONFIGS.map(c => c.length / 0.88);

// Get the specific angle for each blade (in radians)
export const BLADE_ANGLES = BLADE_CONFIGS.map(c => (c.angleDeg * Math.PI) / 180);

// Get the specific inner radius for each blade (where blade starts from center)
export const BLADE_INNER_RADII = BLADE_CONFIGS.map(c => c.innerRadius);

/**
 * Center offset - the emblem design is asymmetrical.
 * All values are normalized (-1 to 1 coordinate space).
 */
export const EMBLEM_CENTER = {
  /** X offset from geometric center (positive = right) */
  x: 0.254,
  /** Y offset from geometric center (positive = up in Three.js) */
  y: 0,
} as const;
