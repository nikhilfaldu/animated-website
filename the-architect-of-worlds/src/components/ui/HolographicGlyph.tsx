'use client'

import React from 'react'
import { Html } from '@react-three/drei'
import { WorldId } from '@/types'
import { WORLDS } from '@/config/worlds'
import { useWorldStore } from '@/stores/useWorldStore'
import { Sparkles } from 'lucide-react'

interface HolographicGlyphProps {
  worldId: WorldId
  position: [number, number, number]
}

export function HolographicGlyph({ worldId, position }: HolographicGlyphProps) {
  const { hoveredWorld, activeWorld } = useWorldStore()
  const isHovered = hoveredWorld === worldId
  const isActive = activeWorld === worldId
  const config = WORLDS[worldId]

  if (!config) return null

  return (
    <group position={position}>
      <Html center zIndexRange={[100, 0]}>
        <div
          className={`flex flex-col items-center gap-1 font-mono transition-all duration-500 pointer-events-none ${
            isHovered || isActive ? 'opacity-100 scale-100 translate-y-0' : 'opacity-0 scale-90 translate-y-3'
          }`}
        >
          {/* Holographic Beam Pointer */}
          <div
            className="w-0.5 h-6 animate-pulse"
            style={{ background: `linear-gradient(to bottom, transparent, ${config.colors.accent})` }}
          />

          {/* Holographic Badge */}
          <div
            className="px-4 py-2 rounded-2xl bg-black/70 border backdrop-blur-xl shadow-[0_0_30px_rgba(0,240,255,0.4)] flex flex-col items-center text-center"
            style={{ borderColor: `${config.colors.primary}88` }}
          >
            <div className="flex items-center gap-1.5 text-[10px] text-cyan-300 uppercase tracking-widest">
              <Sparkles className="w-3 h-3 text-cyan-400" />
              <span>{config.subtitle}</span>
            </div>
            <h3
              className="text-base font-extrabold font-heading tracking-widest text-transparent bg-clip-text bg-gradient-to-r from-white via-cyan-100 to-purple-200"
              style={{ textShadow: `0 0 15px ${config.colors.primary}99` }}
            >
              {config.name}
            </h3>
          </div>
        </div>
      </Html>
    </group>
  )
}
