'use client';

import React from 'react';
import { useAudioStore } from '@/stores/useAudioStore';
import { useWorldStore } from '@/stores/useWorldStore';
import { HiSpeakerWave, HiSpeakerXMark } from 'react-icons/hi2';
import { motion, AnimatePresence } from 'framer-motion';

const AudioToggle: React.FC = () => {
  const { isMuted, toggle } = useAudioStore();
  const { isIntroComplete } = useWorldStore();

  if (!isIntroComplete) return null;

  return (
    <button
      onClick={toggle}
      className="fixed left-6 bottom-6 z-30 w-11 h-11 rounded-full glass flex items-center justify-center transition-transform hover:scale-110 active:scale-95"
      aria-label={isMuted ? 'Unmute audio' : 'Mute audio'}
    >
      <AnimatePresence mode="wait">
        <motion.div
          key={isMuted ? 'muted' : 'unmuted'}
          initial={{ opacity: 0, scale: 0.5, rotate: -45 }}
          animate={{ opacity: 1, scale: 1, rotate: 0 }}
          exit={{ opacity: 0, scale: 0.5, rotate: 45 }}
          transition={{ duration: 0.2 }}
        >
          {isMuted ? (
            <HiSpeakerXMark className="text-white text-xl" />
          ) : (
            <HiSpeakerWave className="text-white text-xl" />
          )}
        </motion.div>
      </AnimatePresence>
    </button>
  );
};

export default React.memo(AudioToggle);
