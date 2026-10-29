export type PlantSpeciesId = 'lotus' | 'crystal' | 'mushroom' | 'orb' | 'willow'

export type GrowthStage = 'seed' | 'sprouting' | 'blooming' | 'mature'

export interface PlantSpeciesConfig {
  id: PlantSpeciesId
  name: string
  scientificName: string
  category: string
  description: string
  primaryColor: string
  secondaryColor: string
  emissiveColor: string
  baseEnergy: number
  bioFrequency: number // Hz for synth
  defaultScale: number
  rareVariant?: boolean
}

export interface GardenPlantInstance {
  id: string
  speciesId: PlantSpeciesId
  position: [number, number, number]
  rotation: [number, number, number]
  scale: number
  growthProgress: number // 0 to 1
  stage: GrowthStage
  colorOverride?: string
  energyOutput: number
  ageSeconds: number
  bloomedCount: number
}
