import { useRef, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'

export function GalacticSkybox() {
  const starsRef = useRef<THREE.Points>(null)
  const nebulaGroupRef = useRef<THREE.Group>(null)

  // Generate 2500 random star positions & colors
  const [positions, colors] = useMemo(() => {
    const count = 2500
    const posArr = new Float32Array(count * 3)
    const colArr = new Float32Array(count * 3)

    const palette = [
      new THREE.Color('#00f0ff'),
      new THREE.Color('#ff00aa'),
      new THREE.Color('#a855f7'),
      new THREE.Color('#ffffff'),
      new THREE.Color('#38bdf8'),
    ]

    for (let i = 0; i < count; i++) {
      // Sphere radius 250 to 500
      const r = 250 + Math.random() * 250
      const theta = Math.random() * Math.PI * 2
      const phi = Math.acos(2 * Math.random() - 1)

      posArr[i * 3] = r * Math.sin(phi) * Math.cos(theta)
      posArr[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta)
      posArr[i * 3 + 2] = r * Math.cos(phi)

      const col = palette[Math.floor(Math.random() * palette.length)]
      colArr[i * 3] = col.r
      colArr[i * 3 + 1] = col.g
      colArr[i * 3 + 2] = col.b
    }

    return [posArr, colArr]
  }, [])

  useFrame((_, delta) => {
    if (starsRef.current) {
      starsRef.current.rotation.y += delta * 0.015
    }
    if (nebulaGroupRef.current) {
      nebulaGroupRef.current.rotation.y -= delta * 0.008
    }
  })

  return (
    <group>
      {/* Background Starfield */}
      <points ref={starsRef}>
        <bufferGeometry>
          <bufferAttribute
            attach="attributes-position"
            args={[positions, 3]}
          />
          <bufferAttribute
            attach="attributes-color"
            args={[colors, 3]}
          />
        </bufferGeometry>
        <pointsMaterial
          size={1.6}
          vertexColors
          transparent
          opacity={0.9}
          sizeAttenuation={true}
        />
      </points>

      {/* Distant Nebulae Cloud Spheres */}
      <group ref={nebulaGroupRef}>
        {[
          { pos: [-180, 80, -220] as [number, number, number], color: '#6d28d9', scale: 70 },
          { pos: [200, -60, -250] as [number, number, number], color: '#be185d', scale: 85 },
          { pos: [0, 150, -300] as [number, number, number], color: '#0369a1', scale: 95 },
          { pos: [-220, -100, 180] as [number, number, number], color: '#4c1d95', scale: 75 },
        ].map((neb, i) => (
          <mesh key={`nebula-${i}`} position={neb.pos} scale={neb.scale}>
            <sphereGeometry args={[1, 16, 16]} />
            <meshBasicMaterial
              color={neb.color}
              transparent
              opacity={0.12}
              side={THREE.BackSide}
            />
          </mesh>
        ))}
      </group>
    </group>
  )
}
