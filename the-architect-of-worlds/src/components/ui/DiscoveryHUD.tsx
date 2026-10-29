'use client'

import React from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useWorldStore } from '@/stores/useWorldStore'
import { Bot } from 'lucide-react'

export default function DiscoveryHUD() {
  const { discoveredObjects, currentCoordinates, isIntroComplete, setNovaOpen, isNovaOpen } = useWorldStore()
  
  if (!isIntroComplete) return null

  const discoveredCount = Object.keys(discoveredObjects).length
  const totalCount = 10 // 6 core worlds + 4 anomalies
  const completionPercent = Math.round((discoveredCount / totalCount) * 100)
  
  let explorerLevel = 'NOVICE'
  if (completionPercent >= 50) explorerLevel = 'VOYAGER'
  if (completionPercent >= 100) explorerLevel = 'ARCHITECT'

  // Format coordinates nicely
  const coords = `${currentCoordinates.x.toFixed(0)} : ${currentCoordinates.y.toFixed(0)} : ${currentCoordinates.z.toFixed(0)}`

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="absolute top-6 left-6 z-40 pointer-events-auto flex flex-col gap-2"
      >
        <div className="bg-black/60 backdrop-blur-md border border-cyan-500/30 rounded-xl px-4 py-2 flex flex-col">
          <span className="text-[10px] uppercase tracking-[0.2em] text-cyan-400/70 font-semibold mb-1">
            Current Sector Coordinates
          </span>
          <span className="text-sm font-mono text-white/90">
            SEC-[ {coords} ]
          </span>
        </div>

        <div className="bg-black/60 backdrop-blur-md border border-cyan-500/30 rounded-xl px-4 py-2 flex flex-col gap-1">
          <div className="flex justify-between items-baseline gap-4">
            <span className="text-[10px] uppercase tracking-[0.2em] text-cyan-400/70 font-semibold">
              Discovery Sync
            </span>
            <span className="text-xs text-white/50 font-mono">
              {completionPercent}%
            </span>
          </div>
          <div className="w-full h-1 bg-white/10 rounded-full overflow-hidden">
            <div 
              className="h-full bg-cyan-400 transition-all duration-1000"
              style={{ width: `${completionPercent}%` }}
            />
          </div>
          <div className="flex justify-between items-center mt-1">
            <span className="text-[10px] text-white/40 tracking-widest font-heading">RANK:</span>
            <span className={`text-xs tracking-widest font-heading ${explorerLevel === 'ARCHITECT' ? 'text-yellow-400 text-glow' : 'text-white'}`}>{explorerLevel}</span>
          </div>
        </div>

        {/* Top HUD Nova Trigger Button */}
        <button
          onClick={() => setNovaOpen(!isNovaOpen)}
          className="flex items-center justify-between gap-2 px-4 py-2 rounded-xl bg-cyan-600/30 hover:bg-cyan-600/50 border border-cyan-400/50 text-cyan-200 font-mono text-xs tracking-wider transition-all cursor-pointer shadow-[0_0_15px_rgba(0,240,255,0.3)]"
        >
          <div className="flex items-center gap-2">
            <Bot className="w-4 h-4 text-cyan-300 animate-pulse" />
            <span>Consult Nova AI</span>
          </div>
          <span className="text-[10px] text-cyan-400 font-bold">→</span>
        </button>
      </motion.div>
    </AnimatePresence>
  )
}
