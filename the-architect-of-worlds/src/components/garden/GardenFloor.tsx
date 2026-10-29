import { useRef, useState } from 'react'
import { useFrame, ThreeEvent } from '@react-three/fiber'
import * as THREE from 'three'
import { useGardenStore } from '@/stores/useGardenStore'
import { gardenSound } from '@/components/audio/GardenSoundEngine'

export function GardenFloor() {
  const floorMeshRef = useRef<THREE.Mesh>(null)
  const cursorRef = useRef<THREE.Mesh>(null)
  const [cursorPos, setCursorPos] = useState<[number, number, number] | null>(null)

  const { isPlantingMode, addPlantAt, selectedSpeciesToPlant, selectPlant } = useGardenStore()

  // Animate bioluminescent energy glow
  useFrame((state, delta) => {
    if (floorMeshRef.current) {
      const mat = floorMeshRef.current.material as THREE.MeshStandardMaterial
      if (mat) {
        const t = state.clock.elapsedTime
        mat.emissiveIntensity = 0.35 + Math.sin(t * 0.8) * 0.1
      }
    }

    if (cursorRef.current && cursorPos) {
      cursorRef.current.rotation.z += delta * 1.5
    }
  })

  const handlePointerMove = (e: ThreeEvent<PointerEvent>) => {
    e.stopPropagation()
    if (isPlantingMode && e.point) {
      setCursorPos([e.point.x, e.point.y + 0.1, e.point.z])
    }
  }

  const handlePointerOut = () => {
    setCursorPos(null)
  }

  const handleClick = (e: ThreeEvent<MouseEvent>) => {
    e.stopPropagation()
    if (!e.point) return

    // Deselect current plant if clicking empty terrain
    selectPlant(null)

    if (isPlantingMode) {
      const clickPos: [number, number, number] = [e.point.x, e.point.y + 0.05, e.point.z]
      addPlantAt(clickPos, selectedSpeciesToPlant)
      gardenSound.playSeedPlantSound()
    }
  }

  return (
    <group>
      {/* Primary Floating Island Platform */}
      <mesh
        ref={floorMeshRef}
        position={[0, -0.4, 0]}
        rotation={[-Math.PI / 2, 0, 0]}
        onPointerMove={handlePointerMove}
        onPointerOut={handlePointerOut}
        onClick={handleClick}
      >
        <cylinderGeometry args={[28, 22, 1.2, 64]} />
        <meshStandardMaterial
          color="#0d1117"
          roughness={0.6}
          metalness={0.4}
          emissive="#1e1b4b"
          emissiveIntensity={0.35}
        />
      </mesh>

      {/* Bioluminescent Outer Floating Rock Crust */}
      <mesh position={[0, -1.2, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[22, 5, 2.5, 32]} />
        <meshStandardMaterial color="#05070a" roughness={0.9} metalness={0.7} />
      </mesh>

      {/* Ground Energy Rings */}
      {[8, 16, 24].map((radius, i) => (
        <mesh key={`ring-${i}`} position={[0, 0.02, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[radius - 0.08, radius, 64]} />
          <meshStandardMaterial color="#00f0ff" emissive="#00ffff" emissiveIntensity={0.8} transparent opacity={0.3} side={THREE.DoubleSide} />
        </mesh>
      ))}

      {/* Seed Planting Cursor Ring */}
      {isPlantingMode && cursorPos && (
        <mesh ref={cursorRef} position={cursorPos} rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[0.5, 0.7, 32]} />
          <meshBasicMaterial color="#39ff14" transparent opacity={0.85} side={THREE.DoubleSide} />
        </mesh>
      )}
    </group>
  )
}
