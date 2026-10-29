/**
 * ParallaxLabels Component
 *
 * Layer 3 (z-30) - Scrolls at 0.6x speed for depth perception.
 * Contains 3 text labels that appear sequentially at different scroll points.
 * Staggered positions: right, left, center.
 *
 * Performance: Uses GPU transforms via Framer Motion.
 * Accessibility: Semantic headings with descriptive text, reduced motion support.
 */

import { memo, useMemo } from 'react';
import { motion, type MotionValue, useTransform } from 'framer-motion';
import { useReducedMotion } from '@hooks/useReducedMotion';
import { useIsMobile } from '@/hooks/useResponsive';
import { LABELS, MOBILE_LABELS, CUTOUTS, MOBILE_CUTOUTS, SECTION_HEIGHT_VH, LABEL_PARALLAX_SPEED, type LabelConfig, type CutoutConfig } from './processData';

interface ParallaxLabelsProps {
  // Section scroll progress (0-1)
  scrollProgress: MotionValue<number>;
}

// Position classes based on label position
// Using percentage-based positioning for better viewport control
// Right position is inset from edge to avoid crowding
const POSITION_CLASSES: Record<LabelConfig['position'], string> = {
  left: 'left-[12%] md:left-[14%] lg:left-[16%] text-left',
  'left-center': 'left-[20%] md:left-[22%] lg:left-[24%] text-left',
  right: 'right-[12%] md:right-[15%] lg:right-[18%] text-right',
  'right-center': 'right-[25%] md:right-[28%] lg:right-[30%] text-right',
  center: 'left-1/2 -translate-x-1/2 text-center',
};

// Width classes based on position
const WIDTH_CLASSES: Record<LabelConfig['position'], string> = {
  left: 'max-w-md lg:max-w-lg',
  'left-center': 'max-w-md lg:max-w-lg',
  right: 'max-w-md lg:max-w-lg',
  'right-center': 'max-w-md lg:max-w-lg',
  center: 'max-w-xl lg:max-w-2xl',
};

// Desktop parallax label with fade animation (position: absolute, moves with scroll)
const ParallaxLabel = memo(function ParallaxLabel({
  config,
  scrollProgress,
  reducedMotion,
}: {
  config: LabelConfig;
  scrollProgress: MotionValue<number>;
  reducedMotion: boolean;
}) {
  const { id, title, description, startProgress, endProgress, position, top } = config;

  const range = endProgress - startProgress;

  // Scroll-driven opacity fade in/out
  const fadeInEnd = startProgress + 0.04;
  const fadeOutStart = endProgress - 0.04;

  const opacity = useTransform(scrollProgress, (p) => {
    if (p < startProgress || p > endProgress) return 0;

    if (p <= fadeInEnd) {
      return (p - startProgress) / Math.max(0.0001, fadeInEnd - startProgress);
    }

    if (p >= fadeOutStart) {
      return 1 - (p - fadeOutStart) / Math.max(0.0001, endProgress - fadeOutStart);
    }

    return 1;
  });

  // Vertical position with parallax effect
  const sectionHeight = SECTION_HEIGHT_VH;

  const yOffset = useTransform(scrollProgress, (progress) => {
    if (reducedMotion) {
      return `${top}vh`;
    }

    const localProgress = Math.max(0, Math.min(1, (progress - startProgress) / range));
    const parallaxOffset = localProgress * range * sectionHeight * (1 - LABEL_PARALLAX_SPEED);
    const baseTop = (top / 100) * sectionHeight;
    return `${baseTop - parallaxOffset}vh`;
  });

  return (
    <motion.article
      key={id}
      className={`absolute ${POSITION_CLASSES[position]} ${WIDTH_CLASSES[position]}`}
      style={{
        top: yOffset,
        opacity,
        scale: 1,
        zIndex: 30,
      }}
    >
      <h3 className="h2 display mb-4 text-white/90">
        {title}
      </h3>
      <p className="p text-white/60 leading-relaxed">
        {description}
      </p>
    </motion.article>
  );
});

// Mobile fixed label - truly fixed to viewport, only fades in/out (NO SCROLLING)
const FixedMobileLabel = memo(function FixedMobileLabel({
  config,
  scrollProgress,
}: {
  config: LabelConfig;
  scrollProgress: MotionValue<number>;
}) {
  // Mobile labels are always left-aligned inside the cutout, position from config is ignored
  const { id, title, description, startProgress, endProgress, top } = config;

  // Scroll-driven opacity fade in/out
  const fadeInEnd = startProgress + 0.04;
  const fadeOutStart = endProgress - 0.04;

  const opacity = useTransform(scrollProgress, (p) => {
    if (p < startProgress || p > endProgress) return 0;

    if (p <= fadeInEnd) {
      return (p - startProgress) / Math.max(0.0001, fadeInEnd - startProgress);
    }

    if (p >= fadeOutStart) {
      return 1 - (p - fadeOutStart) / Math.max(0.0001, endProgress - fadeOutStart);
    }

    return 1;
  });

  // Mobile position classes (all left-aligned)
  const mobilePositionClass = 'left-[8%] text-left';
  const mobileWidthClass = 'max-w-[84%]';

  return (
    <motion.article
      key={id}
      className={`fixed ${mobilePositionClass} ${mobileWidthClass} pointer-events-none`}
      style={{
        top: `${top}vh`, // Fixed viewport position in vh units
        opacity,
        zIndex: 9999, // Above everything
      }}
    >
      <h3 className="h2 display mb-4 text-white/90">
        {title}
      </h3>
      <p className="p text-white/60 leading-relaxed">
        {description}
      </p>
    </motion.article>
  );
});

// Frosted glass overlay for cutouts - creates soft backdrop behind gears
// Mobile continuous cutout (spanning full range) stays fully visible
const FrostedCutoutOverlay = memo(function FrostedCutoutOverlay({
  config,
  scrollProgress,
}: {
  config: CutoutConfig;
  scrollProgress: MotionValue<number>;
}) {
  const { id, startProgress, endProgress, top, left, width, height } = config;

  // Continuous cutout spanning full scroll range: always fully visible (mobile)
  const isContinuous = startProgress === 0 && endProgress === 1;

  // Match the same fade timing as PanelMask cutouts
  const fadeInEnd = startProgress + 0.04;
  const fadeOutStart = endProgress - 0.04;

  const opacity = useTransform(scrollProgress, (p) => {
    // Continuous cutout: always visible
    if (isContinuous) return 1;

    if (p < startProgress || p > endProgress) return 0;

    if (p <= fadeInEnd) {
      return (p - startProgress) / Math.max(0.0001, fadeInEnd - startProgress);
    }

    if (p >= fadeOutStart) {
      return 1 - (p - fadeOutStart) / Math.max(0.0001, endProgress - fadeOutStart);
    }

    return 1;
  });

  return (
    <motion.div
      key={id}
      className="absolute backdrop-blur-sm bg-black/20 rounded-lg"
      style={{
        top: `${top}%`,
        left: `${left}%`,
        width: `${width}%`,
        height: `${height}%`,
        opacity,
        zIndex: 25, // Between mask (z-20) and labels (z-30)
      }}
    />
  );
});

export const ParallaxLabels = memo(function ParallaxLabels({
  scrollProgress,
}: ParallaxLabelsProps) {
  const reducedMotion = useReducedMotion();
  const isMobile = useIsMobile();

  // Use mobile or desktop labels/cutouts based on viewport
  const labels = isMobile ? MOBILE_LABELS : LABELS;
  const cutouts = isMobile ? MOBILE_CUTOUTS : CUTOUTS;

  // Memoize frosted glass cutout overlays
  const cutoutOverlays = useMemo(
    () =>
      cutouts.map((config) => (
        <FrostedCutoutOverlay
          key={config.id}
          config={config}
          scrollProgress={scrollProgress}
        />
      )),
    [cutouts, scrollProgress]
  );

  // Memoize label elements - use fixed labels for mobile, parallax for desktop
  const labelElements = useMemo(
    () =>
      labels.map((config) =>
        isMobile ? (
          <FixedMobileLabel
            key={config.id}
            config={config}
            scrollProgress={scrollProgress}
          />
        ) : (
          <ParallaxLabel
            key={config.id}
            config={config}
            scrollProgress={scrollProgress}
            reducedMotion={reducedMotion}
          />
        )
      ),
    [labels, scrollProgress, reducedMotion, isMobile]
  );

  // Mobile: Render fixed labels outside the container (they're viewport-fixed)
  // Desktop: Render parallax labels inside the absolute container
  if (isMobile) {
    return (
      <>
        {/* Container for frosted overlays only */}
        <div
          className="absolute inset-x-0 top-0 pointer-events-none"
          style={{
            height: `${SECTION_HEIGHT_VH}vh`,
            zIndex: 30,
          }}
        >
          {cutoutOverlays}
        </div>
        {/* Fixed labels rendered at root level for true viewport positioning */}
        {labelElements}
      </>
    );
  }

  return (
    <div
      className="absolute inset-x-0 top-0 pointer-events-none"
      style={{
        height: `${SECTION_HEIGHT_VH}vh`,
        zIndex: 30,
      }}
    >
      {/* Frosted glass overlays sit between mask and labels */}
      {cutoutOverlays}
      {labelElements}
    </div>
  );
});
