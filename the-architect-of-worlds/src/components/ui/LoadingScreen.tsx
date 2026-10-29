'use client'

import React, { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

interface LoadingScreenProps {
  isLoaded: boolean
}

const LoadingScreen: React.FC<LoadingScreenProps> = ({ isLoaded }) => {
  const [isVisible, setIsVisible] = useState(true)

  useEffect(() => {
    if (isLoaded) {
      // Auto-dismiss immediately when WebGL canvas is ready
      const timer = setTimeout(() => {
        setIsVisible(false)
      }, 300)
      return () => clearTimeout(timer)
    }
  }, [isLoaded])

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-black cursor-pointer pointer-events-auto select-none"
          onClick={() => setIsVisible(false)}
          exit={{ opacity: 0, scale: 1.05 }}
          transition={{ duration: 0.5, ease: 'easeInOut' }}
        >
          {/* Constellation Animation */}
          <div className="relative w-28 h-28 mb-6">
            <svg viewBox="0 0 100 100" className="w-full h-full animate-pulse">
              <line x1="20" y1="30" x2="50" y2="20" stroke="rgba(0, 240, 255, 0.4)" strokeWidth="0.8" />
              <line x1="50" y1="20" x2="80" y2="40" stroke="rgba(0, 240, 255, 0.4)" strokeWidth="0.8" />
              <line x1="80" y1="40" x2="60" y2="70" stroke="rgba(0, 240, 255, 0.4)" strokeWidth="0.8" />
              <line x1="60" y1="70" x2="30" y2="60" stroke="rgba(0, 240, 255, 0.4)" strokeWidth="0.8" />
              <line x1="30" y1="60" x2="20" y2="30" stroke="rgba(0, 240, 255, 0.4)" strokeWidth="0.8" />
              
              <circle cx="20" cy="30" r="2" fill="#00f0ff" className="animate-ping" style={{ animationDelay: '0s' }} />
              <circle cx="50" cy="20" r="2.5" fill="#ff00aa" className="animate-ping" style={{ animationDelay: '0.2s' }} />
              <circle cx="80" cy="40" r="2" fill="#00f0ff" className="animate-ping" style={{ animationDelay: '0.4s' }} />
              <circle cx="60" cy="70" r="3" fill="#a855f7" className="animate-ping" style={{ animationDelay: '0.6s' }} />
            </svg>
          </div>

          <div className="text-center space-y-2 font-mono">
            <div className="text-sm tracking-[0.2em] text-cyan-400 font-bold uppercase animate-pulse">
              Architect of Worlds
            </div>
            <div className="text-xs tracking-widest text-slate-400">
              {isLoaded ? 'Entering Cosmos...' : 'Initializing 3D WebGL Engine...'}
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

export default React.memo(LoadingScreen)
