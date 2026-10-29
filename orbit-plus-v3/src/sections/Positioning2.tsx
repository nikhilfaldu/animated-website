import { motion, useScroll, useTransform, type MotionValue } from "framer-motion";
import { useRef } from "react";
import { MOTION } from '@/styles/motion';
import { useBreakpoint } from '@/hooks/useResponsive';

const PARAGRAPHS = [
  "You didn't build a generic business.",
  "A generic website says otherwise.",
  "We make your value impossible to miss."
];

export function Positioning() {
  const containerRef = useRef<HTMLElement | null>(null);
  const { height, isMobile } = useBreakpoint();

  const overlayTop = isMobile ? Math.max(60, height * 0.08) : height * 0.10;

  // Start progress as the section approaches (hero nearly out of view)
  const { scrollYProgress } = useScroll({ 
    target: containerRef, 
    offset: ["start 85%", "end start"] 
  });

  // In-place sticky chapter: headline fades up and pins; paragraphs crossfade
  // Delayed start and longer fade for the headline
  const headingOpacity = useTransform(scrollYProgress, [0, 0.05, 0.25], [0, 1, 1]) as MotionValue<number>;
  const headingY = useTransform(scrollYProgress, [0, 1], [0, 0]) as MotionValue<number>; // fixed position fade

  // TIMING FIX: Paragraph sequence starts AFTER headline is fully visible
  // Headline fully visible at 0.05, add breathing room, paragraphs start at 0.12
  // Map scroll [0.12, 0.75] to stepProgress [0, 3] for 3 paragraphs (1.0 units each)
  // Extended range gives each paragraph equal time to land
  const stepProgress = useTransform(scrollYProgress, [0.12, 0.75], [0, PARAGRAPHS.length]) as MotionValue<number>;
  // Overlay fades out earlier to clear before Services
  const overlayOpacity = useTransform(scrollYProgress, [0, 0.1, 0.72, 0.82], [0, 1, 1, 0]) as MotionValue<number>;


  return (
    <section
      ref={containerRef}
      id="positioning"
      className="section relative overflow-hidden p-0"
      style={{ minHeight: '480vh' }}
    >

      {/* Fixed overlay gated by section progress so it never scrolls out */}
      {/* z-[58]: Above GlobalCanvas (z-57) so text remains readable during WebGL handoff */}
      <motion.div
        className="fixed inset-0 z-[58] flex items-start justify-center pointer-events-none"
        style={{ opacity: overlayOpacity, paddingTop: overlayTop }}
      >
        <div
          className="relative w-full max-w-7xl ml-6 md:ml-12 lg:ml-16 pr-6"
        >
          <motion.div
            style={{ opacity: headingOpacity, y: headingY }}
            transition={{ duration: MOTION.d.base, ease: MOTION.ease.clarity }}
            className="flex flex-col gap-3"
          >
            <h2 className="text-[clamp(56px,14vw,240px)] font-bold leading-[0.9] tracking-[-0.03em] display">
              Built Different,<br />
              By Design.
            </h2>
          </motion.div>

          <div className="absolute top-6 md:top-12 right-24 md:right-36 lg:right-48 h-[170px] md:h-[210px] w-[320px] md:w-[420px] lg:w-[480px] overflow-hidden">
            {PARAGRAPHS.map((copy, index) => (
              <StepCard
                key={index}
                index={index}
                copy={copy}
                stepProgress={stepProgress}
              />
            ))}
          </div>
        </div>
      </motion.div>
    </section>
  );
}

interface StepCardProps {
  index: number;
  copy: string;
  stepProgress: MotionValue<number>;
}

function StepCard({ index, copy, stepProgress }: StepCardProps) {
  // TIMING: Equal crossfade rhythm between paragraphs
  // stepProgress maps [0, 3] across scroll range [0.12, 0.75]
  //
  // Each paragraph gets exactly 1.0 units of stepProgress space
  // All three paragraphs have equal hold time
  //
  // Paragraph 0: [0.0, 0.20, 0.70, 1.0] - fade in, hold, fade out
  // Paragraph 1: [1.0, 1.20, 1.70, 2.0] - fade in, hold, fade out
  // Paragraph 2: [2.0, 2.20, 2.70, 3.0] - fade in, hold, fade out (or stay)

  const base = index * 1.0;
  const fadeInEnd = base + 0.20;    // 0.20 units to fade in
  const holdEnd = base + 0.70;      // 0.50 units of full visibility
  const fadeOutEnd = base + 1.0;    // 0.30 units to fade out

  const isLast = index === PARAGRAPHS.length - 1;

  const opacity = useTransform(
    stepProgress,
    isLast
      ? [base, fadeInEnd, holdEnd + 0.5]           // Last: fade in, stay visible
      : [base, fadeInEnd, holdEnd, fadeOutEnd],    // Others: fade in, hold, fade out
    isLast
      ? [0, 1, 1]
      : [0, 1, 1, 0]
  );

  const y = useTransform(
    stepProgress,
    isLast
      ? [base, fadeInEnd, holdEnd + 0.5]
      : [base, fadeInEnd, holdEnd, fadeOutEnd],
    isLast
      ? [16, 0, 0]
      : [16, 0, 0, -16]
  );

  return (
    <motion.div
      className="absolute inset-0 flex items-start justify-start"
      style={{ opacity, y }}
    >
      <p className="p text-5xl md:text-6xl leading-tight max-w-2xl opacity-80 font-big-shoulders">
        {copy}
      </p>
    </motion.div>
  );
}
