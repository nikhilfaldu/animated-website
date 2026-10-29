/**
 * Services Section - Panel System
 *
 * Displays three phases: Strategy, Design, Build
 * Uses AnimatePresence for smooth panel transitions (same pattern as Process.tsx)
 * History stack shows previous phases above current headline
 *
 * Refactored from conic wipe system - see legacy/Services-conic-wipe.tsx
 */

import {
  motion,
  useReducedMotion,
  useScroll,
  useMotionValueEvent,
  AnimatePresence,
} from 'framer-motion';
import { useRef, useState } from 'react';

// --- TYPES ---
type Phase = 'strategy' | 'design' | 'build';

// --- CONSTANTS ---
const SECTION_HEIGHT_VH = 400; // 400vh as specified

// Phase thresholds (equal thirds)
const PHASE_THRESHOLDS = {
  strategy: { start: 0, end: 0.333 },
  design: { start: 0.333, end: 0.666 },
  build: { start: 0.666, end: 1 },
} as const;

// --- COPY DATA ---
function getCopyForPhase(phase: Phase) {
  if (phase === 'strategy') {
    return {
      lede: 'Clarity before craft. We map the narrative, the market, and the decision path so every design choice has a job.',
      bullets: [
        "Define who you're speaking to and why they'll listen",
        'Structure content so your message lands first',
        'Plan launches that build momentum, not stall',
      ],
    };
  }

  if (phase === 'design') {
    return {
      lede: 'A visual system that feels inevitable. Typography, motion, and layout work as one continuous sentence.',
      bullets: [
        'A visual identity unmistakably yours',
        'Motion that guides, never distracts',
        'A system that scales without breaking',
      ],
    };
  }

  return {
    lede: 'Code with intent. Fast, accessible, and built to evolve without losing the original feeling.',
    bullets: [
      'Clean, modern code that loads fast',
      'Accessible to everyone, on every device',
      'Easy updates without calling a developer',
    ],
  };
}

// --- COMPONENTS ---

/**
 * HistoryStack - Shows previous phases above the current headline
 * Scale and opacity decrease with depth (recency)
 */
function HistoryStack({ activePhase }: { activePhase: Phase }) {
  const phases: Phase[] = ['strategy', 'design', 'build'];
  const activeIndex = phases.indexOf(activePhase);

  // No history to show for the first phase
  if (activeIndex === 0) return null;

  const wordClass =
    'display font-semibold tracking-[-0.02em] leading-[0.88] select-none ' +
    'text-[clamp(56px,9vw,128px)] md:text-[clamp(64px,8vw,140px)]';

  return (
    <div className="flex flex-col gap-1 mb-3">
      {phases.slice(0, activeIndex).map((phase, i) => {
        const depth = activeIndex - i; // 1 = most recent, 2 = older
        const scale = depth === 1 ? 0.65 : 0.45;
        const opacity = depth === 1 ? 0.45 : 0.30;

        return (
          <div key={phase} style={{ transformOrigin: 'left center' }}>
            <span
              className={`${wordClass} inline-block`}
              style={{
                transform: `scale(${scale})`,
                transformOrigin: 'left center',
                opacity,
              }}
            >
              {phase.charAt(0).toUpperCase() + phase.slice(1)}
            </span>
          </div>
        );
      })}
    </div>
  );
}

/**
 * AnimatedSubtext - Word-by-word staggered reveal on mount
 * Uses Framer Motion's staggerChildren instead of scroll-based timing
 */
function AnimatedSubtext({
  lede,
  bullets,
  prefersReducedMotion,
}: {
  lede: string;
  bullets: string[];
  prefersReducedMotion: boolean | null;
}) {
  const words = lede.split(/\s+/);

  // Container variants for stagger orchestration
  const containerVariants = {
    hidden: {},
    visible: {
      transition: {
        staggerChildren: prefersReducedMotion ? 0 : 0.02,
        delayChildren: 0.1,
      },
    },
  };

  // Word variants
  const wordVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { duration: 0.15 },
    },
  };

  // Bullet container variants (starts after lede)
  const bulletContainerVariants = {
    hidden: {},
    visible: {
      transition: {
        staggerChildren: prefersReducedMotion ? 0 : 0.008,
        delayChildren: 0.1 + words.length * 0.02, // After lede words complete
      },
    },
  };

  return (
    <div className="max-w-md">
      <motion.p
        className="p opacity-80"
        initial="hidden"
        animate="visible"
        variants={containerVariants}
      >
        {words.map((word, i) => (
          <motion.span
            key={`${word}-${i}`}
            variants={wordVariants}
            style={{ display: 'inline-block' }}
          >
            {word}&nbsp;
          </motion.span>
        ))}
      </motion.p>

      <motion.ul
        className="mt-5 hidden space-y-2 text-sm opacity-70 md:block"
        initial="hidden"
        animate="visible"
        variants={bulletContainerVariants}
      >
        {bullets.map((b) => (
          <motion.li key={b} variants={wordVariants}>
            {b}
          </motion.li>
        ))}
      </motion.ul>
    </div>
  );
}

/**
 * ServicePanel - Individual phase panel with AnimatePresence transitions
 */
function ServicePanel({
  phase,
  prefersReducedMotion,
}: {
  phase: Phase;
  prefersReducedMotion: boolean | null;
}) {
  const copy = getCopyForPhase(phase);

  const wordClass =
    'display font-semibold tracking-[-0.02em] leading-[0.88] select-none ' +
    'text-[clamp(56px,9vw,128px)] md:text-[clamp(64px,8vw,140px)]';

  const phaseTitle = phase.charAt(0).toUpperCase() + phase.slice(1);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{
        duration: prefersReducedMotion ? 0 : 0.4,
        ease: [0.25, 0.46, 0.45, 0.94],
      }}
      className="absolute inset-0 flex items-center"
    >
      <div className="mx-auto max-w-6xl px-4 py-16 md:px-8 md:py-24 w-full">
        <div className="flex flex-col">
          {/* History stack - shows previous phases */}
          <HistoryStack activePhase={phase} />

          {/* Primary row: Headline + Subtext */}
          <div className="flex flex-col gap-6 md:flex-row md:items-start md:gap-16">
            <div className="md:w-[55%] flex-shrink-0">
              <h3 className={wordClass}>{phaseTitle}</h3>
            </div>

            <div className="flex-1 md:pt-4">
              <AnimatedSubtext
                lede={copy.lede}
                bullets={copy.bullets}
                prefersReducedMotion={prefersReducedMotion}
              />
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

/**
 * Services - Main section component
 * White background, black text (inverted from dark theme)
 * Panel system with AnimatePresence transitions
 */
export function Services() {
  const sectionRef = useRef<HTMLElement>(null);
  const prefersReducedMotion = useReducedMotion();

  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ['start start', 'end start'],
  });

  // Phase state - determines which panel is visible
  const [activePhase, setActivePhase] = useState<Phase>('strategy');

  // Update phase based on scroll position (equal thirds)
  useMotionValueEvent(scrollYProgress, 'change', (p) => {
    let newPhase: Phase;
    if (p < PHASE_THRESHOLDS.design.start) {
      newPhase = 'strategy';
    } else if (p < PHASE_THRESHOLDS.build.start) {
      newPhase = 'design';
    } else {
      newPhase = 'build';
    }

    if (newPhase !== activePhase) {
      setActivePhase(newPhase);
    }
  });

  return (
    <section id="services" ref={sectionRef} className="relative w-full">
      <div style={{ height: `${SECTION_HEIGHT_VH}vh` }} className="relative">
        {/* Sticky container - white background, black text */}
        {/* z-50: Below GlobalCanvas (z-57) to allow tunnel scenes to render above */}
        <div className="sticky top-0 z-50 h-screen overflow-hidden text-black" style={{ backgroundColor: '#ffffff' }}>
          <AnimatePresence mode="wait">
            <ServicePanel
              key={activePhase}
              phase={activePhase}
              prefersReducedMotion={prefersReducedMotion}
            />
          </AnimatePresence>
        </div>
      </div>
    </section>
  );
}
