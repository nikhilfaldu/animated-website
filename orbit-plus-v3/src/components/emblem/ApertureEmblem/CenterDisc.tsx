import { motion, useTransform, type MotionValue } from 'framer-motion';

interface CenterDiscProps {
  progress: MotionValue<number>;  // 0..1 progress value
  sizeVmin?: number;              // default 56
}

/**
 * CenterDisc - Subtle alignment cue that appears at the end of the aperture animation.
 *
 * Fades in near the end of the animation progress (around 0.95),
 * providing a subtle visual cue that the emblem is "locked".
 *
 * Intentionally subtle so it doesn't compete with the emblem rays.
 */
export function CenterDisc({ progress, sizeVmin = 56 }: CenterDiscProps) {
  // Fade in near the end of the animation
  const opacity = useTransform(
    progress,
    [0.90, 0.95, 1.0],
    [0, 0.10, 0.10]
  );

  const scale = useTransform(
    progress,
    [0.88, 0.95],
    [0.98, 1]
  );

  // Size the disc relative to the emblem size
  const discSize = Math.max(20, sizeVmin * 0.04);

  return (
    <motion.div
      className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2"
      style={{ opacity, scale }}
      aria-hidden="true"
    >
      {/* Subtle circle alignment cue */}
      <div
        className="rounded-full border border-white/20"
        style={{ width: discSize, height: discSize }}
      />
    </motion.div>
  );
}
