'use client'

import { useState, useCallback } from 'react'
import dynamic from 'next/dynamic'
import LoadingScreen from '@/components/ui/LoadingScreen'
import TitleOverlay from '@/components/ui/TitleOverlay'
import IntroSequence from '@/components/ui/IntroSequence'
import AudioToggle from '@/components/ui/AudioToggle'
import DiscoveryHUD from '@/components/ui/DiscoveryHUD'
import Toolbar from '@/components/ui/Toolbar'
import NovaChat from '@/components/ui/nova/NovaChat'
import DiscoveryLog from '@/components/ui/nova/DiscoveryLog'
import WorldDetail from '@/components/ui/WorldDetail'
import { GrandWorldNavigator } from '@/components/ui/GrandWorldNavigator'
import { ArchitectPortfolioReward } from '@/components/ui/ArchitectPortfolioReward'
import { TransitionWipe } from '@/components/effects/TransitionWipe'
import { AudioManager } from '@/components/audio/AudioManager'
import { useWorldNavigation } from '@/hooks/useWorldNavigation'
import { useWorldStore } from '@/stores/useWorldStore'

import { GardenIntroOverlay } from '@/components/ui/garden/GardenIntroOverlay'
import { PlantHoloLabel } from '@/components/ui/garden/PlantHoloLabel'
import { GardenHUD } from '@/components/ui/garden/GardenHUD'
import { GardenEcosystemStats } from '@/components/ui/garden/GardenEcosystemStats'
import { PlantDetailModal } from '@/components/ui/garden/PlantDetailModal'

const SceneCanvas = dynamic(
  () => import('@/components/canvas/SceneCanvas'),
  {
    ssr: false,
    loading: () => null,
  },
)

function NavigationHandler() {
  useWorldNavigation()
  return null
}

export default function HomePage() {
  const [sceneReady, setSceneReady] = useState(false)
  const { photoMode, viewMode } = useWorldStore()

  const handleSceneReady = useCallback(() => {
    setSceneReady(true)
  }, [])

  return (
    <main className="relative w-screen h-screen overflow-hidden bg-black select-none">
      {/* 3D Canvas */}
      <div className="absolute inset-0 z-0">
        <SceneCanvas onCreated={handleSceneReady} />
      </div>

      {/* Main UI Overlay Container */}
      <div className="relative z-10 pointer-events-none w-full h-full">
        <LoadingScreen isLoaded={sceneReady} />

        {sceneReady && (
          <>
            {/* Top Grand World & Nova Navigator Bar */}
            {!photoMode && <GrandWorldNavigator />}

            {/* Mode 1: 3D Universe Explorations */}
            {viewMode === 'universe' && (
              <>
                {!photoMode && (
                  <div className="pointer-events-auto">
                    <IntroSequence />
                    <TitleOverlay />
                    <DiscoveryHUD />
                    <WorldDetail />
                    <NovaChat />
                    <DiscoveryLog />
                    <AudioToggle />
                    <ArchitectPortfolioReward />
                  </div>
                )}
              </>
            )}

            {/* Mode 2: Galactic Garden Biosphere */}
            {viewMode === 'garden' && (
              <>
                <GardenIntroOverlay />
                <PlantHoloLabel />
                <GardenHUD />
                <GardenEcosystemStats />
                <PlantDetailModal />
              </>
            )}

            {/* Bottom Toolbar & Mode Switcher */}
            <Toolbar />
            <TransitionWipe />
          </>
        )}
      </div>

      {/* Non-visual Managers */}
      <NavigationHandler />
      <AudioManager />
    </main>
  )
}
