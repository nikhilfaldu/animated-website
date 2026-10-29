import { create } from 'zustand'
import { WorldId, ExplorationAchievement } from '@/types'
import * as THREE from 'three'

export interface CelestialObject {
  id: string
  type: 'star' | 'planet' | 'comet' | 'asteroid' | 'pulsar' | 'quasar' | 'station' | 'ruins' | 'nebula' | 'moon' | 'black_hole' | 'universe'
  name: string
  position: THREE.Vector3
}

export type ViewMode = 'universe' | 'garden'

interface WorldState {
  viewMode: ViewMode
  activeWorld: WorldId | null
  hoveredWorld: WorldId | null
  activeObject: CelestialObject | null
  hoveredObject: CelestialObject | null
  isIntroComplete: boolean
  isIntroStarted: boolean
  isTransitioning: boolean
  isDetailOpen: boolean
  isNovaOpen: boolean
  hasInteracted: boolean
  nexusCoreRef: THREE.Mesh | null
  visitedObjects: string[]
  discoveredObjects: Record<string, CelestialObject>
  visitedSectors: string[]
  currentCoordinates: THREE.Vector3
  photoMode: boolean
  autoTour: boolean

  // Extended Exploration System
  achievements: ExplorationAchievement[]
  explorationPercent: number
  comparisonTargetId: string | null

  setViewMode: (mode: ViewMode) => void
  navigateToWorld: (id: WorldId | null) => void
  navigateToObject: (obj: CelestialObject | null) => void
  addDiscoveredObject: (obj: CelestialObject) => void
  updateCoordinates: (coords: THREE.Vector3) => void
  setHovered: (id: WorldId | null) => void
  setHoveredObject: (obj: CelestialObject | null) => void
  startIntro: () => void
  completeIntro: () => void
  setTransitioning: (transitioning: boolean) => void
  openDetail: () => void
  closeDetail: () => void
  setNovaOpen: (isOpen: boolean) => void
  setInteracted: () => void
  setNexusCoreRef: (ref: THREE.Mesh | null) => void
  setPhotoMode: (enabled: boolean) => void
  setAutoTour: (enabled: boolean) => void
  unlockAchievement: (id: string, title: string, description: string, iconName: string) => void
  setComparisonTargetId: (id: string | null) => void
}

export const useWorldStore = create<WorldState>((set, get) => ({
  viewMode: 'universe',
  activeWorld: null,
  hoveredWorld: null,
  activeObject: null,
  hoveredObject: null,
  isIntroComplete: true, // INSTANT ACCESS ON LOAD!
  isIntroStarted: true,  // INSTANT ACCESS ON LOAD!
  isTransitioning: false,
  isDetailOpen: false,
  isNovaOpen: false,
  hasInteracted: false,
  nexusCoreRef: null,
  visitedObjects: [],
  discoveredObjects: {},
  visitedSectors: [],
  currentCoordinates: new THREE.Vector3(0, 0, 0),
  photoMode: false,
  autoTour: false,

  // Extended Exploration State
  achievements: [
    {
      id: 'first-flight',
      title: 'Cosmic Traveler',
      description: 'Entered the Architect of Worlds universe.',
      iconName: 'Compass',
      unlockedAt: new Date().toLocaleTimeString(),
    },
  ],
  explorationPercent: 12,
  comparisonTargetId: null,

  setViewMode: (mode) => set({ viewMode: mode }),

  navigateToWorld: (id) => {
    if (get().isTransitioning) return
    const visited = get().visitedObjects
    const newVisited = id && !visited.includes(id) ? [...visited, id] : visited

    // Calculate exploration %
    const totalKnown = 7
    const percent = Math.min(100, Math.round((newVisited.length / totalKnown) * 100))

    if (id && !visited.includes(id)) {
      // Auto unlock achievement on new world discovery
      get().unlockAchievement(
        `discover-${id}`,
        `Charted ${id.toUpperCase()}`,
        `Explored sector coordinates of world: ${id}`,
        'Globe'
      )
    }

    set({
      activeWorld: id,
      activeObject: null,
      isDetailOpen: true,
      visitedObjects: newVisited,
      explorationPercent: percent,
    })
  },

  navigateToObject: (obj) => {
    if (get().isTransitioning) return
    const visited = get().visitedObjects
    const id = obj?.id
    const newVisited = id && !visited.includes(id) ? [...visited, id] : visited

    set({
      activeObject: obj,
      activeWorld: null,
      isDetailOpen: true,
      visitedObjects: newVisited,
    })
  },

  addDiscoveredObject: (obj) => {
    set((state) => ({
      discoveredObjects: { ...state.discoveredObjects, [obj.id]: obj },
      visitedObjects: state.visitedObjects.includes(obj.id) ? state.visitedObjects : [...state.visitedObjects, obj.id],
    }))
  },

  updateCoordinates: (coords) => set({ currentCoordinates: coords }),

  setHovered: (id) => {
    if (get().isTransitioning) return
    set({ hoveredWorld: id, hoveredObject: null })
  },

  setHoveredObject: (obj) => {
    if (get().isTransitioning) return
    set({ hoveredObject: obj, hoveredWorld: null })
  },

  startIntro: () => set({ isIntroStarted: true }),
  completeIntro: () => set({ isIntroComplete: true }),
  setTransitioning: (transitioning) => set({ isTransitioning: transitioning }),
  openDetail: () => set({ isDetailOpen: true }),
  closeDetail: () => set({ isDetailOpen: false, isNovaOpen: false, comparisonTargetId: null, activeWorld: null, activeObject: null }),
  setNovaOpen: (isOpen) => set({ isNovaOpen: isOpen }),
  setInteracted: () => set({ hasInteracted: true }),
  setNexusCoreRef: (ref) => set({ nexusCoreRef: ref }),
  setPhotoMode: (enabled) => set({ photoMode: enabled }),
  setAutoTour: (enabled) => set({ autoTour: enabled }),

  unlockAchievement: (id, title, description, iconName) => {
    set((state) => {
      if (state.achievements.some((a) => a.id === id)) return state
      const newAchievement: ExplorationAchievement = {
        id,
        title,
        description,
        iconName,
        unlockedAt: new Date().toLocaleTimeString(),
      }
      return {
        achievements: [...state.achievements, newAchievement],
      }
    })
  },

  setComparisonTargetId: (id) => set({ comparisonTargetId: id }),
}))
