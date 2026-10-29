'use client'

import { useState } from 'react'
import { useGardenStore } from '@/stores/useGardenStore'
import { gardenSound } from '@/components/audio/GardenSoundEngine'
import { PLANT_SPECIES } from '@/data/gardenData'
import { PlantSpeciesId } from '@/types/garden'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Sprout,
  Volume2,
  VolumeX,
  Compass,
  RotateCcw,
  Trash2,
  ChevronUp,
} from 'lucide-react'

export function GardenHUD() {
  const [showSpeciesPicker, setShowSpeciesPicker] = useState(false)

  const {
    isPlantingMode,
    selectedSpeciesToPlant,
    soundEnabled,
    autoTour,
    lastActionMessage,
    setPlantingMode,
    setSelectedSpeciesToPlant,
    toggleSound,
    setAutoTour,
    resetGarden,
    clearGarden,
  } = useGardenStore()

  const handleSoundToggle = () => {
    toggleSound()
    gardenSound.setMuted(soundEnabled)
  }

  const handleSpeciesSelect = (id: PlantSpeciesId) => {
    setSelectedSpeciesToPlant(id)
    setShowSpeciesPicker(false)
    if (!isPlantingMode) setPlantingMode(true)
  }

  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 flex flex-col items-center gap-3 pointer-events-auto">
      {/* Toast Notification Bar */}
      {lastActionMessage && (
        <motion.div
          key={lastActionMessage}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="px-4 py-1.5 rounded-full bg-slate-900/80 backdrop-blur-md border border-cyan-500/30 text-xs font-mono text-cyan-300 shadow-lg"
        >
          {lastActionMessage}
        </motion.div>
      )}

      {/* Species Selector Modal */}
      <AnimatePresence>
        {showSpeciesPicker && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 15, scale: 0.95 }}
            className="mb-2 p-3 rounded-2xl bg-slate-950/90 backdrop-blur-2xl border border-cyan-500/30 shadow-[0_0_30px_rgba(0,0,0,0.8)] grid grid-cols-5 gap-2"
          >
            {(Object.keys(PLANT_SPECIES) as PlantSpeciesId[]).map((spId) => {
              const sp = PLANT_SPECIES[spId]
              const isSelected = selectedSpeciesToPlant === spId
              return (
                <button
                  key={spId}
                  onClick={() => handleSpeciesSelect(spId)}
                  className={`flex flex-col items-center p-2.5 rounded-xl border text-center transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-cyan-500/20 border-cyan-400 text-white shadow-[0_0_15px_rgba(0,240,255,0.3)]'
                      : 'bg-slate-900/60 border-slate-800 text-slate-400 hover:border-slate-700 hover:text-slate-200'
                  }`}
                >
                  <span
                    className="w-4 h-4 rounded-full mb-1 shadow-sm"
                    style={{ backgroundColor: sp.emissiveColor }}
                  />
                  <span className="text-[11px] font-medium leading-tight">{sp.name}</span>
                </button>
              )
            })}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Bottom Control Bar */}
      <div className="flex items-center gap-2 p-2 rounded-full bg-slate-950/80 backdrop-blur-2xl border border-cyan-500/30 shadow-[0_0_35px_rgba(0,0,0,0.9)]">
        {/* Plant Seed Button */}
        <div className="relative flex items-center">
          <button
            onClick={() => setPlantingMode(!isPlantingMode)}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-full text-xs font-semibold tracking-wide transition-all cursor-pointer ${
              isPlantingMode
                ? 'bg-gradient-to-r from-emerald-500 to-teal-500 text-slate-950 shadow-[0_0_20px_rgba(57,255,20,0.5)]'
                : 'bg-cyan-500/10 text-cyan-300 hover:bg-cyan-500/20 border border-cyan-500/30'
            }`}
          >
            <Sprout className="w-4 h-4" />
            <span>{isPlantingMode ? 'Click Ground to Plant' : 'Plant Seed'}</span>
          </button>

          {/* Species Dropdown trigger */}
          <button
            onClick={() => setShowSpeciesPicker(!showSpeciesPicker)}
            className="ml-1 p-2 rounded-full hover:bg-cyan-500/20 text-cyan-400 transition-colors cursor-pointer"
            title="Choose Plant Species"
          >
            <ChevronUp className={`w-4 h-4 transition-transform ${showSpeciesPicker ? 'rotate-180' : ''}`} />
          </button>
        </div>

        <div className="w-px h-6 bg-slate-800" />

        {/* Auto Tour */}
        <button
          onClick={() => setAutoTour(!autoTour)}
          className={`p-2.5 rounded-full transition-all cursor-pointer ${
            autoTour
              ? 'bg-purple-500/30 border border-purple-400 text-purple-300 shadow-[0_0_15px_rgba(168,85,247,0.4)]'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
          }`}
          title="Toggle Auto Tour Orbit"
        >
          <Compass className="w-4.5 h-4.5" />
        </button>

        {/* Sound Toggle */}
        <button
          onClick={handleSoundToggle}
          className={`p-2.5 rounded-full transition-all cursor-pointer ${
            soundEnabled
              ? 'text-cyan-400 hover:bg-cyan-500/20'
              : 'text-slate-600 hover:text-slate-400'
          }`}
          title={soundEnabled ? 'Mute Audio' : 'Unmute Audio'}
        >
          {soundEnabled ? <Volume2 className="w-4.5 h-4.5" /> : <VolumeX className="w-4.5 h-4.5" />}
        </button>

        <div className="w-px h-6 bg-slate-800" />

        {/* Regenerate Garden */}
        <button
          onClick={resetGarden}
          className="p-2.5 rounded-full text-slate-400 hover:text-cyan-300 hover:bg-cyan-500/10 transition-colors cursor-pointer"
          title="Regenerate Garden"
        >
          <RotateCcw className="w-4.5 h-4.5" />
        </button>

        {/* Clear All Flora */}
        <button
          onClick={clearGarden}
          className="p-2.5 rounded-full text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition-colors cursor-pointer"
          title="Clear Garden"
        >
          <Trash2 className="w-4.5 h-4.5" />
        </button>
      </div>
    </div>
  )
}
