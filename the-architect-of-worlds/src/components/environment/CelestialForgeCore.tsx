'use client'

import React, { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { WORLDS, WORLD_ORDER } from '@/config/worlds'

export function CelestialForgeCore() {
  const fusionCoreRef = useRef<THREE.Mesh>(null!)
  const innerRingRef = useRef<THREE.Mesh>(null!)
  const middleRingRef = useRef<THREE.Mesh>(null!)
  const outerRingRef = useRef<THREE.Mesh>(null!)
  const particlesRef = useRef<THREE.Points>(null!)

  useFrame((state, delta) => {
    const t = state.clock.elapsedTime

    // Pulse fusion sun core
    if (fusionCoreRef.current) {
      fusionCoreRef.current.rotation.y += delta * 0.4
      const scale = 1.2 + Math.sin(t * 2) * 0.05
      fusionCoreRef.current.scale.set(scale, scale, scale)
    }

    // Rotate 3 concentric celestial machine rings on distinct axes
    if (innerRingRef.current) {
      innerRingRef.current.rotation.x += delta * 0.3
      innerRingRef.current.rotation.y += delta * 0.5
    }
    if (middleRingRef.current) {
      middleRingRef.current.rotation.y -= delta * 0.4
      middleRingRef.current.rotation.z += delta * 0.2
    }
    if (outerRingRef.current) {
      outerRingRef.current.rotation.z += delta * 0.2
      outerRingRef.current.rotation.x -= delta * 0.3
    }

    if (particlesRef.current) {
      particlesRef.current.rotation.y = t * 0.08
    }
  })

  // Generate 300 golden solar flare particles around the Forge Core
  const solarParticles = React.useMemo(() => {
    const count = 300
    const pos = new Float32Array(count * 3)
    for (let i = 0; i < count; i++) {
      const radius = 1.8 + Math.random() * 2.5
      const theta = Math.random() * Math.PI * 2
      const phi = (Math.random() - 0.5) * Math.PI
      pos[i * 3] = radius * Math.cos(theta) * Math.cos(phi)
      pos[i * 3 + 1] = radius * Math.sin(phi)
      pos[i * 3 + 2] = radius * Math.sin(theta) * Math.cos(phi)
    }
    return pos
  }, [])

  return (
    <group position={[0, 0, 0]}>
      {/* 1. Fusion Sun Core */}
      <mesh ref={fusionCoreRef}>
        <sphereGeometry args={[0.6, 64, 64]} />
        <meshStandardMaterial
          color="#FFB800"
          emissive="#FF8C00"
          emissiveIntensity={2.5}
          roughness={0.1}
        />
      </mesh>

      {/* Point Light emitted from Celestial Forge */}
      <pointLight position={[0, 0, 0]} color="#FFB800" intensity={2.5} distance={60} />

      {/* 2. Concentric Celestial Machine Rings */}
      <mesh ref={innerRingRef}>
        <torusGeometry args={[2.2, 0.03, 16, 128]} />
        <meshStandardMaterial
          color="#FFD700"
          emissive="#FF8C00"
          emissiveIntensity={1.0}
          metalness={0.9}
          roughness={0.1}
        />
      </mesh>

      <mesh ref={middleRingRef}>
        <torusGeometry args={[3.2, 0.04, 16, 128]} />
        <meshStandardMaterial
          color="#1A0F0A"
          emissive="#FF4500"
          emissiveIntensity={0.6}
          metalness={0.95}
          roughness={0.2}
        />
      </mesh>

      <mesh ref={outerRingRef}>
        <torusGeometry args={[4.2, 0.02, 16, 128]} />
        <meshStandardMaterial
          color="#00FFFF"
          emissive="#00F5D4"
          emissiveIntensity={1.2}
          transparent
          opacity={0.5}
        />
      </mesh>

      {/* 3. Quantum Energy Tethers to 6 Living Worlds */}
      {WORLD_ORDER.map((worldId) => {
        const targetPos = WORLDS[worldId].position
        const points = [new THREE.Vector3(0, 0, 0), new THREE.Vector3(...targetPos)]
        const lineGeometry = new THREE.BufferGeometry().setFromPoints(points)

        return (
          <primitive
            key={`tether-${worldId}`}
            object={
              new THREE.Line(
                lineGeometry,
                new THREE.LineBasicMaterial({
                  color: new THREE.Color(WORLDS[worldId].colors.primary),
                  transparent: true,
                  opacity: 0.25,
                  blending: THREE.AdditiveBlending,
                })
              )
            }
          />
        )
      })}

      {/* 4. Solar Flare Dust Motes */}
      <points ref={particlesRef}>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" args={[solarParticles, 3]} />
        </bufferGeometry>
        <pointsMaterial
          size={0.04}
          color="#FFE066"
          transparent
          opacity={0.7}
          blending={THREE.AdditiveBlending}
        />
      </points>
    </group>
  )
}
