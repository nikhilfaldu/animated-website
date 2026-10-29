'use client'

import React, { useRef, useState } from 'react'
import { useFrame, ThreeEvent } from '@react-three/fiber'
import * as THREE from 'three'
import { useWorldStore } from '@/stores/useWorldStore'

interface PulsarProps {
  id: string
  position: [number, number, number]
  color?: string
}

const Pulsar = ({ id, position, color = "#00F5D4" }: PulsarProps) => {
  const groupRef = useRef<THREE.Group>(null)
  const beamsRef = useRef<THREE.Group>(null)
  const coreRef = useRef<THREE.Mesh>(null)
  
  const [isHovered, setIsHovered] = useState(false)
  const { isIntroComplete, setHoveredObject, navigateToObject, activeObject } = useWorldStore()
  
  const isActiveObject = activeObject?.id === id

  useFrame((state, delta) => {
    if (groupRef.current) {
      // Pulsar rotates extremely fast
      groupRef.current.rotation.y += delta * 15
      groupRef.current.rotation.x += delta * 5
    }

    if (coreRef.current) {
      const pulse = 1 + Math.sin(state.clock.elapsedTime * 20) * 0.1
      coreRef.current.scale.setScalar(pulse)
    }

    if (beamsRef.current) {
      // Beams flicker
      const opacity = 0.5 + Math.random() * 0.5
      beamsRef.current.children.forEach(c => {
        const mat = (c as THREE.Mesh).material as THREE.MeshBasicMaterial
        if (mat) mat.opacity = opacity
      })
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
        type: 'pulsar',
        name: `Pulsar ${id.split('-')[1].toUpperCase()}`,
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
      type: 'pulsar',
      name: `Pulsar ${id.split('-')[1].toUpperCase()}`,
      position: new THREE.Vector3(...position)
    })
  }

  const s = isHovered || isActiveObject ? 1.5 : 1

  return (
    <group 
      position={position}
      onPointerOver={handlePointerOver}
      onPointerOut={handlePointerOut}
      onClick={handleClick}
      scale={s}
    >
      {/* Invisible interaction hit box */}
      <mesh visible={false}>
        <sphereGeometry args={[2.5, 16, 16]} />
        <meshBasicMaterial />
      </mesh>

      <group ref={groupRef}>
        {/* Extremely dense core */}
        <mesh ref={coreRef}>
          <sphereGeometry args={[0.3, 32, 32]} />
          <meshStandardMaterial color="#ffffff" emissive={color} emissiveIntensity={isActiveObject ? 10 : 4} />
        </mesh>

        {/* Outer energy shell */}
        <mesh>
          <sphereGeometry args={[0.5, 32, 32]} />
          <meshBasicMaterial color={color} transparent opacity={0.3} blending={THREE.AdditiveBlending} depthWrite={false} />
        </mesh>

        {/* Beams */}
        <group ref={beamsRef}>
          <mesh position={[0, 4, 0]}>
            <coneGeometry args={[1.5, 8, 32]} />
            <meshBasicMaterial color={color} transparent opacity={0.8} blending={THREE.AdditiveBlending} depthWrite={false} side={THREE.DoubleSide} />
          </mesh>
          <mesh position={[0, -4, 0]} rotation={[Math.PI, 0, 0]}>
            <coneGeometry args={[1.5, 8, 32]} />
            <meshBasicMaterial color={color} transparent opacity={0.8} blending={THREE.AdditiveBlending} depthWrite={false} side={THREE.DoubleSide} />
          </mesh>
        </group>
      </group>
      <pointLight color={color} intensity={isActiveObject ? 5 : 2} distance={20} />
    </group>
  )
}

export default React.memo(Pulsar)
