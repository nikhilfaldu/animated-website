import { useEffect, useRef, useCallback } from 'react';
import { useScroll, useMotionValueEvent, useTransform } from 'framer-motion';
import { useOrbitSystem } from '@/context/OrbitSystem';
import { useLenis } from '@/components/LenisProvider';

export function ScrollController({ children }: { children: React.ReactNode }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const lastScrollYRef = useRef<number>(0);
  const firstScrollTriggeredRef = useRef<boolean>(false);
  const rafIdRef = useRef<number | null>(null);
  const hasScrolledAwayFromTop = useRef<boolean>(false);
  const hasAnimatedHandoff = useRef<boolean>(false);

  const { scrollYProgress, scrollY } = useScroll({
    target: containerRef,
    offset: ["start start", "end end"],
  });

  const {
    scrollProgress,
    scrollVelocity,
    triggerFirstScroll,
    introComplete,
    setCustomTransform,
  } = useOrbitSystem();

  const { lenis } = useLenis();

  // ============================================================================
  // EMBLEM CHOREOGRAPHY: "Approach, Expand, Arrive"
  // ============================================================================
  // Single breakpoint array for ALL emblem transforms (uniform logic)
  //
  // Timeline:
  // [0]  0.000  Start - emblem centered, scale 1.0
  // [1]  0.042  Expansion complete - left edge pinned, scale 3.8
  // [2]  0.05   Move left - half off screen (x≈5)
  // [3]  0.14   Move back + scale down - inner circle centered, scale 1.0
  // [4]  0.182  TunnelIn - hidden (opacity 0)
  // [5]  0.293  Services - hidden
  // [6]  0.488  Process - reappears
  // [7]  0.571  Process visible
  // [8]  0.732  Reveal
  // [9]  0.893  Work
  // [10] 1.00   End
  // ============================================================================
  const EMBLEM_BREAKPOINTS = [
    0, 0.048, 0.107, 0.150, 0.195, 0.293, 0.488, 0.571, 0.732, 0.893, 1
  ];

  // ============================================================================
  // X POSITION
  // ============================================================================
  // [0]→[1]: Move left during expansion (50→15)
  // [1]→[2]: Continue left to half off screen (15→5)
  // [2]→[3]: Move right + scale down to final position (5→43)
  // x=43 offsets emblem so INNER CIRCLE center aligns with viewport center
  // (emblem is asymmetrical - inner circle is offset from geometric center)
  const emblemX = useTransform(scrollYProgress, EMBLEM_BREAKPOINTS,
    [50, 15, 5, 43, 43, 43, 50, 50, 50, 50, 50]
  );

  // ============================================================================
  // SCALE
  // ============================================================================
  // [0]→[1]: Expand 1.0→3.8 (left edge pinned)
  // [2]→[3]: Scale down 3.8→1.0 (while moving right)
  const emblemScale = useTransform(scrollYProgress, EMBLEM_BREAKPOINTS,
    [1.0, 3.8, 3.8, 1.0, 1.0, 1.0, 1.2, 1.0, 1.0, 1.0, 0.3]
  );

  // ============================================================================
  // Y POSITION: Always centered vertically
  // ============================================================================
  const emblemY = useTransform(scrollYProgress, EMBLEM_BREAKPOINTS,
    [50, 50, 50, 50, 50, 50, 50, 50, 50, 50, 50]
  );

  // ============================================================================
  // ORIGIN X: Left edge for expansion, center after settle
  // ============================================================================
  // [0]→[2]: originX=0 (left edge pinned during expansion and leftward move)
  // [3]+: originX=50 (center, after scale returns to 1.0)
  const emblemOriginX = useTransform(scrollYProgress, EMBLEM_BREAKPOINTS,
    [0, 0, 0, 50, 50, 50, 50, 50, 50, 50, 50]
  );

  // ============================================================================
  // ORIGIN Y: Always centered vertically
  // ============================================================================
  const emblemOriginY = useTransform(scrollYProgress, EMBLEM_BREAKPOINTS,
    [50, 50, 50, 50, 50, 50, 50, 50, 50, 50, 50]
  );

  // ============================================================================
  // OPACITY: Fade out for handoff, hidden during tunnel, fade back in
  // ============================================================================
  const emblemOpacity = useTransform(scrollYProgress, EMBLEM_BREAKPOINTS,
    [0.08, 0.10, 0.12, 0.06, 0, 0, 0, 0.15, 0.20, 0.25, 0]
  );

  // ============================================================================
  // ROTATION: No rotation during main choreography
  // ============================================================================
  const emblemRotateZ = useTransform(scrollYProgress, EMBLEM_BREAKPOINTS,
    [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]
  );

  // Debounced first-scroll trigger (one frame delay)
  const handleFirstScroll = useCallback(() => {
    if (!firstScrollTriggeredRef.current) {
      // Cancel any pending rAF
      if (rafIdRef.current !== null) {
        cancelAnimationFrame(rafIdRef.current);
      }

      // Debounce by one frame
      rafIdRef.current = requestAnimationFrame(() => {
        if (!firstScrollTriggeredRef.current) {
          firstScrollTriggeredRef.current = true;
          triggerFirstScroll();
        }
      });
    }
  }, [triggerFirstScroll]);

  // Track absolute scroll position for velocity calculation and effects
  useMotionValueEvent(scrollY, "change", (latest) => {
    const delta = latest - lastScrollYRef.current;
    
    // Ignore micro-changes from Lenis RAF loop when idle
    if (Math.abs(delta) < 0.1) return;
    
    lastScrollYRef.current = latest;

    // Detect first scroll from scroll position changes
    handleFirstScroll();
    // Mark as scrolled to allow immediate transform handoff on first movement
    hasScrolledAwayFromTop.current = true;

    // Calculate manual velocity from scroll position delta
    // This provides a backup velocity calculation independent of Lenis
    const manualVelocity = delta * 0.1; // Normalized velocity factor

    // Use manual velocity as fallback if Lenis velocity is zero
    if (Math.abs(scrollVelocity.get()) < 0.01) {
      scrollVelocity.set(manualVelocity);
    }
  });
  
  // Track last applied transform values to prevent unnecessary updates
  const lastTransformRef = useRef<{
    x: number;
    y: number;
    originX: number;
    originY: number;
    scale: number;
    opacity: number;
    rotateZ: number;
  } | null>(null);

  // Update scroll progress and apply smooth transforms
  useMotionValueEvent(scrollYProgress, "change", (progress) => {
    scrollProgress.set(progress);

    // Track if user has scrolled away from top; minimal threshold for immediate handoff
    // Using 0.0001 to ensure expansion starts right at scroll position 0
    if (!hasScrolledAwayFromTop.current && progress > 0.0001) {
      hasScrolledAwayFromTop.current = true;
    }

    // Only apply scroll choreography after intro is complete AND user has scrolled away from hero
    // This prevents: 1) Lenis RAF loop from continuously updating when idle at top
    //                2) Race condition with OrbitSystem's intro fade animation
    //                3) ScrollController interfering before user actually scrolls
    if (!introComplete || !hasScrolledAwayFromTop.current) return;

    // Get current transform values
    const currentTransform = {
      x: emblemX.get(),
      y: emblemY.get(),
      originX: emblemOriginX.get(),
      originY: emblemOriginY.get(),
      scale: emblemScale.get(),
      opacity: emblemOpacity.get(),
      rotateZ: emblemRotateZ.get(),
    };

    // Only update if values have changed meaningfully (> 0.01 threshold)
    const hasChanged = !lastTransformRef.current || Object.keys(currentTransform).some(
      key => Math.abs(currentTransform[key as keyof typeof currentTransform] - 
                     lastTransformRef.current![key as keyof typeof currentTransform]) > 0.01
    );

    if (hasChanged) {
      if (!hasAnimatedHandoff.current) {
        setCustomTransform(currentTransform, { animate: true, duration: 0.4 });
        hasAnimatedHandoff.current = true;
      } else {
        setCustomTransform(currentTransform);
      }
      lastTransformRef.current = currentTransform;
    }
  });
  
  // Calculate velocity with Lenis
  useEffect(() => {
    if (!lenis) return;

    const handleScroll = (e: { velocity: number }) => {
      scrollVelocity.set(e.velocity);
    };

    lenis.on('scroll', handleScroll);

    return () => {
      lenis.off('scroll', handleScroll);
    };
  }, [lenis, scrollVelocity]);

  // Detect first scroll from keyboard (Space, PageDown, Arrows)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const scrollKeys = ['Space', 'PageDown', 'PageUp', 'ArrowDown', 'ArrowUp', 'Home', 'End'];
      if (scrollKeys.includes(e.code) || scrollKeys.includes(e.key)) {
        handleFirstScroll();
      }
    };

    window.addEventListener('keydown', handleKeyDown, { passive: true });

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [handleFirstScroll]);

  // Handle mid-page landings (browser back, anchor links, history)
  useEffect(() => {
    // Check if user landed mid-page
    const checkMidPageLanding = () => {
      if (window.scrollY > 10) {
        handleFirstScroll();
      }
    };

    // Run after initial render
    const timeoutId = setTimeout(checkMidPageLanding, 100);

    return () => {
      clearTimeout(timeoutId);
      // Clean up any pending rAF
      if (rafIdRef.current !== null) {
        cancelAnimationFrame(rafIdRef.current);
      }
    };
  }, [handleFirstScroll]);

  return (
    <div ref={containerRef} className="scroll-container">
      {children}
    </div>
  );
}
