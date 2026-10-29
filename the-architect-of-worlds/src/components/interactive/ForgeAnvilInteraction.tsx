'use client'

import React, { useRef, useState } from 'react'
import { useFrame, ThreeEvent } from '@react-three/fiber'
import * as THREE from 'three'
import { Html } from '@react-three/drei'
import { Hammer, Sparkles } from 'lucide-react'
import { useWorldStore } from '@/stores/useWorldStore'

interface ForgedPlanetData {
  id: string
  position: THREE.Vector3
  scale: number
  color: string
}

export function ForgeAnvilInteraction() {
  const { activeWorld } = useWorldStore()
  const isActive = activeWorld === 'forge'

  const anvilRef = useRef<THREE.Group>(null!)
  const sparksRef = useRef<THREE.Points>(null!)
  const [hovered, setHovered] = useState(false)
  const [forgedPlanets, setForgedPlanets] = useState<ForgedPlanetData[]>([])
  const [sparkBurst, setSparkBurst] = useState(false)

  useFrame((state) => {
    const t = state.clock.elapsedTime
    if (anvilRef.current) {
      anvilRef.current.position.y = Math.sin(t * 1.5) * 0.15 + 1.6
      anvilRef.current.rotation.y = t * 0.4
    }

    if (sparksRef.current && sparkBurst) {
      sparksRef.current.rotation.y += 0.05
    }
  })

  const handleStrikeAnvil = (e: ThreeEvent<MouseEvent>) => {
    e.stopPropagation()

    // 1. Play Anvil Strike Sound via Web Audio API
    try {
      const ctx = new AudioContext()
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()

      osc.type = 'sawtooth'
      osc.frequency.setValueAtTime(320, ctx.currentTime)
      osc.frequency.exponentialRampToValueAtTime(80, ctx.currentTime + 0.3)

      gain.gain.setValueAtTime(0.3, ctx.currentTime)
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.4)

      osc.connect(gain).connect(ctx.destination)
      osc.start()
      osc.stop(ctx.currentTime + 0.4)
    } catch {
      // Audio fallback
    }

    // 2. Trigger Spark Burst
    setSparkBurst(true)
    setTimeout(() => setSparkBurst(false), 800)

    // 3. Forged Planet Spawning
    if (forgedPlanets.length < 4) {
      const angle = (forgedPlanets.length / 4) * Math.PI * 2
      const radius = 2.4
      const newPlanet: ForgedPlanetData = {
        id: `forged-${Date.now()}`,
        position: new THREE.Vector3(Math.cos(angle) * radius, 0.4, Math.sin(angle) * radius),
        scale: 0.25 + Math.random() * 0.15,
        color: ['#FF4500', '#FFD700', '#FF1493', '#00FFFF'][forgedPlanets.length % 4],
      }
      setForgedPlanets((prev) => [...prev, newPlanet])
    }
  }

  // Spark burst particles
  const sparkPositions = React.useMemo(() => {
    const pos = new Float32Array(300)
    for (let i = 0; i < 100; i++) {
      pos[i * 3] = (Math.random() - 0.5) * 1.5
      pos[i * 3 + 1] = Math.random() * 1.2
      pos[i * 3 + 2] = (Math.random() - 0.5) * 1.5
    }
    return pos
  }, [])

  return (
    <group position={[0, 0, 0]}>
      {/* Floating Anvil Group */}
      <group
        ref={anvilRef}
        onPointerOver={(e) => {
          e.stopPropagation()
          setHovered(true)
        }}
        onPointerOut={() => setHovered(false)}
        onClick={handleStrikeAnvil}
      >
        {/* Anvil Base Mesh */}
        <mesh scale={hovered ? [1.15, 1.15, 1.15] : [1, 1, 1]}>
          <boxGeometry args={[0.6, 0.3, 0.4]} />
          <meshStandardMaterial
            color={hovered ? '#FF6600' : '#442211'}
            emissive={hovered ? '#FF3300' : '#220000'}
            emissiveIntensity={hovered ? 1.2 : 0.4}
            roughness={0.2}
            metalness={0.8}
          />
        </mesh>

        {/* Anvil Horn */}
        <mesh position={[0.4, 0.05, 0]}>
          <coneGeometry args={[0.15, 0.4, 16]} />
          <meshStandardMaterial color="#FF5500" emissive="#FF2200" emissiveIntensity={0.8} />
        </mesh>

        {/* Floating 3D Interaction Label - Only visible when Active or Hovered! */}
        {(isActive || hovered) && (
          <Html position={[0, 0.6, 0]} center zIndexRange={[100, 0]}>
            <div
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-xs font-mono transition-all cursor-pointer ${
                hovered
                  ? 'bg-orange-500/30 border-orange-400 text-orange-200 shadow-[0_0_20px_rgba(255,100,0,0.8)] scale-110'
                  : 'bg-black/60 border-orange-500/40 text-orange-300'
              }`}
            >
              <Hammer className="w-3.5 h-3.5 animate-bounce" />
              <span>STRIKE FORGE ANVIL</span>
            </div>
          </Html>
        )}
      </group>

      {/* Spark Burst Effect */}
      {sparkBurst && (
        <points ref={sparksRef} position={[0, 1.8, 0]}>
          <bufferGeometry>
            <bufferAttribute attach="attributes-position" args={[sparkPositions, 3]} />
          </bufferGeometry>
          <pointsMaterial
            size={0.06}
            color="#FFE066"
            transparent
            opacity={0.9}
            blending={THREE.AdditiveBlending}
          />
        </points>
      )}

      {/* Spawns Orbiting Miniature Forged Planets */}
      {forgedPlanets.map((fp) => (
        <mesh key={fp.id} position={fp.position} scale={fp.scale}>
          <sphereGeometry args={[1, 32, 32]} />
          <meshStandardMaterial
            color={fp.color}
            emissive={fp.color}
            emissiveIntensity={0.6}
            roughness={0.3}
          />
          {isActive && (
            <Html position={[0, 1.4, 0]} center zIndexRange={[90, 0]}>
              <div className="flex items-center gap-1 px-2 py-1 rounded bg-black/80 border border-orange-500/50 text-[10px] font-mono text-amber-300">
                <Sparkles className="w-3 h-3 text-amber-400" />
                <span>Forged World #{fp.id.slice(-3)}</span>
              </div>
            </Html>
          )}
        </mesh>
      ))}
    </group>
  )
}
