'use client'

import React, { useRef, useMemo, useState, useEffect } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { useWorldStore } from '@/stores/useWorldStore'
import { prng } from '@/lib/procedural/universeGenerator'

const FloatingRocks: React.FC = () => {
  const meshRef = useRef<THREE.InstancedMesh>(null)
  const { isIntroComplete, setHoveredObject, navigateToObject, activeObject } = useWorldStore()
  
  const count = 500
  const [hoveredId, setHoveredId] = useState<number | null>(null)
  
  const { positions, rotations, rotationSpeeds, offsets, ids } = useMemo(() => {
    const positions = new Float32Array(count * 3)
    const rotations = new Float32Array(count * 3)
    const rotationSpeeds = new Float32Array(count * 3)
    const offsets = new Float32Array(count)
    const ids: string[] = []

    for (let i = 0; i < count; i++) {
      // Procedurally spread across a massive deep space area (avoiding foreground)
      const r = 200 + prng() * 1500
      const theta = prng() * Math.PI * 2
      const phi = Math.acos(2 * prng() - 1)
      
      positions[i * 3] = r * Math.sin(phi) * Math.cos(theta)
      positions[i * 3 + 1] = (r * Math.sin(phi) * Math.sin(theta)) * 0.2 // Flatten belt slightly
      positions[i * 3 + 2] = r * Math.cos(phi)
      
      rotations[i * 3] = prng() * Math.PI
      rotations[i * 3 + 1] = prng() * Math.PI
      rotations[i * 3 + 2] = prng() * Math.PI
      
      rotationSpeeds[i * 3] = (prng() - 0.5) * 0.02
      rotationSpeeds[i * 3 + 1] = (prng() - 0.5) * 0.02
      rotationSpeeds[i * 3 + 2] = (prng() - 0.5) * 0.02
      
      offsets[i] = prng() * Math.PI * 2
      ids.push(`asteroid-${i}`)
    }
    
    return { positions, rotations, rotationSpeeds, offsets, ids }
  }, [])

  const dummy = useMemo(() => new THREE.Object3D(), [])
  const baseColor = useMemo(() => new THREE.Color("#222222"), [])
  const hoverColor = useMemo(() => new THREE.Color("#FF4500"), [])
  const activeColor = useMemo(() => new THREE.Color("#FFD700"), [])

  useFrame((state) => {
    if (!meshRef.current) return
    const time = state.clock.elapsedTime
    
    for (let i = 0; i < count; i++) {
      dummy.position.set(
        positions[i * 3],
        positions[i * 3 + 1] + Math.sin(time + offsets[i]) * 0.5,
        positions[i * 3 + 2]
      )
      
      rotations[i * 3] += rotationSpeeds[i * 3]
      rotations[i * 3 + 1] += rotationSpeeds[i * 3 + 1]
      rotations[i * 3 + 2] += rotationSpeeds[i * 3 + 2]
      
      dummy.rotation.set(rotations[i * 3], rotations[i * 3 + 1], rotations[i * 3 + 2])
      
      // Scale up if hovered or active
      const isActive = activeObject?.id === ids[i]
      const isHovered = hoveredId === i
      const s = isActive ? 1.5 : isHovered ? 1.2 : 1.0
      dummy.scale.setScalar(s)
      
      dummy.updateMatrix()
      meshRef.current.setMatrixAt(i, dummy.matrix)

      // Update colors
      if (isActive) {
        meshRef.current.setColorAt(i, activeColor)
      } else if (isHovered) {
        meshRef.current.setColorAt(i, hoverColor)
      } else {
        meshRef.current.setColorAt(i, baseColor)
      }
    }
    meshRef.current.instanceMatrix.needsUpdate = true
    if (meshRef.current.instanceColor) {
      meshRef.current.instanceColor.needsUpdate = true
    }
  })

  // Set up instance colors initially
  useEffect(() => {
    if (meshRef.current) {
      for (let i = 0; i < count; i++) {
        meshRef.current.setColorAt(i, baseColor)
      }
      if (meshRef.current.instanceColor) {
        meshRef.current.instanceColor.needsUpdate = true
      }
    }
  }, [baseColor])

  return (
    <instancedMesh 
      ref={meshRef} 
      args={[undefined, undefined, count]}
      onPointerOver={(e) => {
        if (!isIntroComplete) return
        e.stopPropagation()
        if (e.instanceId !== undefined) {
          document.body.style.cursor = 'pointer'
          setHoveredId(e.instanceId)
          
          const mat = new THREE.Matrix4()
          meshRef.current?.getMatrixAt(e.instanceId, mat)
          const pos = new THREE.Vector3().setFromMatrixPosition(mat)
          
          setHoveredObject({
            id: ids[e.instanceId],
            type: 'asteroid',
            name: `Asteroid ${ids[e.instanceId].split('-')[1]}`,
            position: pos
          })
        }
      }}
      onPointerOut={() => {
        if (!isIntroComplete) return
        document.body.style.cursor = 'auto'
        setHoveredId(null)
        setHoveredObject(null)
      }}
      onClick={(e) => {
        if (!isIntroComplete) return
        e.stopPropagation()
        if (e.instanceId !== undefined) {
          const mat = new THREE.Matrix4()
          meshRef.current?.getMatrixAt(e.instanceId, mat)
          const pos = new THREE.Vector3().setFromMatrixPosition(mat)
          
          navigateToObject({
            id: ids[e.instanceId],
            type: 'asteroid',
            name: `Asteroid ${ids[e.instanceId].split('-')[1]}`,
            position: pos
          })
        }
      }}
    >
      <dodecahedronGeometry args={[0.3, 0]} />
      <meshStandardMaterial roughness={0.8} />
    </instancedMesh>
  )
}

export default React.memo(FloatingRocks)
