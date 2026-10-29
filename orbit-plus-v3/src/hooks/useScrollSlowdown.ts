/**
 * useScrollSlowdown - Dynamically adjust Lenis scroll speed for a section
 *
 * Reduces wheelMultiplier and touchMultiplier when the target section
 * is in view, creating a slower scroll experience for detailed content.
 */

import { useEffect, useRef, useCallback } from 'react';
import { useLenis } from '@components/LenisProvider';

interface ScrollSlowdownConfig {
  /** Target multiplier when section is active (0.1-1.0). Default: 0.45 */
  slowMultiplier?: number;
  /** Transition duration in ms. Default: 350 */
  transitionDuration?: number;
  /** Also adjust touchMultiplier for mobile. Default: true */
  includeTouchMultiplier?: boolean;
  /** Threshold for IntersectionObserver (0-1). Default: 0.1 */
  threshold?: number;
}

const DEFAULT_CONFIG: Required<ScrollSlowdownConfig> = {
  slowMultiplier: 0.45,
  transitionDuration: 350,
  includeTouchMultiplier: true,
  threshold: 0.1,
};

export function useScrollSlowdown(
  sectionRef: React.RefObject<HTMLElement | null>,
  config: ScrollSlowdownConfig = {}
) {
  const { lenis } = useLenis();
  const mergedConfig = { ...DEFAULT_CONFIG, ...config };

  // Store original multipliers to restore on exit
  const originalWheelMultiplier = useRef<number>(1);
  const originalTouchMultiplier = useRef<number>(2);

  // Track animation state
  const animationFrameRef = useRef<number | null>(null);
  const isActiveRef = useRef<boolean>(false);

  // Eased interpolation helper (ease-out quadratic)
  const easeOutQuad = useCallback((t: number) => t * (2 - t), []);

  // Animate multiplier transition
  const animateMultiplier = useCallback(
    (targetWheel: number, targetTouch: number) => {
      if (!lenis) return;

      const startWheel = lenis.options.wheelMultiplier;
      const startTouch = lenis.options.touchMultiplier;
      const startTime = performance.now();
      const duration = mergedConfig.transitionDuration;

      const animate = (currentTime: number) => {
        const elapsed = currentTime - startTime;
        const progress = Math.min(elapsed / duration, 1);
        const eased = easeOutQuad(progress);

        // Interpolate values
        const newWheel = startWheel + (targetWheel - startWheel) * eased;
        lenis.options.wheelMultiplier = newWheel;

        if (mergedConfig.includeTouchMultiplier) {
          const newTouch = startTouch + (targetTouch - startTouch) * eased;
          lenis.options.touchMultiplier = newTouch;
        }

        if (progress < 1) {
          animationFrameRef.current = requestAnimationFrame(animate);
        }
      };

      // Cancel any ongoing animation
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }

      animationFrameRef.current = requestAnimationFrame(animate);
    },
    [lenis, mergedConfig.transitionDuration, mergedConfig.includeTouchMultiplier, easeOutQuad]
  );

  // Handle section entry/exit
  const handleIntersection = useCallback(
    (entries: IntersectionObserverEntry[]) => {
      const entry = entries[0];
      if (!entry || !lenis) return;

      const isEntering =
        entry.isIntersecting && entry.intersectionRatio >= mergedConfig.threshold;

      if (isEntering && !isActiveRef.current) {
        // Entering section - slow down
        isActiveRef.current = true;

        // Calculate proportional touch multiplier
        const touchRatio = mergedConfig.slowMultiplier;
        const targetTouch = originalTouchMultiplier.current * touchRatio;

        animateMultiplier(mergedConfig.slowMultiplier, targetTouch);
      } else if (!entry.isIntersecting && isActiveRef.current) {
        // Exiting section - restore speed
        isActiveRef.current = false;

        animateMultiplier(
          originalWheelMultiplier.current,
          originalTouchMultiplier.current
        );
      }
    },
    [lenis, mergedConfig.slowMultiplier, mergedConfig.threshold, animateMultiplier]
  );

  // Setup IntersectionObserver
  useEffect(() => {
    const section = sectionRef.current;
    if (!section || !lenis) return;

    // Store original multipliers
    originalWheelMultiplier.current = lenis.options.wheelMultiplier;
    originalTouchMultiplier.current = lenis.options.touchMultiplier;

    const observer = new IntersectionObserver(handleIntersection, {
      root: null,
      threshold: [0, mergedConfig.threshold, 0.5, 1],
      rootMargin: '0px',
    });

    observer.observe(section);

    return () => {
      observer.disconnect();

      // Cancel any pending animation
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }

      // Restore original multipliers on unmount
      if (lenis) {
        lenis.options.wheelMultiplier = originalWheelMultiplier.current;
        lenis.options.touchMultiplier = originalTouchMultiplier.current;
      }
    };
  }, [sectionRef, lenis, mergedConfig.threshold, handleIntersection]);

  return {
    isSlowed: isActiveRef.current,
  };
}
