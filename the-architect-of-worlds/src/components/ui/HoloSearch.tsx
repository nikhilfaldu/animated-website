'use client'

import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { FiSearch } from 'react-icons/fi'
import { useWorldStore } from '@/stores/useWorldStore'
import * as THREE from 'three'

// Simple string hash to generate coordinates
function hashStringToCoords(str: string) {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  
  // Use hash to generate Sector coordinates
  // Very simplistic mapping
  const x = (hash % 100) * 500
  const y = ((hash >> 4) % 100) * 500
  const z = ((hash >> 8) % 100) * 500
  
  return new THREE.Vector3(x, y, z)
}

export default function HoloSearch() {
  const [query, setQuery] = useState('')
  const [isFocused, setIsFocused] = useState(false)
  const { isIntroComplete, navigateToObject } = useWorldStore()

  if (!isIntroComplete) return null

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    if (!query.trim()) return

    // In a full implementation, this would search the universe generator
    // For now, we hash the string to find "hidden" coordinates
    const targetCoords = hashStringToCoords(query.toLowerCase())
    
    navigateToObject({
      id: `search-${query.toLowerCase()}`,
      name: query,
      type: 'planet',
      position: targetCoords
    })
    
    setQuery('')
    setIsFocused(false)
  }

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="absolute bottom-10 left-1/2 -translate-x-1/2 z-40 w-full max-w-md px-4"
      >
        <form 
          onSubmit={handleSearch}
          className={`relative group flex items-center transition-all duration-500 rounded-2xl overflow-hidden bg-black/40 backdrop-blur-md border ${isFocused ? 'border-cyan-400 shadow-[0_0_20px_rgba(34,211,238,0.2)]' : 'border-white/10'}`}
        >
          <div className="pl-4 pr-3 text-cyan-500">
            <FiSearch size={18} />
          </div>
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
            placeholder="Search the universe... (e.g. Earth, Nebula)"
            className="w-full bg-transparent py-4 text-sm text-white placeholder-white/30 focus:outline-none"
          />
          
          <button 
            type="submit"
            className="absolute right-2 px-4 py-2 bg-cyan-500/20 hover:bg-cyan-500/40 text-cyan-300 text-xs font-semibold rounded-xl transition-colors uppercase tracking-wider"
          >
            Warp
          </button>
        </form>
      </motion.div>
    </AnimatePresence>
  )
}
