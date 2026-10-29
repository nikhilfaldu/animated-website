import {
  motion,
  useReducedMotion,
  useScroll,
  useTransform,
  type MotionValue,
} from "framer-motion";
import { useEffect, useRef, useState } from "react";

type Phase = "strategy" | "design" | "build";
type Tone = "dark" | "light";

const WRAPPER_HEIGHT_VH = 520;

/**
 * Timeline budgeting (normalized 0..1 over the section).
 * We explicitly reserve BUILD_DWELL at the end so Build always has time on screen
 * before the sticky releases.
 */
const STRATEGY_DWELL = 0.10;
const WIPE_IN_DURATION = 0.34;  // Slower wipe for Design reveal

const WIPE_OUT_DURATION = 0.30;  // Slower wipe for Build reveal
const BUILD_DWELL = 0.24;  // Extra hold time after Build displays before releasing

// Derived cut points
const FLIP_TO_LIGHT = STRATEGY_DWELL;

// Wipe 1 window (reveals Design)
const WIPE_IN_START = FLIP_TO_LIGHT;
const WIPE_IN_END = FLIP_TO_LIGHT + WIPE_IN_DURATION;

// Anchor the end of wipe 2 so Build always has BUILD_DWELL afterward
const WIPE_OUT_END = 1 - BUILD_DWELL;
const WIPE_OUT_START = WIPE_OUT_END - WIPE_OUT_DURATION;
const FLIP_TO_DARK = WIPE_OUT_START;

// Derived Design dwell (time between wipe 1 ending and wipe 2 starting)
const DESIGN_DWELL = FLIP_TO_DARK - WIPE_IN_END;

// Dev sanity check
const __TIMELINE_TOTAL__ =
  STRATEGY_DWELL +
  WIPE_IN_DURATION +
  DESIGN_DWELL +
  WIPE_OUT_DURATION +
  BUILD_DWELL;

if (import.meta.env.DEV && Math.abs(__TIMELINE_TOTAL__ - 1) > 1e-6) {
  console.warn("Services timeline does not sum to 1.0:", __TIMELINE_TOTAL__);
}

/**
 * Subtext animation timing.
 * Each phase's subtext animates in after the wipe completes.
 */
// Subtext is on RIGHT side - gets revealed LATE in the wipe (mask sweeps left-to-right)
// Start animation when subtext area becomes visible, not when wipe starts
const SUBTEXT_TIMING = {
  strategy: { start: 0.00, duration: 0.04 },  // Immediate when section sticks
  design: { start: WIPE_IN_END - 0.12, duration: 0.04 },  // When right side revealed (~0.34)
  build: { start: WIPE_OUT_END - 0.12, duration: 0.04 },  // When right side revealed (~0.70)
};

/**
 * Pivot: OFFSCREEN LEFT (the endpoint you annotated).
 */
const MASK_ORIGIN_X = "-28%";
const MASK_ORIGIN_Y = "34%";

/**
 * Conic gradients: 0deg is "up", then clockwise.
 */
const MASK_FROM_DEG = 0;
// Second invert: return sweep (counterclockwise feel) anchored to the bottom.
const MASK2_FROM_DEG = 180;

function clamp(n: number, min: number, max: number) {
  return Math.min(max, Math.max(min, n));
}
function invLerp(a: number, b: number, v: number) {
  return (v - a) / (b - a);
}
function easeInOutCubic(t: number) {
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
}
function lerp(a: number, b: number, t: number) {
  return a + (b - a) * t;
}
function pulse(p: number, center: number, width: number) {
  const x = (p - center) / width;
  return Math.exp(-(x * x));
}

/**
 * Returns a conic-gradient mask string.
 * - deg < 0.5 => fully transparent (truly hidden; avoids "instant pop" bugs)
 * - reverse=true => visible wedge grows from (360-deg) -> 360 (counterclockwise feel)
 */
function maskFromDeg(deg: number, fromDeg = MASK_FROM_DEG, reverse = false) {
  if (deg < 0.5) {
    return `conic-gradient(from ${fromDeg}deg at ${MASK_ORIGIN_X} ${MASK_ORIGIN_Y},
      transparent 0deg,
      transparent 360deg
    )`;
  }

  const d = Math.min(360, Math.max(0.5, deg));

  // When we hit "fully revealed", return a totally opaque mask (no trailing transparent stop).
  if (d >= 359.5) {
    return `conic-gradient(from ${fromDeg}deg at ${MASK_ORIGIN_X} ${MASK_ORIGIN_Y},
      rgba(0,0,0,1) 0deg,
      rgba(0,0,0,1) 360deg
    )`;
  }

  if (!reverse) {
    return `conic-gradient(from ${fromDeg}deg at ${MASK_ORIGIN_X} ${MASK_ORIGIN_Y},
      rgba(0,0,0,1) 0deg,
      rgba(0,0,0,1) ${d}deg,
      transparent ${d}deg,
      transparent 360deg
    )`;
  }

  const cut = 360 - d;
  return `conic-gradient(from ${fromDeg}deg at ${MASK_ORIGIN_X} ${MASK_ORIGIN_Y},
    transparent 0deg,
    transparent ${cut}deg,
    rgba(0,0,0,1) ${cut}deg,
    rgba(0,0,0,1) 360deg
  )`;
}

/**
 * AnimatedWord: A single word that fades in based on scroll progress.
 */
function AnimatedWord({
  word,
  index,
  scrollYProgress,
  timing,
  prefersReducedMotion,
}: {
  word: string;
  index: number;
  scrollYProgress: MotionValue<number>;
  timing: { start: number; duration: number };
  prefersReducedMotion: boolean | null;
}) {
  // Stagger delay per word (faster animation)
  const staggerDelay = index * 0.003;
  const wordStart = timing.start + staggerDelay;
  const wordEnd = wordStart + timing.duration;

  const opacity = useTransform(scrollYProgress, (p) => {
    if (prefersReducedMotion) return 1;
    if (p <= wordStart) return 0;
    if (p >= wordEnd) return 1;
    const t = clamp(invLerp(wordStart, wordEnd, p), 0, 1);
    return t;
  });

  return (
    <motion.span
      style={{ opacity, display: "inline-block" }}
    >
      {word}&nbsp;
    </motion.span>
  );
}

/**
 * AnimatedSubtext: Lede paragraph with word-by-word animation, plus bullets.
 */
function AnimatedSubtext({
  lede,
  bullets,
  scrollYProgress,
  timing,
  prefersReducedMotion,
}: {
  lede: string;
  bullets: string[];
  scrollYProgress: MotionValue<number>;
  timing: { start: number; duration: number };
  prefersReducedMotion: boolean | null;
}) {
  const words = lede.split(/\s+/);
  const ledeWordCount = words.length;

  // Bullets animate after all lede words complete
  const bulletStartOffset = ledeWordCount * 0.003;

  return (
    <div className="max-w-md">
      <p className="p opacity-80">
        {words.map((word, i) => (
          <AnimatedWord
            key={`${word}-${i}`}
            word={word}
            index={i}
            scrollYProgress={scrollYProgress}
            timing={timing}
            prefersReducedMotion={prefersReducedMotion}
          />
        ))}
      </p>
      <ul className="mt-5 hidden space-y-2 text-sm opacity-70 md:block">
        {bullets.map((b, bulletIndex) => {
          // Each bullet gets its own timing, staggered after lede
          const bulletWords = b.split(/\s+/);
          const bulletTiming = {
            start: timing.start + bulletStartOffset + bulletIndex * 0.008,
            duration: timing.duration,
          };

          return (
            <li key={b}>
              {bulletWords.map((word, wordIndex) => (
                <AnimatedWord
                  key={`${word}-${wordIndex}`}
                  word={word}
                  index={wordIndex}
                  scrollYProgress={scrollYProgress}
                  timing={bulletTiming}
                  prefersReducedMotion={prefersReducedMotion}
                />
              ))}
            </li>
          );
        })}
      </ul>
    </div>
  );
}

export function Services() {
  const sectionRef = useRef<HTMLElement>(null);
  const prefersReducedMotion = useReducedMotion();

  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ["start start", "end start"],
  });

  // Prevent white-on-load: only allow masked layers to show after mount.
  const [mounted, setMounted] = useState(false);
  const [maskSupported, setMaskSupported] = useState(false);

  useEffect(() => {
    setMounted(true);

    const test =
      "conic-gradient(from 0deg at 50% 50%, #000 0deg, transparent 10deg)";
    const ok =
      typeof CSS !== "undefined" &&
      (CSS.supports("mask-image", test) ||
        CSS.supports("-webkit-mask-image", test));

    setMaskSupported(ok);
  }, []);

  /**
   * Wipe 1: reveals the Design (light) layer.
   * 0..360 during WIPE_IN_START..WIPE_IN_END, then stays 360.
   */
  const wipe1Deg = useTransform(scrollYProgress, (p) => {
    if (prefersReducedMotion) return p >= WIPE_IN_START ? 360 : 0;
    if (p <= WIPE_IN_START) return 0;
    if (p >= WIPE_IN_END) return 360;
    const t0 = clamp(invLerp(WIPE_IN_START, WIPE_IN_END, p), 0, 1);
    return lerp(0, 360, easeInOutCubic(t0));
  });

  /**
   * Wipe 2: reveals the Build (dark) layer on top.
   * 0..360 during WIPE_OUT_START..WIPE_OUT_END, then stays 360.
   */
  const wipe2Deg = useTransform(scrollYProgress, (p) => {
    if (prefersReducedMotion) return p >= WIPE_OUT_START ? 360 : 0;
    if (p <= WIPE_OUT_START) return 0;
    if (p >= WIPE_OUT_END) return 360;
    const t0 = clamp(invLerp(WIPE_OUT_START, WIPE_OUT_END, p), 0, 1);
    return lerp(0, 360, easeInOutCubic(t0));
  });

  const maskImageFirst = useTransform(wipe1Deg, (d) => maskFromDeg(d));
  const maskImageSecond = useTransform(wipe2Deg, (d) =>
    maskFromDeg(d, MASK2_FROM_DEG, true)
  );

  // Fallback if masks unsupported: instant layer swaps at the cut points.
  const designOpacityFallback = useTransform(scrollYProgress, (p) => {
    if (p < FLIP_TO_LIGHT) return 0;
    if (p < FLIP_TO_DARK) return 1;
    return 0;
  });

  const buildOpacityFallback = useTransform(scrollYProgress, (p) => {
    if (p < FLIP_TO_DARK) return 0;
    return 1;
  });

  const cutEnergy = useTransform(scrollYProgress, (p) => {
    if (prefersReducedMotion) return 0;
    const e1 = pulse(p, FLIP_TO_LIGHT, 0.035);
    const e2 = pulse(p, FLIP_TO_DARK, 0.035);
    return clamp(Math.max(e1, e2), 0, 1);
  });

  const ringsRotate = useTransform(scrollYProgress, [0, 1], [0, 28]);

  return (
    <section id="services" ref={sectionRef} className="relative w-full">
      <div
        style={{ height: `calc(${WRAPPER_HEIGHT_VH}vh + 100vh)` }}
        className="relative"
      >
        <div className="sticky top-0 h-screen overflow-hidden">
          {/* Base DARK layer: Strategy (always bottom) */}
          <div className="absolute inset-0 z-0 text-[rgb(var(--fg))]">
            <StageContent
              tone="dark"
              phase="strategy"
              layer="base"
              ringsRotate={ringsRotate}
              cutEnergy={cutEnergy}
              scrollYProgress={scrollYProgress}
              prefersReducedMotion={prefersReducedMotion}
            />
          </div>

          {/* LIGHT layer: Design (always above base) */}
          <motion.div
            className="absolute inset-0 z-10 bg-white text-black"
            style={{
              opacity: mounted ? (maskSupported ? 1 : designOpacityFallback) : 0,
              WebkitMaskImage: maskSupported ? (maskImageFirst as unknown as string) : undefined,
              maskImage: maskSupported ? (maskImageFirst as unknown as string) : undefined,
              WebkitMaskRepeat: "no-repeat",
              maskRepeat: "no-repeat",
              WebkitMaskSize: "cover",
              maskSize: "cover",
            }}
            aria-hidden="true"
          >
            <StageContent
              tone="light"
              phase="design"
              layer="design"
              ringsRotate={ringsRotate}
              cutEnergy={cutEnergy}
              scrollYProgress={scrollYProgress}
              prefersReducedMotion={prefersReducedMotion}
            />
          </motion.div>

          {/* DARK top layer: Build (always above everything) */}
          <motion.div
            className="absolute inset-0 z-20 bg-[rgb(var(--bg))] text-[rgb(var(--fg))]"
            style={{
              opacity: mounted ? (maskSupported ? 1 : buildOpacityFallback) : 0,
              WebkitMaskImage: maskSupported ? (maskImageSecond as unknown as string) : undefined,
              maskImage: maskSupported ? (maskImageSecond as unknown as string) : undefined,
              WebkitMaskRepeat: "no-repeat",
              maskRepeat: "no-repeat",
              WebkitMaskSize: "cover",
              maskSize: "cover",
            }}
            aria-hidden="true"
          >
            <StageContent
              tone="dark"
              phase="build"
              layer="build"
              ringsRotate={ringsRotate}
              cutEnergy={cutEnergy}
              scrollYProgress={scrollYProgress}
              prefersReducedMotion={prefersReducedMotion}
            />
          </motion.div>
        </div>
      </div>
    </section>
  );
}

type ServicesLayer = "base" | "design" | "build";

function StageContent({
  phase,
  layer,
  scrollYProgress,
  prefersReducedMotion,
}: {
  tone: Tone;
  phase: Phase;
  layer: ServicesLayer;
  ringsRotate: MotionValue<number>;
  cutEnergy: MotionValue<number>;
  scrollYProgress: MotionValue<number>;
  prefersReducedMotion: boolean | null;
}) {
  const wordClass =
    "display font-semibold tracking-[-0.02em] leading-[0.88] select-none " +
    "text-[clamp(56px,9vw,128px)] md:text-[clamp(64px,8vw,140px)]";

  const copy = getCopyForPhase(phase);
  const timing = SUBTEXT_TIMING[phase];

  // Scale hierarchy for history words (subtle, refined reduction)
  const SECONDARY_SCALE = "scale-[0.65]";
  const TERTIARY_SCALE = "scale-[0.45]";

  return (
    <div className="relative h-full">
      {/* Foreground */}
      <div className="relative z-10 mx-auto flex h-full max-w-6xl flex-col justify-center px-4 py-16 md:px-8 md:py-24">
        <div className="mb-12">
          <p className="caption opacity-70">Services</p>
        </div>

        {/* Content: History stack above, Primary + Subtext together below */}
        <div className="flex flex-col">
          {/* History words - stack naturally above primary */}
          <div className="flex flex-col gap-1 mb-3">
            {layer === "build" && (
              <div style={{ transformOrigin: 'left center' }}>
                <span
                  className={`${wordClass} ${TERTIARY_SCALE} opacity-30 inline-block`}
                  style={{ transformOrigin: 'left center' }}
                >
                  Strategy
                </span>
              </div>
            )}

            {(layer === "build" || layer === "design") && (
              <div style={{ transformOrigin: 'left center' }}>
                <span
                  className={`${wordClass} ${layer === "build" ? SECONDARY_SCALE : SECONDARY_SCALE} ${layer === "build" ? "opacity-45" : "opacity-40"} inline-block`}
                  style={{ transformOrigin: 'left center' }}
                >
                  {layer === "build" ? "Design" : "Strategy"}
                </span>
              </div>
            )}
          </div>

          {/* Primary row: Headline + Subtext horizontally aligned */}
          <div className="flex flex-col gap-6 md:flex-row md:items-start md:gap-16">
            <div className="md:w-[55%] flex-shrink-0">
              <h3 className={wordClass}>
                {phase === "strategy" ? "Strategy" : phase === "design" ? "Design" : "Build"}
              </h3>
            </div>

            <div className="flex-1 md:pt-4">
              <AnimatedSubtext
                lede={copy.lede}
                bullets={copy.bullets}
                scrollYProgress={scrollYProgress}
                timing={timing}
                prefersReducedMotion={prefersReducedMotion}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function getCopyForPhase(phase: Phase) {
  if (phase === "strategy") {
    return {
      lede: "Clarity before craft. We map the narrative, the market, and the decision path so every design choice has a job.",
      bullets: [
        "Define who you're speaking to and why they'll listen",
        "Structure content so your message lands first",
        "Plan launches that build momentum, not stall",
      ],
    };
  }

  if (phase === "design") {
    return {
      lede: "A visual system that feels inevitable. Typography, motion, and layout work as one continuous sentence.",
      bullets: [
        "A visual identity unmistakably yours",
        "Motion that guides, never distracts",
        "A system that scales without breaking",
      ],
    };
  }

  return {
    lede: "Code with intent. Fast, accessible, and built to evolve without losing the original feeling.",
    bullets: [
      "Clean, modern code that loads fast",
      "Accessible to everyone, on every device",
      "Easy updates without calling a developer",
    ],
  };
}
