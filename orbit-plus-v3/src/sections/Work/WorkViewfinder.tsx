// src/sections/Work/WorkViewfinder.tsx
// Animated frame that springs to selected card bounding box

import { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';

type Rect = { left: number; top: number; width: number; height: number } | null;

type Props = {
  rect: DOMRect | null;
  visible: boolean;
};

function toRect(r: DOMRect | null): Rect {
  if (!r) return null;
  return { left: r.left, top: r.top, width: r.width, height: r.height };
}

export function WorkViewfinder({ rect, visible }: Props) {
  const [r, setR] = useState<Rect>(toRect(rect));

  useEffect(() => {
    setR(toRect(rect));
  }, [rect]);

  const show = visible && !!r;

  const target = useMemo(() => {
    if (!r) return { left: 0, top: 0, width: 0, height: 0 };
    return r;
  }, [r]);

  return (
    <motion.div
      aria-hidden="true"
      className="fixed inset-0 pointer-events-none"
      style={{ zIndex: 52 }}
      animate={{ opacity: show ? 1 : 0 }}
      transition={{ duration: 0.18 }}
    >
      {/* Main frame */}
      <motion.div
        className="absolute rounded-2xl border border-white/25"
        animate={target}
        transition={{ type: 'spring', stiffness: 420, damping: 42, mass: 0.7 }}
        style={{
          boxShadow: '0 0 0 1px rgba(255,255,255,0.06), 0 18px 50px rgba(0,0,0,0.35)',
          backdropFilter: 'blur(1px)',
        }}
      />

      {/* Corner ticks */}
      <motion.div
        className="absolute"
        animate={target}
        transition={{ type: 'spring', stiffness: 420, damping: 42, mass: 0.7 }}
        style={{ pointerEvents: 'none' }}
      >
        <div className="absolute -left-2 -top-2 h-4 w-4 border-l border-t border-white/50" />
        <div className="absolute -right-2 -top-2 h-4 w-4 border-r border-t border-white/50" />
        <div className="absolute -left-2 -bottom-2 h-4 w-4 border-l border-b border-white/50" />
        <div className="absolute -right-2 -bottom-2 h-4 w-4 border-r border-b border-white/50" />
      </motion.div>
    </motion.div>
  );
}
