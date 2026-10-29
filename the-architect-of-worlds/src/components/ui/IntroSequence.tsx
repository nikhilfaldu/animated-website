'use client'

import React, { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useWorldStore } from '@/stores/useWorldStore'
import { Sparkles, Heart } from 'lucide-react'

export default function IntroSequence() {
  const { isIntroStarted, isIntroComplete, completeIntro } = useWorldStore()
  const [step, setStep] = useState(0)

  useEffect(() => {
    if (!isIntroStarted || isIntroComplete) return

    // Play heartbeat audio pulse
    try {
      const ctx = new AudioContext()
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()

      osc.type = 'sine'
      osc.frequency.setValueAtTime(60, ctx.currentTime)
      osc.frequency.exponentialRampToValueAtTime(30, ctx.currentTime + 0.5)

      gain.gain.setValueAtTime(0.3, ctx.currentTime)
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.6)

      osc.connect(gain).connect(ctx.destination)
      osc.start()
      osc.stop(ctx.currentTime + 0.6)
    } catch {
      // Audio fallback
    }

    const t1 = setTimeout(() => setStep(1), 1500) // "Every world begins with imagination..."
    const t2 = setTimeout(() => setStep(2), 5500) // "Creation requires curiosity..."
    const t3 = setTimeout(() => setStep(3), 9500) // "You were invited here for a reason."
    const t4 = setTimeout(() => {
      setStep(4)
      completeIntro()
    }, 13500) // Complete intro and release camera to workshop framing

    return () => {
      clearTimeout(t1)
      clearTimeout(t2)
      clearTimeout(t3)
      clearTimeout(t4)
    }
  }, [isIntroStarted, isIntroComplete, completeIntro])

  if (!isIntroStarted || isIntroComplete) return null

  return (
    <div className="fixed inset-0 pointer-events-auto z-50 bg-black flex items-center justify-center p-6 select-none">
      <AnimatePresence mode="wait">
        {step === 0 && (
          <motion.div
            key="step0"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex flex-col items-center gap-3 text-cyan-400/60 font-mono text-xs uppercase tracking-widest"
          >
            <Heart className="w-6 h-6 animate-pulse text-cyan-400" />
            <span>Awakening Cosmic Workshop Heartbeat...</span>
          </motion.div>
        )}

        {step === 1 && (
          <motion.div
            key="step1"
            initial={{ opacity: 0, filter: 'blur(12px)', y: 20 }}
            animate={{ opacity: 1, filter: 'blur(0px)', y: 0 }}
            exit={{ opacity: 0, filter: 'blur(12px)', y: -20 }}
            transition={{ duration: 1.8, ease: 'easeInOut' }}
            className="text-center max-w-xl space-y-3"
          >
            <span className="text-[10px] font-mono uppercase tracking-[0.3em] text-cyan-400 font-bold block">
              Architect Transmission I
            </span>
            <h1 className="text-3xl md:text-5xl font-heading text-white tracking-widest text-glow font-serif italic">
              "Every world begins with imagination."
            </h1>
          </motion.div>
        )}

        {step === 2 && (
          <motion.div
            key="step2"
            initial={{ opacity: 0, filter: 'blur(12px)', y: 20 }}
            animate={{ opacity: 1, filter: 'blur(0px)', y: 0 }}
            exit={{ opacity: 0, filter: 'blur(12px)', y: -20 }}
            transition={{ duration: 1.8, ease: 'easeInOut' }}
            className="text-center max-w-xl space-y-3"
          >
            <span className="text-[10px] font-mono uppercase tracking-[0.3em] text-purple-400 font-bold block">
              Architect Transmission II
            </span>
            <h1 className="text-3xl md:text-5xl font-heading text-purple-200 tracking-widest text-glow font-serif italic">
              "Creation requires curiosity."
            </h1>
          </motion.div>
        )}

        {step === 3 && (
          <motion.div
            key="step3"
            initial={{ opacity: 0, filter: 'blur(12px)', scale: 0.95 }}
            animate={{ opacity: 1, filter: 'blur(0px)', scale: 1 }}
            exit={{ opacity: 0, filter: 'blur(12px)', scale: 1.05 }}
            transition={{ duration: 1.8, ease: 'easeInOut' }}
            className="text-center max-w-2xl space-y-4"
          >
            <span className="text-[10px] font-mono uppercase tracking-[0.3em] text-cyan-300 font-bold flex items-center justify-center gap-2">
              <Sparkles className="w-4 h-4 text-cyan-400 animate-spin" />
              Architect Transmission III
            </span>
            <h1 className="text-3xl md:text-6xl font-heading text-transparent bg-clip-text bg-gradient-to-r from-cyan-200 via-white to-purple-300 tracking-widest text-glow font-serif italic">
              "You were invited here for a reason."
            </h1>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Skip Button */}
      <button
        onClick={() => {
          setStep(4)
          completeIntro()
        }}
        className="absolute bottom-10 right-10 px-4 py-2 rounded-full bg-slate-900/60 hover:bg-slate-800 border border-slate-700/60 text-xs font-mono text-slate-400 hover:text-white transition-colors cursor-pointer"
      >
        SKIP INTRO →
      </button>
    </div>
  )
}
