'use client'

import { QualityTier } from '@/types'
import { useWorldStore } from '@/stores/useWorldStore'
import { CinematicCamera } from '@/components/camera/CinematicCamera'
import SpaceLighting from '@/components/environment/SpaceLighting'
import { CelestialForgeCore } from '@/components/environment/CelestialForgeCore'
import { ProceduralUniverse } from '@/components/environment/ProceduralUniverse'
import FloatingRocks from '@/components/environment/FloatingRocks'
import Comets from '@/components/environment/Comets'
import Nebula from '@/components/environment/Nebula'
import { AtmosphereFX } from '@/components/environment/AtmosphereFX'
import { SceneEffects } from './SceneEffects'

import { NexusWorld } from '@/components/worlds/NexusWorld'
import { EmeraldIsle } from '@/components/worlds/EmeraldIsle'
import { ForgePlanet } from '@/components/worlds/ForgePlanet'
import { OceanWorld } from '@/components/worlds/OceanWorld'
import { CrystalMoon } from '@/components/worlds/CrystalMoon'
import { SingularityWorld } from '@/components/worlds/SingularityWorld'
import { SecretPlanet } from '@/components/worlds/SecretPlanet'

import GalacticGardenScene from '@/components/garden/GalacticGardenScene'

interface SceneContentProps {
  quality?: QualityTier
}

export function SceneContent({ quality = 'high' }: SceneContentProps) {
  const { viewMode } = useWorldStore()

  if (viewMode === 'garden') {
    return <GalacticGardenScene />
  }

  return (
    <>
      <CinematicCamera />
      <SpaceLighting />

      {/* The Central Celestial Forge Machine */}
      <CelestialForgeCore />

      {/* Core Planets */}
      <NexusWorld />
      <EmeraldIsle />
      <ForgePlanet />
      <OceanWorld />
      <CrystalMoon />
      <SingularityWorld />
      <SecretPlanet />

      {/* Procedural Background Decor */}
      <ProceduralUniverse />

      {/* Atmospheric Effects */}
      <AtmosphereFX />
      {quality !== 'low' && <Nebula />}
      {quality !== 'low' && <Comets />}
      <FloatingRocks />

      {/* Postprocessing */}
      <SceneEffects quality={quality} />
    </>
  )
}
