'use client'

import React, { useRef, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'

interface StarfieldProps {
  count?: number
}

const Starfield: React.FC<StarfieldProps> = ({ count = 2500 }) => {
  const meshRef = useRef<THREE.InstancedMesh>(null)
  
  const { positions, phases, scales, colors } = useMemo(() => {
    const positions = new Float32Array(count * 3)
    const phases = new Float32Array(count)
    const scales = new Float32Array(count)
    const colors = new Float32Array(count * 3)
    
    const colorChoices = [
      new THREE.Color('#ffffff'),
      new THREE.Color('#e6f0ff'),
      new THREE.Color('#f0e6ff'),
      new THREE.Color('#e6ffe6')
    ]

    for (let i = 0; i < count; i++) {
      const r = 120 * Math.cbrt(Math.random())
      const theta = Math.random() * 2 * Math.PI
      const phi = Math.acos(2 * Math.random() - 1)
      
      positions[i * 3] = r * Math.sin(phi) * Math.cos(theta)
      positions[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta)
      positions[i * 3 + 2] = r * Math.cos(phi)
      
      phases[i] = Math.random() * Math.PI * 2
      scales[i] = 0.5 + Math.random()
      
      const color = colorChoices[Math.floor(Math.random() * colorChoices.length)]
      colors[i * 3] = color.r
      colors[i * 3 + 1] = color.g
      colors[i * 3 + 2] = color.b
    }
    
    return { positions, phases, scales, colors }
  }, [count])

  const uniforms = useMemo(() => ({
    uTime: { value: 0 }
  }), [])

  useFrame((state) => {
    if (meshRef.current) {
      const material = meshRef.current.material as THREE.ShaderMaterial
      material.uniforms.uTime.value = state.clock.elapsedTime
    }
  })

  return (
    <instancedMesh ref={meshRef} args={[undefined, undefined, count]}>
      <sphereGeometry args={[0.04, 4, 4]}>
        <instancedBufferAttribute attach="attributes-position" args={[positions, 3]} />
        <instancedBufferAttribute attach="attributes-aPhase" args={[phases, 1]} />
        <instancedBufferAttribute attach="attributes-aScale" args={[scales, 1]} />
        <instancedBufferAttribute attach="attributes-color" args={[colors, 3]} />
      </sphereGeometry>
      <shaderMaterial
        transparent
        depthWrite={false}
        uniforms={uniforms}
        vertexShader={`
          attribute float aPhase;
          attribute float aScale;
          attribute vec3 color;
          varying vec3 vColor;
          varying float vPhase;
          
          void main() {
            vColor = color;
            vPhase = aPhase;
            vec4 mvPosition = modelViewMatrix * vec4(position * aScale, 1.0);
            gl_Position = projectionMatrix * mvPosition;
          }
        `}
        fragmentShader={`
          uniform float uTime;
          varying vec3 vColor;
          varying float vPhase;
          
          void main() {
            float alpha = 0.5 + 0.5 * sin(uTime * 2.0 + vPhase);
            gl_FragColor = vec4(vColor, alpha);
          }
        `}
      />
    </instancedMesh>
  )
}

export default React.memo(Starfield)
