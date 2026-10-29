import { create } from 'zustand'
import { GardenPlantInstance, PlantSpeciesId } from '@/types/garden'
import { generateInitialGarden, PLANT_SPECIES } from '@/data/gardenData'

interface GardenState {
  plants: GardenPlantInstance[]
  selectedPlantId: string | null
  hoveredPlantId: string | null
  selectedSpeciesToPlant: PlantSpeciesId
  isPlantingMode: boolean
  soundEnabled: boolean
  isIntroActive: boolean
  autoTour: boolean
  totalBioEnergy: number
  lastActionMessage: string | null

  // Actions
  addPlantAt: (position: [number, number, number], speciesId?: PlantSpeciesId) => GardenPlantInstance
  removePlant: (id: string) => void
  selectPlant: (id: string | null) => void
  hoverPlant: (id: string | null) => void
  bloomPlant: (id: string) => void
  setPlantingMode: (active: boolean) => void
  setSelectedSpeciesToPlant: (speciesId: PlantSpeciesId) => void
  toggleSound: () => void
  completeIntro: () => void
  setAutoTour: (active: boolean) => void
  clearGarden: () => void
  resetGarden: () => void
  calculateTotalEnergy: () => void
}

export const useGardenStore = create<GardenState>((set, get) => ({
  plants: generateInitialGarden(),
  selectedPlantId: null,
  hoveredPlantId: null,
  selectedSpeciesToPlant: 'lotus',
  isPlantingMode: false,
  soundEnabled: true,
  isIntroActive: true,
  autoTour: false,
  totalBioEnergy: 2450,
  lastActionMessage: 'Garden initialized with 32 cosmic flora instances.',

  addPlantAt: (position, speciesId) => {
    const targetSpecies = speciesId || get().selectedSpeciesToPlant
    const spec = PLANT_SPECIES[targetSpecies]
    
    const newPlant: GardenPlantInstance = {
      id: `plant-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
      speciesId: targetSpecies,
      position,
      rotation: [0, Math.random() * Math.PI * 2, 0],
      scale: spec.defaultScale,
      growthProgress: 0.1,
      stage: 'seed',
      energyOutput: spec.baseEnergy,
      ageSeconds: 0,
      bloomedCount: 1,
    }

    set((state) => {
      const updated = [...state.plants, newPlant]
      const totalEnergy = updated.reduce((sum, p) => sum + p.energyOutput, 0)
      return {
        plants: updated,
        selectedPlantId: newPlant.id,
        totalBioEnergy: totalEnergy,
        lastActionMessage: `Planted new ${spec.name} seed!`,
      }
    })

    return newPlant
  },

  removePlant: (id) => {
    set((state) => {
      const updated = state.plants.filter((p) => p.id !== id)
      const totalEnergy = updated.reduce((sum, p) => sum + p.energyOutput, 0)
      return {
        plants: updated,
        selectedPlantId: state.selectedPlantId === id ? null : state.selectedPlantId,
        hoveredPlantId: state.hoveredPlantId === id ? null : state.hoveredPlantId,
        totalBioEnergy: totalEnergy,
        lastActionMessage: 'Removed plant from garden.',
      }
    })
  },

  selectPlant: (id) => set({ selectedPlantId: id }),

  hoverPlant: (id) => set({ hoveredPlantId: id }),

  bloomPlant: (id) => {
    set((state) => {
      const updated = state.plants.map((p) => {
        if (p.id === id) {
          const spec = PLANT_SPECIES[p.speciesId]
          return {
            ...p,
            growthProgress: 1.0,
            stage: 'blooming' as const,
            bloomedCount: p.bloomedCount + 1,
            energyOutput: p.energyOutput + Math.floor(spec.baseEnergy * 0.2),
          }
        }
        return p
      })
      const totalEnergy = updated.reduce((sum, p) => sum + p.energyOutput, 0)
      const targetPlant = state.plants.find((p) => p.id === id)
      const specName = targetPlant ? PLANT_SPECIES[targetPlant.speciesId].name : 'Flora'
      return {
        plants: updated,
        totalBioEnergy: totalEnergy,
        lastActionMessage: `${specName} bloomed! Bio-energy surge detected (+20%)`,
      }
    })
  },

  setPlantingMode: (active) => set({ isPlantingMode: active }),

  setSelectedSpeciesToPlant: (speciesId) => set({ selectedSpeciesToPlant: speciesId }),

  toggleSound: () => set((state) => ({ soundEnabled: !state.soundEnabled })),

  completeIntro: () => set({ isIntroActive: false }),

  setAutoTour: (active) => set({ autoTour: active }),

  clearGarden: () => set({
    plants: [],
    selectedPlantId: null,
    hoveredPlantId: null,
    totalBioEnergy: 0,
    lastActionMessage: 'Cleared all flora from garden.',
  }),

  resetGarden: () => {
    const initial = generateInitialGarden()
    const totalEnergy = initial.reduce((sum, p) => sum + p.energyOutput, 0)
    set({
      plants: initial,
      selectedPlantId: null,
      hoveredPlantId: null,
      totalBioEnergy: totalEnergy,
      lastActionMessage: 'Garden regenerated with 32 fresh alien plant instances.',
    })
  },

  calculateTotalEnergy: () => {
    set((state) => ({
      totalBioEnergy: state.plants.reduce((sum, p) => sum + p.energyOutput, 0)
    }))
  }
}))
