'use client'

import { useEffect, useCallback } from 'react'
import { useWorldStore } from '@/stores/useWorldStore'
import { WORLD_ORDER } from '@/config/worlds'

export function useWorldNavigation() {
  const { activeWorld, navigateToWorld, isTransitioning, isIntroComplete } =
    useWorldStore()

  const navigateNext = useCallback(() => {
    if (isTransitioning || !isIntroComplete) return
    if (!activeWorld) {
      navigateToWorld(WORLD_ORDER[0])
      return
    }
    const idx = WORLD_ORDER.indexOf(activeWorld)
    if (idx < WORLD_ORDER.length - 1) {
      navigateToWorld(WORLD_ORDER[idx + 1])
    }
  }, [activeWorld, navigateToWorld, isTransitioning, isIntroComplete])

  const navigatePrev = useCallback(() => {
    if (isTransitioning || !isIntroComplete) return
    if (!activeWorld) return
    const idx = WORLD_ORDER.indexOf(activeWorld)
    if (idx > 0) {
      navigateToWorld(WORLD_ORDER[idx - 1])
    } else {
      navigateToWorld(null)
    }
  }, [activeWorld, navigateToWorld, isTransitioning, isIntroComplete])

  // Keyboard navigation
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
        e.preventDefault()
        navigateNext()
      } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
        e.preventDefault()
        navigatePrev()
      } else if (e.key === 'Escape') {
        navigateToWorld(null)
      } else if (e.key >= '1' && e.key <= '6') {
        const idx = parseInt(e.key) - 1
        if (idx < WORLD_ORDER.length) {
          navigateToWorld(WORLD_ORDER[idx])
        }
      }
    }

    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [navigateNext, navigatePrev, navigateToWorld])

  // Wheel navigation (debounced)
  useEffect(() => {
    let cooldown = false
    const onWheel = (e: WheelEvent) => {
      if (cooldown || isTransitioning || !isIntroComplete) return
      cooldown = true
      setTimeout(() => (cooldown = false), 1500)

      if (e.deltaY > 30) navigateNext()
      else if (e.deltaY < -30) navigatePrev()
    }

    window.addEventListener('wheel', onWheel, { passive: true })
    return () => window.removeEventListener('wheel', onWheel)
  }, [navigateNext, navigatePrev, isTransitioning, isIntroComplete])

  return { navigateNext, navigatePrev }
}
