'use client';

import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useWorldStore } from '@/stores/useWorldStore';
import { WORLDS } from '@/config/worlds';

const HintText: React.FC = () => {
  const { isIntroComplete, activeWorld, hoveredWorld, hasInteracted } = useWorldStore();
  const [hint, setHint] = useState<string | null>(null);

  useEffect(() => {
    if (!isIntroComplete) {
      setHint(null);
      return;
    }

    if (activeWorld) {
      setHint('Press Escape to return');
    } else if (hoveredWorld) {
      const worldName = WORLDS[hoveredWorld].name;
      setHint(`Click to visit ${worldName}`);
    } else if (!hasInteracted) {
      setHint('Scroll or use arrow keys to explore');
    } else {
      setHint(null);
    }
  }, [isIntroComplete, activeWorld, hoveredWorld, hasInteracted]);

  useEffect(() => {
    let timeout: NodeJS.Timeout;
    if (hint === 'Scroll or use arrow keys to explore') {
      timeout = setTimeout(() => {
        setHint(null);
      }, 5000);
    }
    return () => clearTimeout(timeout);
  }, [hint]);

  return (
    <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-30 pointer-events-none h-6 flex items-center justify-center">
      <AnimatePresence mode="wait">
        {hint && (
          <motion.div
            key={hint}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 0.5, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.3 }}
            className="font-sans text-sm text-white bg-black/30 px-4 py-1.5 rounded-full backdrop-blur-sm"
          >
            {hint}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default React.memo(HintText);
