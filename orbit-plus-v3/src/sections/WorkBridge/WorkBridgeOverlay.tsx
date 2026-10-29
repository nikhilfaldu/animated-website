import { type MotionValue, motion, useReducedMotion, useTransform } from 'framer-motion';
import { useEffect, useMemo, useState } from 'react';
import { useBridgeProgress } from './useBridgeProgress';
import type { Rect, ProjectPreview } from './bridgeTypes';

type Props = {
  globalProgress: MotionValue<number>;
  projects: ProjectPreview[]; // first 4 in grid order
  rects: Record<string, Rect>;
  rectsReady: boolean;
};

const MORPH_STAGGER = 0.12;

function clamp01(n: number) {
  return Math.max(0, Math.min(1, n));
}

function lerp(a: number, b: number, t: number) {
  return a + (b - a) * t;
}

function easeInOut(t: number) {
  return t * t * (3 - 2 * t);
}

function getClickCrossfade(phase: number, index: number, count: number) {
  if (phase <= 0) return index === 0 ? 1 : 0;
  if (phase >= count - 1) return index === count - 1 ? 1 : 0;

  const base = Math.floor(phase);
  const frac = phase - base;
  const eased = easeInOut(frac);

  if (index === base) return 1 - eased;
  if (index === base + 1) return eased;
  return 0;
}

type BridgeWindowProps = {
  logoUrl: string;
  previewImageUrl: string;
  previewFocalPoint?: string;
  startRect: Rect;
  endRect: Rect;
  clickPhase: MotionValue<number>;
  morph: MotionValue<number>;
  index: number;
  total: number;
};

function BridgeWindow({
  logoUrl,
  previewImageUrl,
  previewFocalPoint,
  startRect,
  endRect,
  clickPhase,
  morph,
  index,
  total,
}: BridgeWindowProps) {
  const localMorph = useTransform(morph, (t) => {
    const totalStagger = MORPH_STAGGER * (total - 1);
    const available = Math.max(0.001, 1 - totalStagger);
    const start = index * MORPH_STAGGER;
    return clamp01((t - start) / available);
  });

  const x = useTransform(localMorph, (t) => lerp(startRect.x, endRect.x, t));
  const y = useTransform(localMorph, (t) => lerp(startRect.y, endRect.y, t));
  const w = useTransform(localMorph, (t) => lerp(startRect.w, endRect.w, t));
  const h = useTransform(localMorph, (t) => lerp(startRect.h, endRect.h, t));
  const r = useTransform(localMorph, (t) => lerp(startRect.r, endRect.r ?? startRect.r, t));

  const clickAlpha = useTransform(clickPhase, (phase) =>
    getClickCrossfade(phase as number, index, total)
  );
  const morphAlpha = useTransform(localMorph, [0, 0.12], [0, 1]);

  const windowAlpha = useTransform([clickAlpha, morphAlpha], ([click, lm]) =>
    Math.max(click as number, lm as number)
  );

  const windowScale = useTransform([clickAlpha, localMorph], ([click, lm]) => {
    if ((lm as number) > 0) return 1;
    return 0.94 + (click as number) * 0.06;
  });

  const logoBase = useTransform(localMorph, [0, 0.3, 0.65], [1, 1, 0]);
  const logoOpacity = useTransform([logoBase, clickAlpha, localMorph], ([base, click, lm]) =>
    (lm as number) > 0 ? (base as number) : (base as number) * (click as number)
  );

  const previewOpacity = useTransform(localMorph, [0.08, 0.45, 1], [0, 0.55, 1]);
  const previewBlur = useTransform(localMorph, [0, 0.4, 1], [8, 4, 0]);
  const previewFilter = useTransform(previewBlur, (value) => `blur(${value}px)`);

  return (
    <motion.div
      aria-hidden="true"
      className="absolute left-0 top-0 overflow-hidden bg-black"
      style={{
        x,
        y,
        width: w,
        height: h,
        borderRadius: r,
        opacity: windowAlpha,
        scale: windowScale,
        transformOrigin: 'center',
      }}
    >
      <motion.img
        alt=""
        src={previewImageUrl}
        className="absolute inset-0 h-full w-full object-cover"
        style={{
          opacity: previewOpacity,
          filter: previewFilter,
          objectPosition: previewFocalPoint ?? '50% 50%',
        }}
      />

      <motion.div
        className="absolute inset-0 flex items-center justify-center p-[12%]"
        style={{ opacity: logoOpacity }}
      >
        <img
          alt=""
          src={logoUrl}
          className="h-full w-full object-contain"
          decoding="async"
        />
      </motion.div>
    </motion.div>
  );
}

/**
 * WorkBridgeOverlay creates a visual transition from Reveal's aperture
 * to Work's project cards using 4 animated "exposure windows".
 */
export function WorkBridgeOverlay({ globalProgress, projects, rects, rectsReady }: Props) {
  const prefersReducedMotion = useReducedMotion();
  const { sequence, morph, opacity } = useBridgeProgress(globalProgress);

  const [viewport, setViewport] = useState(() => ({
    width: typeof window !== 'undefined' ? window.innerWidth : 1920,
    height: typeof window !== 'undefined' ? window.innerHeight : 1080,
  }));

  const startRects = useMemo(() => {
    const vw = viewport.width;
    const vh = viewport.height;
    const vmin = Math.min(vw, vh);

    const size = vmin < 640 ? 180 : 240;
    const r = Math.round(size * 0.16);

    const cx = vw / 2 - size / 2;
    const cy = vh / 2 - size / 2;

    return new Array(4).fill(0).map(() => ({
      x: cx,
      y: cy,
      w: size,
      h: size,
      r,
    }));
  }, [viewport.height, viewport.width]);

  const count = Math.min(4, projects.length);
  const clickPhase = useTransform(
    sequence,
    (t) => t * Math.max(1, count - 1)
  );

  useEffect(() => {
    const handleResize = () => {
      setViewport({ width: window.innerWidth, height: window.innerHeight });
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  if (prefersReducedMotion) return null;
  if (!projects || projects.length < 4) return null;

  return (
    <motion.div
      aria-hidden="true"
      className="fixed inset-0 pointer-events-none"
      style={{ zIndex: 56, opacity }}
    >
      <div className="absolute inset-0 bg-black/95" />

      {projects.slice(0, 4).map((project, index) => {
        const end = rects[project.id];
        const endRect = rectsReady && end ? end : startRects[index];

        return (
          <BridgeWindow
            key={project.id}
            logoUrl={project.logoUrl}
            previewImageUrl={project.previewImageUrl}
            previewFocalPoint={project.previewFocalPoint}
            startRect={startRects[index]}
            endRect={endRect}
            clickPhase={clickPhase}
            morph={morph}
            index={index}
            total={count}
          />
        );
      })}

      <div className="absolute inset-0 bg-white/[0.03]" />
    </motion.div>
  );
}
