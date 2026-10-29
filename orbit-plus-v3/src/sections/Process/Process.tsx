/**
 * Process Section
 *
 * The emblem at work. Brand in motion.
 *
 * - Morphing emblem as full background (breathes and twists)
 * - Content panels fade in/out on top (AnimatePresence)
 * - Progress circle indicator
 *
 * Replaces the old gear/cutout system with a unified emblem animation.
 */

import { useRef, useState, useEffect } from 'react';
import {
  motion,
  useScroll,
  useTransform,
  useMotionValueEvent,
  useReducedMotion,
  AnimatePresence,
  type MotionValue,
} from 'framer-motion';
import { useOrbitSystem } from '@/context/OrbitSystem';
import { useIsMobile } from '@/hooks/useResponsive';
import { DESKTOP_TARGETS, MOBILE_SIZES } from '@/config/mobileTargets';

// --- DATA ---
const STEPS: [string, string][] = [
  ['Discover', 'Define the problem, the audience, and the core constraints. We listen first.'],
  ['Define', 'Establish the narrative spine, information architecture, and the metrics for success.'],
  ['Design', 'Create a coherent visual system—type, motion, and identity—that is unmistakably yours.'],
  ['Develop', 'Build a performant, accessible, component-based site ready for the future.'],
  ['Launch', 'Final QA, analytics integration, and a plan for continuous refinement and growth.'],
];

const NUM_STEPS = STEPS.length;
const SECTION_OVERLAP_VH = 160;
const SECTION_HEIGHT_VH = NUM_STEPS * 100 + SECTION_OVERLAP_VH;
const PROCESS_ANIMATION_DELAY = 0.08;

// Emblem path data (32 radials)
const EMBLEM_PATHS = [
  'm366.51,176.77c-6.61.55-13.06,1.63-19.3,3.26L312.11,0c6.85.41,13.66,1.05,20.33,1.94l34.07,174.83Z',
  'm343.39,181.08c-6.36,1.82-12.46,4.21-18.31,7.05L248.42,2.91c6.64-1.03,13.37-1.83,20.18-2.38l74.79,180.55Z',
  'm322.48,189.43c-5.85,3.04-11.38,6.52-16.58,10.4L186.93,19.53c6.24-2.47,12.6-4.72,19.05-6.73l116.51,176.63Z',
  'm302.29,202.7c-5.08,4.11-9.79,8.67-14.08,13.57L124.48,53.15c5.45-3.86,11.01-7.52,16.72-11l161.1,160.55Z',
  'm87.13,84.51l199.05,134.13c-4.18,5.01-7.95,10.36-11.25,16.02L73.5,98.92c4.34-4.98,8.91-9.79,13.63-14.41',
  'm41.55,142.66l231.27,95.83c-3.07,5.72-5.66,11.72-7.75,17.97L31.96,159.89c2.99-5.86,6.17-11.6,9.58-17.23',
  'm12.6,207.99l251.46,51.57c-1.86,6.19-3.26,12.58-4.09,19.15L7.54,226.94c1.46-6.42,3.14-12.7,5.06-18.95',
  'm259.46,283.57c-.3,3.39-.44,6.84-.43,10.32,0,3.11.12,6.19.38,9.24L.22,303.6c-.15-3.25-.21-6.5-.22-9.78,0-3.31.05-6.56.18-9.78l259.28-.46Z',
  'm263.44,325.66L11.46,374.71c-1.82-6.24-3.41-12.58-4.79-19.02l253.03-49.25c.72,6.59,1.97,13,3.74,19.22',
  'm272.33,347.98l-230.98,95.66c-3.38-5.62-6.55-11.38-9.5-17.23l232.9-96.45c2.02,6.27,4.57,12.29,7.58,18.02',
  'm273.89,350.86c3.2,5.73,6.86,11.15,10.97,16.24l-200.47,132.25c-4.67-4.69-9.15-9.57-13.42-14.57l202.92-133.92Z',
  'm301.99,384.49l-159.9,160.47c-5.72-3.44-11.29-7.1-16.76-10.94l162.61-163.19c4.3,4.91,9.01,9.48,14.05,13.66',
  'm320.93,397.12l-118.31,175.55c-6.42-2.08-12.76-4.39-18.96-6.92l120.85-179.32c5.15,4,10.62,7.59,16.42,10.69',
  'm342.97,406.15l-74.51,179.88c-6.81-.55-13.54-1.36-20.19-2.42l76.46-184.55c5.83,2.87,11.91,5.27,18.25,7.09',
  'm365.14,410.5l-35.76,174.5h-.03c-6.73.83-13.48,1.44-20.32,1.76l36.83-179.76c6.22,1.69,12.67,2.86,19.29,3.5',
  'm389.2,410.31l.29,160.9c-6.42,2.24-12.97,4.24-19.58,6l-.29-166.38c2.29.14,4.61.19,6.96.19,4.27,0,8.48-.24,12.64-.7',
  'm438.98,548.87c-5.9,3.4-11.97,6.55-18.11,9.5l-28.9-148.38c6.55-.89,12.97-2.32,19.13-4.22l27.88,143.09Z',
  'm483,518.2c-5.19,4.36-10.5,8.56-15.98,12.55l-52.27-126.17c6.22-2.16,12.2-4.83,17.91-7.95l50.34,121.57Z',
  'm517.12,484.36c-4.38,5.12-8.95,10.08-13.66,14.89l-68.52-103.89c5.67-3.26,11.04-7,16.07-11.14l66.11,100.14Z',
  'm545.52,445.06c-3.44,5.72-7.08,11.32-10.88,16.76l-80.55-80.23c4.91-4.34,9.45-9.07,13.54-14.16l77.89,77.64Z',
  'm565.07,406.61c-2.53,6.11-5.29,12.14-8.28,18.02l-87.69-59.1c4.01-5.12,7.59-10.62,10.69-16.39l85.29,57.47Z',
  'm578.85,365.25c-1.6,6.39-3.43,12.70-5.48,18.95l-92.01-38.11c2.93-5.8,5.35-11.89,7.26-18.19l90.23,37.36Z',
  'm585.96,325.52c-.69,6.56-1.62,13.04-2.77,19.43l-93.92-19.26c1.77-6.19,3.03-12.62,3.75-19.2l92.94,19.03Z',
  'm587.72,292.77c0,3.28-.02,6.53-.18,9.78l-94.18.17c.25-3.05.36-6.14.35-9.24,0-3.48-.15-6.93-.47-10.32l94.26-.17c.18,3.22.21,6.48.22,9.78',
  'm586.16,262.78l-93.12,18.15c-.72-6.59-1.97-13-3.77-19.22l94.23-18.35c1.11,6.42,1.97,12.89,2.66,19.42',
  'm578.77,221.06l-90.43,37.48c-1.96-6.3-4.46-12.35-7.41-18.14l92.38-38.25c2.05,6.22,3.87,12.52,5.46,18.9',
  'm565.8,181.73l-85.93,56.67c-3.09-5.79-6.63-11.27-10.63-16.41l88.39-58.31c2.95,5.93,5.67,11.92,8.17,18.05',
  'm544.98,140.61l-78.12,78.4c-4.14-5.02-8.73-9.71-13.68-14l80.83-81.09c3.85,5.42,7.51,10.98,10.97,16.69',
  'm518.54,103.9l-67.14,99.58c-5.01-4.18-10.36-7.93-16.05-11.22l69.65-103.32c4.73,4.83,9.23,9.82,13.54,14.96',
  'm482.91,68.31l-50.64,122.2c-5.69-3.07-11.66-5.72-17.88-7.86l52.53-126.86c5.49,3.98,10.81,8.15,15.99,12.52',
  'm441.27,39.04l-29.26,142.85c-6.14-1.97-12.53-3.45-19.09-4.38l30.36-148.11c6.11,2.98,12.14,6.2,18,9.64',
  'm388.5,15.02l.29,162c-4.16-.44-8.37-.66-12.64-.65-2.35,0-4.67.06-6.96.21l-.3-167.48c6.62,1.74,13.18,3.71,19.6,5.93',
];

// --- COMPONENTS ---

/**
 * MorphingEmblem
 * The emblem breathes and twists as you scroll through Process.
 * Radials expand outward while the whole form counter-rotates.
 */
function MorphingEmblem({
  scrollYProgress,
  sizePx,
}: {
  scrollYProgress: MotionValue<number>;
  sizePx: number;
}) {
  // Breathing: expand at midpoint, contract at start/end
  const breathRadius = useTransform(scrollYProgress, [0.05, 0.5, 0.95], [0, 200, 0]);
  // Counter-rotation creates the twist
  const rotation = useTransform(scrollYProgress, [0, 1], [0, -360]);
  // Visible but not competing with text
  const emblemOpacity = useTransform(scrollYProgress, [0, 0.1, 0.9, 1], [0.15, 0.25, 0.25, 0.15]);

  return (
    <motion.div
      style={{
        position: 'absolute',
        inset: 0,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        rotate: rotation,
        opacity: emblemOpacity,
        pointerEvents: 'none',
      }}
      aria-hidden="true"
    >
      <svg
        viewBox="0 0 588 587"
        style={{ width: `${sizePx}px`, height: `${sizePx}px`, overflow: 'visible' }}
      >
        {EMBLEM_PATHS.map((d, i) => (
          <MorphingEmblemPath
            key={i}
            d={d}
            index={i}
            total={EMBLEM_PATHS.length}
            breathRadius={breathRadius}
          />
        ))}
      </svg>
    </motion.div>
  );
}

function MorphingEmblemPath({
  d,
  index,
  total,
  breathRadius,
}: {
  d: string;
  index: number;
  total: number;
  breathRadius: MotionValue<number>;
}) {
  const angle = (index / total) * Math.PI * 2;
  const x = useTransform(breathRadius, (r) => Math.cos(angle) * r);
  const y = useTransform(breathRadius, (r) => Math.sin(angle) * r);
  const pathOpacity = useTransform(breathRadius, [0, 100, 200], [1, 0.8, 0.6]);

  return (
    <motion.path
      d={d}
      fill="rgb(var(--fg))"
      style={{ x, y, opacity: pathOpacity }}
    />
  );
}

function StaticEmblem({ sizePx }: { sizePx: number }) {
  return (
    <div
      style={{
        position: 'absolute',
        inset: 0,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        opacity: 0.2,
        pointerEvents: 'none',
      }}
      aria-hidden="true"
    >
      <svg
        viewBox="0 0 588 587"
        style={{ width: `${sizePx}px`, height: `${sizePx}px`, overflow: 'visible' }}
      >
        {EMBLEM_PATHS.map((d, i) => (
          <path key={i} d={d} fill="rgb(var(--fg))" />
        ))}
      </svg>
    </div>
  );
}

/**
 * ProcessPanel
 * Individual step content with fade/slide animation.
 */
function ProcessPanel({
  stepIndex,
  title,
  copy,
}: {
  stepIndex: number;
  title: string;
  copy: string;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.4, ease: [0.25, 0.46, 0.45, 0.94] }}
      style={{
        position: 'absolute',
        inset: 0,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <div
        style={{
          textAlign: 'center',
          maxWidth: '700px',
          padding: '0 5vw',
          color: 'rgb(var(--fg))',
        }}
      >
        <div className="text-xs uppercase tracking-[0.3em] opacity-60" style={{ marginBottom: '1rem' }}>
          Step {String(stepIndex + 1).padStart(2, '0')}
        </div>
        <h2 className="h1 display" style={{ marginBottom: '1.5rem' }}>
          {title}
        </h2>
        <p className="p" style={{ opacity: 0.8, maxWidth: '560px', margin: '0 auto' }}>
          {copy}
        </p>
      </div>
    </motion.div>
  );
}

/**
 * ProgressCircle
 * Visual indicator of scroll progress through Process.
 */
function ProgressCircle({
  scrollYProgress,
  activeStep,
}: {
  scrollYProgress: MotionValue<number>;
  activeStep: number;
}) {
  const radius = 30;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = useTransform(
    scrollYProgress,
    [0, 1],
    [circumference, 0]
  );

  return (
    <div
      style={{
        position: 'absolute',
        bottom: '3rem',
        right: '3rem',
        width: '80px',
        height: '80px',
        zIndex: 100,
      }}
    >
      <svg
        width="80"
        height="80"
        viewBox="0 0 80 80"
        style={{ transform: 'rotate(-90deg)' }}
      >
        {/* Track */}
        <circle
          cx="40"
          cy="40"
          r={radius}
          fill="none"
          stroke="currentColor"
          strokeWidth="1"
          style={{ opacity: 0.2 }}
        />
        {/* Progress */}
        <motion.circle
          cx="40"
          cy="40"
          r={radius}
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeDasharray={circumference}
          style={{ strokeDashoffset }}
        />
      </svg>
      {/* Step number */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '1.5rem',
          fontWeight: 'bold',
          color: 'currentColor',
        }}
      >
        {activeStep + 1}
      </div>
    </div>
  );
}

// --- MAIN COMPONENT ---

export function Process() {
  const sectionRef = useRef<HTMLElement>(null);
  const shouldReduceMotion = useReducedMotion();
  const { opacity: mainEmblemOpacity } = useOrbitSystem();
  const isMobile = useIsMobile();
  const emblemSize = isMobile ? MOBILE_SIZES.emblem : DESKTOP_TARGETS.sizes.emblem;

  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ['start start', 'end end'],
  });
  const delayedProgress = useTransform(scrollYProgress, (value) => {
    if (value <= PROCESS_ANIMATION_DELAY) return 0;
    return (value - PROCESS_ANIMATION_DELAY) / (1 - PROCESS_ANIMATION_DELAY);
  });

  // Track active step for panel switching
  const [activeStep, setActiveStep] = useState(0);

  useMotionValueEvent(delayedProgress, 'change', (progress) => {
    const newStep = Math.min(NUM_STEPS - 1, Math.floor(progress * NUM_STEPS));
    if (newStep !== activeStep) {
      setActiveStep(newStep);
    }
  });

  // Hide main emblem while in Process section
  useEffect(() => {
    const unsubscribe = scrollYProgress.on('change', (p) => {
      // Fade out main emblem when entering, restore when leaving
      if (p > 0.01 && p < 0.99) {
        mainEmblemOpacity.set(0);
      } else {
        mainEmblemOpacity.set(0.08); // Return to idle opacity
      }
    });

    return () => {
      unsubscribe();
      mainEmblemOpacity.set(0.08);
    };
  }, [scrollYProgress, mainEmblemOpacity]);

  // Reduced motion fallback
  if (shouldReduceMotion) {
    return (
      <section id="process" className="section" style={{ padding: '4rem 2rem' }}>
        <h2 className="h1 display" style={{ marginBottom: '2rem' }}>
          Our Five-Step Process
        </h2>
        {STEPS.map(([title, copy], i) => (
          <div key={i} style={{ marginTop: '2rem' }}>
            <h3 className="h2">
              {String(i + 1).padStart(2, '0')} {title}
            </h3>
            <p className="p">{copy}</p>
          </div>
        ))}
      </section>
    );
  }

  return (
    <section
      ref={sectionRef}
      id="process"
      style={{
        position: 'relative',
        height: `${SECTION_HEIGHT_VH}vh`,
        marginTop: `-${SECTION_OVERLAP_VH}vh`,
      }}
      aria-label="Our Process"
    >
      {/* Screen reader accessible content */}
      <div className="sr-only">
        <h2>Our Process</h2>
        <p>
          We follow a five-step approach: Discover, Define, Design, Develop, and Launch.
        </p>
      </div>

      {/* Sticky viewport */}
      {/* z-index 50: Below GlobalCanvas (z-57) to allow tunnel scenes to render above */}
      <div
        style={{
          position: 'sticky',
          top: 0,
          height: '100vh',
          width: '100%',
          overflow: 'hidden',
          backgroundColor: 'rgb(var(--bg))',
          isolation: 'isolate',
          zIndex: 50,
        }}
      >
        {/* Morphing emblem background - z-index 0 keeps it above bg paint but below content */}
        <div style={{ position: 'absolute', inset: 0, zIndex: 0 }}>
          {isMobile ? (
            <StaticEmblem sizePx={emblemSize} />
          ) : (
            <MorphingEmblem scrollYProgress={delayedProgress} sizePx={emblemSize} />
          )}
        </div>

        {/* Content panels */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            zIndex: 1,
          }}
        >
          <AnimatePresence mode="wait">
            <ProcessPanel
              key={activeStep}
              stepIndex={activeStep}
              title={STEPS[activeStep][0]}
              copy={STEPS[activeStep][1]}
            />
          </AnimatePresence>
        </div>

        {/* Progress indicator */}
        {!isMobile && (
          <ProgressCircle scrollYProgress={delayedProgress} activeStep={activeStep} />
        )}
      </div>
    </section>
  );
}
