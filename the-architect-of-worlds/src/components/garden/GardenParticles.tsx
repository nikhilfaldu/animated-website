import { useRef, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'

export function GardenParticles() {
  const sporesRef = useRef<THREE.Points>(null)
  const firefliesRef = useRef<THREE.Points>(null)

  // Spores floating above island
  const sporeCount = 400
  const [sporePositions, sporeData] = useMemo(() => {
    const pos = new Float32Array(sporeCount * 3)
    const data = new Float32Array(sporeCount * 3) // [speed, seed, initialY]

    for (let i = 0; i < sporeCount; i++) {
      const r = Math.random() * 26
      const angle = Math.random() * Math.PI * 2
      const x = Math.cos(angle) * r
      const z = Math.sin(angle) * r
      const y = Math.random() * 15

      pos[i * 3] = x
      pos[i * 3 + 1] = y
      pos[i * 3 + 2] = z

      data[i * 3] = 0.4 + Math.random() * 0.8 // speed
      data[i * 3 + 1] = Math.random() * 100 // phase offset
      data[i * 3 + 2] = y
    }

    return [pos, data]
  }, [])

  // Fireflies closer to floor
  const fireflyCount = 120
  const fireflyPositions = useMemo(() => {
    const pos = new Float32Array(fireflyCount * 3)
    for (let i = 0; i < fireflyCount; i++) {
      const r = Math.random() * 24
      const angle = Math.random() * Math.PI * 2
      pos[i * 3] = Math.cos(angle) * r
      pos[i * 3 + 1] = 0.5 + Math.random() * 4.0
      pos[i * 3 + 2] = Math.sin(angle) * r
    }
    return pos
  }, [])

  useFrame((state, delta) => {
    if (sporesRef.current) {
      const positions = sporesRef.current.geometry.attributes.position.array as Float32Array
      const t = state.clock.elapsedTime

      for (let i = 0; i < sporeCount; i++) {
        const speed = sporeData[i * 3]
        const phase = sporeData[i * 3 + 1]

        // Drift upward and reset
        positions[i * 3 + 1] += delta * speed
        positions[i * 3] += Math.sin(t * 0.8 + phase) * 0.02
        positions[i * 3 + 2] += Math.cos(t * 0.6 + phase) * 0.02

        if (positions[i * 3 + 1] > 18) {
          positions[i * 3 + 1] = 0.2
        }
      }

      sporesRef.current.geometry.attributes.position.needsUpdate = true
    }

    if (firefliesRef.current) {
      const t = state.clock.elapsedTime * 1.2
      firefliesRef.current.rotation.y = Math.sin(t * 0.1) * 0.2
    }
  })

  return (
    <group>
      {/* Drifting Pollen Spores */}
      <points ref={sporesRef}>
        <bufferGeometry>
          <bufferAttribute
            attach="attributes-position"
            args={[sporePositions, 3]}
          />
        </bufferGeometry>
        <pointsMaterial
          size={0.25}
          color="#39ff14"
          transparent
          opacity={0.7}
          blending={THREE.AdditiveBlending}
        />
      </points>

      {/* Floating Glowing Fireflies */}
      <points ref={firefliesRef}>
        <bufferGeometry>
          <bufferAttribute
            attach="attributes-position"
            args={[fireflyPositions, 3]}
          />
        </bufferGeometry>
        <pointsMaterial
          size={0.45}
          color="#00f0ff"
          transparent
          opacity={0.85}
          blending={THREE.AdditiveBlending}
        />
      </points>
    </group>
  )
}
