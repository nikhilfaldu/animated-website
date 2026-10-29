'use client'

import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { WorldConfig } from '@/types'
import { useWorldStore } from '@/stores/useWorldStore'
import TimelineScrubber from './TimelineScrubber'

interface HolographicPanelProps {
  config: WorldConfig
  onClose: () => void
}

const mockTimeline = [
  { year: '2021', title: 'FORMATION', description: 'Raw elements coalescing.' },
  { year: '2023', title: 'MOLTEN ERA', description: 'Extreme heat and volcanic activity.' },
  { year: '2025', title: 'COOLING', description: 'Surface stabilization.' },
  { year: '2026', title: 'MODERN', description: 'Current stable orbit.' },
]

export default function HolographicPanel({ config, onClose }: HolographicPanelProps) {
  const { setNovaOpen } = useWorldStore()
  const [activeTab, setActiveTab] = useState<'lore' | 'data' | 'timeline'>('lore')

  // Derive title from config.id
  let dataTitle = 'DATA'
  if (config.id === 'emerald') dataTitle = 'ABOUT ME'
  if (config.id === 'forge') dataTitle = 'PROJECTS'
  if (config.id === 'ocean') dataTitle = 'SKILLS'
  if (config.id === 'crystal') dataTitle = 'EXPERIENCE'
  if (config.id === 'singularity') dataTitle = 'CONTACT'
  if (config.id === 'secret' || !config.id) dataTitle = 'ANOMALY'

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9, x: 20 }}
      animate={{ opacity: 1, scale: 1, x: 0 }}
      exit={{ opacity: 0, scale: 0.9, x: 20 }}
      onClick={(e) => e.stopPropagation()}
      className="w-[450px] bg-black/60 backdrop-blur-2xl border-l border-t border-white/10 rounded-2xl p-6 shadow-[0_0_50px_rgba(0,0,0,0.8)] relative overflow-hidden group pointer-events-auto"
      style={{
        boxShadow: `0 0 40px ${config.colors.primary}20, inset 0 0 20px ${config.colors.primary}10`,
        borderColor: `${config.colors.primary}40`,
      }}
    >
      {/* Decorative Grid Background */}
      <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-10 pointer-events-none" />
      <div 
        className="absolute inset-0 opacity-20 pointer-events-none"
        style={{ background: `radial-gradient(circle at 100% 0%, ${config.colors.primary}, transparent 50%)` }}
      />

      {/* Header */}
      <div className="flex justify-between items-start mb-6 relative z-10">
        <div>
          <h2 className="text-3xl font-heading tracking-wider text-white mb-1" style={{ textShadow: `0 0 10px ${config.colors.primary}` }}>
            {config.name}
          </h2>
          <p className="text-sm font-mono tracking-[0.2em] uppercase" style={{ color: config.colors.atmosphere }}>
            {config.subtitle}
          </p>
        </div>
        <button 
          onClick={onClose}
          className="text-white/40 hover:text-white transition-colors"
        >
          <span className="font-mono text-xl">✕</span>
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-4 relative z-10">
        <button onClick={() => setActiveTab('lore')} className={`flex-1 py-1.5 text-xs tracking-widest font-heading rounded border ${activeTab === 'lore' ? 'bg-white/10 border-white/30 text-white' : 'border-transparent text-white/40 hover:text-white/70'}`}>
          LORE
        </button>
        <button onClick={() => setActiveTab('data')} className={`flex-1 py-1.5 text-xs tracking-widest font-heading rounded border ${activeTab === 'data' ? 'bg-white/10 border-white/30 text-white' : 'border-transparent text-white/40 hover:text-white/70'}`}>
          {dataTitle}
        </button>
        <button onClick={() => setActiveTab('timeline')} className={`flex-1 py-1.5 text-xs tracking-widest font-heading rounded border ${activeTab === 'timeline' ? 'bg-white/10 border-white/30 text-white' : 'border-transparent text-white/40 hover:text-white/70'}`}>
          TIMELINE
        </button>
      </div>

      {/* Content Area */}
      <div className="relative z-10 min-h-[250px]">
        <AnimatePresence mode="wait">
          {activeTab === 'lore' && (
            <motion.div
              key="lore"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="text-white/80 font-sans leading-relaxed text-sm whitespace-pre-wrap max-h-[250px] overflow-y-auto custom-scrollbar pr-2"
            >
              {config.description}
            </motion.div>
          )}

          {activeTab === 'data' && (
            <motion.div
              key="data"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="flex flex-col gap-4 text-sm max-h-[250px] overflow-y-auto custom-scrollbar pr-2"
            >
              {config.id === 'emerald' && (
                <div className="space-y-4">
                  <div className="flex items-center gap-4 border-b border-white/10 pb-4">
                    <div className="w-16 h-16 rounded-full bg-cyan-900 border-2 border-cyan-400 flex items-center justify-center overflow-hidden shadow-[0_0_15px_#00ffff]">
                      <span className="text-2xl">👨‍💻</span>
                    </div>
                    <div>
                      <h3 className="font-heading tracking-widest text-white text-lg">ASHISH KUMAR</h3>
                      <p className="font-mono text-cyan-400 text-xs uppercase tracking-widest">Creative Technologist</p>
                    </div>
                  </div>
                  <p className="text-white/70 leading-relaxed font-sans">
                    I build unforgettable digital experiences that blur the line between web development and cinematic storytelling. Passionate about WebGL, React, and pushing the boundaries of what is possible in the browser.
                  </p>
                </div>
              )}

              {config.id === 'forge' && (
                <div className="space-y-3">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="p-3 bg-white/5 border border-white/10 rounded-lg hover:border-orange-500/50 transition-colors group cursor-pointer">
                      <h4 className="font-heading text-orange-400 tracking-wider group-hover:text-orange-300">PROJECT__{i}</h4>
                      <p className="font-mono text-white/50 text-xs mt-1">A highly scalable web application leveraging modern 3D frameworks to deliver a premium user experience.</p>
                      <div className="flex gap-2 mt-2">
                        <span className="text-[10px] px-2 py-0.5 bg-white/10 rounded font-mono text-white/80">React</span>
                        <span className="text-[10px] px-2 py-0.5 bg-white/10 rounded font-mono text-white/80">Three.js</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {config.id === 'ocean' && (
                <div className="grid grid-cols-2 gap-3">
                  {['React / Next.js', 'Three.js / R3F', 'GLSL Shaders', 'GSAP / Motion', 'Tailwind CSS', 'TypeScript'].map(skill => (
                    <div key={skill} className="flex items-center gap-2 p-2 bg-blue-900/20 border border-blue-500/30 rounded">
                      <div className="w-2 h-2 rounded-full bg-blue-400 shadow-[0_0_5px_#60a5fa]" />
                      <span className="font-mono text-xs text-white/90 tracking-wider">{skill}</span>
                    </div>
                  ))}
                </div>
              )}

              {config.id === 'crystal' && (
                <div className="relative pl-4 space-y-6 before:absolute before:left-1.5 before:top-2 before:bottom-2 before:w-[1px] before:bg-purple-500/30">
                  <div className="relative">
                    <div className="absolute -left-[21px] top-1.5 w-3 h-3 rounded-full bg-purple-500 shadow-[0_0_10px_#a855f7]" />
                    <h4 className="font-heading text-purple-300 tracking-wider">SENIOR FRONTEND ENGINEER</h4>
                    <p className="font-mono text-white/40 text-[10px] mb-1">2024 - PRESENT</p>
                    <p className="text-white/70 text-xs font-sans">Lead development of immersive web experiences and 3D product visualizers.</p>
                  </div>
                  <div className="relative">
                    <div className="absolute -left-[21px] top-1.5 w-3 h-3 rounded-full bg-purple-900 border border-purple-500" />
                    <h4 className="font-heading text-purple-400 tracking-wider">CREATIVE DEVELOPER</h4>
                    <p className="font-mono text-white/40 text-[10px] mb-1">2021 - 2024</p>
                    <p className="text-white/70 text-xs font-sans">Crafted award-winning interactive campaigns for global brands using WebGL.</p>
                  </div>
                </div>
              )}

              {config.id === 'singularity' && (
                <div className="flex flex-col items-center justify-center py-6 gap-6">
                  <p className="text-center text-white/60 font-sans">Ready to cross the event horizon? Establish a direct comm-link.</p>
                  <div className="flex gap-4 w-full">
                    <button className="flex-1 py-3 bg-purple-900/40 hover:bg-purple-600/60 border border-purple-500/50 rounded font-heading tracking-widest text-white transition-all shadow-[0_0_15px_rgba(168,85,247,0.2)]">
                      EMAIL ME
                    </button>
                    <button className="flex-1 py-3 bg-white/5 hover:bg-white/10 border border-white/20 rounded font-heading tracking-widest text-white transition-all">
                      GITHUB
                    </button>
                  </div>
                </div>
              )}

              {/* Fallback for Anomaly */}
              {config.id === 'secret' || !['emerald', 'forge', 'ocean', 'crystal', 'singularity'].includes(config.id) ? (
                <div className="p-4 bg-red-900/20 border border-red-500/50 rounded-lg">
                  <h4 className="font-heading text-red-400 tracking-widest mb-2">⚠ ANOMALY DETECTED</h4>
                  <p className="font-mono text-xs text-white/70">Unidentified structural data. The geometry of this sector defies standard analysis. Proceed with extreme caution.</p>
                </div>
              ) : null}
            </motion.div>
          )}

          {activeTab === 'timeline' && (
            <motion.div
              key="timeline"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
            >
              <TimelineScrubber events={mockTimeline} />
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Action Footer */}
      <div className="mt-6 pt-4 border-t border-white/10 flex justify-end relative z-10">
        <button 
          onClick={(e) => {
            e.stopPropagation()
            setNovaOpen(true)
          }}
          className="text-cyan-400 text-xs font-mono tracking-widest hover:text-cyan-300 transition-colors"
        >
          [ ASK NOVA ABOUT THIS WORLD ]
        </button>
      </div>
    </motion.div>
  )
}
