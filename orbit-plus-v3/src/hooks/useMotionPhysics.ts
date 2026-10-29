import { useSpring, type MotionValue } from 'framer-motion';
import { MOTION } from '@/styles/motion';

/**
 * Motion Physics Hook
 *
 * Ensures consistent, composable springs for emblem, portal, and constellation.
 * Part of Clarity & Magic Guardrails system.
 *
 * @param value - The motion value to apply spring physics to
 * @param type - Spring type: 'spring' (stiff, 140/18) or 'soft' (gentle, 80/22)
 * @returns Motion value with spring physics applied
 *
 * @example
 * ```ts
 * const rpm = useMotionPhysics(scrollVelocity, 'soft');
 * const emblemScale = useMotionPhysics(baseScale, 'spring');
 * ```
 */
export function useMotionPhysics(
  value: MotionValue<number>,
  type: 'spring' | 'soft' = 'spring'
): MotionValue<number> {
  const config = type === 'soft' ? MOTION.ease.softSpring : MOTION.ease.spring;

  return useSpring(value, {
    stiffness: config.stiffness,
    damping: config.damping,
  });
}
