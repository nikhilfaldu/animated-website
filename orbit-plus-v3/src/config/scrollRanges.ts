/**
 * Scroll Range Configuration
 *
 * Single source of truth for all scroll-based animation ranges and breakpoints.
 * Use these constants throughout the app to ensure consistency across scroll-driven effects.
 *
 * All scroll values are normalized (0..1) representing global scroll progress.
 */

/**
 * Scroll range interface
 * Defines a section's start and end points in global scroll space
 */
export interface ScrollRange {
  /** Start of section (0..1) */
  start: number;
  /** End of section (0..1) */
  end: number;
}

/**
 * Map of section names to their scroll ranges
 */
export interface ScrollRanges {
  [section: string]: ScrollRange;
}

// ============================================================================
// HANDOFF TIMING
// ============================================================================

/**
 * WebGL-to-OrbitSystem handoff start point
 * At this point, WebGL aperture completes and OrbitSystem fade-in begins
 */
export const HANDOFF_IN_START = 0.70;

/**
 * WebGL-to-OrbitSystem handoff end point
 * At this point, OrbitSystem is fully visible and centered
 */
export const HANDOFF_IN_END = 0.74;

// ============================================================================
// SCROLL CHOREOGRAPHY BREAKPOINTS
// ============================================================================

/**
 * Master scroll choreography breakpoints for emblem transforms
 *
 * CHOREOGRAPHY: "Approach, Expand, Arrive"
 * The emblem expands rightward as if preparing to receive you, then centers
 * itself as you approach—arriving at the exact position for tunnel handoff.
 *
 * Timeline (aligned to section boundaries):
 * - 0.000: Hero start - emblem assembled, resting
 * - 0.045: Hero end / Positioning start - expansion begins
 * - 0.10:  Peak rightward expansion (x=25, originX=15, scale=3.5)
 * - 0.14:  Returning to center, fade begins
 * - 0.182: TunnelIn start - centered at scale=4, SVG hidden, WebGL active
 * - 0.273: Services start (white world)
 * - 0.488: Process start - SVG fade-in begins
 * - 0.571: SVG fully visible in Process
 * - 0.732: Reveal start
 * - 0.893: Work section mid
 * - 1.00:  End state
 */
export const SCROLL_BREAKPOINTS = [
  0,        // [0]  Hero start
  0.048,    // [1]  Hero end / Positioning start
  0.107,    // [2]  Peak of rightward expansion
  0.150,    // [3]  Returning to center, fade begins
  0.195,    // [4]  TunnelIn start (centered, SVG hidden)
  0.293,    // [5]  Services start
  0.488,    // [6]  Process start (SVG fade-in begins)
  0.571,    // [7]  SVG fully visible in Process
  0.732,    // [8]  Reveal start
  0.893,    // [9]  Work mid
  1,        // [10] End
];

// ============================================================================
// SECTION RANGES
// ============================================================================

/**
 * Section scroll ranges for Global Canvas implementation
 * Each section occupies a specific portion of global scroll (0..1)
 */
export const SCROLL_RANGES: ScrollRanges = {
  /** Hero section: initial scroll-expansion phase */
  hero: { start: 0.000, end: 0.045 },

  /** Positioning section: brand positioning content */
  positioning: { start: 0.045, end: 0.182 },

  /** Tunnel In: transition into 3D space */
  tunnelIn: { start: 0.195, end: 0.293 },

  /** Services section: service offering cards */
  services: { start: 0.293, end: 0.488 },

  /** Process section: workflow panels with WebGL canvas */
  process: { start: 0.488, end: 0.732 },

  /** Reveal: baton handoff from WebGL to OrbitSystem */
  reveal: { start: 0.732, end: 0.805 },

  /** Work section: case studies and portfolio */
  work: { start: 0.805, end: 0.952 },

  /** Contact section: final CTA and contact form */
  contact: { start: 0.952, end: 1.000 },
};

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Convert global scroll progress to local section progress
 *
 * @param globalProgress - Current global scroll progress (0..1)
 * @param range - Section's start/end range
 * @returns Local progress within the section (0..1)
 *
 * @example
 * ```ts
 * const localProgress = getLocalProgress(0.6, SCROLL_RANGES.process);
 * // Returns 0..1 based on position within process section
 * ```
 */
export function getLocalProgress(
  globalProgress: number,
  range: ScrollRange
): number {
  if (globalProgress < range.start) return 0;
  if (globalProgress > range.end) return 1;
  return (globalProgress - range.start) / (range.end - range.start);
}
