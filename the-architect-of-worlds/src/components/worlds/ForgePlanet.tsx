'use client'

import React, { useRef, useMemo, useState } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { WORLDS } from '@/config/worlds'
import { lavaVertexShader, lavaFragmentShader } from '@/shaders/lava'
import { ForgeAnvilInteraction } from '@/components/interactive/ForgeAnvilInteraction'

export function ForgePlanet() {
  const config = WORLDS['forge']

  const surfaceRef = useRef<THREE.Mesh>(null!)
  const [hovered, setHovered] = useState(false)

  const uniforms = useMemo(() => ({
    uTime: { value: 0 },
    uColorRock: { value: new THREE.Color('#1A0F0A') }, // Dark volcanic rock
    uColorLava: { value: new THREE.Color('#FF3300') }, // Bright intense lava
  }), [])

  useFrame((state) => {
    const t = state.clock.elapsedTime
    // Accelerate lava flow when hovered
    uniforms.uTime.value += hovered ? 0.1 : 0.02

    if (surfaceRef.current) {
      surfaceRef.current.rotation.y = t * 0.1
    }
  })

  return (
    <group position={config.position}>
      {/* Lava Planet Surface */}
      <mesh 
        ref={surfaceRef}
        onPointerEnter={() => setHovered(true)}
        onPointerLeave={() => setHovered(false)}
      >
        <sphereGeometry args={[1.0, 128, 128]} />
        <shaderMaterial 
          vertexShader={lavaVertexShader}
          fragmentShader={lavaFragmentShader}
          uniforms={uniforms}
        />
      </mesh>

      {/* Interactive Celestial Anvil & Forged Planet Spawns */}
      <ForgeAnvilInteraction />

      {/* Volcanic Ash Particles */}
      <points>
        <bufferGeometry>
          <bufferAttribute
            attach="attributes-position"
            args={[
              new Float32Array(Array.from({length: 3000}, () => (Math.random() - 0.5) * 4)),
              3
            ]}
          />
        </bufferGeometry>
        <pointsMaterial size={0.02} color="#FF6600" transparent opacity={0.4} blending={THREE.AdditiveBlending} />
      </points>
    </group>
  )
}
