import { useRef } from 'react'
import { useFrame, ThreeEvent } from '@react-three/fiber'
import * as THREE from 'three'
import { GardenPlantInstance } from '@/types/garden'
import { PLANT_SPECIES } from '@/data/gardenData'

interface PlantProps {
  instance: GardenPlantInstance
  isHovered: boolean
  isSelected: boolean
  onPointerOver: (e: ThreeEvent<PointerEvent>) => void
  onPointerOut: (e: ThreeEvent<PointerEvent>) => void
  onClick: (e: ThreeEvent<MouseEvent>) => void
}

export function AetherCrystal({
  instance,
  isHovered,
  isSelected,
  onPointerOver,
  onPointerOut,
  onClick,
}: PlantProps) {
  const groupRef = useRef<THREE.Group>(null)
  const ringRef = useRef<THREE.Mesh>(null)
  const mainSpireRef = useRef<THREE.Mesh>(null)
  const spec = PLANT_SPECIES.crystal

  useFrame((state, delta) => {
    if (!groupRef.current) return
    const t = state.clock.elapsedTime + instance.position[0]

    // Slow hovering ring rotation
    if (ringRef.current) {
      ringRef.current.rotation.x = t * 1.5
      ringRef.current.rotation.y = t * 2.0
    }

    // Spire pulsation
    if (mainSpireRef.current) {
      const mat = mainSpireRef.current.material as THREE.MeshStandardMaterial
      if (mat) {
        mat.emissiveIntensity = THREE.MathUtils.lerp(
          mat.emissiveIntensity,
          (isHovered || isSelected ? 4.0 : 2.0) + Math.sin(t * 5) * 0.5,
          delta * 6
        )
      }
    }

    // Scale lerp
    const targetScale = instance.scale * (isSelected ? 1.35 : isHovered ? 1.2 : 1.0)
    groupRef.current.scale.lerp(new THREE.Vector3(targetScale, targetScale, targetScale), delta * 8)
  })

  return (
    <group
      ref={groupRef}
      position={instance.position}
      rotation={instance.rotation}
      scale={instance.scale}
      onPointerOver={onPointerOver}
      onPointerOut={onPointerOut}
      onClick={onClick}
    >
      {/* Rocky Crystal Pedestal */}
      <mesh position={[0, 0.2, 0]}>
        <dodecahedronGeometry args={[0.5, 0]} />
        <meshStandardMaterial color="#1e293b" roughness={0.7} metalness={0.8} />
      </mesh>

      {/* Main Crystal Spire */}
      <mesh ref={mainSpireRef} position={[0, 1.4, 0]}>
        <coneGeometry args={[0.35, 2.2, 5]} />
        <meshStandardMaterial
          color={spec.primaryColor}
          emissive={spec.emissiveColor}
          emissiveIntensity={2.0}
          roughness={0.1}
          metalness={0.9}
        />
      </mesh>

      {/* Satellite Crystal Clusters */}
      {[-0.35, 0.35].map((xOffset, i) => (
        <mesh
          key={`sub-crystal-${i}`}
          position={[xOffset, 0.7, (i === 0 ? 0.2 : -0.2)]}
          rotation={[0.2 * (i === 0 ? 1 : -1), 0, (i === 0 ? -0.3 : 0.3)]}
        >
          <coneGeometry args={[0.18, 1.2, 5]} />
          <meshStandardMaterial
            color={spec.secondaryColor}
            emissive={spec.emissiveColor}
            emissiveIntensity={1.5}
            roughness={0.15}
            metalness={0.85}
          />
        </mesh>
      ))}

      {/* Levitating Energy Ring */}
      <mesh ref={ringRef} position={[0, 1.4, 0]}>
        <torusGeometry args={[0.55, 0.03, 16, 32]} />
        <meshStandardMaterial color="#ffffff" emissive="#00ffff" emissiveIntensity={3.0} />
      </mesh>

      {/* Hover / Select Indicator */}
      {(isHovered || isSelected) && (
        <mesh position={[0, 0.05, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[0.7, 0.9, 32]} />
          <meshBasicMaterial color="#00ffff" transparent opacity={0.7} side={THREE.DoubleSide} />
        </mesh>
      )}
    </group>
  )
}
