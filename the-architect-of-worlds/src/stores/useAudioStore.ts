import { create } from 'zustand'

interface AudioState {
  isMuted: boolean
  volume: number
  isContextReady: boolean

  toggle: () => void
  setVolume: (v: number) => void
  setContextReady: () => void
}

export const useAudioStore = create<AudioState>((set) => ({
  isMuted: true,
  volume: 0.3,
  isContextReady: false,

  toggle: () => set((s) => ({ isMuted: !s.isMuted })),
  setVolume: (v) => set({ volume: Math.max(0, Math.min(1, v)) }),
  setContextReady: () => set({ isContextReady: true }),
}))
