/**
 * Responsive Configuration
 *
 * Single source of truth for all breakpoint values and responsive settings.
 * Use these constants throughout the app to ensure consistency.
 *
 * IMPORTANT: These values align with Tailwind's default breakpoints
 * - sm: 640px, md: 768px, lg: 1024px, xl: 1280px, 2xl: 1536px
 */

/**
 * Breakpoint values in pixels
 * Mobile-first approach: values represent the MIN width for each tier
 */
export const BREAKPOINTS = {
  /** Mobile: 0 - 639px (default, below sm) */
  mobile: 0,
  /** Small: 640px+ (Tailwind sm) */
  sm: 640,
  /** Tablet: 768px+ (Tailwind md) */
  tablet: 768,
  /** Desktop: 1024px+ (Tailwind lg) */
  desktop: 1024,
  /** Large desktop: 1280px+ (Tailwind xl) */
  xl: 1280,
  /** Extra large: 1536px+ (Tailwind 2xl) */
  '2xl': 1536,
} as const;

/**
 * Max-width breakpoints for "up to X" queries
 * Use these when you need to target devices BELOW a breakpoint
 */
export const MAX_BREAKPOINTS = {
  /** Up to mobile (max 639px) */
  mobile: BREAKPOINTS.sm - 1, // 639px
  /** Up to tablet (max 767px) */
  sm: BREAKPOINTS.tablet - 1, // 767px
  /** Up to desktop (max 1023px) */
  tablet: BREAKPOINTS.desktop - 1, // 1023px
  /** Up to large desktop (max 1279px) */
  desktop: BREAKPOINTS.xl - 1, // 1279px
  /** Up to extra large (max 1535px) */
  xl: BREAKPOINTS['2xl'] - 1, // 1535px
} as const;

/**
 * Media query strings for use with window.matchMedia()
 */
export const MEDIA_QUERIES = {
  /** Targets mobile only (max-width: 639px) */
  mobileOnly: `(max-width: ${MAX_BREAKPOINTS.mobile}px)`,
  /** Targets tablet and below (max-width: 1023px) */
  tabletDown: `(max-width: ${MAX_BREAKPOINTS.tablet}px)`,
  /** Targets tablet only (768px - 1023px) */
  tabletOnly: `(min-width: ${BREAKPOINTS.tablet}px) and (max-width: ${MAX_BREAKPOINTS.tablet}px)`,
  /** Targets desktop and up (min-width: 1024px) */
  desktopUp: `(min-width: ${BREAKPOINTS.desktop}px)`,
  /** Targets touch devices */
  touch: '(hover: none) and (pointer: coarse)',
  /** Targets devices with hover capability */
  hover: '(hover: hover)',
  /** Portrait orientation */
  portrait: '(orientation: portrait)',
  /** Landscape orientation */
  landscape: '(orientation: landscape)',
  /** Reduced motion preference */
  reducedMotion: '(prefers-reduced-motion: reduce)',
} as const;

/**
 * Breakpoint tier names for useBreakpoint hook
 */
export type BreakpointTier = 'mobile' | 'tablet' | 'desktop' | 'xl' | '2xl';

/**
 * Get the current breakpoint tier based on window width
 */
export function getBreakpointTier(width: number): BreakpointTier {
  if (width >= BREAKPOINTS['2xl']) return '2xl';
  if (width >= BREAKPOINTS.xl) return 'xl';
  if (width >= BREAKPOINTS.desktop) return 'desktop';
  if (width >= BREAKPOINTS.tablet) return 'tablet';
  return 'mobile';
}

/**
 * Check if width is considered mobile (below tablet breakpoint)
 */
export function isMobileWidth(width: number): boolean {
  return width < BREAKPOINTS.tablet;
}

/**
 * Check if width is considered tablet (768px - 1023px)
 */
export function isTabletWidth(width: number): boolean {
  return width >= BREAKPOINTS.tablet && width < BREAKPOINTS.desktop;
}

/**
 * Check if width is considered desktop (1024px+)
 */
export function isDesktopWidth(width: number): boolean {
  return width >= BREAKPOINTS.desktop;
}
