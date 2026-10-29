/**
 * useSceneVisibility Hook
 *
 * Performance-optimized hook for managing WebGL scene visibility based on scroll progress.
 * Scenes should use this hook to:
 * 1. Conditionally render expensive WebGL content only when visible
 * 2. Trigger entrance/exit animations at appropriate times
 * 3. Get local progress (0-1) within their scroll range
 *
 * @example
 * ```tsx
 * function TunnelScene() {
 *   const { scrollProgress } = useOrbitSystem();
 *   const { visible, localProgress, entering, exiting } = useSceneVisibility(
 *     scrollProgress,
 *     SCROLL_RANGES.tunnelIn
 *   );
 *
 *   // Early return for performance - don't render when not visible
 *   if (!visible) return null;
 *
 *   return <TunnelMesh progress={localProgress} />;
 * }
 * ```
 */

import { type MotionValue, useTransform } from 'framer-motion';
import { useState, useEffect, useMemo } from 'react';
import type { ScrollRange } from '@/config/scrollRanges';

/**
 * Result returned by useSceneVisibility hook
 */
export interface SceneVisibilityResult {
  /** Whether the scene is currently within its scroll range */
  visible: boolean;
  /** Local progress (0-1) within the range, derived as MotionValue for reactive transforms */
  localProgress: MotionValue<number>;
  /** True during first 10% of range - useful for entrance animations */
  entering: boolean;
  /** True during last 10% of range - useful for exit animations */
  exiting: boolean;
}

/** Threshold for entering phase (first 10% of range) */
const ENTERING_THRESHOLD = 0.1;

/** Threshold for exiting phase (last 10% of range) */
const EXITING_THRESHOLD = 0.9;

/**
 * Buffer zone before/after range for smoother visibility transitions.
 * This allows scenes to pre-load slightly before they become visible.
 */
const VISIBILITY_BUFFER = 0.005;

/**
 * Hook to manage scene visibility based on scroll progress and range.
 *
 * @param scrollProgress - Global scroll progress MotionValue (0-1) from OrbitSystem
 * @param range - ScrollRange defining when this scene should be active
 * @returns SceneVisibilityResult with visibility state and local progress
 */
export function useSceneVisibility(
  scrollProgress: MotionValue<number>,
  range: ScrollRange
): SceneVisibilityResult {
  const [visible, setVisible] = useState(false);
  const [entering, setEntering] = useState(false);
  const [exiting, setExiting] = useState(false);

  // Memoize buffered range boundaries to avoid recalculation
  const bufferedRange = useMemo(() => ({
    start: Math.max(0, range.start - VISIBILITY_BUFFER),
    end: Math.min(1, range.end + VISIBILITY_BUFFER),
  }), [range.start, range.end]);

  // Derive local progress (0-1) within the range using Framer Motion's useTransform
  // This is reactive and updates automatically as scrollProgress changes
  const localProgress = useTransform(
    scrollProgress,
    [range.start, range.end],
    [0, 1]
  );

  // Subscribe to scroll progress changes to update visibility state
  useEffect(() => {
    const updateVisibility = (value: number) => {
      // Check visibility with buffer zone
      const isVisible = value >= bufferedRange.start && value <= bufferedRange.end;
      setVisible(isVisible);

      if (isVisible) {
        // Calculate local progress for entering/exiting detection
        const rangeWidth = range.end - range.start;
        // Avoid division by zero for very small ranges
        if (rangeWidth <= 0) {
          setEntering(false);
          setExiting(false);
          return;
        }

        const local = (value - range.start) / rangeWidth;
        // Clamp to 0-1 for cases where we're in the buffer zone
        const clampedLocal = Math.max(0, Math.min(1, local));

        setEntering(clampedLocal < ENTERING_THRESHOLD);
        setExiting(clampedLocal > EXITING_THRESHOLD);
      } else {
        setEntering(false);
        setExiting(false);
      }
    };

    // Set initial state
    updateVisibility(scrollProgress.get());

    // Subscribe to changes
    const unsubscribe = scrollProgress.on('change', updateVisibility);

    return unsubscribe;
  }, [scrollProgress, bufferedRange.start, bufferedRange.end, range.start, range.end]);

  return {
    visible,
    localProgress,
    entering,
    exiting,
  };
}
