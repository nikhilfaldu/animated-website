'use client'

import { ThreeEvent } from '@react-three/fiber'
import { useGardenStore } from '@/stores/useGardenStore'
import { PLANT_SPECIES } from '@/data/gardenData'
import { PlantSpeciesId } from '@/types/garden'
import { gardenSound } from '@/components/audio/GardenSoundEngine'

import { GalacticSkybox } from './GalacticSkybox'
import { GardenFloor } from './GardenFloor'
import { GardenParticles } from './GardenParticles'
import { GardenCamera } from './GardenCamera'

import { LuminaLotus } from './plants/LuminaLotus'
import { AetherCrystal } from './plants/AetherCrystal'
import { PulsarMushroom } from './plants/PulsarMushroom'
import { NebulaOrbFlora } from './plants/NebulaOrbFlora'
import { VoidWillow } from './plants/VoidWillow'

export default function GalacticGardenScene() {
  const {
    plants,
    hoveredPlantId,
    selectedPlantId,
    hoverPlant,
    selectPlant,
    bloomPlant,
  } = useGardenStore()

  const handlePointerOver = (e: ThreeEvent<PointerEvent>, id: string, speciesId: PlantSpeciesId) => {
    e.stopPropagation()
    hoverPlant(id)
    const spec = PLANT_SPECIES[speciesId]
    if (spec) {
      gardenSound.playHoverChime(spec.bioFrequency)
    }
  }

  const handlePointerOut = (e: ThreeEvent<PointerEvent>) => {
    e.stopPropagation()
    hoverPlant(null)
  }

  const handleClick = (e: ThreeEvent<MouseEvent>, id: string, speciesId: PlantSpeciesId) => {
    e.stopPropagation()
    selectPlant(id)
    bloomPlant(id)
    const spec = PLANT_SPECIES[speciesId]
    if (spec) {
      gardenSound.playBloomSound(spec.bioFrequency)
    }
  }

  return (
    <>
      <GardenCamera />

      {/* Cosmic Mystical Lighting */}
      <ambientLight intensity={0.45} color="#4c1d95" />
      <directionalLight position={[20, 40, 20]} intensity={1.2} color="#00f0ff" castShadow />
      <pointLight position={[-15, 25, -15]} intensity={1.8} color="#ff00aa" />
      <pointLight position={[0, 10, 0]} intensity={1.0} color="#39ff14" distance={35} />

      {/* Skybox and Terrain Environment */}
      <GalacticSkybox />
      <GardenFloor />
      <GardenParticles />

      {/* Plants Generation */}
      {plants.map((instance) => {
        const isHovered = hoveredPlantId === instance.id
        const isSelected = selectedPlantId === instance.id

        const commonProps = {
          instance,
          isHovered,
          isSelected,
          onPointerOver: (e: ThreeEvent<PointerEvent>) => handlePointerOver(e, instance.id, instance.speciesId),
          onPointerOut: (e: ThreeEvent<PointerEvent>) => handlePointerOut(e),
          onClick: (e: ThreeEvent<MouseEvent>) => handleClick(e, instance.id, instance.speciesId),
        }

        switch (instance.speciesId) {
          case 'lotus':
            return <LuminaLotus key={instance.id} {...commonProps} />
          case 'crystal':
            return <AetherCrystal key={instance.id} {...commonProps} />
          case 'mushroom':
            return <PulsarMushroom key={instance.id} {...commonProps} />
          case 'orb':
            return <NebulaOrbFlora key={instance.id} {...commonProps} />
          case 'willow':
            return <VoidWillow key={instance.id} {...commonProps} />
          default:
            return <LuminaLotus key={instance.id} {...commonProps} />
        }
      })}
    </>
  )
}
