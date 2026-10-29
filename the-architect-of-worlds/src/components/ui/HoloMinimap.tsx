'use client'

import React from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useWorldStore } from '@/stores/useWorldStore'

export default function HoloMinimap() {
  const { isIntroComplete } = useWorldStore()
  
  if (!isIntroComplete) return null

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        className="absolute bottom-6 right-6 z-40 pointer-events-none"
      >
        <div className="relative w-32 h-32 bg-black/40 backdrop-blur-md border border-cyan-500/30 rounded-full overflow-hidden flex items-center justify-center">
          {/* Radar Sweep */}
          <div className="absolute inset-0 border border-cyan-500/20 rounded-full" />
          <div className="absolute inset-4 border border-cyan-500/10 rounded-full" />
          <div className="absolute inset-8 border border-cyan-500/5 rounded-full" />
          
          <motion.div 
            animate={{ rotate: 360 }}
            transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
            className="absolute inset-0"
            style={{
              background: 'conic-gradient(from 0deg, transparent 0deg, rgba(34,211,238,0.3) 90deg, transparent 90deg)'
            }}
          />
          
          {/* Fake anomalies blips */}
          <div className="absolute top-[20%] left-[30%] w-1.5 h-1.5 bg-cyan-400 rounded-full animate-pulse shadow-[0_0_5px_#22d3ee]" />
          <div className="absolute bottom-[30%] right-[20%] w-1 h-1 bg-cyan-400 rounded-full animate-pulse shadow-[0_0_5px_#22d3ee]" />
          
          {/* Center */}
          <div className="absolute w-2 h-2 bg-white rounded-full shadow-[0_0_10px_#fff]" />
          
          {/* Crosshairs */}
          <div className="absolute w-full h-[1px] bg-cyan-500/20" />
          <div className="absolute h-full w-[1px] bg-cyan-500/20" />
        </div>
      </motion.div>
    </AnimatePresence>
  )
}
