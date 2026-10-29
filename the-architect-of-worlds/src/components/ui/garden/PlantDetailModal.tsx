'use client'

import { useGardenStore } from '@/stores/useGardenStore'
import { PLANT_SPECIES } from '@/data/gardenData'
import { gardenSound } from '@/components/audio/GardenSoundEngine'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Sparkles, Zap, Trash2, Radio } from 'lucide-react'

export function PlantDetailModal() {
  const { selectedPlantId, plants, selectPlant, bloomPlant, removePlant } = useGardenStore()

  const targetPlant = plants.find((p) => p.id === selectedPlantId)

  if (!targetPlant) return null

  const spec = PLANT_SPECIES[targetPlant.speciesId]

  const handleBloom = () => {
    bloomPlant(targetPlant.id)
    gardenSound.playBloomSound(spec.bioFrequency)
  }

  const handleRemove = () => {
    removePlant(targetPlant.id)
  }

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, x: -30 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: -30 }}
        className="fixed top-6 left-6 z-40 w-80 p-5 rounded-2xl bg-slate-950/85 backdrop-blur-2xl border border-cyan-500/30 shadow-[0_0_40px_rgba(0,0,0,0.9)] text-slate-200 pointer-events-auto"
      >
        {/* Header bar */}
        <div className="flex items-start justify-between mb-3 border-b border-cyan-500/20 pb-3">
          <div>
            <span className="text-[10px] font-mono tracking-widest text-cyan-400 uppercase">
              {spec.category}
            </span>
            <h2 className="text-xl font-bold font-sans text-transparent bg-clip-text bg-gradient-to-r from-white via-cyan-200 to-pink-300">
              {spec.name}
            </h2>
            <p className="text-xs italic text-slate-400 font-serif">{spec.scientificName}</p>
          </div>
          <button
            onClick={() => selectPlant(null)}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Description */}
        <p className="text-xs text-slate-300 leading-relaxed mb-4">{spec.description}</p>

        {/* Technical Bio Metrics */}
        <div className="grid grid-cols-2 gap-2 mb-4">
          <div className="p-2.5 rounded-xl bg-slate-900/60 border border-slate-800">
            <span className="text-[10px] font-mono text-slate-400 block uppercase">Energy Level</span>
            <span className="text-sm font-bold font-mono text-emerald-400 flex items-center gap-1">
              <Zap className="w-3.5 h-3.5" />
              {targetPlant.energyOutput} GW
            </span>
          </div>

          <div className="p-2.5 rounded-xl bg-slate-900/60 border border-slate-800">
            <span className="text-[10px] font-mono text-slate-400 block uppercase">Bio-Resonance</span>
            <span className="text-sm font-bold font-mono text-purple-400 flex items-center gap-1">
              <Radio className="w-3.5 h-3.5" />
              {spec.bioFrequency} Hz
            </span>
          </div>
        </div>

        {/* Action Controls */}
        <div className="space-y-2 pt-2 border-t border-cyan-500/20">
          <button
            onClick={handleBloom}
            className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-purple-600 text-white font-medium text-xs shadow-[0_0_20px_rgba(0,240,255,0.3)] hover:shadow-[0_0_30px_rgba(168,85,247,0.5)] transition-all transform active:scale-95 cursor-pointer"
          >
            <Sparkles className="w-4 h-4" />
            <span>Trigger Cosmic Bloom</span>
          </button>

          <button
            onClick={handleRemove}
            className="w-full flex items-center justify-center gap-2 py-2 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30 text-xs font-medium transition-colors cursor-pointer"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Prune Flora Instance</span>
          </button>
        </div>
      </motion.div>
    </AnimatePresence>
  )
}
