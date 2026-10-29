'use client'

import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

interface TimelineEvent {
  year: string
  title: string
  description: string
}

interface TimelineScrubberProps {
  events: TimelineEvent[]
}

export default function TimelineScrubber({ events }: TimelineScrubberProps) {
  const [currentIndex, setCurrentIndex] = useState(0)

  return (
    <div className="w-full flex flex-col gap-4 mt-4">
      {/* Current Event Display */}
      <div className="h-24 bg-white/5 rounded-lg border border-white/10 p-4 overflow-hidden relative">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentIndex}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3 }}
            className="absolute inset-4"
          >
            <div className="text-xs text-cyan-400 font-mono mb-1">{events[currentIndex].year}</div>
            <div className="text-sm text-white font-heading tracking-wider mb-1">{events[currentIndex].title}</div>
            <div className="text-xs text-white/60 leading-relaxed">{events[currentIndex].description}</div>
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Scrubber Bar */}
      <div className="relative w-full h-8 flex items-center group cursor-pointer">
        <div className="absolute w-full h-1 bg-white/10 rounded-full" />
        <div 
          className="absolute h-1 bg-cyan-500/50 rounded-full transition-all duration-300"
          style={{ width: `${(currentIndex / (events.length - 1)) * 100}%` }}
        />
        
        <div className="absolute w-full flex justify-between px-1">
          {events.map((_, idx) => (
            <button
              key={idx}
              onClick={(e) => {
                e.stopPropagation()
                setCurrentIndex(idx)
              }}
              className={`w-3 h-3 rounded-full transition-all ${currentIndex === idx ? 'bg-cyan-400 scale-125 shadow-[0_0_10px_rgba(0,255,255,0.8)]' : 'bg-white/30 hover:bg-white/50 hover:scale-110'}`}
            />
          ))}
        </div>
      </div>
    </div>
  )
}
