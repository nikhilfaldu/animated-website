'use client'

import { useGardenStore } from '@/stores/useGardenStore'
import { PLANT_SPECIES } from '@/data/gardenData'
import { motion, AnimatePresence } from 'framer-motion'

export function PlantHoloLabel() {
  const { hoveredPlantId, selectedPlantId, plants } = useGardenStore()
  const activeId = hoveredPlantId || selectedPlantId

  const targetPlant = plants.find((p) => p.id === activeId)
  if (!targetPlant) return null

  const spec = PLANT_SPECIES[targetPlant.speciesId]

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 15, scale: 0.9 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: -10, scale: 0.9 }}
        className="fixed top-20 left-1/2 -translate-x-1/2 z-30 pointer-events-none"
      >
        <div className="relative px-5 py-3 rounded-2xl bg-black/60 backdrop-blur-xl border border-cyan-500/40 shadow-[0_0_25px_rgba(0,240,255,0.25)] text-center min-w-[240px]">
          {/* Holographic Header lines */}
          <div className="flex items-center justify-between text-[10px] font-mono tracking-widest text-cyan-400/80 uppercase mb-1">
            <span>BIO-SIGNAL ID #{targetPlant.id.slice(-4)}</span>
            <span className="flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
              {targetPlant.stage}
            </span>
          </div>

          {/* Plant Name */}
          <h3
            className="text-lg font-bold font-sans tracking-wide text-transparent bg-clip-text bg-gradient-to-r from-white via-cyan-200 to-pink-400"
            style={{ textShadow: `0 0 12px ${spec.emissiveColor}` }}
          >
            {spec.name}
          </h3>
          <p className="text-xs italic text-slate-300 font-serif mb-2">{spec.scientificName}</p>

          {/* Bio Stats */}
          <div className="flex items-center justify-center gap-4 text-xs font-mono border-t border-cyan-500/20 pt-2 text-cyan-200">
            <div>
              <span className="text-slate-400 text-[10px] block uppercase">Energy Output</span>
              <span className="font-bold text-emerald-400">+{targetPlant.energyOutput} GW</span>
            </div>
            <div className="w-px h-6 bg-cyan-500/20" />
            <div>
              <span className="text-slate-400 text-[10px] block uppercase">Bio-Frequency</span>
              <span className="font-bold text-purple-400">{spec.bioFrequency} Hz</span>
            </div>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  )
}
