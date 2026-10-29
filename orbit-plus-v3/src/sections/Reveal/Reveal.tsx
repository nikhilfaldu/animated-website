import { useMemo, useRef } from 'react';
import { motion, useReducedMotion, useScroll, useTransform } from 'framer-motion';
import { ApertureCanvas } from '@/components/emblem/ApertureEmblem';
import { useOrbitEmblemRect } from '@/components/emblem/ApertureEmblem/useOrbitEmblemRect';

interface RevealProps {
  sectionHeight?: number;
}

function clamp01(n: number) {
  return Math.max(0, Math.min(1, n));
}

export function Reveal({ sectionHeight = 1200 }: RevealProps) {
  const prefersReducedMotion = useReducedMotion();
  const ref = useRef<HTMLElement | null>(null);
  const CLICK_COUNT = 4;
  const CLICK_WINDOW_START = 0.06;
  const CLICK_WINDOW_END = 0.92;
  const FINAL_OPEN_END = 0.98;

  /**
   * 1) Pre-lock progress: starts as Reveal ENTERS the viewport.
   *    0 when section top hits viewport bottom
   *    1 when section top hits viewport top (pin moment)
   */
  const { scrollYProgress: enterProgress } = useScroll({
    target: ref,
    offset: ['start end', 'start start'],
  });

  /**
   * 2) Pinned runway progress: begins at lock (start/start), then runs through the whole section height.
   */
  const { scrollYProgress: pinnedProgress } = useScroll({
    target: ref,
    offset: ['start start', 'end start'],
  });

  /**
   * 3) Blend into one continuous 0..1 progress.
   *    Reserve the first chunk (ENTER_PORTION) for “scrolling into place” animation.
   */
  const ENTER_PORTION = 0.22;

  const revealProgress = useTransform(
    [enterProgress, pinnedProgress],
    (values: number[]) => {
      const [e, p] = values;
      // Before lock: pinnedProgress is still ~0, so use enterProgress
      if (p <= 0.000001) return clamp01(e) * ENTER_PORTION;
      // After lock: continue from ENTER_PORTION onward
      return ENTER_PORTION + clamp01(p) * (1 - ENTER_PORTION);
    }
  );

  const apertureProgress = useTransform(revealProgress, (value) => {
    if (value < CLICK_WINDOW_START) return 0;
    if (value <= CLICK_WINDOW_END) {
      const clickSpan = CLICK_WINDOW_END - CLICK_WINDOW_START;
      const clickProgress = clamp01((value - CLICK_WINDOW_START) / clickSpan);
      const phase = clickProgress * CLICK_COUNT;
      const local = phase - Math.floor(phase);
      return Math.sin(Math.PI * local);
    }
    const post = clamp01((value - CLICK_WINDOW_END) / (FINAL_OPEN_END - CLICK_WINDOW_END));
    return post;
  });

  /**
   * WebGL should be visible during entry (no black screen), then fade late.
   * If you want *zero* fade-in and pure motion-only: set first two stops to [1,1].
   */
  const webglOpacity = useTransform(
    revealProgress,
    [0.00, 0.08, 0.96, 0.99],
    [0, 1, 1, 0]
  );

  /**
   * Orbit/SVG crossfade cue (debug).
   * This should come up late so WebGL “hands off” cleanly.
   */
  const orbitOpacityCue = useTransform(revealProgress, [0.74, 0.90], [0, 1]);


  /**
   * Size the WebGL canvas large enough to prevent clipping during the aperture
   * animation (rays swing outward with radial push), while keeping reference to
   * orbitRect for potential handoff alignment.
   *
   * Minimum of 100vmin ensures full viewport coverage for animation.
   * The shader centers the emblem within this space.
   */
  const orbitRect = useOrbitEmblemRect();
  const sizeVmin = useMemo(() => {
    // Full viewport coverage to prevent clipping during animation
    if (!orbitRect) return 100;

    const vminPx = Math.min(window.innerWidth, window.innerHeight);
    const targetPx = Math.max(orbitRect.width, orbitRect.height);

    // Calculate exact percentage to match SVG emblem size
    const pct = (targetPx / vminPx) * 100 * 1.1;
    return Math.max(56, pct);
  }, [orbitRect]);

  return (
    <section
      ref={ref}
      id="reveal"
      className="relative w-full bg-[rgb(var(--bg))]"
      style={{ height: `${sectionHeight}vh` }}
      aria-label="Transition to work"
    >
      {/* Fixed WebGL overlay - z-[58] above WorkBridgeOverlay (z-56) */}
      {!prefersReducedMotion && (
        <motion.div
          className="fixed inset-0 pointer-events-none"
          style={{ opacity: webglOpacity, zIndex: 58 }}
        >
          <ApertureCanvas progress={apertureProgress} sizeVmin={sizeVmin} />
        </motion.div>
      )}

      {/* Sticky gradient overlay for visual depth */}
      <div className="sticky top-0 h-screen w-full flex items-center justify-center pointer-events-none">
        <div className="absolute inset-x-0 bottom-0 h-[40vh] bg-gradient-to-t from-black via-black/80 to-transparent" />
      </div>

      <motion.div className="sr-only" style={{ opacity: orbitOpacityCue }} />
    </section>
  );
}
