'use client'

import React, { useRef, useState } from 'react'
import { useFrame, ThreeEvent } from '@react-three/fiber'
import * as THREE from 'three'
import { useWorldStore } from '@/stores/useWorldStore'

interface AncientRuinsProps {
  id: string
  position: [number, number, number]
}

const AncientRuins = ({ id, position }: AncientRuinsProps) => {
  const groupRef = useRef<THREE.Group>(null)
  
  const [isHovered, setIsHovered] = useState(false)
  const { isIntroComplete, setHoveredObject, navigateToObject, activeObject } = useWorldStore()
  
  const isActiveObject = activeObject?.id === id

  useFrame((state, delta) => {
    if (groupRef.current) {
      groupRef.current.rotation.y += delta * 0.05
      groupRef.current.rotation.x += delta * 0.02
      
      // Floating bob
      groupRef.current.position.y += Math.sin(state.clock.elapsedTime) * 0.005
    }
  })

  const handlePointerOver = (e: ThreeEvent<PointerEvent>) => {
    if (!isIntroComplete) return
    e.stopPropagation()
    document.body.style.cursor = 'pointer'
    setIsHovered(true)
    if (groupRef.current) {
      setHoveredObject({
        id,
        type: 'ruins',
        name: `Ancient Ruins ${id.split('-')[1].toUpperCase()}`,
        position: new THREE.Vector3(...position)
      })
    }
  }

  const handlePointerOut = () => {
    if (!isIntroComplete) return
    document.body.style.cursor = 'auto'
    setIsHovered(false)
    setHoveredObject(null)
  }

  const handleClick = (e: ThreeEvent<MouseEvent>) => {
    if (!isIntroComplete) return
    e.stopPropagation()
    navigateToObject({
      id,
      type: 'ruins',
      name: `Ancient Ruins ${id.split('-')[1].toUpperCase()}`,
      position: new THREE.Vector3(...position)
    })
  }

  const s = isHovered || isActiveObject ? 1.2 : 1
  const glowColor = "#00FF9D"

  return (
    <group 
      position={position}
      onPointerOver={handlePointerOver}
      onPointerOut={handlePointerOut}
      onClick={handleClick}
      scale={s}
    >
      <group ref={groupRef}>
        {/* Main Monolith */}
        <mesh>
          <boxGeometry args={[2, 6, 2]} />
          <meshStandardMaterial color="#1a202c" roughness={0.9} metalness={0.5} />
        </mesh>

        {/* Floating Shards */}
        <mesh position={[2, 2, 2]} rotation={[Math.PI/4, Math.PI/4, 0]}>
          <octahedronGeometry args={[0.8, 0]} />
          <meshStandardMaterial color="#1a202c" roughness={0.9} />
        </mesh>
        <mesh position={[-2, -1, -1.5]} rotation={[Math.PI/3, 0, Math.PI/6]}>
          <octahedronGeometry args={[0.6, 0]} />
          <meshStandardMaterial color="#1a202c" roughness={0.9} />
        </mesh>
        <mesh position={[1, -3, 1.5]} rotation={[0, Math.PI/4, Math.PI/2]}>
          <octahedronGeometry args={[1, 0]} />
          <meshStandardMaterial color="#1a202c" roughness={0.9} />
        </mesh>

        {/* Glowing Runes (simulated via glowing bands) */}
        <mesh position={[0, 1.5, 0]}>
          <boxGeometry args={[2.05, 0.2, 2.05]} />
          <meshBasicMaterial color={glowColor} transparent opacity={0.8} blending={THREE.AdditiveBlending} />
        </mesh>
        <mesh position={[0, -0.5, 0]}>
          <boxGeometry args={[2.05, 0.1, 2.05]} />
          <meshBasicMaterial color={glowColor} transparent opacity={0.6} blending={THREE.AdditiveBlending} />
        </mesh>
        <mesh position={[0, -2, 0]}>
          <boxGeometry args={[2.05, 0.4, 2.05]} />
          <meshBasicMaterial color={glowColor} transparent opacity={0.9} blending={THREE.AdditiveBlending} />
        </mesh>
      </group>
      
      {/* Interactive Aura */}
      <mesh visible={isHovered || isActiveObject}>
        <sphereGeometry args={[4.5, 32, 32]} />
        <meshBasicMaterial color={glowColor} transparent opacity={0.05} blending={THREE.AdditiveBlending} depthWrite={false} side={THREE.BackSide} />
      </mesh>
      
      <pointLight color={glowColor} intensity={isActiveObject ? 2 : 0.5} distance={15} />
    </group>
  )
}

export default React.memo(AncientRuins)
