'use client'

import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useWorldStore } from '@/stores/useWorldStore'
import universeData from '@/data/universe.json'
import { WORLDS } from '@/config/worlds'
import { WorldId } from '@/types'
import {
  Globe,
  Zap,
  Sparkles,
  Compass,
  ArrowRight,
  Shield,
  Activity,
  X,
  Scale,
  Radio,
} from 'lucide-react'

type TabType = 'overview' | 'science' | 'lore' | 'compare'

export function DeepExplorationPanel() {
  const {
    activeWorld,
    activeObject,
    isDetailOpen,
    closeDetail,
    setNovaOpen,
    navigateToWorld,
    comparisonTargetId,
    setComparisonTargetId,
    explorationPercent,
  } = useWorldStore()

  const [activeTab, setActiveTab] = useState<TabType>('overview')

  const currentId = activeObject?.id || activeWorld
  if (!isDetailOpen || !currentId) return null

  // Lookup planet metadata from universeData or WORLDS config
  const objMeta = universeData.objects.find((o) => o.id === currentId)
  const worldConfig = activeWorld ? WORLDS[activeWorld] : null

  const name = objMeta?.name || worldConfig?.name || currentId.toUpperCase()
  const subtitle = worldConfig?.subtitle || objMeta?.type?.toUpperCase() || 'CELESTIAL OBJECT'
  const description = worldConfig?.description || objMeta?.description || ''
  const primaryColor = worldConfig?.colors.primary || objMeta?.color || '#00f0ff'

  // Comparison target
  const comparisonMeta = comparisonTargetId
    ? universeData.objects.find((o) => o.id === comparisonTargetId)
    : null

  const handleNavigateRelated = (relId: string) => {
    if (Object.keys(WORLDS).includes(relId)) {
      navigateToWorld(relId as WorldId)
    }
  }

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, x: 80 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: 80 }}
        transition={{ type: 'spring', damping: 26, stiffness: 220 }}
        className="fixed top-0 right-0 z-40 h-full w-full max-w-[500px] bg-slate-950/90 backdrop-blur-2xl border-l border-cyan-500/30 text-slate-100 flex flex-col shadow-[0_0_60px_rgba(0,0,0,0.95)] pointer-events-auto"
      >
        {/* Top Decorative Color Accent Bar */}
        <div
          className="h-1.5 w-full"
          style={{
            background: `linear-gradient(to right, ${primaryColor}, #a855f7, #00f0ff)`,
          }}
        />

        {/* Panel Header */}
        <div className="p-6 border-b border-cyan-500/20 flex items-start justify-between bg-black/40">
          <div>
            <div className="flex items-center gap-2 text-[10px] font-mono uppercase tracking-widest text-cyan-400">
              <Compass className="w-3.5 h-3.5 text-cyan-400 animate-spin" style={{ animationDuration: '12s' }} />
              <span>Exploration Progress: {explorationPercent}%</span>
            </div>
            <h2
              className="text-3xl font-extrabold font-sans text-transparent bg-clip-text bg-gradient-to-r from-white via-cyan-200 to-purple-300 mt-1"
              style={{ textShadow: `0 0 20px ${primaryColor}66` }}
            >
              {name}
            </h2>
            <p className="text-xs italic text-slate-400 font-serif mt-0.5">{subtitle}</p>
          </div>

          <button
            onClick={closeDetail}
            className="p-2 rounded-xl bg-slate-900/60 hover:bg-slate-800 border border-slate-700/50 text-slate-400 hover:text-white transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center border-b border-cyan-500/20 bg-slate-900/40 text-xs font-mono">
          {[
            { id: 'overview', label: 'Overview', icon: Globe },
            { id: 'science', label: 'NASA Data', icon: Zap },
            { id: 'lore', label: 'Lore', icon: Sparkles },
            { id: 'compare', label: 'Compare', icon: Scale },
          ].map((tab) => {
            const Icon = tab.icon
            const isTabActive = activeTab === tab.id
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as TabType)}
                className={`flex-1 flex items-center justify-center gap-1.5 py-3 border-b-2 transition-all cursor-pointer ${
                  isTabActive
                    ? 'border-cyan-400 text-cyan-300 bg-cyan-500/10 font-bold'
                    : 'border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{tab.label}</span>
              </button>
            )
          })}
        </div>

        {/* Tab Content Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6 scrollbar-thin scrollbar-thumb-cyan-500/30">
          {/* TAB 1: OVERVIEW */}
          {activeTab === 'overview' && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-5">
              <div className="prose prose-invert prose-sm text-slate-300 leading-relaxed font-sans">
                {description.split('\n').filter(Boolean).map((p, i) => (
                  <p key={i} className="mb-3">{p}</p>
                ))}
              </div>

              {/* Quick Key Physical Stats Grid */}
              <div className="grid grid-cols-2 gap-3 text-xs font-mono">
                <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800">
                  <span className="text-[10px] text-slate-400 uppercase block">Surface Gravity</span>
                  <span className="font-bold text-cyan-300">{objMeta?.gravity || '1.0 G'}</span>
                </div>
                <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800">
                  <span className="text-[10px] text-slate-400 uppercase block">Temperature</span>
                  <span className="font-bold text-pink-400">{objMeta?.temperature || '22°C'}</span>
                </div>
                <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800">
                  <span className="text-[10px] text-slate-400 uppercase block">Diameter / Radius</span>
                  <span className="font-bold text-emerald-400">{objMeta?.diameter || objMeta?.radius || '12,742 km'}</span>
                </div>
                <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800">
                  <span className="text-[10px] text-slate-400 uppercase block">Orbital Period</span>
                  <span className="font-bold text-purple-400">{objMeta?.orbitalPeriod || '365 Days'}</span>
                </div>
              </div>

              {/* Interesting Facts Highlight Box */}
              {objMeta?.interestingFacts && (
                <div className="p-4 rounded-2xl bg-cyan-500/10 border border-cyan-500/30 space-y-1">
                  <span className="text-[10px] font-mono text-cyan-400 font-bold uppercase tracking-wider flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5" />
                    Anomalous Discovery Fact
                  </span>
                  <p className="text-xs text-slate-200 leading-relaxed italic">
                    "{objMeta.interestingFacts}"
                  </p>
                </div>
              )}

              {/* Related Object Navigation Prompts */}
              {objMeta?.relatedObjects && objMeta.relatedObjects.length > 0 && (
                <div className="space-y-2 pt-2 border-t border-slate-800">
                  <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider block">
                    Inter-Celestial Navigational Beacons
                  </span>
                  <div className="flex flex-wrap gap-2">
                    {objMeta.relatedObjects.map((relId) => (
                      <button
                        key={relId}
                        onClick={() => handleNavigateRelated(relId)}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-slate-900 hover:bg-cyan-500/20 border border-cyan-500/30 text-xs font-mono text-cyan-300 transition-colors cursor-pointer"
                      >
                        <span>Fly to {relId.toUpperCase()}</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </motion.div>
          )}

          {/* TAB 2: NASA-INSPIRED SCIENCE DATA */}
          {activeTab === 'science' && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-5 text-xs font-mono">
              <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-3">
                <h3 className="font-bold text-cyan-300 uppercase tracking-wider flex items-center gap-2">
                  <Activity className="w-4 h-4 text-cyan-400" />
                  Astrophysical Measurements
                </h3>
                <div className="space-y-2 text-slate-300">
                  <div className="flex justify-between border-b border-slate-800 pb-1">
                    <span className="text-slate-400">Total Mass:</span>
                    <span className="font-bold text-white">{objMeta?.mass || '5.972 × 10^24 kg'}</span>
                  </div>
                  <div className="flex justify-between border-b border-slate-800 pb-1">
                    <span className="text-slate-400">Equatorial Diameter:</span>
                    <span className="font-bold text-white">{objMeta?.diameter || '12,742 km'}</span>
                  </div>
                  <div className="flex justify-between border-b border-slate-800 pb-1">
                    <span className="text-slate-400">Core Distance:</span>
                    <span className="font-bold text-white">{objMeta?.distanceFromCore || '14.2 AU'}</span>
                  </div>
                </div>
              </div>

              {/* Atmospheric Composition Pills */}
              {objMeta?.atmosphere && (
                <div className="space-y-2">
                  <span className="text-slate-400 uppercase text-[10px] block font-bold tracking-wider">
                    Atmospheric Composition
                  </span>
                  <div className="flex flex-wrap gap-2">
                    {objMeta.atmosphere.map((gas, i) => (
                      <span key={i} className="px-3 py-1 rounded-lg bg-purple-500/10 border border-purple-500/30 text-purple-300">
                        {gas}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Composition Crust */}
              {objMeta?.composition && (
                <div className="space-y-2">
                  <span className="text-slate-400 uppercase text-[10px] block font-bold tracking-wider">
                    Geological Layers
                  </span>
                  <div className="flex flex-wrap gap-2">
                    {objMeta.composition.map((comp, i) => (
                      <span key={i} className="px-3 py-1 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-300">
                        {comp}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Scientific Observations */}
              {objMeta?.scientificFacts && (
                <div className="space-y-2 pt-2 border-t border-slate-800">
                  <span className="text-slate-400 uppercase text-[10px] block font-bold tracking-wider">
                    Peer-Reviewed Spectrometry Observations
                  </span>
                  <ul className="space-y-2">
                    {objMeta.scientificFacts.map((fact, i) => (
                      <li key={i} className="p-3 rounded-xl bg-slate-900/60 border border-slate-800 text-slate-300 leading-relaxed font-sans text-xs">
                        {fact}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </motion.div>
          )}

          {/* TAB 3: ARCHITECT LORE */}
          {activeTab === 'lore' && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
              <div className="p-4 rounded-2xl bg-purple-950/30 border border-purple-500/30 space-y-2">
                <span className="text-[10px] font-mono text-purple-300 uppercase tracking-widest font-bold flex items-center gap-1.5">
                  <Shield className="w-3.5 h-3.5" />
                  Architect Mythos Archive
                </span>
                <p className="text-xs text-slate-200 leading-relaxed font-serif italic">
                  "{objMeta?.lore || description}"
                </p>
              </div>

              {/* Key Missions */}
              {objMeta?.keyMissions && (
                <div className="space-y-2 font-mono text-xs">
                  <span className="text-slate-400 uppercase text-[10px] block font-bold tracking-wider">
                    Historical Exploration Probes & Missions
                  </span>
                  {objMeta.keyMissions.map((mission, i) => (
                    <div key={i} className="p-3 rounded-xl bg-slate-900/60 border border-slate-800 flex items-center gap-2">
                      <Radio className="w-3.5 h-3.5 text-cyan-400" />
                      <span className="text-slate-200">{mission}</span>
                    </div>
                  ))}
                </div>
              )}
            </motion.div>
          )}

          {/* TAB 4: COMPARE CELESTIAL OBJECTS */}
          {activeTab === 'compare' && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4 text-xs font-mono">
              <div className="space-y-2">
                <label className="text-slate-400 uppercase text-[10px] block font-bold tracking-wider">
                  Select Comparison Body:
                </label>
                <select
                  value={comparisonTargetId || ''}
                  onChange={(e) => setComparisonTargetId(e.target.value || null)}
                  className="w-full p-2.5 rounded-xl bg-slate-900 border border-cyan-500/30 text-cyan-300 focus:outline-none focus:border-cyan-400 cursor-pointer"
                >
                  <option value="">-- Choose Object to Compare --</option>
                  {universeData.objects
                    .filter((o) => o.id !== currentId)
                    .map((o) => (
                      <option key={o.id} value={o.id}>
                        {o.name} ({o.type.toUpperCase()})
                      </option>
                    ))}
                </select>
              </div>

              {comparisonMeta ? (
                <div className="grid grid-cols-2 gap-3 pt-2">
                  {/* Current Object Card */}
                  <div className="p-3 rounded-2xl bg-cyan-500/10 border border-cyan-500/30 space-y-2">
                    <span className="font-bold text-cyan-300 text-sm block border-b border-cyan-500/20 pb-1">
                      {name}
                    </span>
                    <div>
                      <span className="text-[10px] text-slate-400 block uppercase">Gravity</span>
                      <span className="font-bold">{objMeta?.gravity || '1.0 G'}</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 block uppercase">Temp</span>
                      <span className="font-bold">{objMeta?.temperature || '22°C'}</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 block uppercase">Diameter</span>
                      <span className="font-bold">{objMeta?.diameter || '12,742 km'}</span>
                    </div>
                  </div>

                  {/* Compared Target Card */}
                  <div className="p-3 rounded-2xl bg-purple-500/10 border border-purple-500/30 space-y-2">
                    <span className="font-bold text-purple-300 text-sm block border-b border-purple-500/20 pb-1">
                      {comparisonMeta.name}
                    </span>
                    <div>
                      <span className="text-[10px] text-slate-400 block uppercase">Gravity</span>
                      <span className="font-bold">{comparisonMeta.gravity || 'N/A'}</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 block uppercase">Temp</span>
                      <span className="font-bold">{comparisonMeta.temperature || 'N/A'}</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 block uppercase">Diameter</span>
                      <span className="font-bold">{comparisonMeta.diameter || comparisonMeta.radius || 'N/A'}</span>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="p-6 text-center text-slate-400 italic bg-slate-900/40 rounded-2xl border border-slate-800">
                  Select a second planet or cosmic anomaly above to compare physical metrics side-by-side.
                </div>
              )}
            </motion.div>
          )}
        </div>

        {/* Footer Action Bar */}
        <div className="p-4 border-t border-cyan-500/20 bg-slate-950 flex gap-3">
          <button
            onClick={() => setNovaOpen(true)}
            className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl bg-gradient-to-r from-cyan-500 to-purple-600 text-white font-bold text-xs shadow-[0_0_25px_rgba(0,240,255,0.4)] hover:shadow-[0_0_35px_rgba(168,85,247,0.6)] transition-all transform active:scale-95 cursor-pointer"
          >
            <Sparkles className="w-4 h-4" />
            <span>Consult Nova Oracle</span>
          </button>
        </div>
      </motion.div>
    </AnimatePresence>
  )
}
