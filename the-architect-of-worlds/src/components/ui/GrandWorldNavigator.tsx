'use client'

import React from 'react'
import { motion } from 'framer-motion'
import { useWorldStore } from '@/stores/useWorldStore'
import { WORLDS, WORLD_ORDER } from '@/config/worlds'
import { Bot, Sparkles, Globe, X } from 'lucide-react'
import type { WorldId } from '@/types'
import * as THREE from 'three'

export function GrandWorldNavigator() {
  const { activeWorld, activeObject, navigateToWorld, navigateToObject, closeDetail, setNovaOpen, isNovaOpen, setViewMode, viewMode } = useWorldStore()

  const worldIcons: Record<string, string> = {
    nexus: '☀️',
    emerald: '🌍',
    forge: '🌋',
    ocean: '🌊',
    crystal: '💎',
    singularity: '🕳️',
  }

  const isUniverseActive = activeObject?.id === 'universe-overview'
  const isAnyFocusActive = activeWorld !== null || activeObject !== null

  const handleOpenUniverseSection = () => {
    navigateToObject({
      id: 'universe-overview',
      name: 'The Architect Universe',
      type: 'universe',
      position: new THREE.Vector3(0, 0, 0),
    })
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: -30 }}
      animate={{ opacity: 1, y: 0 }}
      className="fixed top-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-black/85 border border-cyan-500/40 backdrop-blur-2xl shadow-[0_0_50px_rgba(0,240,255,0.35)] pointer-events-auto select-none"
    >
      {/* 1. Universe Overview Pill */}
      <button
        onClick={handleOpenUniverseSection}
        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-mono text-xs font-bold transition-all cursor-pointer ${
          isUniverseActive
            ? 'bg-gradient-to-r from-cyan-500/30 to-purple-600/30 border border-cyan-400 text-cyan-200 shadow-[0_0_15px_rgba(0,240,255,0.5)] scale-105'
            : 'bg-slate-900/80 border border-cyan-500/30 text-cyan-300 hover:bg-cyan-500/20'
        }`}
      >
        <Globe className="w-3.5 h-3.5 text-cyan-300 animate-pulse" />
        <span className="uppercase text-[11px]">UNIVERSE</span>
      </button>

      {/* 2. World Selector Pills */}
      <div className="flex items-center gap-1.5 border-r border-slate-800 pr-3 border-l pl-2">
        {WORLD_ORDER.map((id) => {
          const world = WORLDS[id]
          const isActive = activeWorld === id && !isUniverseActive
          const icon = worldIcons[id] || '🪐'

          return (
            <button
              key={id}
              onClick={() => navigateToWorld(id as WorldId)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-mono text-xs font-bold transition-all cursor-pointer ${
                isActive
                  ? 'bg-cyan-500/20 border border-cyan-400 text-cyan-200 shadow-[0_0_15px_rgba(0,240,255,0.4)] scale-105'
                  : 'bg-slate-900/60 border border-slate-800 text-slate-400 hover:text-white hover:border-slate-700'
              }`}
            >
              <span>{icon}</span>
              <span className="uppercase text-[11px]">{world.name}</span>
            </button>
          )
        })}
      </div>

      {/* 3. Exit Focus / Overview Reset Button */}
      {isAnyFocusActive && (
        <button
          onClick={closeDetail}
          className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-rose-950/60 hover:bg-rose-900/80 border border-rose-500/50 text-rose-200 font-mono text-xs font-bold transition-all cursor-pointer shadow-[0_0_15px_rgba(244,63,94,0.3)]"
        >
          <X className="w-3.5 h-3.5 text-rose-300" />
          <span className="uppercase text-[10px]">EXIT FOCUS</span>
        </button>
      )}

      {/* 4. Ask Nova AI Trigger */}
      <button
        onClick={() => setNovaOpen(!isNovaOpen)}
        className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl font-mono text-xs font-bold transition-all cursor-pointer ${
          isNovaOpen
            ? 'bg-purple-600/30 border border-purple-400 text-purple-200 shadow-[0_0_20px_rgba(168,85,247,0.5)] scale-105'
            : 'bg-slate-900/80 border border-purple-500/40 text-purple-300 hover:bg-purple-600/20'
        }`}
      >
        <Bot className="w-4 h-4 text-purple-300 animate-pulse" />
        <span>ASK NOVA</span>
      </button>

      {/* 5. Mode Switcher (Universe vs Garden) */}
      <button
        onClick={() => setViewMode(viewMode === 'universe' ? 'garden' : 'universe')}
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900/80 border border-pink-500/40 text-pink-300 font-mono text-xs font-bold hover:bg-pink-600/20 transition-all cursor-pointer ml-1"
      >
        <Sparkles className="w-3.5 h-3.5 text-pink-400" />
        <span>{viewMode === 'universe' ? 'GARDEN' : '3D SPACE'}</span>
      </button>
    </motion.div>
  )
}
