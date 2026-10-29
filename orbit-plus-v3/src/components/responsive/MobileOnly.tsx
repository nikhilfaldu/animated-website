/**
 * MobileOnly / DesktopOnly / TabletOnly Components
 *
 * Conditional rendering wrappers based on viewport size.
 * Use these to render mobile-specific or desktop-specific content
 * without affecting the other platform.
 *
 * @example
 * ```tsx
 * <MobileOnly>
 *   <MobileNavigation />
 * </MobileOnly>
 *
 * <DesktopOnly>
 *   <DesktopSidebar />
 * </DesktopOnly>
 *
 * // With fallback
 * <MobileOnly fallback={<DesktopVersion />}>
 *   <MobileVersion />
 * </MobileOnly>
 * ```
 */

import { type ReactNode } from 'react';
import {
  useIsMobile,
  useIsTablet,
  useIsDesktop,
  useBreakpoint,
} from '@/hooks/useResponsive';

interface ResponsiveProps {
  children: ReactNode;
  /** Optional content to render when condition is not met */
  fallback?: ReactNode;
}

/**
 * Only renders children on mobile viewports (< 768px)
 * Desktop users see nothing (or fallback if provided)
 */
export function MobileOnly({ children, fallback = null }: ResponsiveProps): ReactNode {
  const isMobile = useIsMobile();
  return isMobile ? children : fallback;
}

/**
 * Only renders children on tablet viewports (768px - 1023px)
 */
export function TabletOnly({ children, fallback = null }: ResponsiveProps): ReactNode {
  const isTablet = useIsTablet();
  return isTablet ? children : fallback;
}

/**
 * Only renders children on desktop viewports (>= 1024px)
 * Mobile users see nothing (or fallback if provided)
 */
export function DesktopOnly({ children, fallback = null }: ResponsiveProps): ReactNode {
  const isDesktop = useIsDesktop();
  return isDesktop ? children : fallback;
}

/**
 * Only renders children on mobile AND tablet viewports (< 1024px)
 * Desktop users see nothing (or fallback if provided)
 */
export function MobileAndTablet({ children, fallback = null }: ResponsiveProps): ReactNode {
  const { isDesktop } = useBreakpoint();
  return !isDesktop ? children : fallback;
}

/**
 * Only renders children on tablet AND desktop viewports (>= 768px)
 * Mobile users see nothing (or fallback if provided)
 */
export function TabletAndDesktop({ children, fallback = null }: ResponsiveProps): ReactNode {
  const { isMobile } = useBreakpoint();
  return !isMobile ? children : fallback;
}

interface ResponsiveSwitchProps {
  /** Content for mobile viewports (< 768px) */
  mobile: ReactNode;
  /** Content for tablet viewports (768px - 1023px) - falls back to mobile if not provided */
  tablet?: ReactNode;
  /** Content for desktop viewports (>= 1024px) - falls back to tablet then mobile if not provided */
  desktop?: ReactNode;
}

/**
 * Renders different content based on viewport size
 * More explicit than nested MobileOnly/DesktopOnly
 *
 * @example
 * ```tsx
 * <ResponsiveSwitch
 *   mobile={<MobileNav />}
 *   tablet={<TabletNav />}
 *   desktop={<DesktopNav />}
 * />
 * ```
 */
export function ResponsiveSwitch({
  mobile,
  tablet,
  desktop,
}: ResponsiveSwitchProps): ReactNode {
  const { tier } = useBreakpoint();

  switch (tier) {
    case '2xl':
    case 'xl':
    case 'desktop':
      return desktop ?? tablet ?? mobile;
    case 'tablet':
      return tablet ?? mobile;
    case 'mobile':
    default:
      return mobile;
  }
}
