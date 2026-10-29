// Web Audio API Synth Sound Engine for Galactic Garden
class GardenSoundEngine {
  private ctx: AudioContext | null = null
  private ambientOsc1: OscillatorNode | null = null
  private ambientOsc2: OscillatorNode | null = null
  private ambientGain: GainNode | null = null
  private filter: BiquadFilterNode | null = null
  private isMuted: boolean = false
  private isInitialized: boolean = false

  public init() {
    if (this.ctx) return
    const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext
    if (AudioCtx) {
      this.ctx = new AudioCtx()
    }
  }

  private ensureContext() {
    this.init()
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume()
    }
  }

  public setMuted(muted: boolean) {
    this.isMuted = muted
    if (this.ambientGain && this.ctx) {
      this.ambientGain.gain.setTargetAtTime(muted ? 0 : 0.08, this.ctx.currentTime, 0.2)
    }
  }

  public startAmbient() {
    if (this.isInitialized || this.isMuted) return
    this.ensureContext()
    if (!this.ctx) return

    try {
      this.isInitialized = true

      // Create ambient drone oscillators
      this.ambientOsc1 = this.ctx.createOscillator()
      this.ambientOsc2 = this.ctx.createOscillator()
      this.ambientGain = this.ctx.createGain()
      this.filter = this.ctx.createBiquadFilter()

      // Deep harmonic frequencies (A2 + E3)
      this.ambientOsc1.type = 'sine'
      this.ambientOsc1.frequency.setValueAtTime(110, this.ctx.currentTime) // A2

      this.ambientOsc2.type = 'triangle'
      this.ambientOsc2.frequency.setValueAtTime(164.81, this.ctx.currentTime) // E3

      // Lowpass filter for warm space drone
      this.filter.type = 'lowpass'
      this.filter.frequency.setValueAtTime(350, this.ctx.currentTime)

      this.ambientGain.gain.setValueAtTime(this.isMuted ? 0 : 0.08, this.ctx.currentTime)

      this.ambientOsc1.connect(this.filter)
      this.ambientOsc2.connect(this.filter)
      this.filter.connect(this.ambientGain)
      this.ambientGain.connect(this.ctx.destination)

      this.ambientOsc1.start()
      this.ambientOsc2.start()
    } catch {
      // Audio fallback
    }
  }

  public stopAmbient() {
    if (!this.isInitialized) return
    try {
      this.ambientOsc1?.stop()
      this.ambientOsc2?.stop()
      this.ambientOsc1?.disconnect()
      this.ambientOsc2?.disconnect()
      this.isInitialized = false
    } catch {
      // Ignore
    }
  }

  public playHoverChime(baseFreq: number = 528) {
    if (this.isMuted) return
    this.ensureContext()
    if (!this.ctx) return

    try {
      const now = this.ctx.currentTime
      const osc = this.ctx.createOscillator()
      const gain = this.ctx.createGain()

      osc.type = 'sine'
      osc.frequency.setValueAtTime(baseFreq, now)
      osc.frequency.exponentialRampToValueAtTime(baseFreq * 1.25, now + 0.15)

      gain.gain.setValueAtTime(0.06, now)
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.35)

      osc.connect(gain)
      gain.connect(this.ctx.destination)

      osc.start(now)
      osc.stop(now + 0.35)
    } catch {
      // Ignore
    }
  }

  public playBloomSound(baseFreq: number = 639) {
    if (this.isMuted) return
    this.ensureContext()
    if (!this.ctx) return

    try {
      const now = this.ctx.currentTime
      // Harmonic arpeggio chord (1, 1.25, 1.5, 2.0)
      const ratios = [1.0, 1.25, 1.5, 2.0]

      ratios.forEach((ratio, index) => {
        if (!this.ctx) return
        const noteTime = now + index * 0.08
        const osc = this.ctx.createOscillator()
        const gain = this.ctx.createGain()

        osc.type = 'sine'
        osc.frequency.setValueAtTime(baseFreq * ratio, noteTime)

        gain.gain.setValueAtTime(0.08, noteTime)
        gain.gain.exponentialRampToValueAtTime(0.0001, noteTime + 0.6)

        osc.connect(gain)
        gain.connect(this.ctx.destination)

        osc.start(noteTime)
        osc.stop(noteTime + 0.6)
      })
    } catch {
      // Ignore
    }
  }

  public playSeedPlantSound() {
    if (this.isMuted) return
    this.ensureContext()
    if (!this.ctx) return

    try {
      const now = this.ctx.currentTime
      const osc = this.ctx.createOscillator()
      const gain = this.ctx.createGain()

      osc.type = 'sine'
      // Downward pitch drop followed by shimmer resonance
      osc.frequency.setValueAtTime(880, now)
      osc.frequency.exponentialRampToValueAtTime(220, now + 0.25)
      osc.frequency.exponentialRampToValueAtTime(440, now + 0.5)

      gain.gain.setValueAtTime(0.12, now)
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.55)

      osc.connect(gain)
      gain.connect(this.ctx.destination)

      osc.start(now)
      osc.stop(now + 0.55)
    } catch {
      // Ignore
    }
  }
}

export const gardenSound = new GardenSoundEngine()
