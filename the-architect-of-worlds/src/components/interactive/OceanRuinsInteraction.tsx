'use client'

import React, { useRef, useState } from 'react'
import { useFrame, ThreeEvent } from '@react-three/fiber'
import * as THREE from 'three'
import { Html } from '@react-three/drei'
import { Anchor, Shield } from 'lucide-react'
import { useWorldStore } from '@/stores/useWorldStore'

export function OceanRuinsInteraction() {
  const { activeWorld } = useWorldStore()
  const isActive = activeWorld === 'ocean'

  const beaconRef = useRef<THREE.Group>(null!)
  const ruinsRef = useRef<THREE.Group>(null!)
  const [hovered, setHovered] = useState(false)
  const [dived, setDived] = useState(false)

  useFrame((state) => {
    const t = state.clock.elapsedTime
    if (beaconRef.current) {
      beaconRef.current.position.y = Math.sin(t * 1.5) * 0.12 + 1.5
      beaconRef.current.rotation.y = t * 0.4
    }

    if (ruinsRef.current && dived) {
      ruinsRef.current.rotation.y = t * 0.1
    }
  })

  const handleOceanDive = (e: ThreeEvent<MouseEvent>) => {
    e.stopPropagation()

    // 1. Play Sonar Ping Sound via Web Audio API
    try {
      const ctx = new AudioContext()
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()

      osc.type = 'sine'
      osc.frequency.setValueAtTime(600, ctx.currentTime)
      osc.frequency.exponentialRampToValueAtTime(150, ctx.currentTime + 1.2)

      gain.gain.setValueAtTime(0.3, ctx.currentTime)
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 1.3)

      osc.connect(gain).connect(ctx.destination)
      osc.start()
      osc.stop(ctx.currentTime + 1.3)
    } catch {
      // Audio fallback
    }

    setDived(true)
  }

  return (
    <group position={[0, 0, 0]}>
      {/* Sub-Ocean Dive Beacon */}
      {!dived && (
        <group
          ref={beaconRef}
          onPointerOver={(e) => {
            e.stopPropagation()
            setHovered(true)
          }}
          onPointerOut={() => setHovered(false)}
          onClick={handleOceanDive}
        >
          <mesh scale={hovered ? [1.2, 1.2, 1.2] : [1, 1, 1]}>
            <octahedronGeometry args={[0.3]} />
            <meshStandardMaterial
              color={hovered ? '#00F5D4' : '#0077B6'}
              emissive="#00F5D4"
              emissiveIntensity={hovered ? 1.4 : 0.6}
              roughness={0.1}
            />
          </mesh>

          {(isActive || hovered) && (
            <Html position={[0, 0.5, 0]} center zIndexRange={[100, 0]}>
              <div
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-xs font-mono transition-all cursor-pointer ${
                  hovered
                    ? 'bg-cyan-500/30 border-cyan-400 text-cyan-200 shadow-[0_0_20px_rgba(0,245,212,0.8)] scale-110'
                    : 'bg-black/60 border-cyan-500/40 text-cyan-300'
                }`}
              >
                <Anchor className="w-3.5 h-3.5 animate-bounce text-cyan-400" />
                <span>DIVE INTO DEEP OCEAN</span>
              </div>
            </Html>
          )}
        </group>
      )}

      {/* Sunken Ancient Monolithic Ruins */}
      {dived && (
        <group ref={ruinsRef} position={[0, 0, 0]}>
          {/* Monolithic Pillars */}
          {[-0.8, 0.8].map((x, i) => (
            <mesh key={i} position={[x, 0, 0]}>
              <boxGeometry args={[0.3, 1.8, 0.3]} />
              <meshStandardMaterial
                color="#002244"
                emissive="#00F5D4"
                emissiveIntensity={0.6}
                roughness={0.3}
              />
            </mesh>
          ))}

          {/* Archway Lintels */}
          <mesh position={[0, 0.8, 0]}>
            <boxGeometry args={[1.9, 0.3, 0.3]} />
            <meshStandardMaterial
              color="#003366"
              emissive="#00F5D4"
              emissiveIntensity={0.8}
            />
          </mesh>

          {/* Bioluminescent Deep Sea Spore Glow */}
          <points position={[0, 0, 0]}>
            <bufferGeometry>
              <bufferAttribute
                attach="attributes-position"
                args={[
                  new Float32Array(Array.from({ length: 600 }, () => (Math.random() - 0.5) * 3)),
                  3,
                ]}
              />
            </bufferGeometry>
            <pointsMaterial
              size={0.03}
              color="#00F5D4"
              transparent
              opacity={0.8}
              blending={THREE.AdditiveBlending}
            />
          </points>

          {isActive && (
            <Html position={[0, 1.4, 0]} center zIndexRange={[100, 0]}>
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-cyan-950/80 border border-cyan-400/60 text-xs font-mono text-cyan-200 shadow-[0_0_20px_rgba(0,245,212,0.5)]">
                <Shield className="w-3.5 h-3.5 text-cyan-300" />
                <span>Ancient Ocean Ruins Discovered!</span>
              </div>
            </Html>
          )}
        </group>
      )}
    </group>
  )
}
