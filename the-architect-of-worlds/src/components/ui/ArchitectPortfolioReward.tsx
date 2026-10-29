'use client'

import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useWorldStore } from '@/stores/useWorldStore'
import { Globe, Sparkles, Award, Code, Send, X, ExternalLink } from 'lucide-react'

type TabType = 'about' | 'projects' | 'skills' | 'contact'

export function ArchitectPortfolioReward() {
  const { visitedObjects, explorationPercent } = useWorldStore()
  const [isOpen, setIsOpen] = useState(false)
  const [activeTab, setActiveTab] = useState<TabType>('about')

  // Reward is accessible once explorer has charted at least 3 sectors or reached 40% progress
  const isUnlocked = visitedObjects.length >= 3 || explorationPercent >= 40

  if (!isUnlocked) return null

  return (
    <>
      {/* Floating Glowing Portfolio Reward Trigger Badge */}
      <motion.button
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 left-6 z-40 flex items-center gap-2.5 px-4 py-2.5 rounded-full bg-gradient-to-r from-amber-500 via-purple-600 to-cyan-500 text-white font-mono text-xs shadow-[0_0_30px_rgba(255,184,0,0.6)] border border-amber-300/40 pointer-events-auto cursor-pointer"
      >
        <Sparkles className="w-4 h-4 text-amber-200 animate-spin" style={{ animationDuration: '6s' }} />
        <span className="font-bold tracking-wider uppercase">Architect Portfolio World</span>
      </motion.button>

      {/* Full Screen Portfolio Modal */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/90 backdrop-blur-3xl flex items-center justify-center p-6 pointer-events-auto select-none"
          >
            <div className="w-full max-w-4xl max-h-[90vh] bg-slate-950 border border-cyan-500/30 rounded-3xl overflow-hidden flex flex-col shadow-[0_0_80px_rgba(0,240,255,0.3)]">
              {/* Header */}
              <div className="p-6 border-b border-cyan-500/20 bg-black/50 flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2 text-[10px] font-mono text-cyan-400 uppercase tracking-widest">
                    <Award className="w-3.5 h-3.5" />
                    <span>The Architect's Cosmic Reward</span>
                  </div>
                  <h2 className="text-3xl font-extrabold font-heading text-transparent bg-clip-text bg-gradient-to-r from-white via-cyan-200 to-purple-300">
                    THE ARCHITECT OF WORLDS
                  </h2>
                </div>

                <button
                  onClick={() => setIsOpen(false)}
                  className="p-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-400 hover:text-white transition-colors cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Tabs */}
              <div className="flex border-b border-cyan-500/20 bg-slate-900/50 text-xs font-mono">
                {[
                  { id: 'about', label: 'Architect Story', icon: Globe },
                  { id: 'projects', label: '3D & AI Projects', icon: Sparkles },
                  { id: 'skills', label: 'Technical Toolkit', icon: Code },
                  { id: 'contact', label: 'Transmission', icon: Send },
                ].map((t) => {
                  const Icon = t.icon
                  return (
                    <button
                      key={t.id}
                      onClick={() => setActiveTab(t.id as TabType)}
                      className={`flex-1 flex items-center justify-center gap-2 py-3.5 border-b-2 transition-all cursor-pointer ${
                        activeTab === t.id
                          ? 'border-cyan-400 text-cyan-300 bg-cyan-500/10 font-bold'
                          : 'border-transparent text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      <Icon className="w-4 h-4" />
                      <span>{t.label}</span>
                    </button>
                  )
                })}
              </div>

              {/* Modal Body */}
              <div className="flex-1 overflow-y-auto p-8 space-y-6 font-sans text-slate-200">
                {/* ABOUT TAB */}
                {activeTab === 'about' && (
                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
                    <h3 className="text-xl font-bold font-serif text-cyan-300 italic">
                      "Engineering logic meets artistic wonder."
                    </h3>
                    <p className="leading-relaxed text-sm text-slate-300">
                      I am a Senior Spatial Developer & Creative Technologist dedicated to crafting world-class 3D web applications, high-performance WebGL shaders, and real-time AI experiences that captivate users and push the boundaries of browser technology.
                    </p>
                    <div className="grid grid-cols-3 gap-4 pt-4 font-mono text-xs">
                      <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800">
                        <span className="text-[10px] text-slate-400 uppercase block">Exploration Status</span>
                        <span className="font-bold text-cyan-400 text-base">{explorationPercent}% Complete</span>
                      </div>
                      <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800">
                        <span className="text-[10px] text-slate-400 uppercase block">Charted Sectors</span>
                        <span className="font-bold text-purple-400 text-base">{visitedObjects.length} Worlds</span>
                      </div>
                      <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800">
                        <span className="text-[10px] text-slate-400 uppercase block">Hackathon Status</span>
                        <span className="font-bold text-amber-400 text-base">Production Ready</span>
                      </div>
                    </div>
                  </motion.div>
                )}

                {/* PROJECTS TAB */}
                {activeTab === 'projects' && (
                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="grid grid-cols-2 gap-4">
                    {[
                      { name: 'Neural Engine ML Visualizer', tech: 'Three.js, WebGL Shaders, React', desc: 'Real-time 3D neural network topology simulator with interactive weights.' },
                      { name: 'Dyson Sphere Harvest', tech: 'R3F, Instancing, GPU Particles', desc: 'Solar megastructure energy harvesting simulation with 10,000 instanced solar collectors.' },
                      { name: 'Hycean Marine Survey', tech: 'Custom GLSL Shaders, Web Audio API', desc: 'Underwater bioluminescent sea exploration experience with procedural acoustic soundscapes.' },
                      { name: 'Galactic Garden Biosphere', tech: 'Next.js 15, Framer Motion, Zustand', desc: 'Interactive 3D alien garden with procedural flora growth, seed planting, and bio-energy tally.' },
                    ].map((p, i) => (
                      <div key={i} className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-2 hover:border-cyan-500/40 transition-colors">
                        <h4 className="font-bold text-cyan-300 text-base">{p.name}</h4>
                        <span className="text-[10px] font-mono text-purple-300 block">{p.tech}</span>
                        <p className="text-xs text-slate-400 leading-relaxed">{p.desc}</p>
                      </div>
                    ))}
                  </motion.div>
                )}

                {/* SKILLS TAB */}
                {activeTab === 'skills' && (
                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4 font-mono text-xs">
                    {[
                      { title: '3D & Graphics Core', items: ['Three.js', 'React Three Fiber', '@react-three/drei', 'GLSL Custom Shaders', 'Postprocessing FX', 'WebGL 2.0'] },
                      { title: 'Frontend Architecture', items: ['Next.js 15 (App Router)', 'React 19', 'TypeScript', 'Tailwind CSS v4', 'Framer Motion', 'Zustand State'] },
                      { title: 'AI & Audio Engineering', items: ['OpenAI Streaming API', 'Vercel AI SDK', 'Web Audio API Synth Engine', 'AudioContext Procedural Sound'] },
                    ].map((sec, i) => (
                      <div key={i} className="space-y-2">
                        <span className="text-cyan-400 uppercase text-[10px] font-bold tracking-wider block">{sec.title}</span>
                        <div className="flex flex-wrap gap-2">
                          {sec.items.map((item, j) => (
                            <span key={j} className="px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-slate-200 font-bold">
                              {item}
                            </span>
                          ))}
                        </div>
                      </div>
                    ))}
                  </motion.div>
                )}

                {/* CONTACT TAB */}
                {activeTab === 'contact' && (
                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6 text-center py-6">
                    <h3 className="text-2xl font-bold font-heading text-white">Cross the Event Horizon</h3>
                    <p className="text-xs text-slate-400 max-w-md mx-auto leading-relaxed">
                      Ready to build extraordinary 3D web applications together? Establish a direct transmission link below.
                    </p>
                    <div className="flex justify-center gap-4 pt-2">
                      <a
                        href="https://github.com"
                        target="_blank"
                        rel="noreferrer"
                        className="flex items-center gap-2 px-6 py-3 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 font-mono text-xs text-cyan-300 font-bold transition-all"
                      >
                        <span>GitHub Profile</span>
                        <ExternalLink className="w-3.5 h-3.5" />
                      </a>
                      <a
                        href="https://linkedin.com"
                        target="_blank"
                        rel="noreferrer"
                        className="flex items-center gap-2 px-6 py-3 rounded-xl bg-cyan-600/30 hover:bg-cyan-600/50 border border-cyan-500/50 font-mono text-xs text-white font-bold transition-all"
                      >
                        <span>LinkedIn Transmission</span>
                        <ExternalLink className="w-3.5 h-3.5" />
                      </a>
                    </div>
                  </motion.div>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}
