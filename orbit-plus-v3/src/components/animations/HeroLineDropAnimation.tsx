import { motion, useReducedMotion } from "framer-motion";
import { useEffect, useState } from "react";

interface HeroLineDropAnimationProps {
  lines: string[];
  className?: string;
  contentVisible?: boolean;
}

export const HeroLineDropAnimation = ({
  lines,
  className,
  contentVisible = false,
}: HeroLineDropAnimationProps) => {
  const [isLoaded, setIsLoaded] = useState(false);
  const shouldReduceMotion = useReducedMotion() ?? false;

  useEffect(() => {
    if (contentVisible) {
      if (shouldReduceMotion) {
        // Skip animation delay for reduced motion
        setIsLoaded(true);
      } else {
        // Small delay to ensure paint before animation
        const timer = setTimeout(() => setIsLoaded(true), 100);
        return () => clearTimeout(timer);
      }
    }
  }, [contentVisible, shouldReduceMotion]);

  return (
    <h1
      className={className}
      style={{
        margin: 0,
        overflow: "hidden" // Critical for hiding lines before they drop
      }}
    >
      {lines.map((line, lineIndex) => (
        <div
          key={lineIndex}
          className="hero-line-container"
          style={{
            overflow: "hidden", // Each line container clips the animation
            position: "relative",
            display: "flex",
            flexWrap: "nowrap" // Prevent mid-word character wrapping
          }}
        >
          {line.split('').map((char, charIndex) => {
            const dropDelay = shouldReduceMotion
              ? lineIndex * 0.05 + charIndex * 0.01
              : lineIndex * 0.3 + charIndex * 0.03;
            
            return (
              <motion.span
                key={charIndex}
                style={{
                  display: "inline-block",
                  whiteSpace: char === ' ' ? 'pre' : 'normal'
                }}
                initial={shouldReduceMotion ? {
                  opacity: 0
                } : {
                  y: "-100%", // Start above
                  opacity: 0
                }}
                animate={isLoaded ? {
                  y: 0, // Drop down into place
                  opacity: 1
                } : {}}
                transition={shouldReduceMotion ? {
                  duration: 0.3,
                  delay: dropDelay
                } : {
                  duration: 0.6,
                  delay: dropDelay,
                  ease: [0.25, 0.46, 0.45, 0.94]
                }}
              >
                {char === ' ' ? '\u00A0' : char}
              </motion.span>
            );
          })}
        </div>
      ))}
    </h1>
  );
};
