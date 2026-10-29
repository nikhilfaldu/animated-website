import { useRef, useEffect } from 'react'
import { useThree, useFrame } from '@react-three/fiber'
import { OrbitControls } from '@react-three/drei'
import type { OrbitControls as OrbitControlsImpl } from 'three-stdlib'
import gsap from 'gsap'
import { useGardenStore } from '@/stores/useGardenStore'

export function GardenCamera() {
  const { camera } = useThree()
  const controlsRef = useRef<OrbitControlsImpl>(null)
  const isAnimatingRef = useRef(false)

  const { selectedPlantId, plants, autoTour } = useGardenStore()

  // Handle plant selection camera framing
  useEffect(() => {
    if (!selectedPlantId) return
    const plant = plants.find((p) => p.id === selectedPlantId)
    if (!plant || !controlsRef.current) return

    const [px, py, pz] = plant.position
    const targetPos = { x: px + 4, y: py + 4, z: pz + 6 }
    const targetLookAt = { x: px, y: py + 1, z: pz }

    isAnimatingRef.current = true

    const startPos = { x: camera.position.x, y: camera.position.y, z: camera.position.z }
    const startTgt = {
      x: controlsRef.current.target.x,
      y: controlsRef.current.target.y,
      z: controlsRef.current.target.z,
    }

    gsap.to(startPos, {
      x: targetPos.x,
      y: targetPos.y,
      z: targetPos.z,
      duration: 1.8,
      ease: 'power2.inOut',
      onUpdate: () => {
        camera.position.set(startPos.x, startPos.y, startPos.z)
      },
      onComplete: () => {
        isAnimatingRef.current = false
      },
    })

    gsap.to(startTgt, {
      x: targetLookAt.x,
      y: targetLookAt.y,
      z: targetLookAt.z,
      duration: 1.8,
      ease: 'power2.inOut',
      onUpdate: () => {
        if (controlsRef.current) {
          controlsRef.current.target.set(startTgt.x, startTgt.y, startTgt.z)
          controlsRef.current.update()
        }
      },
    })
  }, [selectedPlantId, plants, camera])

  // Subtle idle drift when no active manual movement or selection
  useFrame(() => {
    if (!selectedPlantId && !autoTour && !isAnimatingRef.current && controlsRef.current) {
      // Extremely slow orbit drift
      controlsRef.current.autoRotate = true
      controlsRef.current.autoRotateSpeed = 0.4
    } else if (controlsRef.current) {
      controlsRef.current.autoRotate = autoTour
      controlsRef.current.autoRotateSpeed = 1.2
    }
  })

  return (
    <OrbitControls
      ref={controlsRef}
      enablePan={true}
      enableZoom={true}
      enableRotate={true}
      maxDistance={70}
      minDistance={4}
      maxPolarAngle={Math.PI / 2.05} // Prevent camera going below floor
      minPolarAngle={0.1}
      makeDefault
    />
  )
}
