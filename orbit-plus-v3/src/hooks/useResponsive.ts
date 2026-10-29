/**
 * Responsive Hooks
 *
 * Consolidated responsive detection hooks.
 * Use these instead of creating local useIsMobile implementations.
 *
 * @example
 * ```tsx
 * import { useIsMobile, useBreakpoint, useIsTouchDevice } from '@hooks/useResponsive';
 *
 * function MyComponent() {
 *   const isMobile = useIsMobile();
 *   const breakpoint = useBreakpoint(); // 'mobile' | 'tablet' | 'desktop' | 'xl' | '2xl'
 *   const isTouch = useIsTouchDevice();
 *
 *   if (isMobile) {
 *     return <MobileLayout />;
 *   }
 *   return <DesktopLayout />;
 * }
 * ```
 */

import { useState, useEffect, useCallback } from 'react';
import {
  MEDIA_QUERIES,
  getBreakpointTier,
  isMobileWidth,
  isTabletWidth,
  isDesktopWidth,
  type BreakpointTier,
} from '@/config/responsive';

/**
 * Generic media query hook
 * @param query - Media query string (e.g., '(max-width: 768px)')
 * @returns boolean indicating if the query matches
 */
export function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState(() => {
    if (typeof window === 'undefined') return false;
    return window.matchMedia(query).matches;
  });

  useEffect(() => {
    const mediaQuery = window.matchMedia(query);
    setMatches(mediaQuery.matches);

    const handleChange = (e: MediaQueryListEvent) => {
      setMatches(e.matches);
    };

    // Modern browsers
    if (mediaQuery.addEventListener) {
      mediaQuery.addEventListener('change', handleChange);
      return () => mediaQuery.removeEventListener('change', handleChange);
    }
    // Legacy browsers (Safari < 14)
    mediaQuery.addListener(handleChange);
    return () => mediaQuery.removeListener(handleChange);
  }, [query]);

  return matches;
}

/**
 * Check if current viewport is mobile (below 768px)
 * This is the primary mobile detection hook - use this instead of local implementations
 *
 * @returns boolean - true if viewport width < 768px
 */
export function useIsMobile(): boolean {
  return useMediaQuery(MEDIA_QUERIES.mobileOnly);
}

/**
 * Check if current viewport is tablet (768px - 1023px)
 *
 * @returns boolean - true if viewport width is between 768px and 1023px
 */
export function useIsTablet(): boolean {
  return useMediaQuery(MEDIA_QUERIES.tabletOnly);
}

/**
 * Check if current viewport is desktop or larger (1024px+)
 *
 * @returns boolean - true if viewport width >= 1024px
 */
export function useIsDesktop(): boolean {
  return useMediaQuery(MEDIA_QUERIES.desktopUp);
}

/**
 * Check if device is touch-capable (mobile/tablet)
 *
 * @returns boolean - true if device has touch and no hover
 */
export function useIsTouchDevice(): boolean {
  return useMediaQuery(MEDIA_QUERIES.touch);
}

/**
 * Check device orientation
 *
 * @returns 'portrait' | 'landscape'
 */
export function useOrientation(): 'portrait' | 'landscape' {
  const isPortrait = useMediaQuery(MEDIA_QUERIES.portrait);
  return isPortrait ? 'portrait' : 'landscape';
}

/**
 * Get current breakpoint tier with viewport dimensions
 * Updates on resize with RAF debouncing for performance
 *
 * @returns Object with breakpoint tier, width, height, and helper booleans
 */
export function useBreakpoint() {
  const [state, setState] = useState<{
    tier: BreakpointTier;
    width: number;
    height: number;
    isMobile: boolean;
    isTablet: boolean;
    isDesktop: boolean;
  }>(() => {
    if (typeof window === 'undefined') {
      return {
        tier: 'desktop' as BreakpointTier,
        width: 1024,
        height: 768,
        isMobile: false,
        isTablet: false,
        isDesktop: true,
      };
    }
    const width = window.innerWidth;
    const height = window.innerHeight;
    return {
      tier: getBreakpointTier(width),
      width,
      height,
      isMobile: isMobileWidth(width),
      isTablet: isTabletWidth(width),
      isDesktop: isDesktopWidth(width),
    };
  });

  useEffect(() => {
    let rafId = 0;

    const updateState = () => {
      const width = window.innerWidth;
      const height = window.innerHeight;
      setState({
        tier: getBreakpointTier(width),
        width,
        height,
        isMobile: isMobileWidth(width),
        isTablet: isTabletWidth(width),
        isDesktop: isDesktopWidth(width),
      });
    };

    const handleResize = () => {
      cancelAnimationFrame(rafId);
      rafId = requestAnimationFrame(updateState);
    };

    // Initial update
    updateState();

    window.addEventListener('resize', handleResize);
    return () => {
      cancelAnimationFrame(rafId);
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  return state;
}

/**
 * Get a value based on current breakpoint
 * Useful for responsive values without CSS
 *
 * @example
 * ```tsx
 * const padding = useResponsiveValue({
 *   mobile: 16,
 *   tablet: 24,
 *   desktop: 32,
 * });
 * ```
 */
export function useResponsiveValue<T>(values: {
  mobile: T;
  tablet?: T;
  desktop?: T;
  xl?: T;
  '2xl'?: T;
}): T {
  const { tier } = useBreakpoint();

  // Fall through to find the appropriate value (largest defined breakpoint <= current tier)
  if (tier === '2xl' && values['2xl'] !== undefined) return values['2xl'];
  if ((tier === '2xl' || tier === 'xl') && values.xl !== undefined) return values.xl;
  if ((tier === '2xl' || tier === 'xl' || tier === 'desktop') && values.desktop !== undefined) return values.desktop;
  if ((tier === '2xl' || tier === 'xl' || tier === 'desktop' || tier === 'tablet') && values.tablet !== undefined) return values.tablet;
  return values.mobile;
}

/**
 * Hook that returns different callbacks based on device type
 * Useful for mobile-specific vs desktop-specific event handlers
 *
 * @example
 * ```tsx
 * const handleClick = useResponsiveCallback(
 *   () => console.log('Mobile tap'),
 *   () => console.log('Desktop click')
 * );
 * ```
 */
export function useResponsiveCallback<T extends (...args: unknown[]) => unknown>(
  mobileCallback: T,
  desktopCallback: T
): T {
  const isMobile = useIsMobile();
  return useCallback(
    ((...args: Parameters<T>) => {
      return isMobile ? mobileCallback(...args) : desktopCallback(...args);
    }) as T,
    [isMobile, mobileCallback, desktopCallback]
  );
}
