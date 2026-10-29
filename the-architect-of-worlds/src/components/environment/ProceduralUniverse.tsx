'use client'

import React, { useRef, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { generateSector, prng } from '@/lib/procedural/universeGenerator'
import { useWorldStore } from '@/stores/useWorldStore'
import { Anomalies } from './Anomalies'

function ShootingStars() {
  const count = 5
  const linesRef = useRef<THREE.LineSegments>(null!)
  
  const { positions, velocities, lifetimes } = useMemo(() => {
    const positions = new Float32Array(count * 6) // line segments (start, end)
    const velocities = []
    const lifetimes = []
    
    for (let i = 0; i < count; i++) {
      // Spawn far away
      const x = (Math.random() - 0.5) * 400
      const y = (Math.random() - 0.5) * 400
      const z = (Math.random() - 0.5) * 400
      
      positions[i * 6] = x
      positions[i * 6 + 1] = y
      positions[i * 6 + 2] = z
      positions[i * 6 + 3] = x
      positions[i * 6 + 4] = y
      positions[i * 6 + 5] = z
      
      const speed = 200 + Math.random() * 200
      const vx = (Math.random() - 0.5) * speed
      const vy = (Math.random() - 0.5) * speed
      const vz = (Math.random() - 0.5) * speed
      velocities.push(new THREE.Vector3(vx, vy, vz))
      lifetimes.push(Math.random())
    }
    return { positions, velocities, lifetimes }
  }, [count])

  useFrame((_, delta) => {
    if (!linesRef.current) return
    const pos = linesRef.current.geometry.attributes.position.array as Float32Array
    
    for (let i = 0; i < count; i++) {
      lifetimes[i] -= delta * 0.5
      
      if (lifetimes[i] <= 0) {
        // Respawn
        const x = (Math.random() - 0.5) * 400
        const y = (Math.random() - 0.5) * 400
        const z = (Math.random() - 0.5) * 400
        pos[i * 6] = x
        pos[i * 6 + 1] = y
        pos[i * 6 + 2] = z
        pos[i * 6 + 3] = x
        pos[i * 6 + 4] = y
        pos[i * 6 + 5] = z
        lifetimes[i] = 1.0 + Math.random() * 2.0
      } else {
        // Move head
        pos[i * 6 + 3] += velocities[i].x * delta
        pos[i * 6 + 4] += velocities[i].y * delta
        pos[i * 6 + 5] += velocities[i].z * delta
        
        // Tail follows head
        pos[i * 6] = pos[i * 6 + 3] - velocities[i].x * 0.1
        pos[i * 6 + 1] = pos[i * 6 + 4] - velocities[i].y * 0.1
        pos[i * 6 + 2] = pos[i * 6 + 5] - velocities[i].z * 0.1
      }
    }
    linesRef.current.geometry.attributes.position.needsUpdate = true
  })

  return (
    <lineSegments ref={linesRef}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          args={[positions, 3]}
        />
      </bufferGeometry>
      <lineBasicMaterial color="#ffffff" transparent opacity={0.6} blending={THREE.AdditiveBlending} />
    </lineSegments>
  )
}

function IntroComet() {
  const { isIntroStarted, isIntroComplete } = useWorldStore()
  const cometRef = useRef<THREE.Group>(null!)
  const tailRef = useRef<THREE.Mesh>(null!)

  useFrame((state, delta) => {
    if (!isIntroStarted || isIntroComplete || !cometRef.current) return
    
    // Start from top right, move to bottom left
    const t = state.clock.elapsedTime
    // Just a fast linear move
    cometRef.current.position.x = 80 - t * 30
    cometRef.current.position.y = 50 - t * 20
    cometRef.current.position.z = 20 - t * 10
    
    if (tailRef.current) {
      tailRef.current.rotation.x -= delta * 5
    }
  })

  if (!isIntroStarted || isIntroComplete) return null

  return (
    <group ref={cometRef} position={[80, 50, 20]}>
      <mesh>
        <sphereGeometry args={[0.5, 16, 16]} />
        <meshBasicMaterial color="#00ffff" />
      </mesh>
      <mesh ref={tailRef} position={[2, 1.5, 1]} rotation={[0, 0, Math.PI / 4]}>
        <coneGeometry args={[1, 10, 8]} />
        <meshBasicMaterial color="#00ffff" transparent opacity={0.3} blending={THREE.AdditiveBlending} />
      </mesh>
    </group>
  )
}

function CosmicWorkshop() {
  const ring1Ref = useRef<THREE.Mesh>(null!)
  const ring2Ref = useRef<THREE.Mesh>(null!)
  const ring3Ref = useRef<THREE.Mesh>(null!)
  const { isIntroStarted } = useWorldStore()

  useFrame((state, delta) => {
    if (!ring1Ref.current) return
    ring1Ref.current.rotation.x += delta * 0.1
    ring1Ref.current.rotation.y += delta * 0.05
    
    ring2Ref.current.rotation.x -= delta * 0.08
    ring2Ref.current.rotation.z += delta * 0.12
    
    ring3Ref.current.rotation.y -= delta * 0.15
    ring3Ref.current.rotation.z -= delta * 0.05
  })

  return (
    <group visible={isIntroStarted}>
      {/* Outer constraint ring */}
      <mesh ref={ring1Ref}>
        <torusGeometry args={[35, 0.02, 32, 100]} />
        <meshBasicMaterial color="#ffffff" transparent opacity={0.05} blending={THREE.AdditiveBlending} wireframe />
      </mesh>
      {/* Middle energy ring */}
      <mesh ref={ring2Ref}>
        <torusGeometry args={[30, 0.05, 16, 100]} />
        <meshBasicMaterial color="#00ffff" transparent opacity={0.08} blending={THREE.AdditiveBlending} />
      </mesh>
      {/* Inner architectural framework */}
      <mesh ref={ring3Ref}>
        <torusGeometry args={[25, 0.1, 8, 100]} />
        <meshStandardMaterial color="#111" metalness={1.0} roughness={0.1} emissive="#00aaff" emissiveIntensity={0.3} wireframe />
      </mesh>
    </group>
  )
}

export function ProceduralUniverse() {

  // In the background version, we only want the vast starfield and dust
  // We do NOT render procedural StarSystems in the center sector
  // generateSector is called but we only use the global procedural background below
  useMemo(() => generateSector(0, 0, 0), [])

  // Generate 10,000 background stars using InstancedMesh for performance
  const bgStarsData = useMemo(() => {
    const count = 15000
    const dummy = new THREE.Object3D()
    const positions = new Float32Array(count * 3)
    const colors = new Float32Array(count * 3)
    const color = new THREE.Color()

    for (let i = 0; i < count; i++) {
      // Distribute stars on a massive sphere
      const r = 800 + prng() * 1000
      const theta = 2 * Math.PI * prng()
      const phi = Math.acos(2 * prng() - 1)
      
      const x = r * Math.sin(phi) * Math.cos(theta)
      const y = r * Math.sin(phi) * Math.sin(theta)
      const z = r * Math.cos(phi)

      dummy.position.set(x, y, z)
      dummy.scale.setScalar(0.5 + prng() * 1.5)
      dummy.updateMatrix()

      positions[i * 3] = x
      positions[i * 3 + 1] = y
      positions[i * 3 + 2] = z

      // Starlight colors (blue-white to orange-red)
      const hue = prng() > 0.8 ? 0.6 : (prng() * 0.1)
      color.setHSL(hue, 0.8, 0.8)
      colors[i * 3] = color.r
      colors[i * 3 + 1] = color.g
      colors[i * 3 + 2] = color.b
    }

    return { positions, colors }
  }, [])

  const pointsRef = useRef<THREE.Points>(null!)
  const materialRef = useRef<THREE.PointsMaterial>(null!)
  const { isIntroStarted } = useWorldStore()

  // Procedural Dust
  const dustRef = useRef<THREE.Points>(null!)
  const dustData = useMemo(() => {
    const count = 5000
    const positions = new Float32Array(count * 3)
    for(let i = 0; i < count; i++) {
      positions[i * 3] = (prng() - 0.5) * 200
      positions[i * 3 + 1] = (prng() - 0.5) * 200
      positions[i * 3 + 2] = (prng() - 0.5) * 200
    }
    return positions
  }, [])

  useFrame((state) => {
    const t = state.clock.elapsedTime
    if (pointsRef.current) {
      pointsRef.current.rotation.y = t * 0.01
    }
    if (materialRef.current) {
      // Fade in stars when intro starts
      const targetOpacity = isIntroStarted ? 0.8 : 0
      materialRef.current.opacity = THREE.MathUtils.lerp(materialRef.current.opacity, targetOpacity, 0.02)
    }
    if (dustRef.current) {
      dustRef.current.rotation.y = t * 0.02
      dustRef.current.rotation.x = t * 0.01
    }
  })

  return (
    <group>
      {/* Background Stars (Instanced Points for extreme performance) */}
      <points ref={pointsRef}>
        <bufferGeometry>
          <bufferAttribute
            attach="attributes-position"
            args={[bgStarsData.positions, 3]}
          />
          <bufferAttribute
            attach="attributes-color"
            args={[bgStarsData.colors, 3]}
          />
        </bufferGeometry>
        <pointsMaterial
          ref={materialRef}
          size={1.5}
          vertexColors
          sizeAttenuation
          transparent
          opacity={0}
        />
      </points>

      {/* Drifting Space Dust */}
      <points ref={dustRef}>
        <bufferGeometry>
          <bufferAttribute
            attach="attributes-position"
            args={[dustData, 3]}
          />
        </bufferGeometry>
        <pointsMaterial size={0.2} color="#00ffff" transparent opacity={0.3} sizeAttenuation />
      </points>

      {/* Procedural Stars and Planets */}
      <group>
        <CosmicWorkshop />
        <ShootingStars />
        <IntroComet />
        <Anomalies />
      </group>
    </group>
  )
}
