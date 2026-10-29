/**
 * Emblem Constants - Shared configuration for SVG/WebGL alignment
 *
 * This file ensures both the SVG Emblem and WebGL TunnelInScene share
 * the same baseline measurements for seamless visual handoff.
 *
 * The handoff happens between Positioning and TunnelIn sections:
 * - SVG fades out during the last portion of Positioning
 * - WebGL fades in at the start of TunnelIn
 *
 * Both systems must render the emblem at the same position and scale
 * at the handoff point for a seamless crossfade.
 */

import { SCROLL_RANGES } from './scrollRanges';

// Re-export blade geometry from ApertureEmblem for convenience
export {
  BLADE_CONFIGS,
  BLADE_ANGLES,
  BLADE_LENGTHS,
  BLADE_INNER_RADII,
  EMBLEM_CENTER,
} from '@/components/emblem/ApertureEmblem/bladeConfig';

/**
 * SVG Emblem viewBox dimensions
 * The emblem SVG uses a 588x588 viewBox
 */
export const EMBLEM_VIEWBOX = {
  width: 588,
  height: 588,
  center: 294, // 588 / 2
} as const;

/**
 * Inner circle center offset from emblem geometric center
 *
 * The emblem is asymmetrical - the inner circle (aperture) is not at the
 * geometric center of the bounding box. This offset must be applied to
 * both SVG and WebGL renderings to align the inner circle with viewport center.
 *
 * Value is in normalized coordinates where 1.0 = half the emblem diameter.
 * Positive x = inner circle is to the RIGHT of geometric center.
 *
 * To center the inner circle at viewport center when emblem is at x=50:
 * - Apply offset: x = 50 - (INNER_CIRCLE_OFFSET.x * emblemSizeVw / 2)
 */
export const INNER_CIRCLE_OFFSET = {
  /** X offset (0.254 = 25.4% of radius to the right) */
  x: 0.254,
  /** Y offset (0 = vertically centered) */
  y: 0,
} as const;

/**
 * Number of radials/blades in the emblem
 */
export const NUM_RADIALS = 32;

// ============================================================================
// HANDOFF TIMING
// ============================================================================

/**
 * SVG Emblem fade-out range (global scroll progress)
 *
 * The SVG emblem should start fading out before the TunnelIn section begins,
 * completing the fade as TunnelIn starts.
 *
 * Timeline:
 * - positioning.end = 0.182 (where Positioning content finishes)
 * - tunnelIn.start = 0.182 (where TunnelIn section begins)
 *
 * We want the SVG to be fully faded out BY tunnelIn.start,
 * so we start the fade slightly before.
 *
 * POSITION ALIGNMENT NOTE:
 * During the handoff (0.148-0.182), the SVG emblem is moving LEFT (x: -17 to -39)
 * while WebGL tunnel appears CENTERED. This is intentional for the narrative flow:
 * - SVG emblem exits left (brand "preparing" for entry)
 * - WebGL tunnel appears centered (user enters "through" the brand)
 *
 * If exact position matching is required, either:
 * 1. Move handoff earlier (scroll 0.08-0.10) when emblem is at x=15 (near center)
 * 2. Adjust ScrollController to keep emblem centered during handoff range
 * 3. Make WebGL track SVG position via shared motion values
 */
export const SVG_EMBLEM_HANDOFF = {
  /** Start fading SVG emblem (global scroll) - ~75% through Positioning */
  fadeStart: SCROLL_RANGES.positioning.start +
    (SCROLL_RANGES.positioning.end - SCROLL_RANGES.positioning.start) * 0.75,
  /** Complete SVG fade (global scroll) - at TunnelIn start */
  fadeEnd: SCROLL_RANGES.tunnelIn.start,
  /** Fade back in start (after services) */
  fadeInStart: SCROLL_RANGES.process.start,
  /** Fade back in complete */
  fadeInEnd: SCROLL_RANGES.process.start + 0.03,
} as const;

/**
 * WebGL TunnelIn scene opacity range (global scroll progress)
 *
 * The WebGL scene should start appearing as the SVG fades out,
 * creating a smooth crossfade effect.
 */
export const WEBGL_TUNNEL_HANDOFF = {
  /** Start WebGL fade-in (global scroll) - 50% through SVG fade duration (creates overlap) */
  fadeStart: SVG_EMBLEM_HANDOFF.fadeStart +
    (SVG_EMBLEM_HANDOFF.fadeEnd - SVG_EMBLEM_HANDOFF.fadeStart) * 0.5,
  /** Complete WebGL fade-in (global scroll) - shortly after TunnelIn starts */
  fadeEnd: SCROLL_RANGES.tunnelIn.start + 0.02,
} as const;

// ============================================================================
// DEBUG HELPERS
// ============================================================================

/**
 * Log handoff timing values (development only)
 */
export function logHandoffTiming(): void {
  if (process.env.NODE_ENV !== 'development') return;

  console.group('[Emblem Handoff Timing]');
  console.log('Positioning range:', SCROLL_RANGES.positioning);
  console.log('TunnelIn range:', SCROLL_RANGES.tunnelIn);
  console.log('SVG Emblem fadeout:', SVG_EMBLEM_HANDOFF);
  console.log('WebGL Tunnel fadein:', WEBGL_TUNNEL_HANDOFF);
  console.groupEnd();
}
