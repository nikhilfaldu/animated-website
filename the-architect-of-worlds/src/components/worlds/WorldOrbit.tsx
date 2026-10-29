'use client'

import { useRef, ReactNode, useState } from 'react'
import { useFrame } from '@react-three/fiber'
import { Html } from '@react-three/drei'
import * as THREE from 'three'
import { WorldConfig } from '@/types'
import { useWorldStore } from '@/stores/useWorldStore'
import HolographicPanel from '@/components/ui/HolographicPanel'

interface WorldOrbitProps {
  config: WorldConfig
  children: ReactNode
}

export function WorldOrbit({ config, children }: WorldOrbitProps) {
  const groupRef = useRef<THREE.Group>(null!)
  const glowRef = useRef<THREE.Mesh>(null!)
  const { activeWorld, hoveredWorld, navigateToWorld, setHovered, isIntroComplete, setNovaOpen, addDiscoveredObject } =
    useWorldStore()

  const isActive = activeWorld === config.id
  const isHovered = hoveredWorld === config.id
  const isSecret = config.id === 'secret'
  const [secretRevealed, setSecretRevealed] = useState(false)
  const [showLore, setShowLore] = useState(false)

  // Target scale based on hover/active state
  const baseScale = config.scale
  const currentScale = useRef(baseScale)

  useFrame((state) => {
    if (!groupRef.current) return
    const t = state.clock.elapsedTime

    // Gentle floating bob
    const bobY = Math.sin(t * 0.5 + config.position[0]) * 0.15
    groupRef.current.position.y = config.position[1] + bobY

    // Self-rotation
    groupRef.current.rotation.y += config.orbitSpeed * 0.01

    // Smooth scale interpolation (hide completely if intro not finished)
    let targetScale = isHovered ? baseScale * 1.08 : isActive ? baseScale * 1.05 : baseScale
    if (!isIntroComplete) targetScale = 0
    currentScale.current = THREE.MathUtils.lerp(currentScale.current, targetScale, 0.05)
    groupRef.current.scale.setScalar(currentScale.current)

    // Glow aura opacity
    if (glowRef.current) {
      const mat = glowRef.current.material as THREE.MeshBasicMaterial
      const targetOpacity = isHovered && !isActive ? 0.3 : 0
      mat.opacity = THREE.MathUtils.lerp(mat.opacity, targetOpacity, 0.1)
    }
  })

  const handlePointerEnter = () => {
    if (!isIntroComplete) return
    if (isSecret && !secretRevealed) return
    setHovered(config.id)
    document.body.style.cursor = 'pointer'
  }

  const handlePointerLeave = () => {
    setHovered(null)
    document.body.style.cursor = 'default'
  }

  const handleClick = () => {
    if (!isIntroComplete) return
    if (isSecret && !secretRevealed) {
      setSecretRevealed(true)
      return
    }
    
    // Log discovery
    addDiscoveredObject({
      id: config.id,
      name: config.name,
      type: 'planet',
      position: new THREE.Vector3(config.position[0], config.position[1], config.position[2])
    })

    navigateToWorld(config.id)
  }

  // Secret planet starts tiny and invisible until discovered
  const visible = isSecret ? secretRevealed || isActive : true

  return (
    <group
      ref={groupRef}
      position={[config.position[0], config.position[1], config.position[2]]}
      visible={visible}
    >
      <group
        onPointerEnter={handlePointerEnter}
        onPointerLeave={handlePointerLeave}
        onClick={handleClick}
      >
        {children}
      </group>

      {/* Hover glow aura */}
      <mesh ref={glowRef} visible={!isActive}>
        <sphereGeometry args={[1.3, 32, 32]} />
        <meshBasicMaterial
          color={config.colors.primary}
          transparent
          opacity={0}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
          side={THREE.BackSide}
        />
      </mesh>

      {/* Active ring indicator */}
      {isActive && (
        <mesh rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[1.3, 1.4, 64]} />
          <meshBasicMaterial
            color={config.colors.primary}
            transparent
            opacity={0.6}
            side={THREE.DoubleSide}
          />
        </mesh>
      )}
      {/* Contextual UI */}
      {isActive && (
        <Html position={[2, 0, 0]} center transform distanceFactor={5} zIndexRange={[100, 0]}>
          <div className="flex flex-col gap-4 animate-fade-in-up">
            {!showLore ? (
              <div className="flex flex-col gap-2 min-w-[200px]">
                <button 
                  onClick={(e) => { e.stopPropagation(); setShowLore(true); }}
                  className="px-4 py-2 bg-black/40 hover:bg-white/10 border border-white/20 rounded-md text-white font-heading text-sm tracking-widest backdrop-blur-md transition-all text-left"
                >
                  [ INSPECT ]
                </button>
                <button 
                  onClick={(e) => { e.stopPropagation(); setNovaOpen(true); }}
                  className="px-4 py-2 bg-black/40 hover:bg-white/10 border border-cyan-500/50 rounded-md text-cyan-300 font-heading text-sm tracking-widest backdrop-blur-md transition-all text-left shadow-[0_0_10px_rgba(0,255,255,0.2)]"
                >
                  [ ASK NOVA ]
                </button>
                <button 
                  onClick={(e) => { e.stopPropagation(); navigateToWorld(null); }}
                  className="px-4 py-2 bg-black/40 hover:bg-white/10 border border-red-500/30 rounded-md text-white/70 font-heading text-sm tracking-widest backdrop-blur-md transition-all text-left"
                >
                  [ DEPART ]
                </button>
              </div>
            ) : (
              <HolographicPanel config={config} onClose={() => setShowLore(false)} />
            )}
          </div>
        </Html>
      )}
    </group>
  )
}
