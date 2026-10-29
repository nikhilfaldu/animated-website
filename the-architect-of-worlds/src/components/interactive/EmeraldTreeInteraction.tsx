'use client'

import React, { useRef, useState } from 'react'
import { useFrame, ThreeEvent } from '@react-three/fiber'
import * as THREE from 'three'
import { Html } from '@react-three/drei'
import { Sprout, Sparkles } from 'lucide-react'
import { useWorldStore } from '@/stores/useWorldStore'

export function EmeraldTreeInteraction() {
  const { activeWorld } = useWorldStore()
  const isActive = activeWorld === 'emerald'

  const seedRef = useRef<THREE.Group>(null!)
  const treeRef = useRef<THREE.Group>(null!)
  const [hovered, setHovered] = useState(false)
  const [treeGrown, setTreeGrown] = useState(false)
  const [growthScale, setGrowthScale] = useState(0)

  useFrame((state, delta) => {
    const t = state.clock.elapsedTime
    if (seedRef.current) {
      seedRef.current.position.y = Math.sin(t * 1.5) * 0.12 + 1.5
      seedRef.current.rotation.y = t * 0.5
    }

    if (treeGrown && growthScale < 1) {
      setGrowthScale((prev) => Math.min(1, prev + delta * 0.8))
    }

    if (treeRef.current && treeGrown) {
      treeRef.current.rotation.y = t * 0.2
    }
  })

  const handlePlantSeed = (e: ThreeEvent<MouseEvent>) => {
    e.stopPropagation()

    // 1. Play Bio-Growth Shimmer Synth via Web Audio API
    try {
      const ctx = new AudioContext()
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()

      osc.type = 'sine'
      osc.frequency.setValueAtTime(440, ctx.currentTime)
      osc.frequency.exponentialRampToValueAtTime(1760, ctx.currentTime + 0.6)

      gain.gain.setValueAtTime(0.2, ctx.currentTime)
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.7)

      osc.connect(gain).connect(ctx.destination)
      osc.start()
      osc.stop(ctx.currentTime + 0.7)
    } catch {
      // Audio fallback
    }

    setTreeGrown(true)
  }

  return (
    <group position={[0, 0, 0]}>
      {/* Seed Pod Interaction */}
      {!treeGrown && (
        <group
          ref={seedRef}
          onPointerOver={(e) => {
            e.stopPropagation()
            setHovered(true)
          }}
          onPointerOut={() => setHovered(false)}
          onClick={handlePlantSeed}
        >
          <mesh scale={hovered ? [1.2, 1.2, 1.2] : [1, 1, 1]}>
            <dodecahedronGeometry args={[0.25, 1]} />
            <meshStandardMaterial
              color={hovered ? '#7DFFC4' : '#00D68F'}
              emissive="#00FF99"
              emissiveIntensity={hovered ? 1.4 : 0.6}
              roughness={0.2}
            />
          </mesh>

          {(isActive || hovered) && (
            <Html position={[0, 0.5, 0]} center zIndexRange={[100, 0]}>
              <div
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-xs font-mono transition-all cursor-pointer ${
                  hovered
                    ? 'bg-emerald-500/30 border-emerald-400 text-emerald-200 shadow-[0_0_20px_rgba(0,255,150,0.8)] scale-110'
                    : 'bg-black/60 border-emerald-500/40 text-emerald-300'
                }`}
              >
                <Sprout className="w-3.5 h-3.5 animate-bounce text-emerald-400" />
                <span>PLANT ANCIENT SEED</span>
              </div>
            </Html>
          )}
        </group>
      )}

      {/* Sprouting Magical Tree */}
      {treeGrown && (
        <group ref={treeRef} position={[0, 1.2, 0]} scale={[growthScale, growthScale, growthScale]}>
          {/* Tree Trunk */}
          <mesh position={[0, 0.4, 0]}>
            <cylinderGeometry args={[0.08, 0.18, 0.8, 16]} />
            <meshStandardMaterial color="#3d2314" roughness={0.8} />
          </mesh>

          {/* Bioluminescent Emerald Foliage */}
          <mesh position={[0, 1.0, 0]}>
            <dodecahedronGeometry args={[0.55, 2]} />
            <meshStandardMaterial
              color="#00FF99"
              emissive="#00D68F"
              emissiveIntensity={0.8}
              roughness={0.3}
              wireframe={false}
            />
          </mesh>

          {/* Upper Glowing Canopy */}
          <mesh position={[0, 1.4, 0]}>
            <dodecahedronGeometry args={[0.35, 2]} />
            <meshStandardMaterial color="#7DFFC4" emissive="#7DFFC4" emissiveIntensity={1.0} />
          </mesh>

          {isActive && (
            <Html position={[0, 2.0, 0]} center zIndexRange={[100, 0]}>
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-950/80 border border-emerald-400/60 text-xs font-mono text-emerald-200 shadow-[0_0_20px_rgba(0,255,150,0.5)]">
                <Sparkles className="w-3.5 h-3.5 text-emerald-300" />
                <span>Magical Tree Sprouted!</span>
              </div>
            </Html>
          )}
        </group>
      )}
    </group>
  )
}
