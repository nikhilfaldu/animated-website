'use client'

import React, { useRef, useMemo } from 'react'
import { useFrame, ThreeEvent } from '@react-three/fiber'
import * as THREE from 'three'
import { Html } from '@react-three/drei'
import { ProceduralPlanetData } from '@/lib/procedural/universeGenerator'
import { useWorldStore } from '@/stores/useWorldStore'

interface ProceduralPlanetProps {
  data: ProceduralPlanetData
  systemId: string
}

export function ProceduralPlanet({ data }: ProceduralPlanetProps) {
  const planetRef = useRef<THREE.Group>(null!)
  const meshRef = useRef<THREE.Mesh>(null!)
  const moonsRef = useRef<THREE.Group>(null!)
  
  const { navigateToObject, activeObject, isIntroComplete } = useWorldStore()
  const isActive = activeObject?.id === data.id

  const handleClick = (e: ThreeEvent<MouseEvent>) => {
    if (!isIntroComplete) return
    e.stopPropagation()
    navigateToObject({
      id: data.id,
      name: data.name,
      type: 'planet',
      position: planetRef.current.position.clone() // Need world position ideally, but we'll adapt CinematicCamera
    })
  }

  const handlePointerOver = (e: ThreeEvent<PointerEvent>) => {
    if (!isIntroComplete) return
    e.stopPropagation()
    document.body.style.cursor = 'pointer'
  }

  const handlePointerOut = () => {
    document.body.style.cursor = 'auto'
  }

  useFrame((state) => {
    const t = state.clock.elapsedTime
    // Orbit around star
    if (planetRef.current) {
      planetRef.current.position.x = Math.cos(t * data.orbitalSpeed) * data.distanceFromStar
      planetRef.current.position.z = Math.sin(t * data.orbitalSpeed) * data.distanceFromStar
    }
    // Rotate planet
    if (meshRef.current) {
      meshRef.current.rotation.y += 0.005
    }
    // Moons orbit
    if (moonsRef.current) {
      moonsRef.current.children.forEach((moon, i) => {
        const moonData = data.moons[i]
        moon.position.x = Math.cos(t * moonData.orbitalSpeed * 2) * moonData.distanceFromPlanet
        moon.position.z = Math.sin(t * moonData.orbitalSpeed * 2) * moonData.distanceFromPlanet
        moon.rotation.y += 0.01
      })
    }
  })

  // Basic procedural textures/materials based on type
  const materialProps = useMemo(() => {
    switch (data.type) {
      case 'rocky': return { color: data.baseColor, roughness: 0.9, metalness: 0.1 }
      case 'ocean': return { color: data.baseColor, roughness: 0.2, metalness: 0.5 }
      case 'lava': return { color: data.baseColor, emissive: '#ff3300', emissiveIntensity: 0.5, roughness: 0.7 }
      case 'gas_giant': return { color: data.baseColor, roughness: 0.5, metalness: 0.1 }
      case 'ice': return { color: data.baseColor, roughness: 0.1, metalness: 0.8, transmission: 0.5 }
      default: return { color: data.baseColor, roughness: 0.8 }
    }
  }, [data.type, data.baseColor])

  return (
    <group ref={planetRef}>
      {/* Planet Mesh */}
      <mesh 
        ref={meshRef}
        onClick={handleClick}
        onPointerOver={handlePointerOver}
        onPointerOut={handlePointerOut}
      >
        <sphereGeometry args={[data.radius, 32, 32]} />
        <meshStandardMaterial {...materialProps} />
        {isActive && (
          <pointLight color={data.baseColor} intensity={2} distance={data.radius * 5} />
        )}
      </mesh>

      {/* Moons */}
      <group ref={moonsRef}>
        {data.moons.map((moonData) => (
          <mesh 
            key={moonData.id}
            onClick={(e) => {
              e.stopPropagation()
              navigateToObject({
                id: moonData.id,
                name: moonData.name,
                type: 'planet', // Treats moons like planets for UI
                position: new THREE.Vector3() // Needs world pos logic
              })
            }}
          >
            <sphereGeometry args={[moonData.radius, 16, 16]} />
            <meshStandardMaterial color={moonData.baseColor} roughness={0.9} />
          </mesh>
        ))}
      </group>

      {/* Optional Rings */}
      {data.hasRings && (
        <mesh rotation={[-Math.PI / 2.5, 0, 0]}>
          <ringGeometry args={[data.radius * 1.5, data.radius * 2.5, 64]} />
          <meshStandardMaterial color={data.baseColor} transparent opacity={0.4} side={THREE.DoubleSide} />
        </mesh>
      )}

      {isActive && (
        <Html center position={[0, data.radius + 1, 0]} className="pointer-events-none">
          <div className="text-white text-xs whitespace-nowrap bg-black/50 px-2 py-1 rounded border border-white/20 backdrop-blur-md">
            {data.name} ({data.type})
          </div>
        </Html>
      )}
    </group>
  )
}
