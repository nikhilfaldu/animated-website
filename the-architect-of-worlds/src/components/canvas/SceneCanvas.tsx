'use client'

import { Canvas } from '@react-three/fiber'
import { Suspense, useState, useEffect } from 'react'
import * as THREE from 'three'
import { SceneContent } from './SceneContent'
import { useDeviceCapability } from '@/hooks/useDeviceCapability'

interface SceneCanvasProps {
  onCreated?: () => void
}

export default function SceneCanvas({ onCreated }: SceneCanvasProps) {
  const quality = useDeviceCapability()
  const [ready, setReady] = useState(false)

  useEffect(() => {
    if (ready && onCreated) onCreated()
  }, [ready, onCreated])

  const dpr = quality === 'high' ? [1, 2] : quality === 'medium' ? [1, 1.5] : [1, 1]

  return (
    <Canvas
      gl={{
        antialias: quality !== 'low',
        toneMapping: THREE.ACESFilmicToneMapping,
        toneMappingExposure: 1.2,
        powerPreference: 'high-performance',
      }}
      dpr={dpr as [number, number]}
      camera={{ fov: 50, near: 0.1, far: 500, position: [0, 2, 80] }}
      onCreated={() => setReady(true)}
      style={{ background: '#000000' }}
    >
      <Suspense fallback={null}>
        <SceneContent quality={quality} />
      </Suspense>
    </Canvas>
  )
}
