'use client'

import * as THREE from 'three'
import { shaderMaterial } from '@react-three/drei'
import { extend, useFrame } from '@react-three/fiber'
import { vertexShader, fragmentShader } from '@/shaders/planet'
import React, { useRef } from 'react'

const PlanetMaterialImpl = shaderMaterial(
  {
    uTime: 0,
    uColor1: new THREE.Color('#00D68F'),
    uColor2: new THREE.Color('#1a6b3c'),
    uAtmosphereColor: new THREE.Color('#B8F0D8'),
    uFresnelPower: 2.5,
  },
  vertexShader,
  fragmentShader
)

extend({ PlanetMaterialImpl })

type PlanetMaterialProps = {
  color1?: string
  color2?: string
  atmosphereColor?: string
  fresnelPower?: number
}

export function PlanetShaderMaterial({ color1 = '#00D68F', color2 = '#1a6b3c', atmosphereColor = '#B8F0D8', fresnelPower = 2.5 }: PlanetMaterialProps) {
  const ref = useRef<THREE.ShaderMaterial & { uTime: number }>(null)

  useFrame((state) => {
    if (ref.current) {
      ref.current.uTime = state.clock.elapsedTime
    }
  })

  return (
    // @ts-expect-error R3F intrinsic elements typing for custom shader materials
    <planetMaterialImpl
      ref={ref}
      uColor1={new THREE.Color(color1)}
      uColor2={new THREE.Color(color2)}
      uAtmosphereColor={new THREE.Color(atmosphereColor)}
      uFresnelPower={fresnelPower}
    />
  )
}
