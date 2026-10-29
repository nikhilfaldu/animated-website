'use client'

import React, { useRef, useState, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import { Html } from '@react-three/drei'
import * as THREE from 'three'
import { WorldId } from '@/types'
import { useWorldStore, CelestialObject } from '@/stores/useWorldStore'
import HolographicPanel from '@/components/ui/HolographicPanel'

const ANOMALIES_DATA: CelestialObject[] = [
  { id: 'ruins-1', type: 'ruins', name: 'Progenitor Gate', position: new THREE.Vector3(-40, 20, -80) },
  { id: 'station-1', type: 'station', name: 'Voyager Array', position: new THREE.Vector3(60, -30, -50) },
  { id: 'comet-1', type: 'comet', name: 'Halley-X', position: new THREE.Vector3(120, 50, -100) },
  { id: 'pulsar-1', type: 'pulsar', name: 'Neutron Star PSR B1919+21', position: new THREE.Vector3(-100, -60, -150) },
]

export function Anomalies() {
  const { activeObject, hoveredObject, navigateToObject, setHoveredObject, addDiscoveredObject, setNovaOpen, isIntroComplete } = useWorldStore()

  if (!isIntroComplete) return null

  return (
    <group>
      {ANOMALIES_DATA.map((anomaly) => (
        <AnomalyNode 
          key={anomaly.id} 
          data={anomaly} 
          isActive={activeObject?.id === anomaly.id}
          isHovered={hoveredObject?.id === anomaly.id}
          navigateToObject={navigateToObject}
          setHoveredObject={setHoveredObject}
          addDiscoveredObject={addDiscoveredObject}
          setNovaOpen={setNovaOpen}
        />
      ))}
    </group>
  )
}

interface AnomalyNodeProps {
  data: CelestialObject
  isActive: boolean
  isHovered: boolean
  navigateToObject: (obj: CelestialObject | null) => void
  setHoveredObject: (obj: CelestialObject | null) => void
  addDiscoveredObject: (obj: CelestialObject) => void
  setNovaOpen: (isOpen: boolean) => void
}

function AnomalyNode({ data, isActive, isHovered, navigateToObject, setHoveredObject, addDiscoveredObject, setNovaOpen }: AnomalyNodeProps) {
  const meshRef = useRef<THREE.Group>(null!)
  const [showLore, setShowLore] = useState(false)

  useFrame((state, delta) => {
    if (!meshRef.current) return
    if (data.type === 'ruins') {
      meshRef.current.rotation.x += delta * 0.1
      meshRef.current.rotation.y += delta * 0.2
    }
    if (data.type === 'pulsar') {
      meshRef.current.rotation.y += delta * 10 // spin fast
    }
    if (data.type === 'comet') {
      // Very slow orbit around center
      const t = state.clock.elapsedTime * 0.05
      meshRef.current.position.x = Math.sin(t) * 120
      meshRef.current.position.z = Math.cos(t) * 120
      data.position.copy(meshRef.current.position)
    }
  })

  // Provide a fake config for HolographicPanel
  const fakeConfig = useMemo(() => ({
    id: data.id as WorldId,
    name: data.name,
    subtitle: data.type.toUpperCase(),
    description: `A fascinating ${data.type} detected on the edge of the sensor range. Deep space scans reveal high levels of anomalous energy and structural logic defying standard procedural generation.`,
    position: [data.position.x, data.position.y, data.position.z] as [number, number, number],
    colors: { primary: '#fff', secondary: '#ccc', atmosphere: '#00ffff', accent: '#f0f' },
    orbitSpeed: 0,
    scale: 1,
  }), [data])

  return (
    <group 
      position={data.position} 
      ref={meshRef}
      onPointerOver={(e) => { e.stopPropagation(); setHoveredObject(data) }}
      onPointerOut={(e) => { e.stopPropagation(); setHoveredObject(null) }}
      onClick={(e) => {
        e.stopPropagation()
        addDiscoveredObject(data)
        navigateToObject(data)
      }}
    >
      {/* Visual Representation based on type */}
      {data.type === 'ruins' && (
        <mesh>
          <torusKnotGeometry args={[3, 0.5, 100, 16]} />
          <meshStandardMaterial color="#333" wireframe={isHovered} emissive="#00ffff" emissiveIntensity={isHovered ? 0.5 : 0.1} />
        </mesh>
      )}
      {data.type === 'station' && (
        <group>
          <mesh>
            <cylinderGeometry args={[2, 2, 10, 8]} />
            <meshStandardMaterial color="#666" metalness={0.8} roughness={0.2} />
          </mesh>
          <mesh rotation={[Math.PI/2, 0, 0]}>
            <cylinderGeometry args={[4, 4, 2, 16]} />
            <meshStandardMaterial color="#444" emissive="#00ff00" emissiveIntensity={0.2} />
          </mesh>
        </group>
      )}
      {data.type === 'comet' && (
        <mesh>
          <dodecahedronGeometry args={[2, 1]} />
          <meshStandardMaterial color="#aaddff" roughness={0.1} />
        </mesh>
      )}
      {data.type === 'pulsar' && (
        <mesh>
          <sphereGeometry args={[1, 32, 32]} />
          <meshBasicMaterial color="#ffffff" />
          {/* Pulsar beams */}
          <mesh position={[0, 5, 0]}>
            <cylinderGeometry args={[0.1, 2, 10, 16]} />
            <meshBasicMaterial color="#00ffff" transparent opacity={0.5} blending={THREE.AdditiveBlending} />
          </mesh>
          <mesh position={[0, -5, 0]} rotation={[Math.PI, 0, 0]}>
            <cylinderGeometry args={[0.1, 2, 10, 16]} />
            <meshBasicMaterial color="#00ffff" transparent opacity={0.5} blending={THREE.AdditiveBlending} />
          </mesh>
        </mesh>
      )}

      {/* Hover Label */}
      {isHovered && !isActive && (
        <Html position={[0, 5, 0]} center style={{ pointerEvents: 'none' }}>
          <div className="bg-black/60 backdrop-blur-md border border-cyan-500/30 px-3 py-1 rounded text-white font-mono text-xs whitespace-nowrap">
            {data.name} [{data.type.toUpperCase()}]
          </div>
        </Html>
      )}

      {/* Contextual UI - Flat HUD overlay to prevent backwards text */}
      {isActive && (
        <Html position={[0, 0, 0]} center zIndexRange={[100, 0]}>
          <div className="flex flex-col gap-4 animate-fade-in-up mt-32 ml-32 pointer-events-auto">
            {!showLore ? (
              <div className="flex flex-col gap-2 min-w-[250px] bg-black/60 p-4 rounded-xl border border-white/10 backdrop-blur-xl">
                <h3 className="font-heading text-white tracking-widest text-lg mb-2 text-glow">{data.name}</h3>
                <button 
                  onClick={(e) => { e.stopPropagation(); setShowLore(true); }}
                  className="px-4 py-2 bg-white/5 hover:bg-white/20 border border-white/20 rounded-md text-white font-heading text-sm tracking-widest transition-all text-left"
                >
                  [ INSPECT DATA ]
                </button>
                <button 
                  onClick={(e) => { e.stopPropagation(); setNovaOpen(true); }}
                  className="px-4 py-2 bg-cyan-900/40 hover:bg-cyan-800/60 border border-cyan-500/50 rounded-md text-cyan-300 font-heading text-sm tracking-widest transition-all text-left shadow-[0_0_10px_rgba(0,255,255,0.2)]"
                >
                  [ ASK NOVA (AI) ]
                </button>
                <button 
                  onClick={(e) => { e.stopPropagation(); navigateToObject(null); }}
                  className="px-4 py-2 bg-red-900/30 hover:bg-red-800/50 border border-red-500/30 rounded-md text-red-200 font-heading text-sm tracking-widest transition-all text-left"
                >
                  [ DEPART ]
                </button>
              </div>
            ) : (
              <HolographicPanel config={fakeConfig} onClose={() => setShowLore(false)} />
            )}
          </div>
        </Html>
      )}
    </group>
  )
}
