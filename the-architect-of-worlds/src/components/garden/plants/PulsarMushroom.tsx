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

export function PulsarMushroom({
  instance,
  isHovered,
  isSelected,
  onPointerOver,
  onPointerOut,
  onClick,
}: PlantProps) {
  const groupRef = useRef<THREE.Group>(null)
  const capRef = useRef<THREE.Mesh>(null)
  const sporesGroupRef = useRef<THREE.Group>(null)
  const spec = PLANT_SPECIES.mushroom

  useFrame((state, delta) => {
    if (!groupRef.current) return
    const t = state.clock.elapsedTime * 2.0 + instance.position[0] * 3.0

    // Cap squish & stretch pulse
    if (capRef.current) {
      capRef.current.scale.y = 1.0 + Math.sin(t) * 0.08
      capRef.current.scale.x = 1.0 + Math.cos(t) * 0.05
      capRef.current.scale.z = 1.0 + Math.cos(t) * 0.05

      const mat = capRef.current.material as THREE.MeshStandardMaterial
      if (mat) {
        mat.emissiveIntensity = THREE.MathUtils.lerp(
          mat.emissiveIntensity,
          (isHovered || isSelected ? 3.8 : 1.8) + Math.sin(t * 2) * 0.6,
          delta * 6
        )
      }
    }

    // Drifting spores elevation
    if (sporesGroupRef.current) {
      sporesGroupRef.current.position.y = 0.8 + (Math.sin(t * 1.5) * 0.15)
      sporesGroupRef.current.rotation.y += delta * 0.8
    }

    // Overall scale lerp
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
      {/* Mushroom Stem */}
      <mesh position={[0, 0.7, 0]}>
        <cylinderGeometry args={[0.1, 0.22, 1.4, 12]} />
        <meshStandardMaterial
          color="#064e3b"
          emissive={spec.primaryColor}
          emissiveIntensity={0.6}
          roughness={0.3}
        />
      </mesh>

      {/* Mushroom Cap */}
      <mesh ref={capRef} position={[0, 1.4, 0]}>
        <sphereGeometry args={[0.7, 16, 12, 0, Math.PI * 2, 0, Math.PI * 0.55]} />
        <meshStandardMaterial
          color={spec.primaryColor}
          emissive={spec.emissiveColor}
          emissiveIntensity={1.8}
          roughness={0.2}
          side={THREE.DoubleSide}
        />
      </mesh>

      {/* Bioluminescent Cap Dots */}
      {[0, 1.2, 2.4, 3.6, 4.8].map((angle, i) => (
        <mesh
          key={`dot-${i}`}
          position={[Math.cos(angle) * 0.45, 1.6, Math.sin(angle) * 0.45]}
        >
          <sphereGeometry args={[0.08, 8, 8]} />
          <meshBasicMaterial color="#ffffff" />
        </mesh>
      ))}

      {/* Spore Particles underneath cap */}
      <group ref={sporesGroupRef} position={[0, 0.8, 0]}>
        {[0, 1, 2, 3, 4, 5].map((i) => {
          const a = (i / 6) * Math.PI * 2
          return (
            <mesh key={`spore-${i}`} position={[Math.cos(a) * 0.35, 0, Math.sin(a) * 0.35]}>
              <sphereGeometry args={[0.04, 8, 8]} />
              <meshBasicMaterial color={spec.emissiveColor} />
            </mesh>
          )
        })}
      </group>

      {/* Selection Glow */}
      {(isHovered || isSelected) && (
        <mesh position={[0, 0.05, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[0.75, 0.95, 32]} />
          <meshBasicMaterial color={spec.emissiveColor} transparent opacity={0.7} side={THREE.DoubleSide} />
        </mesh>
      )}
    </group>
  )
}
