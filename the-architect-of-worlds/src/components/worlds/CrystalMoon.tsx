'use client'

import React, { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { WORLDS } from '@/config/worlds'
import { Float, MeshTransmissionMaterial } from '@react-three/drei'
import { CrystalRefractionInteraction } from '@/components/interactive/CrystalRefractionInteraction'

export function CrystalMoon() {
  const config = WORLDS['crystal']

  const crystalRef = useRef<THREE.Mesh>(null!)
  const wireRef = useRef<THREE.Mesh>(null!)

  useFrame((state, delta) => {
    if (crystalRef.current) {
      crystalRef.current.rotation.y += delta * 0.15
      crystalRef.current.rotation.z += delta * 0.1
    }
    if (wireRef.current) {
      wireRef.current.rotation.y -= delta * 0.1
      wireRef.current.rotation.x -= delta * 0.05
    }
  })

  return (
    <group position={config.position}>
      <Float speed={2} rotationIntensity={0.5} floatIntensity={1}>
        <mesh ref={crystalRef}>
          <dodecahedronGeometry args={[1.2, 0]} />
          <MeshTransmissionMaterial 
            color="#ffffff"
            transparent 
            opacity={0.9} 
            metalness={0.1}
            roughness={0.1}
            ior={2.5}
            thickness={2.0}
            transmission={1}
            chromaticAberration={0.15}
            anisotropy={0.3}
          />
        </mesh>
        
        <mesh ref={wireRef}>
          <dodecahedronGeometry args={[1.3, 0]} />
          <meshBasicMaterial color="#a855f7" wireframe transparent opacity={0.3} blending={THREE.AdditiveBlending} />
        </mesh>

        {/* Interactive Crystal Refraction & Spectral Cavern Illumination */}
        <CrystalRefractionInteraction />
      </Float>
    </group>
  )
}
