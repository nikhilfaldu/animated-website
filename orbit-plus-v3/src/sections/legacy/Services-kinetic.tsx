/**
 * ServicesKinetic - Horizontal Panel Animation System
 *
 * Redesigned Services section using scroll-driven horizontal panels
 * inspired by legacy Process.tsx. Creates kinetic, continuous motion
 * with layered depth and geometric accents echoing the emblem.
 *
 * Design: White World Kinetic Typography
 * - Maintains the inverted (white) world from tunnel-in
 * - White panels with subtle shadows slide left to reveal content
 * - Geometric radial accents echo emblem language
 * - Vertical typography adds visual dynamism
 * - Continuous scroll-driven motion (not discrete state changes)
 */

import {
  motion,
  useMotionValueEvent,
  useScroll,
  useTransform,
  MotionValue,
} from 'framer-motion';
import { useRef, useState, useMemo } from 'react';

// --- TYPES ---
interface ServiceStage {
  id: string;
  title: string;
  lede: string;
  bullets: string[];
  accent: string; // Accent color for geometric elements
}

// --- CONSTANTS ---
const SECTION_HEIGHT_VH = 400;

const STAGES: ServiceStage[] = [
  {
    id: 'strategy',
    title: 'Strategy',
    lede: 'Clarity before craft. We map the narrative, the market, and the decision path so every design choice has a job.',
    bullets: [
      "Define who you're speaking to and why they'll listen",
      'Structure content so your message lands first',
      'Plan launches that build momentum, not stall',
    ],
    accent: '#000000',
  },
  {
    id: 'design',
    title: 'Design',
    lede: 'A visual system that feels inevitable. Typography, motion, and layout work as one continuous sentence.',
    bullets: [
      'A visual identity unmistakably yours',
      'Motion that guides, never distracts',
      'A system that scales without breaking',
    ],
    accent: '#1a1a1a',
  },
  {
    id: 'build',
    title: 'Build',
    lede: 'Code with intent. Fast, accessible, and built to evolve without losing the original feeling.',
    bullets: [
      'Clean, modern code that loads fast',
      'Accessible to everyone, on every device',
      'Easy updates without calling a developer',
    ],
    accent: '#0a0a0a',
  },
];

// --- GEOMETRIC ACCENTS ---
/**
 * RadialAccent - Decorative lines echoing emblem radials
 * Creates visual connection to the tunnel/emblem system
 */
function RadialAccent({
  progress,
  stageIndex,
}: {
  progress: MotionValue<number>;
  stageIndex: number;
}) {
  const rotation = useTransform(
    progress,
    [0, 1],
    [stageIndex * 15, stageIndex * 15 + 90]
  );

  const scale = useTransform(progress, [0, 0.5, 1], [0.8, 1, 0.9]);

  return (
    <motion.div
      className="pointer-events-none absolute inset-0 overflow-hidden"
      style={{ opacity: 0.06 }}
    >
      <motion.div
        className="absolute left-1/2 top-1/2 h-[200%] w-px origin-center bg-black"
        style={{
          rotate: rotation,
          scale,
          x: '-50%',
          y: '-50%',
        }}
      />
      <motion.div
        className="absolute left-1/2 top-1/2 h-[200%] w-px origin-center bg-black"
        style={{
          rotate: useTransform(rotation, (r) => r + 30),
          scale,
          x: '-50%',
          y: '-50%',
        }}
      />
      <motion.div
        className="absolute left-1/2 top-1/2 h-[200%] w-px origin-center bg-black"
        style={{
          rotate: useTransform(rotation, (r) => r + 60),
          scale,
          x: '-50%',
          y: '-50%',
        }}
      />
      {/* Arc accent */}
      <motion.div
        className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2"
        style={{ scale }}
      >
        <svg
          width="600"
          height="600"
          viewBox="0 0 600 600"
          fill="none"
          className="opacity-50"
        >
          <circle
            cx="300"
            cy="300"
            r="250"
            stroke="black"
            strokeWidth="0.5"
            fill="none"
            strokeDasharray="4 8"
          />
          <circle
            cx="300"
            cy="300"
            r="180"
            stroke="black"
            strokeWidth="0.5"
            fill="none"
            strokeDasharray="2 12"
          />
        </svg>
      </motion.div>
    </motion.div>
  );
}

// --- BACKGROUND STAGE CONTENT ---
/**
 * StageBackground - Content revealed as panels slide away
 * Uses large display typography with geometric accents
 */
function StageBackground({
  stage,
  index,
  progress,
}: {
  stage: ServiceStage;
  index: number;
  progress: MotionValue<number>;
}) {
  const stageNumber = String(index + 1).padStart(2, '0');

  // Stagger reveal based on panel position
  const stageStart = index / STAGES.length;
  const stageEnd = (index + 1) / STAGES.length;

  const contentOpacity = useTransform(
    progress,
    [stageStart, stageStart + 0.05, stageEnd - 0.05, stageEnd],
    [0, 1, 1, 0]
  );

  const contentY = useTransform(
    progress,
    [stageStart, stageStart + 0.1],
    [40, 0]
  );

  return (
    <motion.div
      className="absolute inset-0 flex items-center justify-center bg-white text-black"
      style={{
        zIndex: index + 1,
        opacity: contentOpacity,
      }}
    >
      <RadialAccent progress={progress} stageIndex={index} />

      <motion.div
        className="relative z-10 mx-auto max-w-5xl px-8"
        style={{ y: contentY }}
      >
        {/* Stage indicator */}
        <div className="mb-8 flex items-baseline gap-4">
          <span className="font-mono text-xs tracking-[0.3em] opacity-40">
            SERVICES
          </span>
          <span className="font-mono text-xs opacity-30">—</span>
          <span className="font-mono text-xs tracking-[0.2em] opacity-40">
            {stageNumber}
          </span>
        </div>

        {/* Main content grid */}
        <div className="grid gap-12 md:grid-cols-[1fr,1fr] md:gap-20">
          {/* Left: Display title */}
          <div>
            <h3
              className="display font-semibold leading-[0.88] tracking-[-0.03em]"
              style={{ fontSize: 'clamp(4rem, 12vw, 10rem)' }}
            >
              {stage.title}
            </h3>
          </div>

          {/* Right: Lede and bullets */}
          <div className="flex flex-col justify-end pb-4">
            <p className="mb-8 max-w-md text-lg leading-relaxed opacity-70">
              {stage.lede}
            </p>

            <ul className="space-y-3">
              {stage.bullets.map((bullet, i) => (
                <li
                  key={i}
                  className="flex items-start gap-3 text-sm opacity-50"
                >
                  <span className="mt-1.5 h-1 w-1 flex-shrink-0 rounded-full bg-current" />
                  <span>{bullet}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}

// --- SLIDING PANEL ---
/**
 * SlidingPanel - White panel with subtle shadow that slides left
 * Maintains white world continuity while creating depth through shadows
 * Uses vertical typography for visual dynamism
 */
function SlidingPanel({
  stage,
  index,
  transform,
  isLast,
}: {
  stage: ServiceStage;
  index: number;
  transform: string;
  isLast: boolean;
}) {
  const stageNumber = String(index + 1).padStart(2, '0');

  // Subtle gray tints for panel differentiation (all very light)
  const panelTints = ['#fafafa', '#f7f7f7', '#f5f5f5'];
  const panelBg = panelTints[index] || '#ffffff';

  return (
    <motion.div
      className="relative flex h-full flex-col items-center justify-center"
      style={{
        flex: `0 0 ${100 / STAGES.length}%`,
        backgroundColor: panelBg,
        // Subtle shadow on the left edge for depth
        boxShadow: '-8px 0 30px rgba(0,0,0,0.08), -2px 0 8px rgba(0,0,0,0.04)',
        borderRight: !isLast ? '1px solid rgba(0,0,0,0.06)' : 'none',
        x: transform,
        zIndex: 50 - index,
      }}
    >
      {/* Vertical stage number - very subtle */}
      <div
        className="absolute left-6 top-1/2 -translate-y-1/2 font-mono text-[12rem] font-light leading-none tracking-tighter text-black/[0.03]"
        style={{ writingMode: 'vertical-rl' }}
      >
        {stageNumber}
      </div>

      {/* Vertical title - black text */}
      <div
        className="absolute right-8 top-1/4 text-right"
        style={{
          writingMode: 'vertical-rl',
          textOrientation: 'mixed',
        }}
      >
        <span className="display text-2xl font-light tracking-[0.15em] text-black/70">
          {stage.title}
        </span>
      </div>

      {/* Center content hint - black text */}
      <div className="absolute left-1/2 top-1/2 w-32 -translate-x-1/2 -translate-y-1/2 text-center">
        <p className="text-xs leading-relaxed text-black/25">
          {stage.lede.split('.')[0]}.
        </p>
      </div>

      {/* Bottom stage indicator - black dots */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2">
        <div className="flex items-center gap-2">
          {STAGES.map((_, i) => (
            <div
              key={i}
              className={`h-0.5 transition-all duration-300 ${
                i === index ? 'w-6 bg-black/40' : 'w-2 bg-black/15'
              }`}
            />
          ))}
        </div>
      </div>

      {/* Decorative radial line - black */}
      <div
        className="pointer-events-none absolute inset-0 overflow-hidden"
        style={{ opacity: 0.03 }}
      >
        <div
          className="absolute left-1/2 top-0 h-full w-px bg-gradient-to-b from-transparent via-black to-transparent"
          style={{ transform: `rotate(${15 + index * 10}deg)` }}
        />
      </div>

      {/* Right edge accent line */}
      <div className="absolute right-0 top-[15%] h-[70%] w-px bg-gradient-to-b from-transparent via-black/10 to-transparent" />
    </motion.div>
  );
}

// --- MAIN COMPONENT ---
export function ServicesKinetic() {
  const sectionRef = useRef<HTMLElement>(null);

  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ['start start', 'end end'],
  });

  // Calculate slide timing for each panel
  const slideStart = useMemo(
    () => STAGES.map((_, i) => i / STAGES.length),
    []
  );
  const slideEnd = useMemo(
    () => STAGES.map((_, i) => (i + 0.9) / STAGES.length),
    []
  );

  // Panel transforms state
  const [panelTransforms, setPanelTransforms] = useState<string[]>(() =>
    STAGES.map(() => '0%')
  );

  // Update panel transforms on scroll using useMotionValueEvent
  useMotionValueEvent(scrollYProgress, 'change', (value) => {
    setPanelTransforms(
      STAGES.map((_, index) => {
        if (value <= slideStart[index]) return '0%';
        if (value >= slideEnd[index]) return '-100vw';

        const t =
          (value - slideStart[index]) / (slideEnd[index] - slideStart[index]);
        const clamped = Math.min(Math.max(t, 0), 1);
        // Ease out cubic for smoother deceleration
        const eased = 1 - Math.pow(1 - clamped, 3);
        return `${-100 * eased}vw`;
      })
    );
  });

  return (
    <section
      id="services"
      ref={sectionRef}
      className="relative w-full"
      style={{ height: `${SECTION_HEIGHT_VH}vh` }}
    >
      {/* Sticky viewport container */}
      <div className="sticky top-0 z-50 h-screen w-full overflow-hidden">
        {/* Background layers - white with content */}
        {STAGES.map((stage, i) => (
          <StageBackground
            key={`bg-${stage.id}`}
            stage={stage}
            index={i}
            progress={scrollYProgress}
          />
        ))}

        {/* Sliding panels container */}
        <div className="absolute inset-0 flex">
          {STAGES.map((stage, i) => (
            <SlidingPanel
              key={`panel-${stage.id}`}
              stage={stage}
              index={i}
              transform={panelTransforms[i]}
              isLast={i === STAGES.length - 1}
            />
          ))}
        </div>

        {/* Progress indicator */}
        <motion.div
          className="absolute bottom-0 left-0 h-0.5 bg-black/20"
          style={{
            width: useTransform(scrollYProgress, [0, 1], ['0%', '100%']),
          }}
        />
      </div>
    </section>
  );
}

export default ServicesKinetic;
