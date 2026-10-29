import { Canvas } from '@react-three/fiber';
import { useReducedMotion, type MotionValue } from 'framer-motion';
// import { EmblemLogo } from './EmblemLogo';
import { IrisShutter } from './IrisShutter';
import { CenterDisc } from './CenterDisc';

interface ApertureCanvasProps {
  progress: MotionValue<number>;  // 0..1 progress value
  sizeVmin?: number;              // default 56
}

/**
 * ApertureCanvas - R3F Canvas wrapper for the aperture emblem animation.
 *
 * Uses:
 * - frameloop="demand" to only render on MotionValue changes
 * - Orthographic camera for 2D SVG-like appearance
 * - Reduced motion check to skip animation for users who prefer it
 */
export function ApertureCanvas({ progress, sizeVmin = 56 }: ApertureCanvasProps) {
  const prefersReducedMotion = useReducedMotion();

  // Skip WebGL animation entirely for reduced motion preference
  if (prefersReducedMotion) {
    return null;
  }

  // Use CSS centering identical to OrbitSystem emblem for pixel-perfect alignment
  // OrbitSystem uses: position: fixed, top: 50%, left: 50%, translate(-50%, -50%)
  return (
    <div
      className="pointer-events-none"
      style={{
        position: 'fixed',
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        width: `${sizeVmin}vmin`,
        height: `${sizeVmin}vmin`,
      }}
    >
      <Canvas
        dpr={[1, 2]}
        gl={{ antialias: true, alpha: true, powerPreference: 'high-performance' }}
        orthographic
        frameloop="demand"
        camera={{ position: [0, 0, 10], zoom: 100 }}
        onCreated={(state) => {
          state.invalidate();
        }}
        style={{ width: '100%', height: '100%' }}
      >
        {/* Iris shutter - exact SVG blade geometry with animation */}
        <IrisShutter progress={progress} sizeVmin={sizeVmin} />
      </Canvas>

      {/* Center "click" cue (subtle, barely visible) - overlaid on canvas */}
      <CenterDisc progress={progress} sizeVmin={sizeVmin} />
    </div>
  );
}
