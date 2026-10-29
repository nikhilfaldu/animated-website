'use client'

import React, { useRef, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { WORLDS } from '@/config/worlds'
import { earthVertexShader, earthFragmentShader, cloudVertexShader, cloudFragmentShader, atmosphereVertexShader, atmosphereFragmentShader } from '@/shaders/earth'
import { EmeraldTreeInteraction } from '@/components/interactive/EmeraldTreeInteraction'

export function EmeraldIsle() {
  const config = WORLDS['emerald']

  const surfaceRef = useRef<THREE.Mesh>(null!)
  const cloudsRef = useRef<THREE.Mesh>(null!)
  const atmosphereRef = useRef<THREE.Mesh>(null!)

  const uniforms = useMemo(() => ({
    uTime: { value: 0 },
    uColorWater: { value: new THREE.Color('#002B5B') }, // Deep blue
    uColorLand: { value: new THREE.Color('#2A5E1A') },  // Green
    uColorForest: { value: new THREE.Color('#103808') }, // Dark green
    uColorSand: { value: new THREE.Color('#D2B48C') },   // Tan
  }), [])

  const cloudUniforms = useMemo(() => ({
    uTime: { value: 0 },
  }), [])

  const atmosphereUniforms = useMemo(() => ({
    uColor: { value: new THREE.Color('#64B5F6') }, // Light blue atmosphere
  }), [])

  useFrame((state) => {
    const t = state.clock.elapsedTime
    uniforms.uTime.value = t
    cloudUniforms.uTime.value = t

    if (surfaceRef.current) surfaceRef.current.rotation.y = t * 0.05
    if (cloudsRef.current) cloudsRef.current.rotation.y = t * 0.08
    if (atmosphereRef.current) atmosphereRef.current.rotation.y = t * 0.05
  })

  return (
    <group position={config.position}>
      {/* Atmosphere Glow */}
      <mesh ref={atmosphereRef}>
        <sphereGeometry args={[1.3, 64, 64]} />
        <shaderMaterial 
          vertexShader={atmosphereVertexShader}
          fragmentShader={atmosphereFragmentShader}
          uniforms={atmosphereUniforms}
          transparent
          side={THREE.BackSide}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
        />
      </mesh>

      {/* Cloud Layer */}
      <mesh ref={cloudsRef}>
        <sphereGeometry args={[1.05, 64, 64]} />
        <shaderMaterial 
          vertexShader={cloudVertexShader}
          fragmentShader={cloudFragmentShader}
          uniforms={cloudUniforms}
          transparent
          depthWrite={false}
        />
      </mesh>

      {/* Planet Surface */}
      <mesh ref={surfaceRef}>
        <sphereGeometry args={[1.0, 128, 128]} />
        <shaderMaterial 
          vertexShader={earthVertexShader}
          fragmentShader={earthFragmentShader}
          uniforms={uniforms}
        />
      </mesh>

      {/* Interactive Seed Planting & Magical Tree Growth */}
      <EmeraldTreeInteraction />
    </group>
  )
}
