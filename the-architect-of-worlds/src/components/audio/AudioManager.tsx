'use client'

import { useEffect, useRef, useCallback } from 'react'
import { useAudioStore } from '@/stores/useAudioStore'
import { useWorldStore } from '@/stores/useWorldStore'

export function AudioManager() {
  const { isMuted, volume, setContextReady } = useAudioStore()
  const { isIntroStarted, activeWorld } = useWorldStore()
  const ctxRef = useRef<AudioContext | null>(null)
  const gainRef = useRef<GainNode | null>(null)
  const dronesRef = useRef<OscillatorNode[]>([])
  const worldSynthRef = useRef<OscillatorNode | null>(null)
  const isInitRef = useRef(false)

  const initAudio = useCallback(() => {
    if (isInitRef.current) return
    isInitRef.current = true

    try {
      const ctx = new AudioContext()
      ctxRef.current = ctx

      const masterGain = ctx.createGain()
      masterGain.gain.value = volume
      masterGain.connect(ctx.destination)
      gainRef.current = masterGain

      // Base drone — deep sub-bass
      const osc1 = ctx.createOscillator()
      osc1.type = 'sine'
      osc1.frequency.value = 55
      const g1 = ctx.createGain()
      g1.gain.value = 0.12
      osc1.connect(g1).connect(masterGain)
      osc1.start()
      dronesRef.current.push(osc1)

      // Harmonic — fifth above
      const osc2 = ctx.createOscillator()
      osc2.type = 'sine'
      osc2.frequency.value = 82.5
      const g2 = ctx.createGain()
      g2.gain.value = 0.06
      osc2.connect(g2).connect(masterGain)
      osc2.start()
      dronesRef.current.push(osc2)

      // High shimmer — filtered noise
      const bufferSize = ctx.sampleRate * 2
      const noiseBuffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate)
      const output = noiseBuffer.getChannelData(0)
      for (let i = 0; i < bufferSize; i++) {
        output[i] = (Math.random() * 2 - 1) * 0.3
      }

      const noise = ctx.createBufferSource()
      noise.buffer = noiseBuffer
      noise.loop = true

      const bandpass = ctx.createBiquadFilter()
      bandpass.type = 'bandpass'
      bandpass.frequency.value = 800
      bandpass.Q.value = 2

      const noiseGain = ctx.createGain()
      noiseGain.gain.value = 0.04

      noise.connect(bandpass).connect(noiseGain).connect(masterGain)
      noise.start()

      setContextReady()
    } catch {
      // Audio context creation failed silently
    }
  }, [volume, setContextReady])

  // Initialize audio on intro start
  useEffect(() => {
    if (isIntroStarted) initAudio()
  }, [isIntroStarted, initAudio])

  // Update volume/mute
  useEffect(() => {
    if (!gainRef.current) return
    gainRef.current.gain.setTargetAtTime(
      isMuted ? 0 : volume,
      ctxRef.current?.currentTime || 0,
      0.3,
    )
  }, [isMuted, volume])

  // Cleanup
  useEffect(() => {
    const drones = dronesRef.current
    const ctx = ctxRef.current
    return () => {
      drones.forEach((osc) => {
        try { osc.stop() } catch { /* already stopped */ }
      })
      try {
        if (ctx?.state !== 'closed') {
          ctx?.close()
        }
      } catch {
        // Ignore AudioContext close errors
      }
    }
  }, [])

  // World-Specific Soundscape Synthesizer
  useEffect(() => {
    if (!ctxRef.current || !gainRef.current || isMuted) return
    const ctx = ctxRef.current

    // Stop previous world synth oscillator if playing
    if (worldSynthRef.current) {
      try {
        worldSynthRef.current.stop()
      } catch {
        /* already stopped */
      }
      worldSynthRef.current = null
    }

    if (!activeWorld) return

    try {
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()
      const filter = ctx.createBiquadFilter()

      let freq = 220
      let waveType: OscillatorType = 'sine'
      let filterFreq = 1000

      switch (activeWorld) {
        case 'forge':
          freq = 65 // Volcanic low saw rumble
          waveType = 'sawtooth'
          filterFreq = 400
          break
        case 'ocean':
          freq = 110 // Deep sub sea chord
          waveType = 'sine'
          filterFreq = 600
          break
        case 'crystal':
          freq = 880 // High crystalline chime
          waveType = 'triangle'
          filterFreq = 3000
          break
        case 'singularity':
          freq = 40 // Gravitational black hole sub-bass
          waveType = 'sawtooth'
          filterFreq = 200
          break
        case 'emerald':
          freq = 330 // Lush major 7th atmosphere
          waveType = 'sine'
          filterFreq = 1200
          break
        case 'nexus':
          freq = 440 // Golden fundamental core A4
          waveType = 'sine'
          filterFreq = 2000
          break
        default:
          freq = 220
      }

      osc.type = waveType
      osc.frequency.setValueAtTime(freq, ctx.currentTime)

      filter.type = 'lowpass'
      filter.frequency.setValueAtTime(filterFreq, ctx.currentTime)

      gain.gain.setValueAtTime(0, ctx.currentTime)
      gain.gain.linearRampToValueAtTime(0.04, ctx.currentTime + 0.5)

      osc.connect(filter).connect(gain).connect(gainRef.current)
      osc.start()
      worldSynthRef.current = osc

      // Navigation Chime
      const chimeOsc = ctx.createOscillator()
      const chimeGain = ctx.createGain()
      chimeOsc.type = 'sine'
      chimeOsc.frequency.setValueAtTime(freq * 2, ctx.currentTime)
      chimeOsc.frequency.exponentialRampToValueAtTime(freq, ctx.currentTime + 0.3)

      chimeGain.gain.setValueAtTime(0, ctx.currentTime)
      chimeGain.gain.linearRampToValueAtTime(0.06, ctx.currentTime + 0.02)
      chimeGain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.5)

      chimeOsc.connect(chimeGain).connect(gainRef.current)
      chimeOsc.start()
      chimeOsc.stop(ctx.currentTime + 0.6)
    } catch {
      // Audio errors silenced
    }
  }, [activeWorld, isMuted])

  return null
}
