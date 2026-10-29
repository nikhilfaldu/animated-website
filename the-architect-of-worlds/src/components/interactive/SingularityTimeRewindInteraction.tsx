'use client'

import React, { useRef, useState } from 'react'
import { useFrame, ThreeEvent } from '@react-three/fiber'
import * as THREE from 'three'
import { Html } from '@react-three/drei'
import { RotateCcw, Sparkles } from 'lucide-react'
import { useWorldStore } from '@/stores/useWorldStore'

export function SingularityTimeRewindInteraction() {
  const { activeWorld } = useWorldStore()
  const isActive = activeWorld === 'singularity'

  const coreRef = useRef<THREE.Group>(null!)
  const [hovered, setHovered] = useState(false)
  const [timeRewound, setTimeRewound] = useState(false)

  useFrame((state) => {
    const t = state.clock.elapsedTime
    if (coreRef.current) {
      coreRef.current.position.y = Math.sin(t * 1.5) * 0.15 + 1.2
      // Reverse spin when time is rewound!
      coreRef.current.rotation.y = timeRewound ? -t * 1.2 : t * 0.5
    }
  })

  const handleTouchSingularity = (e: ThreeEvent<MouseEvent>) => {
    e.stopPropagation()

    // 1. Play Gravitational Pitch-Bend Sub-Bass Sweep via Web Audio API
    try {
      const ctx = new AudioContext()
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()

      osc.type = 'sawtooth'
      osc.frequency.setValueAtTime(140, ctx.currentTime)
      osc.frequency.exponentialRampToValueAtTime(30, ctx.currentTime + 1.2) // Pitch bend drop

      gain.gain.setValueAtTime(0.4, ctx.currentTime)
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 1.3)

      osc.connect(gain).connect(ctx.destination)
      osc.start()
      osc.stop(ctx.currentTime + 1.3)
    } catch {
      // Audio fallback
    }

    setTimeRewound((prev) => !prev)
  }

  return (
    <group position={[0, 0, 0]}>
      {/* Event Horizon Time Core */}
      <group
        ref={coreRef}
        onPointerOver={(e) => {
          e.stopPropagation()
          setHovered(true)
        }}
        onPointerOut={() => setHovered(false)}
        onClick={handleTouchSingularity}
      >
        <mesh scale={hovered ? [1.25, 1.25, 1.25] : [1, 1, 1]}>
          <torusGeometry args={[0.4, 0.08, 16, 64]} />
          <meshStandardMaterial
            color={hovered ? '#FF0055' : '#7B2FBE'}
            emissive="#FF0055"
            emissiveIntensity={hovered ? 1.8 : 0.8}
            wireframe
          />
        </mesh>

        {(isActive || hovered) && (
          <Html position={[0, 0.6, 0]} center zIndexRange={[100, 0]}>
            <div
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-xs font-mono transition-all cursor-pointer ${
                hovered
                  ? 'bg-rose-500/30 border-rose-400 text-rose-200 shadow-[0_0_20px_rgba(255,0,85,0.8)] scale-110'
                  : 'bg-black/60 border-rose-500/40 text-rose-300'
              }`}
            >
              <RotateCcw className={`w-3.5 h-3.5 ${timeRewound ? 'animate-spin' : ''}`} style={{ animationDirection: 'reverse' }} />
              <span>{timeRewound ? 'TIME REVERSED' : 'TOUCH SINGULARITY'}</span>
            </div>
          </Html>
        )}
      </group>

      {/* Time Rewind Visual Notification */}
      {timeRewound && isActive && (
        <group position={[0, 1.8, 0]}>
          <Html position={[0, 0, 0]} center zIndexRange={[100, 0]}>
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-rose-950/90 border border-rose-400/80 text-xs font-mono text-rose-200 shadow-[0_0_25px_rgba(255,0,85,0.7)] animate-bounce">
              <Sparkles className="w-3.5 h-3.5 text-rose-300" />
              <span>Time Rewound & Reality Folded!</span>
            </div>
          </Html>
        </group>
      )}
    </group>
  )
}
