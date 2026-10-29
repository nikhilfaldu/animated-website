'use client'

import React, { useRef, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { WORLDS } from '@/config/worlds'
import { SingularityTimeRewindInteraction } from '@/components/interactive/SingularityTimeRewindInteraction'

export function SingularityWorld() {
  const config = WORLDS['singularity']

  const pointsRef = useRef<THREE.Points>(null!)
  const centerRef = useRef<THREE.Mesh>(null!)

  const { positions, randoms } = useMemo(() => {
    const count = 2000
    const positions = new Float32Array(count * 3)
    const randoms = new Float32Array(count)
    for (let i = 0; i < count; i++) {
      const radius = 0.5 + Math.random() * 3
      const theta = Math.random() * Math.PI * 2
      // mostly flat disk
      const y = (Math.random() - 0.5) * 0.2 * (4 - radius)
      
      positions[i * 3] = radius * Math.cos(theta)
      positions[i * 3 + 1] = y
      positions[i * 3 + 2] = radius * Math.sin(theta)
      
      randoms[i] = Math.random()
    }
    return { positions, randoms }
  }, [])

  useFrame((state, delta) => {
    if (centerRef.current) {
      centerRef.current.rotation.y += delta * 2
      centerRef.current.rotation.x += delta * 1.5
    }
    
    if (pointsRef.current) {
      const positions = pointsRef.current.geometry.attributes.position.array as Float32Array
      
      for (let i = 0; i < positions.length / 3; i++) {
        const i3 = i * 3
        const x = positions[i3]
        const z = positions[i3 + 2]
        
        const radius = Math.sqrt(x*x + z*z)
        const speed = 0.05 / radius + randoms[i] * 0.02
        
        const currentTheta = Math.atan2(z, x)
        const nextTheta = currentTheta - speed
        
        // slowly pull in
        const nextRadius = radius > 0.5 ? radius - (0.001 / radius) : 3.5 + Math.random()
        
        positions[i3] = nextRadius * Math.cos(nextTheta)
        positions[i3 + 2] = nextRadius * Math.sin(nextTheta)
      }
      
      pointsRef.current.geometry.attributes.position.needsUpdate = true
      // tilt the accretion disk
      pointsRef.current.rotation.x = Math.PI / 8
      pointsRef.current.rotation.z = -Math.PI / 16
    }
  })

  return (
    <group position={config.position}>
      {/* Event Horizon */}
      <mesh ref={centerRef}>
        <sphereGeometry args={[0.5, 32, 32]} />
        <meshBasicMaterial color="#000000" />
      </mesh>
      
      {/* Accretion Disk */}
      <points ref={pointsRef}>
        <bufferGeometry>
          <bufferAttribute
            attach="attributes-position"
            args={[positions, 3]}
          />
        </bufferGeometry>
        <pointsMaterial size={0.015} color="#ff0055" transparent opacity={0.6} blending={THREE.AdditiveBlending} />
      </points>

      {/* Interactive Singularity Time Rewind */}
      <SingularityTimeRewindInteraction />
    </group>
  )
}
