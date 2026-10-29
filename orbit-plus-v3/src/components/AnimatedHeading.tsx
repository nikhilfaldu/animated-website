import { motion, useInView, useTransform, useScroll } from "framer-motion";
import { useRef } from "react";
import type { ReactNode, CSSProperties, ElementType } from "react";

type Props = {
  children: ReactNode;
  className?: string;
  initialWeight?: number;
  animatedWeight?: number;
  /** Heading tag to render (e.g., 'h1' | 'h2' | 'h3' ...) */
  tag?: ElementType;
  style?: CSSProperties;
};

export function AnimatedHeading({
  children,
  className = "",
  initialWeight = 300,
  animatedWeight = 700,
  tag: Tag = "h2",
  style,
  ...props
}: Props & Record<string, unknown>) {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: "-10%" });

  // Scroll-based weight animation
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start end", "end start"],
  });

  const scrollWeight = useTransform(
    scrollYProgress,
    [0, 0.3, 0.7, 1],
    [initialWeight, animatedWeight, animatedWeight, initialWeight]
  );

  const HeadingTag = Tag as ElementType;

  return (
    <motion.div
      ref={ref}
      initial={{ fontWeight: initialWeight, opacity: 0, y: 20 }}
      animate={isInView ? { fontWeight: animatedWeight, opacity: 1, y: 0 } : {}}
      transition={{
        fontWeight: { duration: 0.8, ease: "easeOut" },
        opacity: { duration: 0.6, delay: 0.1 },
        y: { duration: 0.6, delay: 0.1 },
      }}
      style={{ fontWeight: scrollWeight, ...style }}
      className={className}
      {...props}
    >
      {/* Use createElement via ElementType-compatible JSX */}
      <HeadingTag style={{ fontWeight: "inherit" }}>{children}</HeadingTag>
    </motion.div>
  );
}