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

export function NebulaOrbFlora({
  instance,
  isHovered,
  isSelected,
  onPointerOver,
  onPointerOut,
  onClick,
}: PlantProps) {
  const groupRef = useRef<THREE.Group>(null)
  const orbRef = useRef<THREE.Mesh>(null)
  const tendrilsRef = useRef<THREE.Group>(null)
  const spec = PLANT_SPECIES.orb

  useFrame((state, delta) => {
    if (!groupRef.current) return
    const t = state.clock.elapsedTime * 2.2 + instance.position[0] * 4.0

    // Floating orb bobbing
    if (orbRef.current) {
      orbRef.current.position.y = 1.6 + Math.sin(t) * 0.25

      const mat = orbRef.current.material as THREE.MeshStandardMaterial
      if (mat) {
        mat.emissiveIntensity = THREE.MathUtils.lerp(
          mat.emissiveIntensity,
          (isHovered || isSelected ? 4.5 : 2.2) + Math.sin(t * 3) * 0.7,
          delta * 6
        )
      }
    }

    // Tendril wriggling wave effect
    if (tendrilsRef.current) {
      tendrilsRef.current.children.forEach((tendril, idx) => {
        const wave = Math.sin(t * 2.5 + idx) * 0.2
        tendril.rotation.z = wave
        tendril.rotation.x = Math.cos(t * 2.0 + idx) * 0.15
      })
    }

    // Target scale lerp
    const targetScale = instance.scale * (isSelected ? 1.35 : isHovered ? 1.25 : 1.0)
    groupRef.current.scale.lerp(new THREE.Vector3(targetScale, targetScale, targetScale), delta * 8)
  })

  const tendrilCount = 6

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
      {/* Root Base */}
      <mesh position={[0, 0.15, 0]}>
        <cylinderGeometry args={[0.2, 0.35, 0.3, 8]} />
        <meshStandardMaterial color="#3f0f3f" roughness={0.5} emissive="#ff0055" emissiveIntensity={0.5} />
      </mesh>

      {/* Floating Orb Head */}
      <mesh ref={orbRef} position={[0, 1.6, 0]}>
        <icosahedronGeometry args={[0.45, 4]} />
        <meshStandardMaterial
          color={spec.primaryColor}
          emissive={spec.emissiveColor}
          emissiveIntensity={2.5}
          roughness={0.1}
          metalness={0.8}
        />
      </mesh>

      {/* Organic Tendrils tethered from base up towards orb */}
      <group ref={tendrilsRef} position={[0, 0.3, 0]}>
        {Array.from({ length: tendrilCount }).map((_, i) => {
          const angle = (i / tendrilCount) * Math.PI * 2
          const radius = 0.2
          return (
            <mesh
              key={`tendril-${i}`}
              position={[Math.cos(angle) * radius, 0.6, Math.sin(angle) * radius]}
              rotation={[0.1, angle, 0]}
            >
              <cylinderGeometry args={[0.03, 0.06, 1.2, 8]} />
              <meshStandardMaterial
                color={spec.secondaryColor}
                emissive={spec.emissiveColor}
                emissiveIntensity={1.2}
                roughness={0.3}
              />
            </mesh>
          )
        })}
      </group>

      {/* Selection Glow */}
      {(isHovered || isSelected) && (
        <mesh position={[0, 0.05, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[0.7, 0.9, 32]} />
          <meshBasicMaterial color={spec.emissiveColor} transparent opacity={0.7} side={THREE.DoubleSide} />
        </mesh>
      )}
    </group>
  )
}
