import { Canvas } from '@react-three/fiber';
import { type ReactNode } from 'react';
import { useReducedMotion } from '@/hooks/useReducedMotion';
import { useIsMobile } from '@/hooks/useResponsive';

interface GlobalCanvasProps {
  children?: ReactNode;
}

/**
 * GlobalCanvas - Persistent WebGL canvas that lives at App root.
 *
 * This canvas never unmounts, hosting all scroll-driven WebGL scenes:
 * - TunnelInScene (radials converge during transition to Services)
 * - ApertureScene (iris snap during Reveal)
 *
 * Scenes control their own visibility based on scroll ranges,
 * accessing OrbitSystem context directly via useOrbitSystem().
 *
 * Configuration:
 * - frameloop="demand": Only renders when invalidated (performance)
 * - Orthographic camera: 2D shader work
 * - z-index 57: Above section backgrounds (z-55), below Emblem (z-60)
 */
export function GlobalCanvas({ children }: GlobalCanvasProps) {
  const prefersReducedMotion = useReducedMotion();
  const isMobile = useIsMobile();

  // Skip WebGL canvas entirely for reduced motion preference
  // Users who prefer reduced motion won't see animated tunnel/aperture effects
  if (prefersReducedMotion || isMobile) {
    return null;
  }

  return (
    <div
      className="fixed inset-0 pointer-events-none"
      style={{ zIndex: 57 }}
      aria-hidden="true"
    >
      <Canvas
        frameloop="demand"
        orthographic
        camera={{
          zoom: 100,
          position: [0, 0, 100],
          near: 0.1,
          far: 1000,
        }}
        gl={{
          antialias: true,
          alpha: true,
          powerPreference: 'high-performance',
        }}
        dpr={[1, 2]}
      >
        {children}
      </Canvas>
    </div>
  );
}
