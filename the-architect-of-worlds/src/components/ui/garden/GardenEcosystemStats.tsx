'use client'

import { useGardenStore } from '@/stores/useGardenStore'
import { PLANT_SPECIES } from '@/data/gardenData'
import { Zap, Layers, Globe } from 'lucide-react'

export function GardenEcosystemStats() {
  const { plants, totalBioEnergy } = useGardenStore()

  // Species count counts
  const speciesCounts = plants.reduce((acc, p) => {
    acc[p.speciesId] = (acc[p.speciesId] || 0) + 1
    return acc
  }, {} as Record<string, number>)

  return (
    <div className="fixed top-6 right-6 z-30 pointer-events-auto">
      <div className="w-64 p-4 rounded-2xl bg-slate-950/80 backdrop-blur-xl border border-cyan-500/30 shadow-[0_0_30px_rgba(0,0,0,0.8)] text-slate-200 space-y-3">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-cyan-500/20 pb-2">
          <div className="flex items-center gap-2 text-xs font-mono font-bold text-cyan-400 uppercase tracking-wider">
            <Globe className="w-4 h-4" />
            <span>ECOSYSTEM STATS</span>
          </div>
          <span className="flex items-center gap-1.5 text-[10px] font-mono text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/30">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            OPTIMAL
          </span>
        </div>

        {/* Bio Energy Meter */}
        <div className="space-y-1">
          <div className="flex items-center justify-between text-xs">
            <span className="text-slate-400 flex items-center gap-1.5">
              <Zap className="w-3.5 h-3.5 text-amber-400" />
              Total Bio-Energy
            </span>
            <span className="font-mono font-bold text-amber-400">{totalBioEnergy} GW</span>
          </div>
          <div className="w-full h-1.5 rounded-full bg-slate-800 overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-amber-400 via-emerald-400 to-cyan-400 transition-all duration-500"
              style={{ width: `${Math.min(100, (totalBioEnergy / 4000) * 100)}%` }}
            />
          </div>
        </div>

        {/* Total Flora Count */}
        <div className="flex items-center justify-between text-xs font-mono">
          <span className="text-slate-400 flex items-center gap-1.5">
            <Layers className="w-3.5 h-3.5 text-cyan-400" />
            Active Alien Flora
          </span>
          <span className="font-bold text-cyan-300">{plants.length} units</span>
        </div>

        {/* Species Distribution */}
        <div className="pt-2 border-t border-cyan-500/20 space-y-1.5 text-[11px]">
          <div className="text-[10px] font-mono text-slate-400 uppercase tracking-wider mb-1">
            Flora Composition
          </div>
          {Object.entries(PLANT_SPECIES).map(([spId, spec]) => {
            const count = speciesCounts[spId] || 0
            return (
              <div key={spId} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span
                    className="w-2.5 h-2.5 rounded-full"
                    style={{ backgroundColor: spec.emissiveColor }}
                  />
                  <span className="text-slate-300">{spec.name}</span>
                </div>
                <span className="font-mono font-semibold text-slate-400">{count}</span>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
