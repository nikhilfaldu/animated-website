'use client'

import { useState, useEffect } from 'react'
import { QualityTier } from '@/types'

export function useDeviceCapability(): QualityTier {
  const [tier, setTier] = useState<QualityTier>('high')

  useEffect(() => {
    const canvas = document.createElement('canvas')
    const gl = canvas.getContext('webgl2') || canvas.getContext('webgl')

    if (!gl) {
      setTier('low')
      return
    }

    const debugInfo = gl.getExtension('WEBGL_debug_renderer_info')
    const renderer = debugInfo
      ? gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL)
      : ''

    const isMobile = /Mobi|Android/i.test(navigator.userAgent)
    const isLowEnd = /Mali|Adreno [0-4]/i.test(renderer)
    const lowPixelRatio = window.devicePixelRatio < 1.5

    if (isMobile || isLowEnd) setTier('low')
    else if (lowPixelRatio) setTier('medium')

    canvas.remove()
  }, [])

  return tier
}
