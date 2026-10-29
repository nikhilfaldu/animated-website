import { useState, useEffect } from 'react';
import { useReducedMotion } from '@/hooks/useReducedMotion';

/**
 * Motion Scale Hook
 *
 * Scales motion values based on device capabilities and user preferences.
 * Part of Clarity & Magic Guardrails - ensures accessibility parity.
 *
 * @param base - Base motion value to scale
 * @returns Scaled value based on reduced motion preference and device type
 *
 * Rules:
 * - Reduced motion: 50% of base value
 * - Mobile devices: 80% of base value
 * - Desktop with motion: 100% of base value
 *
 * @example
 * ```ts
 * const radius = useMotionScale(84); // Returns 42, 67, or 84 based on context
 * const duration = useMotionScale(0.44);
 * ```
 */
export function useMotionScale(base: number): number {
  const prefersReduced = useReducedMotion();
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    // Check if mobile on mount
    const checkMobile = () => {
      setIsMobile(window.matchMedia('(max-width: 768px)').matches);
    };

    checkMobile();

    // Listen for viewport changes
    const mediaQuery = window.matchMedia('(max-width: 768px)');
    const handleChange = () => checkMobile();

    if (mediaQuery?.addEventListener) {
      mediaQuery.addEventListener('change', handleChange);
    } else if (mediaQuery?.addListener) {
      mediaQuery.addListener(handleChange);
    }

    return () => {
      if (mediaQuery?.removeEventListener) {
        mediaQuery.removeEventListener('change', handleChange);
      } else if (mediaQuery?.removeListener) {
        mediaQuery.removeListener(handleChange);
      }
    };
  }, []);

  // Reduced motion takes precedence
  if (prefersReduced) {
    return base * 0.5;
  }

  // Mobile gets slightly reduced motion
  if (isMobile) {
    return base * 0.8;
  }

  // Desktop with full motion
  return base;
}
