'use client'

import React, { Component, ReactNode } from 'react'
import {
  EffectComposer,
  Bloom,
  Vignette,
  ChromaticAberration,
} from '@react-three/postprocessing'
import { BlendFunction } from 'postprocessing'
import { Vector2 } from 'three'
import { QualityTier } from '@/types'

interface SceneEffectsProps {
  quality: QualityTier
}

class PostprocessingErrorBoundary extends Component<{ children: ReactNode }, { hasError: boolean }> {
  constructor(props: { children: ReactNode }) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError() {
    return { hasError: true }
  }

  componentDidCatch(error: Error) {
    console.warn('Postprocessing effect load skipped:', error)
  }

  render() {
    if (this.state.hasError) {
      return null
    }
    return this.props.children
  }
}

export function SceneEffects({ quality }: SceneEffectsProps) {
  if (quality === 'low') {
    return (
      <PostprocessingErrorBoundary>
        <EffectComposer multisampling={0}>
          <Bloom
            luminanceThreshold={0.8}
            luminanceSmoothing={0.9}
            intensity={0.4}
            mipmapBlur
          />
        </EffectComposer>
      </PostprocessingErrorBoundary>
    )
  }

  return (
    <PostprocessingErrorBoundary>
      <EffectComposer multisampling={0}>
        <Bloom
          luminanceThreshold={0.5}
          luminanceSmoothing={0.9}
          intensity={1.2}
          mipmapBlur
          levels={5}
        />
        <Vignette
          offset={0.3}
          darkness={0.7}
          blendFunction={BlendFunction.NORMAL}
        />
        <ChromaticAberration
          offset={new Vector2(0.0006, 0.0006)}
          blendFunction={BlendFunction.NORMAL}
          radialModulation
          modulationOffset={0.5}
        />
      </EffectComposer>
    </PostprocessingErrorBoundary>
  )
}
