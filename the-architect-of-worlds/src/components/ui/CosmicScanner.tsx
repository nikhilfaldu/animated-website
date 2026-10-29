'use client'

import React, { useState } from 'react'
import { motion } from 'framer-motion'
import { useWorldStore } from '@/stores/useWorldStore'
import { WORLDS } from '@/config/worlds'

interface CosmicScannerProps {
  onClose: () => void
}

export default function CosmicScanner({ onClose }: CosmicScannerProps) {
  const { navigateToWorld, navigateToObject, discoveredObjects } = useWorldStore()
  const [query, setQuery] = useState('')

  // Build a searchable list of all entities
  const allEntities = [
    ...Object.values(WORLDS).map(w => ({
      id: w.id,
      name: w.name,
      type: 'planet',
      isDiscovered: true, // Core worlds are always known
      action: () => navigateToWorld(w.id)
    })),
    ...Object.values(discoveredObjects).map(obj => ({
      id: obj.id,
      name: obj.name,
      type: obj.type,
      isDiscovered: true,
      action: () => navigateToObject(obj)
    }))
  ]

  // Filter based on query
  const results = allEntities.filter(e => e.name.toLowerCase().includes(query.toLowerCase()) || e.type.toLowerCase().includes(query.toLowerCase()))

  return (
    <motion.div 
      initial={{ opacity: 0, y: 50, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 20, scale: 0.95 }}
      className="absolute bottom-20 left-1/2 -translate-x-1/2 w-[500px] bg-black/60 backdrop-blur-2xl border border-cyan-500/30 rounded-2xl shadow-[0_0_50px_rgba(0,255,255,0.1)] overflow-hidden z-50 flex flex-col"
    >
      <div className="absolute top-0 left-0 w-full h-[1px] bg-cyan-400/50 shadow-[0_0_10px_#00ffff] animate-scanline pointer-events-none" />

      {/* Header / Input */}
      <div className="p-4 border-b border-white/10 flex items-center gap-3">
        <span className="text-cyan-400 font-mono animate-pulse">⎈</span>
        <input 
          autoFocus
          type="text"
          placeholder="SEARCH COSMIC DATABASE..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="bg-transparent border-none outline-none text-white font-heading tracking-widest text-sm flex-1 placeholder:text-white/30"
        />
        <button onClick={onClose} className="text-white/50 hover:text-white">✕</button>
      </div>

      {/* Results */}
      <div className="max-h-[300px] overflow-y-auto custom-scrollbar p-2 flex flex-col gap-1">
        {results.length > 0 ? (
          results.map(entity => (
            <button
              key={entity.id}
              onClick={() => {
                entity.action()
                onClose()
              }}
              className="flex items-center justify-between w-full text-left p-3 rounded-lg hover:bg-white/10 transition-colors group"
            >
              <div className="flex flex-col">
                <span className="text-white font-heading tracking-wider group-hover:text-cyan-300 transition-colors">{entity.name}</span>
                <span className="text-[10px] text-white/40 uppercase tracking-[0.2em] font-mono">{entity.type}</span>
              </div>
              <span className="text-xs text-cyan-500/50 group-hover:text-cyan-400 font-mono tracking-widest">
                [ TARGET ]
              </span>
            </button>
          ))
        ) : (
          <div className="p-8 text-center text-white/40 font-mono text-sm tracking-widest">
            NO SIGNATURES DETECTED
          </div>
        )}
      </div>
    </motion.div>
  )
}
