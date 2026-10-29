'use client'

import { useRef, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { useWorldStore } from '@/stores/useWorldStore'

export function TheArchitect() {
  const groupRef = useRef<THREE.Group>(null!)
  const innerRef = useRef<THREE.Mesh>(null!)
  const outerRef = useRef<THREE.Mesh>(null!)
  const ringRef = useRef<THREE.Mesh>(null!)
  const { isIntroComplete } = useWorldStore()

  // Generate floating runes/fragments
  const fragmentsData = useMemo(() => {
    const count = 40
    const dummy = new THREE.Object3D()
    const matrices: THREE.Matrix4[] = []
    
    for (let i = 0; i < count; i++) {
      const phi = Math.acos(-1 + (2 * i) / count)
      const theta = Math.sqrt(count * Math.PI) * phi
      
      const r = 80 + Math.random() * 20
      dummy.position.setFromSphericalCoords(r, phi, theta)
      dummy.lookAt(0, 0, 0)
      dummy.scale.setScalar(1 + Math.random() * 3)
      dummy.updateMatrix()
      matrices.push(dummy.matrix.clone())
    }
    return { count, matrices }
  }, [])

  const fragmentsRef = useRef<THREE.InstancedMesh>(null!)

  useMemo(() => {
    if (!fragmentsRef.current) return
    fragmentsData.matrices.forEach((m, i) => {
      fragmentsRef.current.setMatrixAt(i, m)
    })
    fragmentsRef.current.instanceMatrix.needsUpdate = true
  }, [fragmentsData])

  useFrame((state) => {
    const t = state.clock.elapsedTime

    if (groupRef.current) {
      // Extremely slow majestic rotation
      groupRef.current.rotation.y = Math.sin(t * 0.05) * 0.2
      groupRef.current.position.y = Math.sin(t * 0.1) * 2
    }

    if (innerRef.current) {
      innerRef.current.rotation.x = t * 0.03
      innerRef.current.rotation.z = t * 0.02
      const mat = innerRef.current.material as THREE.MeshStandardMaterial
      mat.emissiveIntensity = 0.5 + Math.sin(t * 0.5) * 0.2
    }

    if (outerRef.current) {
      outerRef.current.rotation.x = -t * 0.015
      outerRef.current.rotation.y = t * 0.025
    }

    if (ringRef.current) {
      ringRef.current.rotation.z = t * 0.01
      const scale = 1 + Math.sin(t * 0.2) * 0.02
      ringRef.current.scale.setScalar(scale)
    }

    if (fragmentsRef.current) {
      fragmentsRef.current.rotation.y = t * 0.01
      fragmentsRef.current.rotation.x = Math.sin(t * 0.05) * 0.1
    }
  })

  // Position it far in the background, slightly offset
  return (
    <group position={[0, -20, -180]} ref={groupRef} scale={isIntroComplete ? 1 : 0.8}>
      {/* Inner glowing core */}
      <mesh ref={innerRef}>
        <octahedronGeometry args={[20, 0]} />
        <meshStandardMaterial 
          color="#FFB800"
          emissive="#FFB800"
          emissiveIntensity={0.5}
          wireframe
          transparent
          opacity={0.3}
        />
      </mesh>

      {/* Outer dark shell */}
      <mesh ref={outerRef}>
        <octahedronGeometry args={[35, 1]} />
        <meshStandardMaterial 
          color="#050510"
          roughness={0.9}
          metalness={0.5}
          wireframe
          transparent
          opacity={0.15}
        />
      </mesh>

      {/* Massive halo ring */}
      <mesh ref={ringRef} rotation={[Math.PI / 2.5, 0, 0]}>
        <torusGeometry args={[60, 0.2, 16, 100]} />
        <meshBasicMaterial 
          color="#FFE066"
          transparent
          opacity={0.1}
          blending={THREE.AdditiveBlending}
        />
      </mesh>

      {/* Orbiting geometric fragments */}
      <instancedMesh ref={fragmentsRef} args={[undefined, undefined, fragmentsData.count]}>
        <tetrahedronGeometry args={[1, 0]} />
        <meshBasicMaterial 
          color="#FFB800" 
          wireframe 
          transparent 
          opacity={0.05} 
          blending={THREE.AdditiveBlending}
        />
      </instancedMesh>
    </group>
  )
}
