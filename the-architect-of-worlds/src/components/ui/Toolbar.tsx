'use client'

import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useWorldStore } from '@/stores/useWorldStore'
import CosmicScanner from './CosmicScanner'
import { Sparkles, Globe, Bot } from 'lucide-react'

export default function Toolbar() {
  const {
    isIntroComplete,
    photoMode,
    setPhotoMode,
    autoTour,
    setAutoTour,
    viewMode,
    setViewMode,
    setNovaOpen,
    isNovaOpen,
  } = useWorldStore()
  const [scannerOpen, setScannerOpen] = useState(false)

  if (!isIntroComplete) return null

  if (photoMode) {
    return (
      <div className="absolute bottom-6 right-6 z-50 pointer-events-auto">
        <button 
          onClick={() => setPhotoMode(false)}
          className="px-4 py-2 bg-black/80 hover:bg-white/20 border border-white/40 rounded-xl text-white font-mono text-xs tracking-widest backdrop-blur-md transition-all cursor-pointer shadow-[0_0_20px_rgba(255,255,255,0.2)]"
        >
          [ EXIT PHOTO MODE ]
        </button>
      </div>
    )
  }

  return (
    <>
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="absolute bottom-6 left-1/2 -translate-x-1/2 z-40 flex items-center gap-2 pointer-events-auto"
      >
        {/* Mode Switcher */}
        <button
          onClick={() => setViewMode(viewMode === 'universe' ? 'garden' : 'universe')}
          className="px-4 py-2 bg-gradient-to-r from-cyan-600/40 to-purple-600/40 hover:from-cyan-500/60 hover:to-purple-500/60 border border-cyan-400/50 rounded-xl text-cyan-200 font-mono text-xs tracking-wider backdrop-blur-md transition-all shadow-[0_0_20px_rgba(0,240,255,0.3)] flex items-center gap-2 cursor-pointer"
        >
          {viewMode === 'universe' ? (
            <>
              <Sparkles className="w-3.5 h-3.5 text-pink-400" />
              <span>GALACTIC GARDEN</span>
            </>
          ) : (
            <>
              <Globe className="w-3.5 h-3.5 text-cyan-400" />
              <span>3D UNIVERSE</span>
            </>
          )}
        </button>

        {/* Persistent Nova AI Trigger Button */}
        <button
          onClick={() => setNovaOpen(!isNovaOpen)}
          className={`px-4 py-2 bg-gradient-to-r from-purple-600/40 to-pink-600/40 hover:from-purple-500/60 hover:to-pink-500/60 border ${
            isNovaOpen ? 'border-pink-400 text-pink-200' : 'border-purple-400/50 text-purple-200'
          } rounded-xl font-mono text-xs tracking-wider backdrop-blur-md transition-all shadow-[0_0_20px_rgba(168,85,247,0.3)] flex items-center gap-2 cursor-pointer`}
        >
          <Bot className="w-4 h-4 text-purple-300 animate-pulse" />
          <span>ASK NOVA AI</span>
        </button>

        {viewMode === 'universe' && (
          <>
            <button 
              onClick={() => setScannerOpen(!scannerOpen)}
              className={`px-5 py-2 bg-black/40 hover:bg-white/10 border ${scannerOpen ? 'border-cyan-400 text-cyan-300' : 'border-white/20 text-white'} rounded-xl font-heading text-xs tracking-[0.2em] backdrop-blur-md transition-all cursor-pointer`}
            >
              SCANNER
            </button>
            <button 
              onClick={() => setAutoTour(!autoTour)}
              className={`px-5 py-2 bg-black/40 hover:bg-white/10 border ${autoTour ? 'border-purple-400 text-purple-300' : 'border-white/20 text-white'} rounded-xl font-heading text-xs tracking-[0.2em] backdrop-blur-md transition-all cursor-pointer`}
            >
              AUTO TOUR
            </button>
            <button 
              onClick={() => setPhotoMode(true)}
              className="px-5 py-2 bg-black/40 hover:bg-white/10 border border-white/20 rounded-xl text-white font-heading text-xs tracking-[0.2em] backdrop-blur-md transition-all cursor-pointer"
            >
              PHOTO MODE
            </button>
          </>
        )}
      </motion.div>

      <AnimatePresence>
        {scannerOpen && <CosmicScanner onClose={() => setScannerOpen(false)} />}
      </AnimatePresence>
    </>
  )
}
