'use client'

import { useRef, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { useWorldStore } from '@/stores/useWorldStore'
import { WORLDS } from '@/config/worlds'
import { WORLD_ORDER } from '@/config/worlds'

export function EnergyBeam() {
  const groupRef = useRef<THREE.Group>(null!)
  const { isIntroComplete } = useWorldStore()

  const beamData = useMemo(() => {
    const nexusPos = new THREE.Vector3(...WORLDS.nexus.position)
    return WORLD_ORDER.filter((id) => id !== 'nexus').map((id) => {
      const world = WORLDS[id]
      const worldPos = new THREE.Vector3(...world.position)
      const direction = worldPos.clone().sub(nexusPos)
      const length = direction.length()
      const midpoint = nexusPos
        .clone()
        .add(worldPos)
        .multiplyScalar(0.5)
      const rotation = new THREE.Euler()
      const dummy = new THREE.Object3D()
      dummy.position.copy(midpoint)
      dummy.lookAt(worldPos)
      rotation.copy(dummy.rotation)

      return {
        id,
        midpoint,
        rotation,
        length,
        color: world.colors.primary,
      }
    })
  }, [])

  useFrame((state) => {
    if (!groupRef.current) return
    const t = state.clock.elapsedTime

    groupRef.current.children.forEach((child, i) => {
      const mesh = child as THREE.Mesh
      if (mesh.material) {
        const mat = mesh.material as THREE.MeshBasicMaterial
        mat.opacity = 0.05 + Math.sin(t * 1.5 + i * 0.8) * 0.03
      }
    })
  })

  if (!isIntroComplete) return null

  return (
    <group ref={groupRef}>
      {beamData.map((beam) => (
        <mesh
          key={beam.id}
          position={beam.midpoint}
          rotation={beam.rotation}
        >
          <cylinderGeometry args={[0.008, 0.008, beam.length, 4]} />
          <meshBasicMaterial
            color={beam.color}
            transparent
            opacity={0.06}
            blending={THREE.AdditiveBlending}
            depthWrite={false}
          />
        </mesh>
      ))}
    </group>
  )
}
