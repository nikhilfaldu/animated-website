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

export function VoidWillow({
  instance,
  isHovered,
  isSelected,
  onPointerOver,
  onPointerOut,
  onClick,
}: PlantProps) {
  const groupRef = useRef<THREE.Group>(null)
  const canopyRef = useRef<THREE.Group>(null)
  const spec = PLANT_SPECIES.willow

  useFrame((state, delta) => {
    if (!groupRef.current) return
    const t = state.clock.elapsedTime * 1.5 + instance.position[0] * 2.5

    // Branch canopy swaying
    if (canopyRef.current) {
      canopyRef.current.rotation.z = Math.sin(t) * 0.08
      canopyRef.current.rotation.x = Math.cos(t * 0.8) * 0.06

      canopyRef.current.children.forEach((branch, idx) => {
        const mat = (branch as THREE.Mesh).material as THREE.MeshStandardMaterial
        if (mat && mat.emissiveIntensity !== undefined) {
          mat.emissiveIntensity = THREE.MathUtils.lerp(
            mat.emissiveIntensity,
            (isHovered || isSelected ? 3.5 : 1.8) + Math.sin(t * 2 + idx) * 0.5,
            delta * 5
          )
        }
      })
    }

    // Scale lerp
    const targetScale = instance.scale * (isSelected ? 1.3 : isHovered ? 1.18 : 1.0)
    groupRef.current.scale.lerp(new THREE.Vector3(targetScale, targetScale, targetScale), delta * 8)
  })

  // Pre-calculated leaf node positions
  const canopyNodes = [
    { pos: [0, 2.2, 0] as [number, number, number], r: 0.6 },
    { pos: [-0.6, 1.8, 0.4] as [number, number, number], r: 0.45 },
    { pos: [0.6, 1.9, -0.3] as [number, number, number], r: 0.48 },
    { pos: [0.2, 2.0, 0.7] as [number, number, number], r: 0.42 },
    { pos: [-0.4, 2.1, -0.5] as [number, number, number], r: 0.44 },
  ]

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
      {/* Twisted Trunk */}
      <mesh position={[0, 0.9, 0]}>
        <cylinderGeometry args={[0.15, 0.35, 1.8, 10]} />
        <meshStandardMaterial
          color="#1e1b4b"
          emissive="#4c1d95"
          emissiveIntensity={0.5}
          roughness={0.6}
        />
      </mesh>

      {/* Canopy Leaf Clusters */}
      <group ref={canopyRef}>
        {canopyNodes.map((node, i) => (
          <mesh key={`canopy-${i}`} position={node.pos}>
            <dodecahedronGeometry args={[node.r, 1]} />
            <meshStandardMaterial
              color={spec.primaryColor}
              emissive={spec.emissiveColor}
              emissiveIntensity={2.0}
              roughness={0.2}
              metalness={0.3}
            />
          </mesh>
        ))}
      </group>

      {/* Hanging starlight droplets */}
      {canopyNodes.map((node, i) => (
        <mesh key={`droplet-${i}`} position={[node.pos[0], node.pos[1] - node.r - 0.2, node.pos[2]]}>
          <sphereGeometry args={[0.07, 8, 8]} />
          <meshBasicMaterial color="#ffffff" />
        </mesh>
      ))}

      {/* Selection Glow */}
      {(isHovered || isSelected) && (
        <mesh position={[0, 0.05, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[0.9, 1.15, 32]} />
          <meshBasicMaterial color={spec.emissiveColor} transparent opacity={0.7} side={THREE.DoubleSide} />
        </mesh>
      )}
    </group>
  )
}
