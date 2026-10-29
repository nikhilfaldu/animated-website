/**
 * Global Motion Constants
 *
 * Clarity & Magic Guardrails - Centralized motion language for Orbit-Plus V3
 * Reference: docs/stories/8. STORY-clarity-magic-guardrails.md
 *
 * Philosophy: 70% clarity (predictable, trustworthy) + 30% magic (memorable, organic)
 */

export const MOTION = {
  /**
   * Durations (in seconds)
   * - short: Quick feedback (0.18s)
   * - base: Standard transitions (0.28s)
   * - medium: Emblem state changes (0.44s)
   * - long: Major transformations (0.72s)
   */
  d: {
    short: 0.18,
    base: 0.28,
    medium: 0.44,
    long: 0.72,
  },

  /**
   * Easings
   * - orbit: Natural orbital feel for emblem/dial transitions [0.33, 1, 0.68, 1]
   * - clarity: Standard UI transition for fades/forms [0.4, 0, 0.2, 1]
   * - spring: Emblem/bloom echo (stiffness: 140, damping: 18)
   * - softSpring: Background swells (stiffness: 80, damping: 22)
   */
  ease: {
    orbit: [0.33, 1, 0.68, 1] as const,
    clarity: [0.4, 0, 0.2, 1] as const,
    spring: { stiffness: 140, damping: 18 },
    softSpring: { stiffness: 80, damping: 22 },
  },

  /**
   * Physics constants
   * - friction: Inertia decay rate (0.85)
   * - maxVelocity: Clamp velocity to prevent runaway animations (4)
   */
  inertia: {
    friction: 0.85,
    maxVelocity: 4,
  },

  /**
   * Scroll mapping
   * - sensitivity: Multiplier for scroll-to-motion conversion (0.0025)
   */
  scroll: {
    sensitivity: 0.0025,
  },
} as const;

/**
 * Type exports for type-safe usage
 */
export type MotionDuration = keyof typeof MOTION.d;
export type MotionEasing = keyof typeof MOTION.ease;
