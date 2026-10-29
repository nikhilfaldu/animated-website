'use client'

import React, { useRef, useState } from 'react'
import { useFrame, ThreeEvent } from '@react-three/fiber'
import * as THREE from 'three'
import { useWorldStore } from '@/stores/useWorldStore'

interface QuasarProps {
  id: string
  position: [number, number, number]
  color?: string
}

const Quasar = ({ id, position, color = "#FF3366" }: QuasarProps) => {
  const groupRef = useRef<THREE.Group>(null)
  const diskRef = useRef<THREE.Mesh>(null)
  
  const [isHovered, setIsHovered] = useState(false)
  const { isIntroComplete, setHoveredObject, navigateToObject, activeObject } = useWorldStore()
  
  const isActiveObject = activeObject?.id === id

  useFrame((state, delta) => {
    if (groupRef.current) {
      groupRef.current.rotation.z += delta * 0.2
      groupRef.current.rotation.y += delta * 0.1
    }

    if (diskRef.current) {
      diskRef.current.rotation.z -= delta * 2
      const scale = 1 + Math.sin(state.clock.elapsedTime * 5) * 0.05
      diskRef.current.scale.set(scale, scale, 1)
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
        type: 'quasar',
        name: `Quasar ${id.split('-')[1].toUpperCase()}`,
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
      type: 'quasar',
      name: `Quasar ${id.split('-')[1].toUpperCase()}`,
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
        <sphereGeometry args={[4, 16, 16]} />
        <meshBasicMaterial />
      </mesh>

      <group ref={groupRef}>
        {/* Black Hole Core */}
        <mesh>
          <sphereGeometry args={[0.8, 32, 32]} />
          <meshBasicMaterial color="#000000" />
        </mesh>

        {/* Accretion Disk */}
        <mesh ref={diskRef} rotation={[Math.PI / 2.2, 0, 0]}>
          <ringGeometry args={[1.2, 3.5, 64]} />
          <meshBasicMaterial 
            color={color} 
            transparent 
            opacity={0.8} 
            blending={THREE.AdditiveBlending} 
            depthWrite={false}
            side={THREE.DoubleSide}
          />
        </mesh>

        {/* Glowing Aura */}
        <mesh>
          <sphereGeometry args={[1.1, 32, 32]} />
          <meshBasicMaterial color={color} transparent opacity={0.4} blending={THREE.AdditiveBlending} depthWrite={false} />
        </mesh>

        {/* Jets */}
        <mesh position={[0, 6, 0]}>
          <cylinderGeometry args={[0.1, 1.5, 12, 32]} />
          <meshBasicMaterial color={color} transparent opacity={0.6} blending={THREE.AdditiveBlending} depthWrite={false} />
        </mesh>
        <mesh position={[0, -6, 0]} rotation={[Math.PI, 0, 0]}>
          <cylinderGeometry args={[0.1, 1.5, 12, 32]} />
          <meshBasicMaterial color={color} transparent opacity={0.6} blending={THREE.AdditiveBlending} depthWrite={false} />
        </mesh>
      </group>
      
      <pointLight color={color} intensity={isActiveObject ? 8 : 4} distance={40} />
    </group>
  )
}

export default React.memo(Quasar)
