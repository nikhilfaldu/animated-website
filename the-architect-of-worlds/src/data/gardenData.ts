import { PlantSpeciesConfig, PlantSpeciesId, GardenPlantInstance } from '@/types/garden'

export const PLANT_SPECIES: Record<PlantSpeciesId, PlantSpeciesConfig> = {
  lotus: {
    id: 'lotus',
    name: 'Lumina Lotus',
    scientificName: 'Lotus Cosmicus Radiata',
    category: 'Radiant Flora',
    description: 'A glowing cosmic flower with layered crystalline petals that unfold in response to stellar radiation.',
    primaryColor: '#ff2a8d',
    secondaryColor: '#9d00ff',
    emissiveColor: '#ff00aa',
    baseEnergy: 45,
    bioFrequency: 528,
    defaultScale: 1.2,
  },
  crystal: {
    id: 'crystal',
    name: 'Aether Crystal',
    scientificName: 'Litho-Flora Prismaticus',
    category: 'Crystalline Mineral Flora',
    description: 'Geometric mineral spire that channels zero-point energy and hums with high-frequency resonance.',
    primaryColor: '#00f0ff',
    secondaryColor: '#0044ff',
    emissiveColor: '#00ffff',
    baseEnergy: 75,
    bioFrequency: 639,
    defaultScale: 1.5,
  },
  mushroom: {
    id: 'mushroom',
    name: 'Pulsar Mushroom',
    scientificName: 'Mycelium Pulsaris',
    category: 'Bioluminescent Fungi',
    description: 'A dome-capped fungal organism with pulsating light spores that drift upward into the nebula sky.',
    primaryColor: '#00ffaa',
    secondaryColor: '#056644',
    emissiveColor: '#39ff14',
    baseEnergy: 30,
    bioFrequency: 432,
    defaultScale: 1.1,
  },
  orb: {
    id: 'orb',
    name: 'Nebula Orb Tendril',
    scientificName: 'Sphera Hydro-Plasma',
    category: 'Plasma Float Flora',
    description: 'A levitating orb of liquid plasma tethered by fluid organic tendrils that react to touch.',
    primaryColor: '#ffaa00',
    secondaryColor: '#ff0055',
    emissiveColor: '#ff7700',
    baseEnergy: 90,
    bioFrequency: 741,
    defaultScale: 1.3,
  },
  willow: {
    id: 'willow',
    name: 'Void Willow Sprout',
    scientificName: 'Arbor Astra Noctis',
    category: 'Starlight Tree',
    description: 'An ethereal tree-like plant with sweeping bioluminescent leaves that filter cosmic dust into pure light.',
    primaryColor: '#a855f7',
    secondaryColor: '#ec4899',
    emissiveColor: '#c084fc',
    baseEnergy: 120,
    bioFrequency: 852,
    defaultScale: 1.8,
  },
}

export function generateInitialGarden(): GardenPlantInstance[] {
  const initialPlants: GardenPlantInstance[] = []
  const speciesList: PlantSpeciesId[] = ['lotus', 'crystal', 'mushroom', 'orb', 'willow']
  
  // Create natural distribution around center of floating island radius 28
  const count = 32
  for (let i = 0; i < count; i++) {
    const angle = (i / count) * Math.PI * 2 + (Math.random() * 0.4 - 0.2)
    // Radial distance between 4 and 26
    const radius = 5 + Math.pow(Math.random(), 0.7) * 21
    const x = Math.cos(angle) * radius
    const z = Math.sin(angle) * radius
    
    // Slight height variations on terrain curve
    const distFromCenter = Math.sqrt(x * x + z * z)
    const y = Math.sin(distFromCenter * 0.2) * 0.8 - (distFromCenter * 0.05)

    const speciesId = speciesList[i % speciesList.length]
    const spec = PLANT_SPECIES[speciesId]

    const scale = (spec.defaultScale * (0.8 + Math.random() * 0.5))

    initialPlants.push({
      id: `plant-init-${i}-${Date.now().toString(36)}`,
      speciesId,
      position: [x, y, z],
      rotation: [0, Math.random() * Math.PI * 2, (Math.random() - 0.5) * 0.15],
      scale,
      growthProgress: 1.0,
      stage: 'mature',
      energyOutput: Math.floor(spec.baseEnergy * (0.9 + Math.random() * 0.3)),
      ageSeconds: Math.floor(Math.random() * 5000),
      bloomedCount: Math.floor(Math.random() * 5) + 1,
    })
  }

  return initialPlants
}
