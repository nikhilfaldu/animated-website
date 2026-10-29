'use client'

import React from 'react'
import { Environment } from '@react-three/drei'
import { useThree } from '@react-three/fiber'
import * as THREE from 'three'
import { WORLDS, WORLD_ORDER } from '@/config/worlds'

const SpaceLighting: React.FC = () => {
  const { scene } = useThree()

  // Add fog
  React.useEffect(() => {
    scene.fog = new THREE.FogExp2('#050510', 0.008)
    return () => {
      scene.fog = null
    }
  }, [scene])

  return (
    <>

      <ambientLight intensity={0.12} />
      <directionalLight
        position={[50, 30, 50]}
        intensity={1.8}
        color="#fff0e6"
      />
      {WORLD_ORDER.map((worldId) => {
        const world = WORLDS[worldId]
        return (
          <pointLight
            key={worldId}
            position={world.position}
            color={world.colors.primary}
            intensity={0.5}
            distance={15}
          />
        )
      })}
    </>
  )
}

export default React.memo(SpaceLighting)
