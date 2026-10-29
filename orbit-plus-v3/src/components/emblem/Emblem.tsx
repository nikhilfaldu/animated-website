/**
 * Emblem - SVG-based 32-radial emblem component
 *
 * GEOMETRY SYNC NOTE:
 * This component uses EMBLEM_PATHS from '@/assets/emblemPaths' for SVG path data.
 * The WebGL tunnel scenes use BLADE_CONFIGS from '@/components/emblem/ApertureEmblem/bladeConfig'.
 * These two sources were derived from the same original emblem design and MUST stay synchronized.
 *
 * If emblem geometry changes:
 * 1. Update EMBLEM_PATHS (SVG path strings)
 * 2. Update BLADE_CONFIGS (angles, radii, lengths)
 * 3. Verify both render the same 32-radial shape
 *
 * Future refactor option: Generate EMBLEM_PATHS from BLADE_CONFIGS for true single source.
 */
import { motion, useTransform, useMotionValueEvent, type MotionValue } from 'framer-motion';
import { useMemo, useState } from 'react';
import { useOrbitSystem } from '@/context/OrbitSystem';
import { useReducedMotion } from '@/hooks/useReducedMotion';
import { EMBLEM_PATHS } from '@/assets/emblemPaths';
import { SVG_EMBLEM_HANDOFF, EMBLEM_VIEWBOX } from '@/config/emblemConstants';

interface EmblemProps {
  size?: number;
  className?: string;
  dataValues?: number[]; // For data viz state
}

export function Emblem({
  size = 400,
  className = '',
  dataValues = [],
}: EmblemProps) {
  const {
    x, y, scale, rotateX, rotateY, rotateZ, opacity, originX, originY,
    currentState, scrollProgress, assemblyProgress,
  } = useOrbitSystem();

  // Accessibility: disable all dynamics if user prefers reduced motion
  const prefersReducedMotion = useReducedMotion();

  // Use scrollProgress and assemblyProgress for reactive updates
  const [scrollOffset, setScrollOffset] = useState(0);
  const [assemblyOffset, setAssemblyOffset] = useState(0);

  // Subscribe to scrollProgress changes to update scrollOffset reactively
  useMotionValueEvent(scrollProgress, 'change', (latest) => {
    setScrollOffset(latest);
  });

  // Subscribe to assemblyProgress for ingress animation
  useMotionValueEvent(assemblyProgress, 'change', (latest) => {
    setAssemblyOffset(latest);
  });

  // Quadrant-based stagger order (avoid visible wipe)
  // Group radials by quadrant, randomize within each quadrant
  const staggerOrder = useMemo(() => {
    const quadrants = [
      Array.from({ length: 8 }, (_, i) => i),           // Q1: 0-7
      Array.from({ length: 8 }, (_, i) => i + 8),       // Q2: 8-15
      Array.from({ length: 8 }, (_, i) => i + 16),      // Q3: 16-23
      Array.from({ length: 8 }, (_, i) => i + 24),      // Q4: 24-31
    ];

    // Shuffle within each quadrant
    const shuffled = quadrants.map(q => [...q].sort(() => Math.random() - 0.5));

    // Interleave quadrants for distributed stagger
    const order: number[] = [];
    for (let i = 0; i < 8; i++) {
      order.push(shuffled[0][i], shuffled[1][i], shuffled[2][i], shuffled[3][i]);
    }

    return order;
  }, []);

  // Calculate radial transforms based on state
  const radialTransforms = useMemo(() => {
    if (currentState === 'intro') {
      return EMBLEM_PATHS.map((_, i) => {
        const angle = (i / EMBLEM_PATHS.length) * Math.PI * 2;
        const distance = 900;
        return {
          x: Math.cos(angle) * distance,
          y: Math.sin(angle) * distance,
          scale: 0.2,
          opacity: 0,
          rotate: 180,
        };
      });
    }

    if (currentState === 'assembly') {
      // Reduced motion: skip animation, jump to assembled pose
      if (prefersReducedMotion) {
        return EMBLEM_PATHS.map(() => ({
          x: 0,
          y: 0,
          scale: 1,
          opacity: 1,
          rotate: 0,
        }));
      }

      // Radial ingress: arc inward with gravitational curves
      return EMBLEM_PATHS.map((_, i) => {
        const staggerIndex = staggerOrder.indexOf(i);
        const staggerDelay = staggerIndex * 0.012; // 12ms per radial
        const denom = Math.max(0.001, 1 - staggerDelay);
        const localProgress = Math.max(0, Math.min(1, (assemblyOffset - staggerDelay) / denom));

        // Gravitational arc: radials come from dispersed positions
        const angle = (i / EMBLEM_PATHS.length) * Math.PI * 2;
        const startDistance = 800; // Start far out

        // Apply easing to local progress
        const eased = localProgress; // Framer Motion will apply easing

        // Arc path with slight curve
        const distance = startDistance * (1 - eased);
        const curveFactor = Math.sin(eased * Math.PI) * 50; // Peak curve at midpoint

        return {
          x: Math.cos(angle) * distance + curveFactor * Math.cos(angle + Math.PI / 4),
          y: Math.sin(angle) * distance + curveFactor * Math.sin(angle + Math.PI / 4),
          scale: 0.3 + eased * 0.7, // Grow as they converge
          opacity: eased, // Fade in
          rotate: (1 - eased) * 180, // Rotate into place
        };
      });
    }
    
    if (currentState === 'data' && dataValues.length > 0) {
      // Radials represent data, animated by scroll
      return EMBLEM_PATHS.map((_, i) => {
        const value = dataValues[i % dataValues.length] || 0;
        const pulseOffset = Math.sin(scrollOffset * Math.PI * 2 + i * 0.2);
        return {
          x: 0,
          y: 0,
          scale: 0.5 + value * 0.5 + pulseOffset * 0.1,
          opacity: 0.3 + value * 0.7,
          rotate: scrollOffset * 180 * (i % 2 === 0 ? 1 : -1), // Alternating rotation
        };
      });
    }
    
    if (currentState === 'vortex') {
      // Spiral into vortex based on scroll
      return EMBLEM_PATHS.map((_, i) => {
        const angle = (i / EMBLEM_PATHS.length) * Math.PI * 2;
        const spiralRadius = 200 * (1 - scrollOffset);
        const spiralAngle = angle + scrollOffset * Math.PI * 4;
        return {
          x: Math.cos(spiralAngle) * spiralRadius,
          y: Math.sin(spiralAngle) * spiralRadius,
          scale: 1 - scrollOffset * 0.5,
          opacity: 1 - scrollOffset * 0.5,
          rotate: scrollOffset * 720, // Double rotation for vortex
        };
      });
    }
    
    // Default idle position - radials at their exact SVG positions
    // No wobble effect - perfect alignment with original emblem shape
    return EMBLEM_PATHS.map(() => ({
      x: 0,
      y: 0,
      scale: 1,
      opacity: 1,
      rotate: 0,
    }));
  }, [currentState, dataValues, scrollOffset, assemblyOffset, staggerOrder, prefersReducedMotion]);

  // Reactive transform origin
  const transformOrigin = useTransform(
    [originX, originY],
    ([ox, oy]) => `${ox}% ${oy}%`
  );

  // Convert x, y (0-100 viewport %) to pixel offsets from center
  // x=50 means centered, x=0 means left edge, x=100 means right edge
  const xOffset = useTransform(x, (val) => `${val - 50}vw`);
  const yOffset = useTransform(y, (val) => `${val - 50}vh`);

  // ============================================================================
  // HANDOFF OPACITY: SVG fades out before WebGL tunnel takes over
  // ============================================================================
  // The handoff opacity multiplies with the OrbitSystem opacity to create
  // a smooth crossfade between SVG emblem and WebGL tunnel scene.
  //
  // Timeline:
  // - Before fadeStart: handoffOpacity = 1 (fully visible)
  // - fadeStart to fadeEnd: handoffOpacity 1 -> 0 (fading out)
  // - fadeEnd to fadeInStart: handoffOpacity = 0 (hidden during tunnel)
  // - fadeInStart to fadeInEnd: handoffOpacity 0 -> 1 (fading back in)
  // - After fadeInEnd: handoffOpacity = 1 (fully visible)

  const handoffOpacity = useTransform(
    scrollProgress,
    [
      0, // Start of scroll
      SVG_EMBLEM_HANDOFF.fadeStart,
      SVG_EMBLEM_HANDOFF.fadeEnd,
      SVG_EMBLEM_HANDOFF.fadeInStart,
      SVG_EMBLEM_HANDOFF.fadeInEnd,
      1, // End of scroll
    ],
    [1, 1, 0, 0, 1, 1]
  ) as MotionValue<number>;

  // Combined opacity: OrbitSystem opacity * handoff opacity
  // This allows OrbitSystem to control normal opacity changes while
  // the handoff system can independently fade out for tunnel transition
  const combinedOpacity = useTransform(
    [opacity, handoffOpacity],
    ([systemOpacity, handoff]) => (systemOpacity as number) * (handoff as number)
  );

  return (
    <motion.div
      className={`emblem-container ${className}`}
      data-orbit-emblem-container="true"
      style={{
        position: 'fixed',
        top: '50%',
        left: '50%',
        x: xOffset,
        y: yOffset,
        translateX: '-50%',
        translateY: '-50%',
        width: size,
        height: size,
        pointerEvents: 'none',
        zIndex: 0,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <motion.svg
        viewBox={`0 0 ${EMBLEM_VIEWBOX.width} ${EMBLEM_VIEWBOX.height}`}
        width={size}
        height={size}
        data-orbit-emblem="true"
        style={{
          overflow: 'visible',
          scale,
          rotateX,
          rotateY,
          rotateZ,
          opacity: combinedOpacity,
          transformOrigin,
        }}
      >
        <g>
        {EMBLEM_PATHS.map((path, index) => {
          const transform = radialTransforms[index];

          return (
            <motion.path
              key={index}
              d={path}
              fill="currentColor"
              initial={false}
              animate={{
                x: transform.x,
                y: transform.y,
                scale: transform.scale,
                opacity: transform.opacity,
                rotate: transform.rotate,
              }}
              transition={
                prefersReducedMotion
                  ? { duration: 0 }
                  : currentState === 'assembly'
                  ? {
                      type: 'spring',
                      stiffness: 200,
                      damping: 26, // ζ ≈ 0.65 (critical damping ~40, so 26 gives slight overshoot)
                      mass: 1,
                    }
                  : currentState === 'idle'
                  ? {
                      // Avoid idle snap at the tail of the intro; short tween maintains smoothness
                      type: 'tween',
                      duration: 0.3,
                      ease: [0.33, 1, 0.68, 1],
                    }
                  : {
                      type: 'tween',
                      duration: 0.8,
                      ease: [0.25, 0.46, 0.45, 0.94],
                    }
              }
              style={{
                // Transform around emblem center, not individual path center
                transformOrigin: `${EMBLEM_VIEWBOX.center}px ${EMBLEM_VIEWBOX.center}px`,
              }}
            />
          );
        })}
        </g>
      </motion.svg>
    </motion.div>
  );
}
