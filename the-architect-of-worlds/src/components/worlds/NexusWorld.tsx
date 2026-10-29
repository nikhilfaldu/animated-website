'use client'

import React, { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { WORLDS } from '@/config/worlds'
import { Float } from '@react-three/drei'
import { NexusConstellationInteraction } from '@/components/interactive/NexusConstellationInteraction'

export function NexusWorld() {
  const config = WORLDS['nexus']

  const coreRef = useRef<THREE.Mesh>(null!)
  const ringsRef = useRef<THREE.Group>(null!)

  useFrame((state, delta) => {
    if (coreRef.current) {
      coreRef.current.rotation.y -= delta * 0.5
      coreRef.current.rotation.x -= delta * 0.2
    }
    if (ringsRef.current) {
      ringsRef.current.rotation.x += delta * 0.1
      ringsRef.current.rotation.y += delta * 0.2
      ringsRef.current.rotation.z += delta * 0.15
    }
  })

  return (
    <group position={config.position}>
      <Float speed={1.5} rotationIntensity={0.2} floatIntensity={0.5}>
        <mesh ref={coreRef}>
          <octahedronGeometry args={[1.5, 0]} />
          <meshStandardMaterial 
            color="#ffbb00" 
            emissive="#ffbb00" 
            emissiveIntensity={1.5} 
            wireframe 
          />
        </mesh>
        
        <group ref={ringsRef}>
          <mesh>
            <torusGeometry args={[2.5, 0.02, 16, 100]} />
            <meshBasicMaterial color="#ffffff" transparent opacity={0.2} blending={THREE.AdditiveBlending} />
          </mesh>
          <mesh rotation={[Math.PI/2, 0, 0]}>
            <torusGeometry args={[3.5, 0.02, 16, 100]} />
            <meshBasicMaterial color="#ffbb00" transparent opacity={0.3} blending={THREE.AdditiveBlending} />
          </mesh>
        </group>

        {/* Interactive Constellation Stretching & Spiral Galaxy Creation */}
        <NexusConstellationInteraction />
      </Float>
    </group>
  )
}
