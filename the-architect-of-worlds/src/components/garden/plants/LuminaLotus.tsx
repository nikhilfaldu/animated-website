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

export function LuminaLotus({
  instance,
  isHovered,
  isSelected,
  onPointerOver,
  onPointerOut,
  onClick,
}: PlantProps) {
  const groupRef = useRef<THREE.Group>(null)
  const coreRef = useRef<THREE.Mesh>(null)
  const petalsGroupRef = useRef<THREE.Group>(null)
  const spec = PLANT_SPECIES.lotus

  // Continuous subtle pulse & float animation
  useFrame((state, delta) => {
    if (!groupRef.current) return
    const t = state.clock.elapsedTime + instance.position[0] * 2.0

    // Gentle swaying
    groupRef.current.rotation.z = Math.sin(t * 1.5) * 0.05
    groupRef.current.rotation.x = Math.cos(t * 1.2) * 0.05

    // Hover / selected scale target lerp
    const targetScale = instance.scale * (isSelected ? 1.4 : isHovered ? 1.25 : 1.0)
    groupRef.current.scale.lerp(new THREE.Vector3(targetScale, targetScale, targetScale), delta * 8)

    // Petal opening rotation lerp
    if (petalsGroupRef.current) {
      const targetPetalRot = isHovered || isSelected ? 0.35 : 0.1
      petalsGroupRef.current.rotation.y += delta * 0.5
      petalsGroupRef.current.children.forEach((child) => {
        child.rotation.z = THREE.MathUtils.lerp(child.rotation.z, targetPetalRot, delta * 5)
      })
    }

    // Core pulsing glow
    if (coreRef.current) {
      const mat = coreRef.current.material as THREE.MeshStandardMaterial
      if (mat) {
        mat.emissiveIntensity = THREE.MathUtils.lerp(
          mat.emissiveIntensity,
          (isHovered || isSelected ? 3.5 : 1.8) + Math.sin(t * 4) * 0.4,
          delta * 6
        )
      }
    }
  })

  const petalCount = 8

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
      {/* Stem */}
      <mesh position={[0, 0.6, 0]}>
        <cylinderGeometry args={[0.06, 0.12, 1.2, 8]} />
        <meshStandardMaterial
          color="#1a4d2e"
          roughness={0.4}
          metalness={0.2}
          emissive="#00ff88"
          emissiveIntensity={0.3}
        />
      </mesh>

      {/* Bioluminescent Leaf Base */}
      {[0, Math.PI / 2, Math.PI, (Math.PI * 3) / 2].map((angle, i) => (
        <mesh
          key={`leaf-${i}`}
          position={[Math.cos(angle) * 0.4, 0.2, Math.sin(angle) * 0.4]}
          rotation={[0.3, angle, 0.4]}
        >
          <coneGeometry args={[0.25, 0.8, 5]} />
          <meshStandardMaterial
            color="#0b3b24"
            emissive="#00ffaa"
            emissiveIntensity={0.4}
          />
        </mesh>
      ))}

      {/* Petals Container */}
      <group ref={petalsGroupRef} position={[0, 1.2, 0]}>
        {Array.from({ length: petalCount }).map((_, i) => {
          const angle = (i / petalCount) * Math.PI * 2
          return (
            <group key={`petal-${i}`} rotation={[0, angle, 0]}>
              <mesh position={[0.3, 0.2, 0]} rotation={[0, 0, 0.2]}>
                <coneGeometry args={[0.22, 0.9, 6]} />
                <meshStandardMaterial
                  color={spec.primaryColor}
                  emissive={spec.emissiveColor}
                  emissiveIntensity={isHovered ? 2.5 : 1.2}
                  roughness={0.2}
                  metalness={0.3}
                />
              </mesh>
            </group>
          )
        })}
      </group>

      {/* Glowing Inner Core */}
      <mesh ref={coreRef} position={[0, 1.35, 0]}>
        <sphereGeometry args={[0.3, 16, 16]} />
        <meshStandardMaterial
          color="#ffffff"
          emissive={spec.emissiveColor}
          emissiveIntensity={2.0}
          roughness={0.1}
        />
      </mesh>

      {/* Selection Glow Ring */}
      {(isHovered || isSelected) && (
        <mesh position={[0, 0.05, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[0.8, 1.0, 32]} />
          <meshBasicMaterial color={spec.emissiveColor} transparent opacity={0.6} side={THREE.DoubleSide} />
        </mesh>
      )}
    </group>
  )
}
