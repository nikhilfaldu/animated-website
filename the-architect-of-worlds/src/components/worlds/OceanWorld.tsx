'use client'

import React, { useRef, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { WORLDS } from '@/config/worlds'
import { oceanVertexShader, oceanFragmentShader } from '@/shaders/ocean'
import { OceanRuinsInteraction } from '@/components/interactive/OceanRuinsInteraction'

export function OceanWorld() {
  const config = WORLDS['ocean']

  const surfaceRef = useRef<THREE.Mesh>(null!)

  const uniforms = useMemo(() => ({
    uTime: { value: 0 },
    uColorDeep: { value: new THREE.Color('#001133') },
    uColorShallow: { value: new THREE.Color('#00aaff') },
  }), [])

  useFrame((state) => {
    const t = state.clock.elapsedTime
    uniforms.uTime.value = t

    if (surfaceRef.current) {
      surfaceRef.current.rotation.y = t * 0.02
    }
  })

  return (
    <group position={config.position}>
      {/* Ocean Planet Surface */}
      <mesh ref={surfaceRef}>
        <sphereGeometry args={[1.0, 256, 256]} />
        <shaderMaterial 
          vertexShader={oceanVertexShader}
          fragmentShader={oceanFragmentShader}
          uniforms={uniforms}
          transparent
        />
      </mesh>

      {/* Inner Core */}
      <mesh>
        <sphereGeometry args={[0.95, 32, 32]} />
        <meshBasicMaterial color="#000a1a" />
      </mesh>

      {/* Interactive Sub-Ocean Dive & Ancient Sunken Ruins */}
      <OceanRuinsInteraction />
    </group>
  )
}
