/**
 * Mobile Targets Configuration
 *
 * Define mobile-specific values and settings here.
 * These values ONLY affect mobile viewports and will not impact desktop.
 *
 * Usage:
 * - Import specific targets where needed
 * - Use with useResponsiveValue() hook for dynamic switching
 * - Combine with MobileOnly component for mobile-specific features
 *
 * @example
 * ```tsx
 * import { MOBILE_TARGETS } from '@/config/mobileTargets';
 * import { useIsMobile } from '@/hooks/useResponsive';
 *
 * function MyComponent() {
 *   const isMobile = useIsMobile();
 *   const size = isMobile ? MOBILE_TARGETS.emblem.size : 700;
 *   return <Emblem size={size} />;
 * }
 * ```
 */

/**
 * Mobile-specific sizing values
 */
export const MOBILE_SIZES = {
  /** Emblem size on mobile (smaller for performance) */
  emblem: 450,
  /** Navigation height on mobile */
  navHeight: 56,
  /** Minimum tap target size (accessibility) */
  minTapTarget: 44,
  /** Standard spacing unit for mobile */
  spacing: 16,
  /** Standard section padding */
  sectionPadding: 24,
} as const;

/**
 * Mobile-specific animation values
 */
export const MOBILE_ANIMATION = {
  /** Reduced duration for snappier feel */
  duration: 0.3,
  /** Stagger delay between elements */
  staggerDelay: 0.05,
  /** Scale factor for motion (80% of desktop) */
  motionScale: 0.8,
  /** Reduced blur for performance */
  maxBlur: 8,
} as const;

/**
 * Mobile-specific scroll behavior
 */
export const MOBILE_SCROLL = {
  /** Scroll threshold for triggering nav hide */
  hideNavThreshold: 50,
  /** Velocity threshold for momentum-based interactions */
  velocityThreshold: 0.5,
  /** Snap points offset adjustment */
  snapOffset: 0,
} as const;

/**
 * Mobile-specific typography scale
 * Values in pixels - use with clamp() for fluid scaling
 */
export const MOBILE_TYPOGRAPHY = {
  h0: { min: 28, max: 48 },
  h1: { min: 24, max: 36 },
  h2: { min: 20, max: 28 },
  h3: { min: 18, max: 24 },
  body: { min: 14, max: 16 },
  small: { min: 12, max: 14 },
} as const;

/**
 * Mobile-specific layout values
 */
export const MOBILE_LAYOUT = {
  /** Maximum content width */
  maxWidth: '100%',
  /** Side padding for content */
  contentPadding: 16,
  /** Gap between cards/items */
  cardGap: 12,
  /** Grid columns for mobile layouts */
  gridCols: 1,
} as const;

/**
 * Mobile-specific touch interaction values
 */
export const MOBILE_TOUCH = {
  /** Swipe threshold for gesture detection (px) */
  swipeThreshold: 50,
  /** Long press duration (ms) */
  longPressDuration: 500,
  /** Pinch zoom sensitivity */
  pinchSensitivity: 1.5,
} as const;

/**
 * Combined mobile targets object for easy import
 */
export const MOBILE_TARGETS = {
  sizes: MOBILE_SIZES,
  animation: MOBILE_ANIMATION,
  scroll: MOBILE_SCROLL,
  typography: MOBILE_TYPOGRAPHY,
  layout: MOBILE_LAYOUT,
  touch: MOBILE_TOUCH,
} as const;

/**
 * Desktop targets for comparison/fallback
 * Keep desktop values here to maintain parity
 */
export const DESKTOP_TARGETS = {
  sizes: {
    emblem: 800,
    navHeight: 64,
    minTapTarget: 32,
    spacing: 24,
    sectionPadding: 48,
  },
  animation: {
    duration: 0.5,
    staggerDelay: 0.08,
    motionScale: 1.0,
    maxBlur: 16,
  },
  scroll: {
    hideNavThreshold: 100,
    velocityThreshold: 0.3,
    snapOffset: 0,
  },
  layout: {
    maxWidth: '1440px',
    contentPadding: 48,
    cardGap: 24,
    gridCols: 4,
  },
} as const;

/**
 * Type-safe getter for responsive values
 * Returns mobile value on mobile, desktop value otherwise
 */
export function getMobileTarget<K extends keyof typeof MOBILE_TARGETS>(
  category: K,
  key: keyof (typeof MOBILE_TARGETS)[K],
  isMobile: boolean
): (typeof MOBILE_TARGETS)[K][typeof key] {
  if (isMobile) {
    return MOBILE_TARGETS[category][key];
  }
  // Type assertion needed due to structural differences
  return (DESKTOP_TARGETS as Record<string, Record<string, unknown>>)[category]?.[
    key as string
  ] as (typeof MOBILE_TARGETS)[K][typeof key];
}
