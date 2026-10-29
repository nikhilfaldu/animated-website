'use client'

import React, { useRef } from 'react'
import { useFrame, ThreeEvent } from '@react-three/fiber'
import * as THREE from 'three'
import { Html } from '@react-three/drei'
import { StarSystemData } from '@/lib/procedural/universeGenerator'
import { ProceduralPlanet } from './ProceduralPlanet'
import { useWorldStore } from '@/stores/useWorldStore'

interface StarSystemProps {
  data: StarSystemData
}

export function StarSystem({ data }: StarSystemProps) {
  const starRef = useRef<THREE.Mesh>(null!)
  const { navigateToObject, activeObject, isIntroComplete } = useWorldStore()
  
  const isActive = activeObject?.id === data.id

  const handleClick = (e: ThreeEvent<MouseEvent>) => {
    if (!isIntroComplete) return
    e.stopPropagation()
    navigateToObject({
      id: data.id,
      name: data.name,
      type: 'star',
      position: data.position.clone()
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
    if (starRef.current) {
      starRef.current.rotation.y = t * 0.02
    }
  })

  return (
    <group position={data.position}>
      {/* Star */}
      <mesh 
        ref={starRef}
        onClick={handleClick}
        onPointerOver={handlePointerOver}
        onPointerOut={handlePointerOut}
      >
        <sphereGeometry args={[data.starRadius, 32, 32]} />
        <meshBasicMaterial color={data.starColor} />
        {/* Glow effect simplified for performance, can use PostProcessing later */}
        <pointLight color={data.starColor} intensity={5} distance={100} decay={1.5} />
      </mesh>

      {/* Orbit Rings (UI) */}
      {data.planets.map((planet) => (
        <mesh key={`orbit-${planet.id}`} rotation={[Math.PI / 2, 0, 0]}>
          <ringGeometry args={[planet.distanceFromStar - 0.02, planet.distanceFromStar + 0.02, 64]} />
          <meshBasicMaterial color="#ffffff" transparent opacity={0.05} side={THREE.DoubleSide} />
        </mesh>
      ))}

      {/* Planets */}
      {data.planets.map((planet) => (
        <ProceduralPlanet key={planet.id} data={planet} systemId={data.id} />
      ))}

      {isActive && (
        <Html center position={[0, data.starRadius + 2, 0]} className="pointer-events-none">
          <div className="text-white text-xs whitespace-nowrap bg-black/50 px-2 py-1 rounded border border-white/20 backdrop-blur-md">
            {data.name} ({data.starType.replace('_', ' ').toUpperCase()})
          </div>
        </Html>
      )}
    </group>
  )
}
