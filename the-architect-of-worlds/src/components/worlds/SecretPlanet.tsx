'use client'

import React, { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { useWorldStore } from '@/stores/useWorldStore'
import { WORLDS } from '@/config/worlds'
import { Html, Float, MeshTransmissionMaterial } from '@react-three/drei'

export function SecretPlanet() {
  const { activeWorld } = useWorldStore()
  const config = WORLDS['secret']
  const isActive = activeWorld === 'secret'

  const monolithRef = useRef<THREE.Mesh>(null!)
  const outerRef = useRef<THREE.Mesh>(null!)

  useFrame((state, delta) => {
    if (monolithRef.current) {
      monolithRef.current.rotation.y -= delta * 0.1
      monolithRef.current.position.y = Math.sin(state.clock.elapsedTime) * 0.1
    }
    if (outerRef.current) {
      outerRef.current.rotation.y += delta * 0.05
      outerRef.current.rotation.x += delta * 0.02
    }
  })

  return (
    <group position={config.position}>
      <Float speed={1} rotationIntensity={0.2} floatIntensity={0.5}>
        <mesh ref={monolithRef}>
          <boxGeometry args={[0.5, 2, 0.5]} />
          <MeshTransmissionMaterial 
            color="#00ffaa"
            transparent 
            opacity={1.0} 
            metalness={0.5}
            roughness={0.0}
            ior={1.2}
            thickness={1.5}
            transmission={1}
            chromaticAberration={0.2}
            anisotropy={0.5}
          />
        </mesh>
        
        <mesh ref={outerRef}>
          <boxGeometry args={[1.5, 3, 1.5]} />
          <meshBasicMaterial color="#00ffaa" wireframe transparent opacity={0.1} blending={THREE.AdditiveBlending} />
        </mesh>
      </Float>

      {isActive && (
        <Html position={[0, 0, 0]} center zIndexRange={[100, 0]}>
          <div className="flex flex-col animate-fade-in-up mt-32 ml-48 pointer-events-auto">
            <div className="w-[400px] p-8 bg-black/40 border-l-2 border-teal-400/50 backdrop-blur-2xl">
              <h2 className="text-3xl font-heading text-white tracking-[0.2em] mb-4 text-glow">ANOMALY DETECTED</h2>
              <div className="text-white/60 font-sans text-sm leading-relaxed space-y-4">
                <p>
                  You have found the hidden sector. Data streams indicate a highly experimental logic structure.
                </p>
                <div className="p-3 bg-teal-500/10 font-mono text-xs text-teal-300 border border-teal-500/20">
                  <code>&gt; DECRYPTING HIDDEN LOGS...</code><br/>
                  <code>&gt; SYSTEM OVERRIDE SUCCESSFUL.</code>
                </div>
              </div>
            </div>
          </div>
        </Html>
      )}
    </group>
  )
}
