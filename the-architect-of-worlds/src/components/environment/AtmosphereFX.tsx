'use client'

import React, { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { useWorldStore } from '@/stores/useWorldStore'
import { WORLDS } from '@/config/worlds'

export function AtmosphereFX() {
  const { activeWorld } = useWorldStore()
  const fogRef = useRef<THREE.FogExp2>(null)
  const particlesRef = useRef<THREE.Points>(null)

  const activeColor = activeWorld ? WORLDS[activeWorld].colors.atmosphere : '#090d16'

  useFrame(({ clock }) => {
    const t = clock.getElapsedTime()
    if (fogRef.current) {
      // Subtle breathing density for volumetric fog
      fogRef.current.density = 0.003 + Math.sin(t * 0.5) * 0.0005
    }

    if (particlesRef.current) {
      particlesRef.current.rotation.y = t * 0.02
      particlesRef.current.rotation.x = Math.sin(t * 0.01) * 0.05
    }
  })

  // Generate 600 volumetric floating atmosphere dust motes
  const particleCount = 600
  const positions = React.useMemo(() => {
    const pos = new Float32Array(particleCount * 3)
    for (let i = 0; i < particleCount; i++) {
      pos[i * 3] = (Math.random() - 0.5) * 160
      pos[i * 3 + 1] = (Math.random() - 0.5) * 160
      pos[i * 3 + 2] = (Math.random() - 0.5) * 160
    }
    return pos
  }, [])

  return (
    <>
      {/* Volumetric Exp2 Fog */}
      <fogExp2 ref={fogRef} attach="fog" args={[activeColor, 0.0035]} />

      {/* Volumetric Floating Dust Particles */}
      <points ref={particlesRef}>
        <bufferGeometry>
          <bufferAttribute
            attach="attributes-position"
            args={[positions, 3]}
          />
        </bufferGeometry>
        <pointsMaterial
          size={0.6}
          color={activeWorld ? WORLDS[activeWorld].colors.accent : '#00f0ff'}
          transparent
          opacity={0.35}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
        />
      </points>
    </>
  )
}
