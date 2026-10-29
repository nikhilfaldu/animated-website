'use client'

import React, { useRef, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import { Points, PointMaterial } from '@react-three/drei'
import * as THREE from 'three'

interface CosmicDustProps {
  count?: number
}

const CosmicDust: React.FC<CosmicDustProps> = ({ count = 1200 }) => {
  const pointsRef = useRef<THREE.Points>(null)

  const positions = useMemo(() => {
    const pos = new Float32Array(count * 3)
    for (let i = 0; i < count; i++) {
      const theta = Math.random() * 2 * Math.PI
      const r = 30 * Math.sqrt(Math.random())
      const z = (Math.random() - 0.5) * 100
      pos[i * 3] = r * Math.cos(theta)
      pos[i * 3 + 1] = r * Math.sin(theta)
      pos[i * 3 + 2] = z
    }
    return pos
  }, [count])

  useFrame((state, delta) => {
    if (pointsRef.current) {
      pointsRef.current.rotation.z += delta * 0.05
      pointsRef.current.position.y = Math.sin(state.clock.elapsedTime * 0.2) * 2
    }
  })

  return (
    <Points ref={pointsRef} positions={positions} stride={3}>
      <PointMaterial
        transparent
        color="#fff5e6"
        size={0.05}
        sizeAttenuation={true}
        depthWrite={false}
        opacity={0.4}
      />
    </Points>
  )
}

export default React.memo(CosmicDust)
