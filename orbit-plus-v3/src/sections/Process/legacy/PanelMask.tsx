/**
 * PanelMask Component
 *
 * Layer 2 (z-20) - Scrolls normally (1x speed) with the section.
 * Contains an SVG mask with rectangular cutouts that reveal the
 * gear field beneath. Background fills everywhere except the cutouts.
 *
 * Desktop: 4 groups of cutouts tied to text labels
 * Mobile: Minimal "peephole" cutouts spread across full height
 *
 * Animation: Cutouts fade in/out based on scroll progress (18% fade at edges).
 * Accessibility: Decorative mask with aria-hidden.
 */

import { memo, useState, useEffect, useRef } from 'react';
import { type MotionValue, useMotionValueEvent } from 'framer-motion';
import { useIsMobile } from '@/hooks/useResponsive';
import {
  CUTOUTS,
  MOBILE_CUTOUTS,
  SECTION_HEIGHT_VH,
  type CutoutConfig,
} from './processData';

// Calculate rounded corner radius for a cutout
function getCornerRadius(w: number, h: number): number {
  return Math.min(0.8, w * 0.15, h * 0.15);
}

function clamp01(n: number) {
  return Math.max(0, Math.min(1, n));
}

// Calculate opacity for a cutout based on scroll progress (fade in/out at edges)
// Mobile continuous cutout (spanning full range) stays fully visible
function getCutoutOpacity(cutout: CutoutConfig, progress: number): number {
  const { startProgress, endProgress } = cutout;

  // Continuous cutout spanning full scroll range: always fully visible (mobile)
  if (startProgress === 0 && endProgress === 1) {
    return 1;
  }

  // Outside the cutout's range = invisible
  if (progress < startProgress || progress > endProgress) return 0;

  // Fixed fade duration: 0.04
  const fadeInEnd = startProgress + 0.04;
  const fadeOutStart = endProgress - 0.04;

  // Fade in
  if (progress <= fadeInEnd) {
    return (progress - startProgress) / Math.max(0.0001, fadeInEnd - startProgress);
  }

  // Fade out
  if (progress >= fadeOutStart) {
    return 1 - (progress - fadeOutStart) / Math.max(0.0001, endProgress - fadeOutStart);
  }

  // Fully visible
  return 1;
}

// Get all cutouts that should be visible at the current scroll progress
function getVisibleCutouts(all: CutoutConfig[], progress: number): CutoutConfig[] {
  return all.filter((c) => {
    const range = c.endProgress - c.startProgress;
    const fadeBuffer = range * 0.05; // Small buffer for smooth transitions
    return progress >= c.startProgress - fadeBuffer && progress <= c.endProgress + fadeBuffer;
  });
}

export const PanelMask = memo(function PanelMask({
  scrollProgress,
}: {
  scrollProgress: MotionValue<number>;
}) {
  const isMobile = useIsMobile();
  const allCutouts = isMobile ? MOBILE_CUTOUTS : CUTOUTS;

  const [progress, setProgress] = useState(0);
  const [visible, setVisible] = useState<CutoutConfig[]>(() =>
    getVisibleCutouts(allCutouts, 0)
  );

  // Ref to avoid stale visible compare in useMotionValueEvent
  const visibleRef = useRef<CutoutConfig[]>(visible);
  useEffect(() => {
    visibleRef.current = visible;
  }, [visible]);

  useEffect(() => {
    setVisible(getVisibleCutouts(allCutouts, 0));
  }, [isMobile, allCutouts]);

  useMotionValueEvent(scrollProgress, 'change', (p) => {
    const clampedProgress = clamp01(p);
    setProgress(clampedProgress);
    const next = getVisibleCutouts(allCutouts, clampedProgress);
    const prev = visibleRef.current;
    const same = next.length === prev.length && next.every((c, i) => c.id === prev[i]?.id);
    if (!same) setVisible(next);
  });

  // Unique mask ID to avoid conflicts
  const maskId = 'process-cutout-mask';

  return (
    <div
      className="absolute inset-x-0 top-0 pointer-events-none"
      style={{ height: `${SECTION_HEIGHT_VH}vh`, zIndex: 20 }}
      aria-hidden="true"
    >
      <svg
        width="100%"
        height="100%"
        viewBox="0 0 100 100"
        preserveAspectRatio="none"
        className="block w-full h-full"
      >
        <defs>
          <mask id={maskId}>
            {/* White background = show the fill (solid background) */}
            <rect x="0" y="0" width="100" height="100" fill="white" />
            {/* Black cutouts = hide the fill (reveal gears behind) */}
            {/* Opacity controls the fade in/out effect */}
            {visible.map((c) => {
              const opacity = getCutoutOpacity(c, progress);
              const r = getCornerRadius(c.width, c.height);
              return (
                <rect
                  key={c.id}
                  x={c.left}
                  y={c.top}
                  width={c.width}
                  height={c.height}
                  rx={r}
                  ry={r}
                  fill="black"
                  opacity={opacity}
                />
              );
            })}
          </mask>
        </defs>

        {/* Background with mask applied */}
        <rect
          x="0"
          y="0"
          width="100"
          height="100"
          fill="rgb(var(--bg))"
          mask={`url(#${maskId})`}
        />

        {/* Subtle edge strokes for each cutout (also fade with opacity) */}
        {visible.map((c) => {
          const opacity = getCutoutOpacity(c, progress);
          const r = getCornerRadius(c.width, c.height);
          return (
            <rect
              key={`edge-${c.id}`}
              x={c.left}
              y={c.top}
              width={c.width}
              height={c.height}
              rx={r}
              ry={r}
              fill="none"
              stroke="rgba(255,255,255,0.06)"
              strokeWidth={0.25}
              opacity={opacity}
            />
          );
        })}
      </svg>
    </div>
  );
});
