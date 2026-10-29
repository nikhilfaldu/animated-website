'use client';

import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useWorldStore } from '@/stores/useWorldStore';

const TitleOverlay: React.FC = () => {
  const { isIntroComplete, activeWorld } = useWorldStore();
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    let timeoutId: NodeJS.Timeout;

    if (isIntroComplete && !activeWorld) {
      setIsVisible(true);
      timeoutId = setTimeout(() => {
        setIsVisible(false);
      }, 4000);
    } else {
      setIsVisible(false);
    }

    return () => {
      clearTimeout(timeoutId);
    };
  }, [isIntroComplete, activeWorld]);

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          className="pointer-events-none fixed inset-0 z-40 flex flex-col items-center justify-center"
          initial="hidden"
          animate="visible"
          exit="exit"
          variants={{
            hidden: { opacity: 0 },
            visible: {
              opacity: 1,
              transition: {
                staggerChildren: 0.3,
              },
            },
            exit: { opacity: 0, transition: { duration: 1 } },
          }}
        >
          <motion.h1
            variants={{
              hidden: { opacity: 0, y: 20 },
              visible: { opacity: 1, y: 0, transition: { duration: 1, ease: 'easeOut' } },
            }}
            className="font-heading text-5xl md:text-7xl gradient-text text-center tracking-wider text-glow mb-4"
          >
            The Architect of Worlds
          </motion.h1>
          <motion.p
            variants={{
              hidden: { opacity: 0, y: 10 },
              visible: { opacity: 0.4, y: 0, transition: { duration: 1, ease: 'easeOut' } },
            }}
            className="font-sans text-lg text-white"
          >
            Every world tells a story
          </motion.p>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default React.memo(TitleOverlay);
