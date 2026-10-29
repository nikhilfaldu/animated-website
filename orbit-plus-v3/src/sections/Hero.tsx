import { useRef } from "react";
import { motion, useScroll, useTransform } from "framer-motion";
import { HeroLineDropAnimation } from '@/components/animations/HeroLineDropAnimation';
import { useOrbitSystem } from '@/context/OrbitSystem';

/**
 * Hero section with pinned scrollytelling behavior.
 *
 * The section has a 200vh height to create a "scroll runway":
 * - First 100vh: Hero text stays pinned while emblem expands
 * - Second 100vh: Hero text scrolls out naturally
 *
 * The text uses position:sticky to remain centered during the first half,
 * then fades out as the user continues scrolling.
 */
export function Hero() {
  const heroRef = useRef<HTMLElement | null>(null);
  const { heroTextReady, introComplete } = useOrbitSystem();

  // Track scroll progress within this section
  const { scrollYProgress } = useScroll({
    target: heroRef,
    offset: ["start start", "end start"],
  });

  // Hero text opacity: fully visible until 50% of section scroll, then fades out
  // Only applies after intro is complete to avoid interfering with text entrance animation
  const heroTextOpacity = useTransform(
    scrollYProgress,
    [0, 0.5, 0.75],
    [1, 1, 0]
  );

  // Hero text Y translation: starts moving up after 50% of section scroll
  const heroTextY = useTransform(
    scrollYProgress,
    [0, 0.5, 1],
    ["0%", "0%", "-30%"]
  );

  return (
    <section
      ref={heroRef}
      id="hero"
      className="relative w-full"
      style={{ height: "280vh" }} // Extended height for longer pinned scroll runway
    >
      {/* Sticky container that pins the hero content during first 100vh */}
      <div
        className="sticky top-0 h-screen flex items-center justify-center"
        style={{ zIndex: 10 }}
      >
        <motion.div
          className="relative w-full mx-auto px-6 text-center"
          style={{
            marginLeft: 90,
            opacity: introComplete ? heroTextOpacity : 1,
            y: introComplete ? heroTextY : 0,
          }}
        >
          <HeroLineDropAnimation
            lines={[
              "Creative websites",
              "for brands that",
              "don't fit the mold."
            ]}
            className="h0 display"
            contentVisible={heroTextReady}
          />
        </motion.div>
      </div>
    </section>
  );
}
