// src/sections/Work/WorkWatermark.tsx
// Faint emblem watermark with rotating slice highlight

import { motion } from 'framer-motion';

type Props = {
  sliceIndex: number; // 0..31
  visible: boolean;
};

export function WorkWatermark({ sliceIndex, visible }: Props) {
  const degPer = 360 / 32;
  const rot = sliceIndex * degPer;

  return (
    <motion.div
      aria-hidden="true"
      className="absolute inset-0 pointer-events-none"
      style={{ zIndex: 45 }}
      animate={{ opacity: visible ? 1 : 0 }}
      transition={{ duration: 0.25 }}
    >
      <div className="absolute inset-0 flex items-center justify-center">
        {/* Base faint disc */}
        <div
          className="rounded-full"
          style={{
            width: 'min(72vmin, 680px)',
            height: 'min(72vmin, 680px)',
            border: '1px solid rgba(255,255,255,0.05)',
            opacity: 0.08,
          }}
        />

        {/* Slice highlight */}
        <motion.div
          className="absolute rounded-full"
          animate={{ rotate: rot }}
          transition={{ type: 'spring', stiffness: 220, damping: 28, mass: 0.9 }}
          style={{
            width: 'min(72vmin, 680px)',
            height: 'min(72vmin, 680px)',
            background:
              'conic-gradient(from 0deg, rgba(255,255,255,0.16) 0deg 10deg, rgba(255,255,255,0.00) 10deg 360deg)',
            maskImage: 'radial-gradient(circle at center, transparent 0 28%, black 34% 100%)',
            WebkitMaskImage: 'radial-gradient(circle at center, transparent 0 28%, black 34% 100%)',
            opacity: 0.55,
          }}
        />
      </div>
    </motion.div>
  );
}
