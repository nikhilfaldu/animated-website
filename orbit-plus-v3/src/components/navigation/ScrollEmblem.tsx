import { motion } from 'framer-motion';
import { useMemo, useRef, useEffect } from 'react';
import { useReducedMotion } from '@/hooks/useReducedMotion';
import { EMBLEM_PATHS } from '@/assets/emblemPaths';
import {
  ANIMATED_RADIALS_COUNT,
  CYL_ITEM_COUNT,
  CYL_RADIUS,
  MORPH_DURATION_MS,
  RADIAL_GROW_SCALE,
  RADIAL_STAGGER_MS,
  NAV_MORPH_V2,
} from './nav/constants';
import type { NavMode } from './nav/types';

interface ScrollEmblemProps {
  size?: number;
  className?: string;
  litRadials?: number; // How many radials are "lit up" (0-32)
  mode?: NavMode; // Navigation mode for morph animation
  activeIndex?: number;
  phase?: 'idle' | 'morphing' | 'persist' | 'fading' | 'complete';
}

const TOTAL_RADIALS = EMBLEM_PATHS.length;
const animatedRadialIndices = Array.from({ length: TOTAL_RADIALS }, (_, index) => index)
  .filter(index => index % 2 === 0)
  .slice(0, ANIMATED_RADIALS_COUNT);
const animatedRadialIndexSet = new Set(animatedRadialIndices);
const animatedRadialOrder = animatedRadialIndices.reduce<Map<number, number>>((map, index, order) => {
  map.set(index, order);
  return map;
}, new Map<number, number>());

if (process.env.NODE_ENV !== 'production') {
  if (animatedRadialIndices.length !== ANIMATED_RADIALS_COUNT) {
    throw new Error(
      `Expected ${ANIMATED_RADIALS_COUNT} animated radials but computed ${animatedRadialIndices.length}.`
    );
  }
}

const baseEase: [number, number, number, number] = [0.33, 1, 0.68, 1];

export function ScrollEmblem({
  size = 60,
  className = '',
  litRadials = 0,
  mode = 'compact',
  activeIndex = 0,
  phase = 'idle',
}: ScrollEmblemProps) {
  const prefersReducedMotion = useReducedMotion();

  if (!NAV_MORPH_V2) {
    return (
      <LegacyScrollEmblem
        size={size}
        className={className}
        litRadials={litRadials}
        mode={mode}
        prefersReducedMotion={prefersReducedMotion}
      />
    );
  }

  return (
    <MorphingScrollEmblem
      size={size}
      className={className}
      litRadials={litRadials}
      mode={mode}
      activeIndex={activeIndex}
      phase={phase}
      prefersReducedMotion={prefersReducedMotion}
    />
  );
}

interface LegacyScrollEmblemProps {
  size: number;
  className: string;
  litRadials: number;
  mode: NavMode;
  prefersReducedMotion: boolean;
}

function LegacyScrollEmblem({
  size,
  className,
  litRadials,
  mode,
  prefersReducedMotion,
}: LegacyScrollEmblemProps) {
  const isCylinder = mode !== 'compact' && !prefersReducedMotion;
  const transition = {
    duration: prefersReducedMotion ? 0 : 0.3,
    ease: baseEase,
  };

  const fadeTransition = {
    duration: prefersReducedMotion ? 0 : 0.08,
    delay: prefersReducedMotion ? 0 : 0.18,
    ease: baseEase,
  };

  return (
    <svg
      viewBox="0 0 588 588"
      width={size}
      height={size}
      className={className}
      style={{ overflow: 'visible' }}
    >
      <g transform="translate(294, 294)">
        {EMBLEM_PATHS.map((path, index) => {
          const isLit = index < litRadials;
          const angle = (index / TOTAL_RADIALS) * 360;

          return (
            <motion.path
              key={index}
              d={path}
              fill="currentColor"
              initial={false}
              animate={{
                opacity: isLit ? (isCylinder ? 0 : 1) : 0.2,
                rotateX: isCylinder ? angle : 0,
                translateZ: isCylinder ? CYL_RADIUS : 0,
              }}
              transition={{
                rotateX: transition,
                translateZ: transition,
                opacity: isLit ? fadeTransition : transition,
              }}
              style={{
                transformOrigin: 'center',
              }}
            />
          );
        })}
      </g>
    </svg>
  );
}

interface MorphingScrollEmblemProps {
  size: number;
  className: string;
  litRadials: number;
  mode: NavMode;
  activeIndex: number;
  phase: 'idle' | 'morphing' | 'persist' | 'fading' | 'complete';
  prefersReducedMotion: boolean;
}

function MorphingScrollEmblem({
  size,
  className,
  litRadials,
  mode,
  activeIndex,
  phase,
  prefersReducedMotion,
}: MorphingScrollEmblemProps) {
  const isCylinderMode = mode !== 'compact' && !prefersReducedMotion;
  const transformDuration = prefersReducedMotion ? 0 : MORPH_DURATION_MS / 1000;
  const cylinderRotation = -activeIndex * (360 / CYL_ITEM_COUNT);
  const isFadeOutPhase = phase === 'fading' || phase === 'complete' || mode === 'pinned';
  const inMorphSequence =
    mode === 'navigating' || phase === 'morphing' || phase === 'persist';

  const wasCylinderModeRef = useRef(isCylinderMode);
  useEffect(() => {
    wasCylinderModeRef.current = isCylinderMode;
  }, [isCylinderMode]);
  const isDisassembling = !isCylinderMode && wasCylinderModeRef.current;

  const transforms = useMemo(() => {
    const theta = 360 / CYL_ITEM_COUNT;
    const underlineScaleY = 0.14; // compress to an underline bar
    const growScale = Math.min(RADIAL_GROW_SCALE, 1.6); // avoid protruding too far
    const usedLanes = new Set<number>();
    return EMBLEM_PATHS.map((_, index) => {
      const isAnimatedRadial = animatedRadialIndexSet.has(index);
      if (!isAnimatedRadial || (!isCylinderMode && !isDisassembling)) {
        return {
          cssTransform: 'rotateX(0deg) translateZ(0px) scale(1)',
          delay: 0,
          isPrimary: false,
        };
      }

      const order = animatedRadialOrder.get(index) ?? 0;
      if (!isCylinderMode) {
        const reverseOrder = Math.max(0, ANIMATED_RADIALS_COUNT - 1 - order);
        return {
          cssTransform: 'rotateX(0deg) translateZ(0px) scale(1)',
          delay: (reverseOrder * RADIAL_STAGGER_MS) / 1000,
          isPrimary: false,
        };
      }
      // Map radial to a dial lane based on its native index; ensure one primary per lane
      const laneFromIndex = Math.round((index / TOTAL_RADIALS) * CYL_ITEM_COUNT) % CYL_ITEM_COUNT;
      const lane = usedLanes.has(laneFromIndex) ? (order % CYL_ITEM_COUNT) : laneFromIndex;
      const isPrimary = !usedLanes.has(lane);
      usedLanes.add(lane);
      const angle = (lane + 0.5) * theta;

      return {
        cssTransform: `rotateX(${angle}deg) translateZ(${CYL_RADIUS}px) ${isPrimary ? '' : `scaleX(1) scaleY(${underlineScaleY}) scale(${growScale})`}`,
        delay: (order * RADIAL_STAGGER_MS) / 1000,
        isPrimary,
      };
    });
  }, [isCylinderMode, isDisassembling]);

  return (
    <div
      className={className}
      style={{
        width: size,
        height: size,
        position: 'relative',
        overflow: 'visible',
        transformStyle: 'preserve-3d',
      }}
    >
      <motion.div
        style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          width: '100%',
          height: '100%',
          transformStyle: 'preserve-3d',
          transformOrigin: '50% 50% 0px',
        }}
        animate={{ rotateX: isCylinderMode ? cylinderRotation : 0 }}
        transition={{
          duration: prefersReducedMotion ? 0 : 0.45,
          ease: baseEase,
        }}
      >
        {EMBLEM_PATHS.map((path, index) => {
          const t = transforms[index];
          const isLit = index < litRadials;
          const isAnimatedRadial = animatedRadialIndexSet.has(index);

          // Opacity policy: hide non-animated radials ONLY during morph/persist
          let targetOpacity: number;
          if (isFadeOutPhase) {
            targetOpacity = 0;
          } else if (inMorphSequence) {
            targetOpacity = isAnimatedRadial && t.isPrimary ? 1 : 0;
          } else if (mode === 'compact') {
            targetOpacity = isLit ? 1 : 0.2;
          } else if (mode === 'preview') {
            targetOpacity = 1.0;
          } else {
            targetOpacity = isLit ? 1 : 0.2;
          }

          const combinedTransform = `translate(-50%, -50%) ${t.cssTransform}`;

          return (
            <motion.div
              key={index}
              style={{
                position: 'absolute',
                top: '50%',
                left: '50%',
                width: size,
                height: size,
                transformOrigin: '50% 50% 0px',
                willChange: (isCylinderMode || isDisassembling) && isAnimatedRadial ? 'transform' : undefined,
              }}
              initial={false}
              animate={{
                opacity: targetOpacity,
                transform: combinedTransform,
              }}
              transition={{
                transform: {
                  duration: transformDuration,
                  ease: baseEase,
                  delay: t.delay,
                },
                opacity: prefersReducedMotion ? { duration: 0 } : undefined,
              }}
            >
              {t.isPrimary ? (
                <div
                  style={{
                    position: 'absolute',
                    top: '50%',
                    left: '50%',
                    width: '70%',
                    height: 2,
                    background: 'currentColor',
                    borderRadius: 9999,
                    transform: 'translate(-50%, -50%)',
                    pointerEvents: 'none',
                  }}
                />
              ) : (
                <svg
                  viewBox="0 0 588 588"
                  width={size}
                  height={size}
                  style={{ overflow: 'visible' }}
                >
                  <path d={path} fill="currentColor" />
                </svg>
              )}
            </motion.div>
          );
        })}
      </motion.div>
    </div>
  );
}
