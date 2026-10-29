import { motion, useTransform } from 'framer-motion';
import { useOrbitSystem } from '@/context/OrbitSystem';

/**
 * Scroll Indicator - Subtle bouncing arrow that appears after hero text
 *
 * - Appears: After heroTextReady (intro complete + delay)
 * - Disappears: Before Positioning section (scroll > 0.03)
 */
export function ScrollIndicator() {
  const { heroTextReady, scrollProgress } = useOrbitSystem();

  // Fade out as user starts scrolling (gone before positioning at 0.045)
  const opacity = useTransform(
    scrollProgress,
    [0, 0.015, 0.03],
    [1, 0.5, 0]
  );

  // Don't render until hero text is ready
  if (!heroTextReady) return null;

  return (
    <motion.div
      className="fixed bottom-8 left-1/2 -translate-x-1/2 z-10 pointer-events-none"
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay: 0.3 }}
      style={{ opacity, bottom: 'calc(2rem + env(safe-area-inset-bottom))' }}
    >
      <motion.div
        animate={{ y: [0, 6, 0] }}
        transition={{
          duration: 1.5,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      >
        <svg
          width="29"
          height="29"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="text-white/60"
        >
          <path d="M12 5v14M5 12l7 7 7-7" />
        </svg>
      </motion.div>
    </motion.div>
  );
}
