'use client'

import { useGardenStore } from '@/stores/useGardenStore'
import { gardenSound } from '@/components/audio/GardenSoundEngine'
import { motion, AnimatePresence } from 'framer-motion'
import { Sparkles, Compass } from 'lucide-react'

export function GardenIntroOverlay() {
  const { isIntroActive, completeIntro } = useGardenStore()

  if (!isIntroActive) return null

  const handleStart = () => {
    gardenSound.startAmbient()
    gardenSound.playBloomSound(639)
    completeIntro()
  }

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0, scale: 1.05 }}
        transition={{ duration: 0.8 }}
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-2xl p-6 pointer-events-auto"
      >
        <div className="max-w-xl w-full text-center space-y-6 relative">
          {/* Ambient Glow */}
          <div className="absolute -top-24 left-1/2 -translate-x-1/2 w-96 h-96 bg-purple-600/30 rounded-full blur-[100px] pointer-events-none" />
          <div className="absolute -bottom-24 left-1/2 -translate-x-1/2 w-96 h-96 bg-cyan-600/20 rounded-full blur-[100px] pointer-events-none" />

          {/* Badge */}
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-cyan-500/10 border border-cyan-500/30 text-cyan-300 text-xs font-mono tracking-widest uppercase"
          >
            <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
            <span>Interactive 3D Cosmic Ecosystem</span>
          </motion.div>

          {/* Main Title */}
          <motion.h1
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="text-5xl md:text-7xl font-extrabold tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-cyan-300 via-pink-400 to-purple-400 drop-shadow-[0_0_35px_rgba(168,85,247,0.4)]"
          >
            GALACTIC GARDEN
          </motion.h1>

          <motion.p
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.4 }}
            className="text-slate-300 text-base md:text-lg max-w-md mx-auto font-light leading-relaxed"
          >
            Explore an ethereal cosmic garden filled with bioluminescent alien plants that pulse, grow, bloom, and synthesize audio in response to your touch.
          </motion.p>

          {/* Call to action */}
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="pt-4"
          >
            <button
              onClick={handleStart}
              className="group relative inline-flex items-center gap-3 px-8 py-4 rounded-full bg-gradient-to-r from-cyan-500 via-purple-500 to-pink-500 text-white font-semibold text-base shadow-[0_0_30px_rgba(0,240,255,0.4)] hover:shadow-[0_0_45px_rgba(255,0,170,0.6)] transition-all duration-300 transform hover:scale-105 active:scale-95 cursor-pointer"
            >
              <Compass className="w-5 h-5 transition-transform duration-300 group-hover:rotate-45" />
              <span>Begin Your Journey</span>
            </button>
          </motion.div>
        </div>
      </motion.div>
    </AnimatePresence>
  )
}
