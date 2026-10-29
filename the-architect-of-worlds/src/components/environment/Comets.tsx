'use client'

import React, { useRef, useState } from 'react'
import { useFrame, ThreeEvent } from '@react-three/fiber'
import * as THREE from 'three'
import { useWorldStore } from '@/stores/useWorldStore'

interface CometProps {
  id: string
  delay: number
  startPos: THREE.Vector3
  endPos: THREE.Vector3
  speed: number
}

const Comet = ({ id, delay, startPos, endPos, speed }: CometProps) => {
  const groupRef = useRef<THREE.Group>(null)
  const [active, setActive] = useState(false)
  const [isHovered, setIsHovered] = useState(false)
  const progressRef = useRef(0)
  const delayRef = useRef(delay)
  
  const { isIntroComplete, setHoveredObject, navigateToObject, activeObject } = useWorldStore()
  
  const isActiveObject = activeObject?.id === id

  useFrame((state, delta) => {
    if (!active) {
      delayRef.current -= delta
      if (delayRef.current <= 0) {
        setActive(true)
        progressRef.current = 0
      }
      return
    }

    // If active object is this comet, slow it down so we can look at it
    const currentSpeed = isActiveObject ? speed * 0.1 : speed
    progressRef.current += delta * currentSpeed
    
    if (progressRef.current >= 1) {
      setActive(false)
      delayRef.current = 3 + Math.random() * 5
      progressRef.current = 0
      return
    }

    if (groupRef.current) {
      groupRef.current.position.lerpVectors(startPos, endPos, progressRef.current)
      groupRef.current.lookAt(endPos)
      
      const s = isHovered || isActiveObject ? 1.5 : 1
      groupRef.current.scale.lerp(new THREE.Vector3(s, s, s), 0.1)
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
        type: 'comet',
        name: `Comet ${id.split('-')[1].toUpperCase()}`,
        position: groupRef.current.position.clone()
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
    if (groupRef.current) {
      navigateToObject({
        id,
        type: 'comet',
        name: `Comet ${id.split('-')[1].toUpperCase()}`,
        position: groupRef.current.position.clone()
      })
    }
  }

  return (
    <group 
      ref={groupRef} 
      visible={active}
      onPointerOver={handlePointerOver}
      onPointerOut={handlePointerOut}
      onClick={handleClick}
    >
      <mesh>
        <sphereGeometry args={[1.5, 16, 16]} />
        <meshBasicMaterial transparent opacity={0} depthWrite={false} />
      </mesh>
      <mesh>
        <sphereGeometry args={[0.15, 16, 16]} />
        <meshStandardMaterial color={isHovered ? "#ffffff" : "#cccccc"} emissive={isHovered || isActiveObject ? "#ffffff" : "#4fc3f7"} emissiveIntensity={isActiveObject ? 8 : 5} />
      </mesh>
      <mesh position={[0, 0, -2]} rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.15, 0.0, 4, 16]} />
        <meshBasicMaterial color="#4fc3f7" transparent opacity={0.3} depthWrite={false} blending={THREE.AdditiveBlending} />
      </mesh>
    </group>
  )
}

const Comets: React.FC = () => {
  const comets = [
    { id: 'comet-alpha', delay: 0, startPos: new THREE.Vector3(-500, 200, -200), endPos: new THREE.Vector3(500, -100, -600), speed: 0.02 },
    { id: 'comet-beta', delay: 3, startPos: new THREE.Vector3(400, 300, -100), endPos: new THREE.Vector3(-400, -200, -500), speed: 0.015 },
    { id: 'comet-gamma', delay: 7, startPos: new THREE.Vector3(-300, -300, -400), endPos: new THREE.Vector3(600, 200, -200), speed: 0.025 }
  ]

  return (
    <>
      {comets.map((comet) => (
        <Comet key={comet.id} {...comet} />
      ))}
    </>
  )
}

export default React.memo(Comets)
