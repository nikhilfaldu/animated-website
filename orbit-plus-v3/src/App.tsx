import './styles/globals.css';
import { useState, useEffect, useMemo } from 'react';
import { useMotionValueEvent } from 'framer-motion';
import { OrbitSystemProvider, useOrbitSystem } from '@/context/OrbitSystem';
import { Emblem } from '@/components/emblem/Emblem';
import { ScrollController } from '@/components/ScrollController';
import { GlobalNav } from '@/components/navigation/GlobalNav';
import { LenisProvider } from '@/components/LenisProvider';
import { useIsMobile } from '@/hooks/useResponsive';
import { MOBILE_SIZES, DESKTOP_TARGETS } from '@/config/mobileTargets';
import {
  Hero,
  Positioning,
  TunnelIn,
  Services,
  Process,
  Reveal,
  Work,
  Proof,
  Pricing,
  Contact
} from '@/sections';
import { PROJECTS } from '@/sections/Work';
import {
  WorkBridgeOverlay,
  useWorkCardRects,
  BRIDGE_GLOBAL_START,
  BRIDGE_FADE_OUT_END,
} from '@/sections/WorkBridge';
import { GlobalCanvas, TunnelInScene } from '@/components/GlobalCanvas';
import { ScrollIndicator } from '@/components/ScrollIndicator';

/**
 * AppContent is the inner component that consumes OrbitSystem context.
 * This separation is necessary because App wraps OrbitSystemProvider.
 */
function AppContent() {
  const isMobile = useIsMobile();
  const emblemSize = isMobile ? MOBILE_SIZES.emblem : DESKTOP_TARGETS.sizes.emblem;

  // Access global scroll progress from OrbitSystem
  const { scrollProgress } = useOrbitSystem();

  // Track when bridge overlay should be active
  const [bridgeActive, setBridgeActive] = useState(false);

  useMotionValueEvent(scrollProgress, 'change', (v) => {
    setBridgeActive(v >= BRIDGE_GLOBAL_START && v <= BRIDGE_FADE_OUT_END);
  });

  // Prepare bridge projects data (first 4 projects)
  const bridgeProjects = useMemo(
    () =>
      PROJECTS.slice(0, 4).map((p) => ({
        id: p.id,
        previewImageUrl: p.previewImageUrl,
        previewFocalPoint: p.previewFocalPoint,
        logoUrl: p.logoUrl,
      })),
    []
  );

  // Measure Work card positions for bridge animation
  const { rects, ready } = useWorkCardRects(
    bridgeProjects.map((p) => p.id),
    bridgeActive
  );

  // Preload preview images for smooth transitions
  useEffect(() => {
    for (const p of PROJECTS.slice(0, 4)) {
      if (p.previewImageUrl) {
        const img = new Image();
        img.decoding = 'async';
        img.src = p.previewImageUrl;
      }
      if (p.logoUrl) {
        const img = new Image();
        img.decoding = 'async';
        img.src = p.logoUrl;
      }
    }
  }, []);

  return (
    <div className="app-container">
      {/* Accessibility: ARIA live region for screen reader announcements */}
      <div
        id="live-region"
        role="status"
        aria-live="polite"
        aria-atomic="true"
        className="sr-only"
      />

      {/* Global WebGL Canvas - persistent, never unmounts */}
      {/* z-57: Above section backgrounds (z-55), below Emblem (z-60) */}
      <GlobalCanvas>
        <TunnelInScene />
        {/* Additional scenes to be added:
            - ApertureScene (iris snap during Reveal)
        */}
      </GlobalCanvas>

      {/* Fixed emblem that responds to scroll */}
      {/* z-[56] places emblem BELOW GlobalCanvas (z-57) so WebGL renders on top during handoff */}
      <div className="pointer-events-none fixed inset-0 z-[56]">
        <Emblem size={emblemSize} />
      </div>

      {/* Scroll indicator - appears after hero text, fades before Positioning */}
      <ScrollIndicator />

      {/* WorkBridge Overlay: 4 exposure windows from Reveal to Work */}
      {/* z-56: above emblem (z-56) via DOM order, below WebGL (z-58) */}
      <WorkBridgeOverlay
        globalProgress={scrollProgress}
        projects={bridgeProjects}
        rects={rects}
        rectsReady={ready}
      />

      {/* Navigation */}
      <GlobalNav />

      {/* Scrollable content */}
      <ScrollController>
        <Hero />
        <Positioning />
        <TunnelIn />
        <Services />
        <Process />
        <Reveal />
        <Work />
        <Proof />
        <Pricing />
        <Contact />
      </ScrollController>
    </div>
  );
}

function App() {
  // Always start at top on page load/reload
  useEffect(() => {
    if ('scrollRestoration' in history) {
      history.scrollRestoration = 'manual';
    }
    window.scrollTo(0, 0);
  }, []);

  return (
    <LenisProvider>
      <OrbitSystemProvider>
        <AppContent />
      </OrbitSystemProvider>
    </LenisProvider>
  );
}

export default App;
