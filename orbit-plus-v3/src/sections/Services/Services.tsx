/**
 * Services Section - Zoom-Through Color Inversion
 *
 * THE MECHANIC:
 * - Pages stacked: Strategy (top) → Design (middle) → Build (bottom)
 * - Each page has an anchor element colored to match the NEXT page's background
 * - Strategy's period "." is dark (matches Design's dark bg)
 * - Design's i-dot is light (matches Build's light bg)
 * 
 * TRANSITION:
 * - Page scales up with transform-origin at the anchor's center
 * - The anchor grows to fill the viewport
 * - NO OPACITY FADE - the geometry creates the seamless color transition
 * - At high scale, only the colored anchor is visible (everything else is off-screen)
 */

import {
  motion,
  useScroll,
  useTransform,
  useMotionTemplate,
  MotionValue,
} from 'framer-motion';
import { useRef, useLayoutEffect, useState, useCallback, useEffect } from 'react';
import { WaveText } from '../../components/typography/WaveText';

const SECTION_HEIGHT_VH = 480;

const SCROLL_PHASES = {
  strategy: { start: 0, end: 0.25 },
  transition1: { start: 0.25, end: 0.42 },
  design: { start: 0.42, end: 0.57 },
  transition2: { start: 0.57, end: 0.74 },
  build: { start: 0.74, end: 1.0 },
} as const;

const COLORS = {
  light: '#f5f5f5',
  dark: '#0a0a0a',
} as const;

const MASK_EDGE_BIAS_PX = 1;

// Debug mode - set to true to see transform-origin markers
const DEBUG = false;

const easeInOutCubic = (value: number) =>
  value < 0.5 ? 4 * value * value * value : 1 - Math.pow(-2 * value + 2, 3) / 2;

const STRATEGY_ZOOM_DELAY = 0.05;
const BUILD_ZOOM_DELAY = 0.04;

interface ServicePageProps {
  title: React.ReactNode;
  descriptors: string[];
  descriptorContainerClassName?: string;
  marqueeText: string;
  srText: string;
  bgColor: string;
  textColor: string;
  scale: MotionValue<number>;
  zIndex: number;
  transformOrigin: string;
  maskOrigin?: string;
  maskRadius?: number;
}

function ServicePage({
  title,
  descriptors,
  descriptorContainerClassName,
  marqueeText,
  srText,
  bgColor,
  textColor,
  scale,
  zIndex,
  transformOrigin,
  maskOrigin,
  maskRadius,
}: ServicePageProps) {
  const isLight = bgColor === COLORS.light;
  const marqueeColor = isLight ? 'rgba(10, 10, 10, 0.28)' : 'rgba(245, 245, 245, 0.28)';

  const hasMask = Boolean(maskOrigin && maskRadius);
  const maskRadiusPx = useTransform(scale, (value) => {
    if (!maskRadius) return 0;
    return Math.max(0, value * maskRadius + MASK_EDGE_BIAS_PX);
  });
  const maskImage = useMotionTemplate`radial-gradient(circle at ${maskOrigin ?? '50% 50%'}, rgba(255, 255, 255, 0) calc(${maskRadiusPx}px - 0.5px), rgba(255, 255, 255, 1) calc(${maskRadiusPx}px + 0.5px))`;

  return (
    <motion.div
      className="absolute inset-0"
      style={{
        backgroundColor: bgColor,
        color: textColor,
        zIndex,
        WebkitMaskImage: hasMask ? maskImage : undefined,
        maskImage: hasMask ? maskImage : undefined,
        WebkitMaskRepeat: hasMask ? 'no-repeat' : undefined,
        maskRepeat: hasMask ? 'no-repeat' : undefined,
        WebkitMaskSize: hasMask ? '100% 100%' : undefined,
        maskSize: hasMask ? '100% 100%' : undefined,
      }}
    >
      <motion.div
        className="absolute inset-0 will-change-transform"
        style={{
          scale,
          transformOrigin,
        }}
      >
        <div className="h-full w-full flex items-center justify-center">
          <div className="relative w-full px-6 md:px-12 lg:px-16">
            <div
              aria-hidden="true"
              className="absolute inset-x-0 top-[calc(50%+2rem)] md:top-[calc(50%+2.6rem)] lg:top-[calc(50%+3rem)] overflow-hidden pointer-events-none motion-reduce:hidden"
            >
              <div
                className="marquee-track text-[0.7rem] md:text-sm uppercase tracking-[0.35em]"
                style={{ color: marqueeColor }}
              >
                {Array.from({ length: 4 }).map((_, index) => (
                  <span key={index}>{marqueeText}</span>
                ))}
              </div>
            </div>

            <div className="relative z-10 flex h-full w-full flex-col justify-center gap-10 md:block">
              <div className="md:absolute md:left-0 md:top-1/2 md:-translate-y-1/2 md:w-[40%] lg:w-[38%]">
                <h3
                  className="display w-full text-right font-semibold leading-[0.84] tracking-[-0.04em]"
                  style={{ fontSize: 'clamp(4rem, 10.5vw, 9.5rem)' }}
                >
                  <span className="block">{title}</span>
                </h3>
              </div>
              <div
                className={`flex w-full flex-col gap-4 uppercase leading-[0.78] tracking-[0.08em] text-[clamp(4.2rem,14.5vw,10rem)] md:absolute md:top-1/2 md:-translate-y-[60%] md:left-[calc(40%+11rem)] lg:left-[calc(38%+13rem)] md:w-[68%] lg:w-[70%] md:h-[80vh] lg:h-[86vh] md:justify-evenly md:py-[4vh] lg:py-[5vh] md:text-[clamp(7rem,20vw,24rem)] ${descriptorContainerClassName ?? ''}`}
              >
                {descriptors.map((descriptor, index) => (
                  <WaveText
                    key={descriptor}
                    className="descriptor-justify block w-full whitespace-nowrap"
                    direction={index === 1 ? 'ltr' : 'rtl'}
                  >
                    {descriptor}
                  </WaveText>
                ))}
              </div>
              <span className="sr-only">{srText}</span>
            </div>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}

export function Services() {
  const sectionRef = useRef<HTMLElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  
  // Refs for anchor elements
  const periodRef = useRef<HTMLSpanElement>(null);
  const iDotRef = useRef<HTMLSpanElement>(null);
  const buildAnchorRef = useRef<HTMLSpanElement>(null);

  const [strategyOrigin, setStrategyOrigin] = useState('50% 50%');
  const [designOrigin, setDesignOrigin] = useState('50% 50%');
  const [buildOrigin, setBuildOrigin] = useState('50% 50%');
  const [strategyRadius, setStrategyRadius] = useState(6);
  const [designRadius, setDesignRadius] = useState(6);
  const [buildRadius, setBuildRadius] = useState(6);
  const [strategyMaxScale, setStrategyMaxScale] = useState(80);
  const [designMaxScale, setDesignMaxScale] = useState(80);
  const [buildMaxScale, setBuildMaxScale] = useState(80);

  const updateOrigins = useCallback(() => {
    if (!containerRef.current) return;
    const container = containerRef.current;
    const containerRect = container.getBoundingClientRect();

    const updateAnchor = (
      el: HTMLSpanElement | null,
      setOrigin: (value: string) => void,
      setRadius?: (value: number) => void,
    ): { xPercent: number; yPercent: number; centerX: number; centerY: number; radius: number } | null => {
      if (!el || containerRect.width === 0 || containerRect.height === 0) return null;
      const rect = el.getBoundingClientRect();
      const centerX = rect.left + rect.width / 2 - containerRect.left;
      const centerY = rect.top + rect.height / 2 - containerRect.top;
      const xPercent = (centerX / containerRect.width) * 100;
      const yPercent = (centerY / containerRect.height) * 100;
      setOrigin(`${xPercent.toFixed(2)}% ${yPercent.toFixed(2)}%`);
      const radius = Math.max(rect.width, rect.height) / 2;
      if (setRadius) {
        setRadius(Number.isFinite(radius) && radius > 0 ? radius : 6);
      }
      return { xPercent, yPercent, centerX, centerY, radius };
    };

    const getMaxScale = (centerX: number, centerY: number, radiusValue: number) => {
      const width = containerRect.width;
      const height = containerRect.height;
      const maxDistance = Math.max(
        Math.hypot(centerX, centerY),
        Math.hypot(width - centerX, centerY),
        Math.hypot(centerX, height - centerY),
        Math.hypot(width - centerX, height - centerY)
      );
      const safeRadius = Math.max(radiusValue, 1);
      const scale = (maxDistance / safeRadius) * 1.05;
      return Math.min(500, Math.max(60, scale));
    };

    const strategyAnchor = updateAnchor(periodRef.current, setStrategyOrigin, setStrategyRadius);
    if (strategyAnchor) {
      setStrategyMaxScale(getMaxScale(strategyAnchor.centerX, strategyAnchor.centerY, strategyAnchor.radius));
    }

    const designAnchor = updateAnchor(iDotRef.current, setDesignOrigin, setDesignRadius);
    if (designAnchor) {
      setDesignMaxScale(getMaxScale(designAnchor.centerX, designAnchor.centerY, designAnchor.radius));
    }

    const buildAnchor = updateAnchor(buildAnchorRef.current, setBuildOrigin, setBuildRadius);
    if (buildAnchor) {
      setBuildMaxScale(getMaxScale(buildAnchor.centerX, buildAnchor.centerY, buildAnchor.radius));
    }
  }, []);

  useLayoutEffect(() => {
    updateOrigins();
    window.addEventListener('resize', updateOrigins);
    const timer = setTimeout(updateOrigins, 300);
    return () => {
      window.removeEventListener('resize', updateOrigins);
      clearTimeout(timer);
    };
  }, [updateOrigins]);

  useEffect(() => {
    if (!('fonts' in document)) return;
    document.fonts.ready.then(updateOrigins).catch(() => {});
  }, [updateOrigins]);

  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ['start start', 'end end'],
  });

  // STRATEGY: scale 1 → 50, NO OPACITY CHANGE
  const strategyZoomStart = Math.min(
    SCROLL_PHASES.transition1.end,
    SCROLL_PHASES.transition1.start + STRATEGY_ZOOM_DELAY
  );
  const strategyZoomProgress = useTransform(
    scrollYProgress,
    [strategyZoomStart, SCROLL_PHASES.transition1.end],
    [0, 1]
  );
  const strategyScale = useTransform(strategyZoomProgress, (value) => {
    const eased = easeInOutCubic(value);
    return 1 + (strategyMaxScale - 1) * eased;
  });

  // DESIGN: scale 1 → 50, NO OPACITY CHANGE
  const designZoomProgress = useTransform(
    scrollYProgress,
    [SCROLL_PHASES.transition2.start, SCROLL_PHASES.transition2.end],
    [0, 1]
  );
  const designScale = useTransform(designZoomProgress, (value) => {
    const eased = easeInOutCubic(value);
    return 1 + (designMaxScale - 1) * eased;
  });

  const buildZoomStart = Math.min(
    SCROLL_PHASES.build.end,
    SCROLL_PHASES.build.start + BUILD_ZOOM_DELAY
  );
  const buildZoomProgress = useTransform(
    scrollYProgress,
    [buildZoomStart, SCROLL_PHASES.build.end],
    [0, 1]
  );
  const buildScale = useTransform(buildZoomProgress, (value) => {
    const eased = easeInOutCubic(value);
    return 1 + (buildMaxScale - 1) * eased;
  });

  // --- TITLES ---

  // Strategy: "Strategy." - the period is DARK (matches Design's background)
  const strategyTitle = (
    <span className="relative inline-block">
      <span className="block">Strategy</span>
      <span
        ref={periodRef}
        className="absolute"
        style={{
          width: '0.16em',
          height: '0.16em',
          borderRadius: '999px',
          backgroundColor: COLORS.dark,
          left: '100%',
          marginLeft: '0.05em',
          bottom: '0.12em',
        }}
      />
    </span>
  );

  // Design: "Design" with a light dot OVER the i's dot
  // The dot is positioned absolutely to cover the original i-dot
  const designTitle = (
    <span className="relative">
      Des
      <span className="relative inline-block">
        {/* The letter i */}
        <span
          className="inline-block"
          style={{
            WebkitClipPath: 'inset(45% 0 0 0)',
            clipPath: 'inset(45% 0 0 0)',
          }}
        >
          i
        </span>
        {/* Light overlay dot - positioned over the tittle of the i */}
        <span
          ref={iDotRef}
          className="absolute rounded-full"
          style={{
            backgroundColor: COLORS.light,
            // Position: centered horizontally over the i, at the top where the dot is
            width: '0.16em',
            height: '0.16em',
            left: '50%',
            top: '0.02em',
            transform: 'translateX(-50%)',
          }}
        />
      </span>
      gn
    </span>
  );

  const buildTitle = (
    <span className="relative inline-flex items-end">
      Eng
      <span className="relative inline-block">
        <span
          className="inline-block"
          style={{
            WebkitClipPath: 'inset(45% 0 0 0)',
            clipPath: 'inset(45% 0 0 0)',
          }}
        >
          i
        </span>
        <span
          ref={buildAnchorRef}
          className="absolute rounded-full"
          style={{
            backgroundColor: COLORS.dark,
            width: '0.16em',
            height: '0.16em',
            left: '50%',
            top: '0.02em',
            transform: 'translateX(-50%)',
          }}
        />
      </span>
      neer
    </span>
  );

  const strategyDescriptors = ['PLAN', 'PATH', 'GOAL'];
  const designDescriptors = ['SYSTEM', 'RHYTHM', 'MOTION'];
  const buildDescriptors = ['SPEED', 'FLUID', 'SCALE'];

  return (
    <section
      id="services"
      ref={sectionRef}
      className="relative w-full"
      style={{ height: `${SECTION_HEIGHT_VH}vh`, zIndex: 55 }}
    >
      <div
        ref={containerRef}
        className="sticky top-0 h-screen w-full overflow-hidden"
      >
        {/* Debug markers showing transform-origin positions */}
        {DEBUG && (
          <>
            <div
              className="absolute w-4 h-4 bg-red-500 rounded-full z-50 pointer-events-none"
              style={{
                left: strategyOrigin.split(' ')[0],
                top: strategyOrigin.split(' ')[1],
                transform: 'translate(-50%, -50%)',
              }}
            />
            <div
              className="absolute w-4 h-4 bg-blue-500 rounded-full z-50 pointer-events-none"
              style={{
                left: designOrigin.split(' ')[0],
                top: designOrigin.split(' ')[1],
                transform: 'translate(-50%, -50%)',
              }}
            />
            <div
              className="absolute w-4 h-4 bg-green-500 rounded-full z-50 pointer-events-none"
              style={{
                left: buildOrigin.split(' ')[0],
                top: buildOrigin.split(' ')[1],
                transform: 'translate(-50%, -50%)',
              }}
            />
          </>
        )}

        {/* BUILD - z-1 (bottom) */}
        <ServicePage
          title={buildTitle}
          descriptors={buildDescriptors}
          marqueeText="SHIP IT THEN SCALE IT • SHIP IT THEN SCALE IT •"
          srText="Code with intent. Fast, accessible, and built to evolve without losing the original feeling. Clean, modern code that loads fast. Accessible to everyone, on every device. Easy updates without calling a developer."
          bgColor={COLORS.light}
          textColor={COLORS.dark}
          scale={buildScale}
          zIndex={1}
          transformOrigin={buildOrigin}
          maskOrigin={buildOrigin}
          maskRadius={buildRadius}
        />

        {/* DESIGN - z-2 (middle) */}
        <ServicePage
          title={designTitle}
          descriptors={designDescriptors}
          marqueeText="FORM FOLLOWS FEELING • FORM FOLLOWS FEELING •"
          srText="A visual system that feels inevitable. Typography, motion, and layout work as one continuous sentence. A visual identity unmistakably yours. Motion that guides, never distracts. A system that scales without breaking."
          bgColor={COLORS.dark}
          textColor={COLORS.light}
          scale={designScale}
          zIndex={2}
          transformOrigin={designOrigin}
          maskOrigin={designOrigin}
          maskRadius={designRadius}
        />

        {/* STRATEGY - z-3 (top) */}
        <ServicePage
          title={strategyTitle}
          descriptors={strategyDescriptors}
          marqueeText="KNOW BEFORE YOU MAKE • KNOW BEFORE YOU MAKE •"
          srText="Clarity before craft. We map the narrative, the market, and the decision path so every design choice has a job. Define who you're speaking to and why they'll listen. Structure content so your message lands first. Plan launches that build momentum, not stall."
          bgColor={COLORS.light}
          textColor={COLORS.dark}
          scale={strategyScale}
          zIndex={3}
          transformOrigin={strategyOrigin}
          maskOrigin={strategyOrigin}
          maskRadius={strategyRadius}
        />
      </div>
    </section>
  );
}

export default Services;
