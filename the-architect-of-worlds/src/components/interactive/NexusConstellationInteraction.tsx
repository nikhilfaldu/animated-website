'use client'

import React, { useRef, useState } from 'react'
import { useFrame, ThreeEvent } from '@react-three/fiber'
import * as THREE from 'three'
import { Html } from '@react-three/drei'
import { Sparkles, Orbit } from 'lucide-react'
import { useWorldStore } from '@/stores/useWorldStore'

export function NexusConstellationInteraction() {
  const { activeWorld } = useWorldStore()
  const isActive = activeWorld === 'nexus'

  const nodeGroupRef = useRef<THREE.Group>(null!)
  const galaxyRef = useRef<THREE.Points>(null!)
  const [hovered, setHovered] = useState(false)
  const [galaxyForged, setGalaxyForged] = useState(false)

  useFrame((state) => {
    const t = state.clock.elapsedTime
    if (nodeGroupRef.current) {
      nodeGroupRef.current.position.y = Math.sin(t * 1.5) * 0.15 + 2.2
      nodeGroupRef.current.rotation.y = t * 0.3
    }

    if (galaxyRef.current && galaxyForged) {
      galaxyRef.current.rotation.y = t * 0.4
    }
  })

  const handleStretchConstellation = (e: ThreeEvent<MouseEvent>) => {
    e.stopPropagation()

    // 1. Play Sacred Geometry Harmonic Synth via Web Audio API
    try {
      const ctx = new AudioContext()
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()

      osc.type = 'sine'
      osc.frequency.setValueAtTime(440, ctx.currentTime) // A4 fundamental
      osc.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.8) // A5 octave

      gain.gain.setValueAtTime(0.3, ctx.currentTime)
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.9)

      osc.connect(gain).connect(ctx.destination)
      osc.start()
      osc.stop(ctx.currentTime + 0.9)
    } catch {
      // Audio fallback
    }

    setGalaxyForged(true)
  }

  // Generate 800 golden galaxy spiral particles
  const galaxyPositions = React.useMemo(() => {
    const count = 800
    const pos = new Float32Array(count * 3)
    for (let i = 0; i < count; i++) {
      const r = (i / count) * 3.5
      const theta = i * 0.15
      pos[i * 3] = Math.cos(theta) * r
      pos[i * 3 + 1] = (Math.random() - 0.5) * 0.3
      pos[i * 3 + 2] = Math.sin(theta) * r
    }
    return pos
  }, [])

  return (
    <group position={[0, 0, 0]}>
      {/* Interactive Constellation Nodes */}
      <group
        ref={nodeGroupRef}
        onPointerOver={(e) => {
          e.stopPropagation()
          setHovered(true)
        }}
        onPointerOut={() => setHovered(false)}
        onClick={handleStretchConstellation}
      >
        <mesh scale={hovered ? [1.2, 1.2, 1.2] : [1, 1, 1]}>
          <octahedronGeometry args={[0.3]} />
          <meshStandardMaterial
            color={hovered ? '#FFE066' : '#FFB800'}
            emissive="#FF8C00"
            emissiveIntensity={hovered ? 1.6 : 0.7}
            wireframe
          />
        </mesh>

        {(isActive || hovered) && (
          <Html position={[0, 0.5, 0]} center zIndexRange={[100, 0]}>
            <div
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-xs font-mono transition-all cursor-pointer ${
                hovered
                  ? 'bg-amber-500/30 border-amber-400 text-amber-200 shadow-[0_0_20px_rgba(255,184,0,0.8)] scale-110'
                  : 'bg-black/60 border-amber-500/40 text-amber-300'
              }`}
            >
              <Orbit className="w-3.5 h-3.5 animate-spin text-amber-300" style={{ animationDuration: '8s' }} />
              <span>STRETCH CONSTELLATION</span>
            </div>
          </Html>
        )}
      </group>

      {/* Swirling Golden Spiral Galaxy */}
      {galaxyForged && (
        <group position={[0, 2.2, 0]}>
          <points ref={galaxyRef}>
            <bufferGeometry>
              <bufferAttribute attach="attributes-position" args={[galaxyPositions, 3]} />
            </bufferGeometry>
            <pointsMaterial
              size={0.05}
              color="#FFD700"
              transparent
              opacity={0.9}
              blending={THREE.AdditiveBlending}
            />
          </points>

          {isActive && (
            <Html position={[0, 1.2, 0]} center zIndexRange={[100, 0]}>
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-amber-950/80 border border-amber-400/60 text-xs font-mono text-amber-200 shadow-[0_0_20px_rgba(255,215,0,0.6)]">
                <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                <span>Golden Spiral Galaxy Forged!</span>
              </div>
            </Html>
          )}
        </group>
      )}
    </group>
  )
}
