import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { AnimatePresence, motion, useSpring } from 'framer-motion';
import { ScrollEmblem } from './ScrollEmblem';
import { KineticDialNav, type NavItem } from './KineticDialNav';
import { NavStagePortal } from './NavStagePortal';
import {
  CYL_ITEM_COUNT,
  CYL_RADIUS,
  FADE_DURATION_MS,
  MORPH_DURATION_MS,
  MORPH_PERSIST_BEAT_MS,
  NAV_MORPH_V2,
} from './nav/constants';
import type { NavMode } from './nav/types';
import { useOrbitSystem } from '@/context/OrbitSystem';
import { useLenis } from '@/components/LenisProvider';
import { useIsMobile } from '@/hooks/useResponsive';
import { SCROLL_RANGES } from '@/config/scrollRanges';

interface GlobalNavProps {
  className?: string;
}

// Helper: Compute section offsets (MVP: equal segments)
function computeSectionOffsets(sectionCount: number) {
  return Array.from({ length: sectionCount }, (_, i) => ({
    start: i / sectionCount,
    end: (i + 1) / sectionCount,
  }));
}

// Helper: Find active section index from scroll progress
function findActiveSectionIndex(
  progress: number,
  offsets: Array<{ start: number; end: number }>
): number {
  let activeIndex = 0;

  offsets.forEach((range, i) => {
    if (progress >= range.start) {
      activeIndex = i;
    }
    if (progress >= range.start && progress < range.end) {
      activeIndex = i;
    }
  });

  return activeIndex;
}

/**
 * GlobalNav - Complete navigation system with mode state machine
 *
 * Architecture:
 * - Emblem in upper LEFT corner as scroll progress indicator and navigation trigger
 * - Navigation appears on LEFT side as 3D cylindrical carousel
 * - Mode state machine: compact → preview (hover) → pinned (click)
 * - Scroll progress fills emblem radials (0-32) and syncs with cylinder rotation
 *
 * Accessibility:
 * - Emblem is focusable button with aria-label and aria-expanded
 * - Navigation has role="navigation"
 * - Keyboard navigation: Tab, Enter, Space, Escape, ArrowLeft/Right
 * - Roving tabindex pattern
 * - Screen reader announcements
 */
export function GlobalNav({
  className = '',
}: GlobalNavProps): React.JSX.Element {
  const [mode, setMode] = useState<NavMode>('compact');
  const [activeIndex, setActiveIndex] = useState(0);
  const [isStageHovered, setIsStageHovered] = useState(false);
  const wheelAccumulatorRef = useRef(0);
  const wheelGestureTimeRef = useRef(0);
  const wheelStepTimeRef = useRef(0);
  const emblemRef = useRef<HTMLDivElement>(null);
  const dialContainerRef = useRef<HTMLDivElement>(null);
  const morphTimers = useRef<number[]>([]);
  const [morphPhase, setMorphPhase] = useState<
    'idle' | 'morphing' | 'persist' | 'fading' | 'complete'
  >('idle');
  const [dialPhase, setDialPhase] = useState<'hidden' | 'fading-in' | 'visible'>(
    NAV_MORPH_V2 ? 'hidden' : 'visible'
  );
  const [dialInteractive, setDialInteractive] = useState(!NAV_MORPH_V2);
  const [debugOverlayEnabled, setDebugOverlayEnabled] = useState(false);
  const pinOnCompleteRef = useRef(false);

  // Mobile responsiveness
  const isMobile = useIsMobile();

  const debugLog = useCallback((label: string) => {
    if (!NAV_MORPH_V2) return;
    if (typeof performance !== 'undefined' && typeof performance.mark === 'function') {
      performance.mark(label);
    }
  }, []);

  // Get scrollProgress and transform values from OrbitSystem for morph
  const { scrollProgress, originX, originY } = useOrbitSystem();

  // Get Lenis for smooth scrolling
  const { lenis } = useLenis();

  // Check for reduced motion preference
  const prefersReducedMotion =
    typeof window !== 'undefined' && window.matchMedia
      ? (() => {
          try {
            return window.matchMedia('(prefers-reduced-motion: reduce)')
              .matches;
          } catch {
            return false;
          }
        })()
      : false;
  // Navigation items for the vertical carousel - memoized to prevent recreating on every render
  const navItems: NavItem[] = useMemo(() => [
    { id: 'hero', label: 'Introduction', href: '#hero' },
    { id: 'positioning', label: 'Your Story', href: '#positioning' },
    { id: 'services', label: 'Services', href: '#services' },
    { id: 'process', label: 'How We Work', href: '#process' },
    { id: 'work', label: 'Projects', href: '#work' },
    { id: 'proof', label: 'Results', href: '#proof' },
    { id: 'pricing', label: 'Investment', href: '#pricing' },
    { id: 'contact', label: 'Start Here', href: '#contact' },
  ], []);

  const dialItems = useMemo(
    () => navItems.map((item, index) => ({ ...item, originalIndex: index })).reverse(),
    [navItems]
  );

  const dialIndexMap = useMemo(
    () => dialItems.map(item => item.originalIndex),
    [dialItems]
  );

  const dialActiveIndex = useMemo(() => {
    const activeId = navItems[activeIndex]?.id;
    const found = dialItems.findIndex(item => item.id === activeId);
    return found >= 0 ? found : 0;
  }, [activeIndex, dialItems, navItems]);

  const fallbackOffsets = useMemo(
    () => computeSectionOffsets(navItems.length),
    [navItems.length]
  );
  const [sectionOffsets, setSectionOffsets] = useState(fallbackOffsets);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const updateOffsets = () => {
      const container = document.querySelector('.scroll-container') as HTMLElement | null;
      const totalScroll =
        container && container.scrollHeight > window.innerHeight
          ? container.scrollHeight - window.innerHeight
          : null;
      const containerTop =
        container
          ? container.getBoundingClientRect().top + window.scrollY
          : 0;

      const nextOffsets = navItems.map((item, index) => {
        const range = SCROLL_RANGES[item.id as keyof typeof SCROLL_RANGES];
        if (range) return range;

        if (totalScroll) {
          const el = document.getElementById(item.id);
          if (el) {
            const rect = el.getBoundingClientRect();
            const top = rect.top + window.scrollY - containerTop;
            const start = Math.min(1, Math.max(0, top / totalScroll));
            const end = Math.min(1, Math.max(0, (top + rect.height) / totalScroll));
            return {
              start,
              end: Math.max(end, Math.min(1, start + 0.001)),
            };
          }
        }

        return fallbackOffsets[index];
      });

      setSectionOffsets(nextOffsets);
    };

    updateOffsets();
    window.addEventListener('resize', updateOffsets);
    return () => window.removeEventListener('resize', updateOffsets);
  }, [navItems, fallbackOffsets]);

  // Subscribe to scrollProgress to update activeIndex
  useEffect(() => {
    const unsubscribe = scrollProgress.on('change', (latest) => {
      const nearestIndex = findActiveSectionIndex(latest, sectionOffsets);
      setActiveIndex(nearestIndex);
    });

    return () => unsubscribe();
  }, [scrollProgress, sectionOffsets]);

  // Convert scrollProgress to radials for emblem (0-32)
  const [litRadials, setLitRadials] = useState(0);
  useEffect(() => {
    const unsubscribe = scrollProgress.on('change', (latest) => {
      const radials = Math.round(latest * 32);
      setLitRadials(radials);
    });

    return () => unsubscribe();
  }, [scrollProgress]);

  useEffect(() => {
    if (!NAV_MORPH_V2) return;

    const handleDebugToggle = (event: KeyboardEvent) => {
      if (event.altKey && event.shiftKey && (event.key === 'd' || event.key === 'D')) {
        event.preventDefault();
        setDebugOverlayEnabled(value => !value);
      }
    };

    window.addEventListener('keydown', handleDebugToggle);
    return () => window.removeEventListener('keydown', handleDebugToggle);
  }, []);

  useEffect(() => {
    if (!NAV_MORPH_V2) return;

    morphTimers.current.forEach(id => window.clearTimeout(id));
    morphTimers.current = [];

    if (mode !== 'navigating') {
      if (mode === 'pinned' || mode === 'preview') {
        setMorphPhase('complete');
        setDialPhase('visible');
        setDialInteractive(true);
      } else if (mode === 'compact') {
        setMorphPhase('idle');
        setDialPhase('hidden');
        setDialInteractive(false);
      }
      return;
    }

    const morphDuration = prefersReducedMotion ? 0 : MORPH_DURATION_MS;
    const persistDelay = morphDuration + MORPH_PERSIST_BEAT_MS;
    // Fade dial in after morph completes so the emblem stagger is visible
    const earlyDialFadeInDelay = morphDuration;
    const fadeCompleteDelay = persistDelay + FADE_DURATION_MS;

    setMorphPhase('morphing');
    setDialPhase('hidden');
    setDialInteractive(false);
    debugLog('NAV:MORPH_START');

    const timers: number[] = [];

    // Start dial text pre-fade earlier for a smoother morph handoff
    timers.push(
      window.setTimeout(() => {
        setDialPhase('fading-in');
        debugLog('NAV:DIAL_FADE_PRIME');
      }, earlyDialFadeInDelay)
    );

    timers.push(
      window.setTimeout(() => {
        setMorphPhase('persist');
        debugLog('NAV:MORPH_END');
      }, morphDuration)
    );

    timers.push(
      window.setTimeout(() => {
        setMorphPhase('fading');
        debugLog('NAV:PERSIST_BEAT_END');
        debugLog('NAV:EMBLEM_FADE_START');
        setDialPhase('fading-in');
        debugLog('NAV:DIAL_FADE_START');
      }, persistDelay)
    );

    timers.push(
      window.setTimeout(() => {
        setDialInteractive(true);
        debugLog('NAV:DIAL_INTERACTIVE');
      }, persistDelay + Math.round(FADE_DURATION_MS * 0.6))
    );

    timers.push(
      window.setTimeout(() => {
        setMorphPhase('complete');
        setDialPhase('visible');
        setMode(pinOnCompleteRef.current ? 'pinned' : 'preview');
      }, fadeCompleteDelay)
    );

    morphTimers.current = timers;

    return () => {
      timers.forEach(id => window.clearTimeout(id));
    };
  }, [mode, prefersReducedMotion, debugLog]);

  // Preview scale spring: 1.0 → 1.04 on preview/pinned (snappy spring)
  const previewScaleTarget = mode === 'compact' ? 1.0 : 1.04;
  const previewScale = useSpring(previewScaleTarget, {
    stiffness: 140,
    damping: 22,
  });

  // Handle navigation item click
  const handleNavItemClick = useCallback((item: NavItem) => {
    // Ensure Lenis is running before scrolling (it may be paused during dial hover)
    if (lenis) {
      lenis.start();
    }

    // Use Lenis for smooth scroll if available
    if (item.href) {
      if (item.href.startsWith('#')) {
        if (lenis) {
          lenis.scrollTo(item.href, {
            duration: 1.2,
            offset: 0,
          });
        } else {
          const target = document.querySelector(item.href);
          if (target instanceof HTMLElement) {
            target.scrollIntoView({ behavior: 'smooth', block: 'start' });
          }
        }
      } else {
        window.location.href = item.href;
      }
    } else {
      const sectionId = `#${item.id}`;
      if (lenis) {
        lenis.scrollTo(sectionId, {
          duration: 1.2,
          offset: 0,
        });
      } else {
        const section = document.getElementById(item.id);
        if (section) {
          section.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      }
    }

    // Auto-collapse after 600ms idle
    setTimeout(() => {
      setMode('compact');
    }, 600);
  }, [lenis]);

  // Global keyboard navigation when nav is open (roving tabindex pattern)
  useEffect(() => {
    if (mode === 'compact') return;

    const handleKeyDown = (e: KeyboardEvent) => {
      // ArrowLeft/Right: navigate between items
      if (e.key === 'ArrowLeft') {
        e.preventDefault();
        setActiveIndex(i => (i > 0 ? i - 1 : navItems.length - 1));
      } else if (e.key === 'ArrowRight') {
        e.preventDefault();
        setActiveIndex(i => (i < navItems.length - 1 ? i + 1 : 0));
      }
      // Enter/Space: select active item
      else if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        handleNavItemClick(navItems[activeIndex]);
      }
      // Escape: close and return focus to trigger
      else if (e.key === 'Escape') {
        e.preventDefault();
        setMode('compact');
        emblemRef.current?.focus();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [mode, activeIndex, navItems, handleNavItemClick]);

  // Handle nav stage hover - open preview mode
  const handleStageEnter = useCallback(() => {
    setIsStageHovered(true);
    if (mode === 'compact') {
      pinOnCompleteRef.current = false;
      setMode('navigating');
    }
  }, [mode]);

  // Handle nav stage leave - close if not pinned
  const handleStageLeave = useCallback(() => {
    setIsStageHovered(false);
    if (pinOnCompleteRef.current) return;
    if (mode === 'preview' || mode === 'navigating') {
      setMode('compact');
    }
  }, [mode]);

  useEffect(() => {
    if (!lenis) return;
    if (isStageHovered) {
      lenis.stop();
    } else {
      lenis.start();
    }
    return () => {
      lenis.start();
    };
  }, [isStageHovered, lenis]);

  const handleStageWheel = useCallback((event: React.WheelEvent<HTMLDivElement>) => {
    if (!isStageHovered || mode === 'compact') return;
    event.preventDefault();

    const now = performance.now();
    const timeSinceGesture = now - wheelGestureTimeRef.current;
    const isNewGesture = timeSinceGesture > 140;
    wheelGestureTimeRef.current = now;

    if (isNewGesture) {
      wheelAccumulatorRef.current = 0;
    }

    wheelAccumulatorRef.current += event.deltaY;

    const baseThreshold = 110;
    const deltaModeMultiplier = event.deltaMode === 1 ? 0.4 : event.deltaMode === 2 ? 1.6 : 1;
    const threshold = baseThreshold * deltaModeMultiplier;

    if (Math.abs(wheelAccumulatorRef.current) < threshold) return;

    const stepCooldownMs = 180;
    if (now - wheelStepTimeRef.current < stepCooldownMs) return;
    wheelStepTimeRef.current = now;

    const stepDirection = wheelAccumulatorRef.current > 0 ? -1 : 1;
    wheelAccumulatorRef.current = 0;

    const count = dialItems.length || 1;
    const nextDialIndex = Math.max(0, Math.min(count - 1, dialActiveIndex + stepDirection));
    const nextNavIndex = dialIndexMap[nextDialIndex];
    if (typeof nextNavIndex === 'number') {
      setActiveIndex(nextNavIndex);
    }
  }, [dialActiveIndex, dialIndexMap, dialItems.length, isStageHovered, mode]);

  const handleStageTouchMove = useCallback((event: React.TouchEvent<HTMLDivElement>) => {
    if (!isStageHovered) return;
    event.preventDefault();
    event.stopPropagation();
  }, [isStageHovered]);

  // Handle keyboard navigation for emblem trigger
  const handleEmblemKeyDown = useCallback(
    (event: React.KeyboardEvent<HTMLDivElement>) => {
      if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();
        if (NAV_MORPH_V2) {
          pinOnCompleteRef.current = true;
          setMode(current => {
            if (current === 'compact' || current === 'preview') {
              return 'navigating';
            }
            if (current === 'navigating') {
              return current;
            }
            pinOnCompleteRef.current = false;
            return 'compact';
          });
        } else {
          setMode(m => (m === 'pinned' ? 'compact' : 'pinned'));
        }
      } else if (event.key === 'Escape') {
        event.preventDefault();
        setMode('compact');
        emblemRef.current?.focus();
      }
    },
    []
  );

  // Handle emblem click to toggle pinned
  const handleEmblemClick = useCallback(
    (event: React.MouseEvent<HTMLDivElement>) => {
      event.stopPropagation();
      if (NAV_MORPH_V2) {
        pinOnCompleteRef.current = true;
        setMode(current => {
          if (current === 'compact' || current === 'preview') {
            return 'navigating';
          }
          if (current === 'navigating') {
            return current;
          }
          pinOnCompleteRef.current = false;
          return 'compact';
        });
      } else {
        setMode(m => (m === 'pinned' ? 'compact' : 'pinned'));
      }
    },
    []
  );

  // Handle click outside to close navigation (unless pinned)
  const handleOutsideClick = useCallback(() => {
    if (mode !== 'compact') {
      pinOnCompleteRef.current = false;
      setMode('compact');
    }
  }, [mode]);

  // Enhanced nav items with click handler - memoized to prevent unnecessary re-renders
  const enhancedNavItems = useMemo(
    () => dialItems.map(item => ({
      ...item,
      onClick: () => handleNavItemClick(item),
    })),
    [dialItems, handleNavItemClick]
  );

  const handleDialIndexChange = useCallback((dialIndex: number) => {
    const navIndex = dialIndexMap[dialIndex];
    if (typeof navIndex !== 'number') return;
    setActiveIndex(navIndex);
  }, [dialIndexMap]);

  useEffect(() => {
    return () => {
      morphTimers.current.forEach(id => window.clearTimeout(id));
      morphTimers.current = [];
    };
  }, []);

  const dialFocusArmed = useRef(false);

  useEffect(() => {
    if (!NAV_MORPH_V2) return;

    if (mode === 'compact') {
      dialFocusArmed.current = false;
    }
  }, [mode]);

  useEffect(() => {
    if (!NAV_MORPH_V2) return;
    if (!dialInteractive) return;
    if (dialPhase === 'hidden') return;
    if (dialFocusArmed.current) return;

    const node = dialContainerRef.current;
    if (node) {
      node.focus({ preventScroll: true });
      dialFocusArmed.current = true;
    }
  }, [dialInteractive, dialPhase]);

  const navExpanded = mode !== 'compact';
  const crossfadeEase: [number, number, number, number] = [0.33, 1, 0.68, 1];
  const crossfadeDuration = prefersReducedMotion ? 0 : FADE_DURATION_MS / 1000;
  const theta = 360 / CYL_ITEM_COUNT;

  const emblemOpacity = NAV_MORPH_V2
    ? (() => {
        const isFadeOutPhase =
          morphPhase === 'fading' || morphPhase === 'complete' || mode === 'pinned';
        if (isFadeOutPhase) return 0;

        const inMorphSequence =
          mode === 'navigating' || morphPhase === 'morphing' || morphPhase === 'persist';
        if (inMorphSequence) return 1;

        if (mode === 'preview') {
          return 1.0;
        }

        return 1;
      })()
    : mode === 'compact'
      ? 1
      : 0.2;

  const dialOpacity = NAV_MORPH_V2
    ? dialPhase === 'hidden'
      ? 0
      : dialPhase === 'fading-in'
        ? 0.6
        : 1
    : navExpanded
      ? 1
      : 0;

  const emblemTransitionDuration = NAV_MORPH_V2 && (morphPhase === 'fading' || morphPhase === 'complete')
    ? crossfadeDuration
    : prefersReducedMotion ? 0 : 0.3;

  const dialTransitionDuration = NAV_MORPH_V2
    ? (morphPhase === 'fading' || morphPhase === 'complete') ? crossfadeDuration : 0
    : prefersReducedMotion ? 0 : 0.6;

  const emblemPointerEvents: 'auto' | 'none' = 'auto';

  const dialPointerEvents: 'auto' | 'none' = NAV_MORPH_V2
    ? dialInteractive ? 'auto' : 'none'
    : navExpanded ? 'auto' : 'none';

  const emblemTabIndex = emblemPointerEvents === 'auto' ? 0 : -1;

  const dialVisibilityPhase = NAV_MORPH_V2
    ? dialPhase
    : navExpanded ? 'visible' : 'hidden';

  const dialIsInteractive = NAV_MORPH_V2 ? dialInteractive : navExpanded;
  const activeLabel = navItems[activeIndex]?.label ?? '';
  const activeLabelId = navItems[activeIndex]?.id ?? 'section';
  const hintOpacity = mode === 'compact' ? 1 : 0;
  const hintTransition = {
    duration: prefersReducedMotion ? 0 : 0.3,
    ease: crossfadeEase,
  };

  const debugOverlay = debugOverlayEnabled && NAV_MORPH_V2
    ? (
        <div className="w-full h-full">
          <div
            className="absolute inset-0 flex items-center justify-center"
            style={{ pointerEvents: 'none' }}
          >
            <div
              style={{
                width: CYL_RADIUS * 2,
                height: CYL_RADIUS * 2,
                borderRadius: '50%',
                border: '1px dashed rgba(255,255,255,0.4)',
              }}
            />
          </div>
          <div
            className="absolute inset-0 flex items-center justify-center"
            style={{ pointerEvents: 'none' }}
          >
            <div
              style={{
                width: 6,
                height: 6,
                borderRadius: '50%',
                backgroundColor: 'rgba(255,255,255,0.85)',
              }}
            />
          </div>
          <div
            className="absolute bottom-2 left-1/2"
            style={{
              transform: 'translateX(-50%)',
              fontSize: 10,
              letterSpacing: 0.6,
              padding: '2px 6px',
              borderRadius: 4,
              backgroundColor: 'rgba(0,0,0,0.55)',
              color: '#fff',
            }}
          >
            rotateX {Math.round((( -activeIndex * theta ) % 360 + 360) % 360)}°
          </div>
        </div>
      )
    : undefined;

  const emblemZIndex = NAV_MORPH_V2 && (morphPhase === 'complete' || mode === 'pinned')
    ? 10
    : 20;

  const dialZIndex = NAV_MORPH_V2 && dialPhase === 'visible'
    ? 20
    : 10;

  return (
    <nav
      className={`global-nav fixed inset-0 z-[10000] ${className}`}
      role="navigation"
      aria-label="Main navigation"
    >
      <div
        className={`absolute inset-0 ${mode !== 'compact' ? 'pointer-events-auto' : 'pointer-events-none'}`}
        onClick={handleOutsideClick}
        aria-hidden="true"
      />
      <NavStagePortal
        className="z-30"
        onMouseEnter={handleStageEnter}
        onMouseLeave={handleStageLeave}
        onWheel={handleStageWheel}
        onTouchMove={handleStageTouchMove}
        containerStyle={{
          transform: isMobile ? 'translate(-55px, -55px) scale(0.7)' : 'translate(-40px, -40px)',
        }}
        emblem={{
          node: (
            <motion.div
              ref={emblemRef}
              className="cursor-pointer"
              style={{
                outline: 'none',
                scale: previewScale,
                transformOrigin: `${originX.get()}% ${originY.get()}%`,
              }}
              initial={false}
              animate={{ opacity: emblemOpacity }}
              transition={{
                duration: emblemTransitionDuration,
                ease: crossfadeEase,
              }}
              onClick={handleEmblemClick}
              onKeyDown={handleEmblemKeyDown}
              tabIndex={emblemTabIndex}
              role="button"
              aria-label={`Navigation menu, ${litRadials} of 32 sections completed`}
              aria-expanded={mode !== 'compact'}
              aria-controls="main-navigation-menu"
            >
              <ScrollEmblem
                size={isMobile ? 72 : 96}
                litRadials={litRadials}
                mode={mode}
                activeIndex={activeIndex}
                phase={morphPhase}
              />
            </motion.div>
          ),
          style: {
            pointerEvents: emblemPointerEvents,
            zIndex: emblemZIndex,
          },
        }}
        dial={{
          node: (
            <motion.div
              id="main-navigation-menu"
              className="outline-none"
              ref={dialContainerRef}
              style={{
                outline: 'none',
                scale: previewScale,
                transformOrigin: `${originX.get()}% ${originY.get()}%`,
              }}
              onClick={event => event.stopPropagation()}
              tabIndex={-1}
            >
              <KineticDialNav
                items={enhancedNavItems}
                mode={mode}
                activeIndex={dialActiveIndex}
                onActiveIndexChange={handleDialIndexChange}
                visibilityPhase={dialVisibilityPhase}
                interactive={dialIsInteractive}
                enableWheel={false}
                clampIndex={isStageHovered}
                labelOpacity={dialOpacity}
                labelTransitionDuration={dialTransitionDuration}
              />
            </motion.div>
          ),
          style: {
            pointerEvents: dialPointerEvents,
            zIndex: dialZIndex,
            // Mobile: scale up cylinder 1.5x for easier touch targets, adjust position accordingly
            transform: isMobile ? 'translate(48px, 48px) scale(1.5)' : 'translate(48px, 48px)',
          },
        }}
        hint={{
          node: (
            <div className="flex flex-col items-center gap-2">
              {isMobile ? null : (
                <motion.div
                  className="text-center text-xs uppercase tracking-[0.3em] text-white/40 cursor-pointer select-none outline-none"
                  style={{ outline: 'none' }}
                  animate={{ opacity: hintOpacity }}
                  transition={hintTransition}
                  onClick={handleEmblemClick}
                >
                  Navigation
                </motion.div>
              )}
              <motion.div
                className="text-center text-[10px] uppercase tracking-[0.3em] text-white/60 select-none pointer-events-none"
                animate={{ opacity: hintOpacity }}
                transition={hintTransition}
              >
                <AnimatePresence mode="wait" initial={false}>
                  <motion.div
                    key={activeLabelId}
                    initial={{ opacity: 0, y: 4 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -4 }}
                    transition={{
                      duration: prefersReducedMotion ? 0 : 0.25,
                      ease: crossfadeEase,
                    }}
                  >
                    {activeLabel}
                  </motion.div>
                </AnimatePresence>
              </motion.div>
            </div>
          ),
          style: { pointerEvents: isMobile ? 'none' : 'auto' },
        }}
        debugOverlay={debugOverlay}
      />
    </nav>
  );
}
