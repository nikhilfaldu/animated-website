'use client'

import React, { useRef, useState } from 'react'
import { useFrame, ThreeEvent } from '@react-three/fiber'
import * as THREE from 'three'
import { Html } from '@react-three/drei'
import { Gem, Sparkles } from 'lucide-react'
import { useWorldStore } from '@/stores/useWorldStore'

export function CrystalRefractionInteraction() {
  const { activeWorld } = useWorldStore()
  const isActive = activeWorld === 'crystal'

  const crystalRef = useRef<THREE.Group>(null!)
  const beamsRef = useRef<THREE.Group>(null!)
  const [hovered, setHovered] = useState(false)
  const [illuminated, setIlluminated] = useState(false)

  useFrame((state) => {
    const t = state.clock.elapsedTime
    if (crystalRef.current) {
      crystalRef.current.position.y = Math.sin(t * 1.5) * 0.12 + 1.4
      crystalRef.current.rotation.y = t * 0.3
    }

    if (beamsRef.current && illuminated) {
      beamsRef.current.rotation.z = t * 0.2
      beamsRef.current.rotation.y = t * 0.1
    }
  })

  const handleTouchCrystal = (e: ThreeEvent<MouseEvent>) => {
    e.stopPropagation()

    // 1. Play High C6 Resonance Glass Chime via Web Audio API
    try {
      const ctx = new AudioContext()
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()

      osc.type = 'sine'
      osc.frequency.setValueAtTime(1046.5, ctx.currentTime) // High C6 glass resonance
      osc.frequency.exponentialRampToValueAtTime(2093.0, ctx.currentTime + 0.8)

      gain.gain.setValueAtTime(0.25, ctx.currentTime)
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 1.0)

      osc.connect(gain).connect(ctx.destination)
      osc.start()
      osc.stop(ctx.currentTime + 1.0)
    } catch {
      // Audio fallback
    }

    setIlluminated(true)
  }

  return (
    <group position={[0, 0, 0]}>
      {/* Interactive Crystal Spire */}
      <group
        ref={crystalRef}
        onPointerOver={(e) => {
          e.stopPropagation()
          setHovered(true)
        }}
        onPointerOut={() => setHovered(false)}
        onClick={handleTouchCrystal}
      >
        <mesh scale={hovered ? [1.25, 1.25, 1.25] : [1, 1, 1]}>
          <octahedronGeometry args={[0.35]} />
          <meshStandardMaterial
            color={hovered ? '#F0E6FF' : '#9B5DE5'}
            emissive="#E0B0FF"
            emissiveIntensity={hovered ? 1.6 : 0.7}
            roughness={0.1}
            metalness={0.9}
          />
        </mesh>

        {(isActive || hovered) && (
          <Html position={[0, 0.6, 0]} center zIndexRange={[100, 0]}>
            <div
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-xs font-mono transition-all cursor-pointer ${
                hovered
                  ? 'bg-purple-500/30 border-purple-400 text-purple-200 shadow-[0_0_20px_rgba(224,176,255,0.8)] scale-110'
                  : 'bg-black/60 border-purple-500/40 text-purple-300'
              }`}
            >
              <Gem className="w-3.5 h-3.5 animate-bounce text-purple-300" />
              <span>TOUCH CRYSTAL SPIRE</span>
            </div>
          </Html>
        )}
      </group>

      {/* Spectral Light Refraction Beams */}
      {illuminated && (
        <group ref={beamsRef} position={[0, 1.4, 0]}>
          {[0, 60, 120, 180, 240, 300].map((angle, i) => (
            <mesh
              key={i}
              rotation={[0, 0, (angle * Math.PI) / 180]}
              position={[Math.cos((angle * Math.PI) / 180) * 0.8, Math.sin((angle * Math.PI) / 180) * 0.8, 0]}
            >
              <cylinderGeometry args={[0.01, 0.04, 1.6, 8]} />
              <meshStandardMaterial
                color={['#FF007F', '#9B5DE5', '#00FFFF', '#7DFFC4', '#FFD700', '#FF4500'][i]}
                emissive={['#FF007F', '#9B5DE5', '#00FFFF', '#7DFFC4', '#FFD700', '#FF4500'][i]}
                emissiveIntensity={1.2}
                transparent
                opacity={0.85}
              />
            </mesh>
          ))}

          {isActive && (
            <Html position={[0, 1.2, 0]} center zIndexRange={[100, 0]}>
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-purple-950/80 border border-purple-400/60 text-xs font-mono text-purple-200 shadow-[0_0_20px_rgba(224,176,255,0.6)]">
                <Sparkles className="w-3.5 h-3.5 text-purple-300" />
                <span>Crystal Cavern Illuminated!</span>
              </div>
            </Html>
          )}
        </group>
      )}
    </group>
  )
}
