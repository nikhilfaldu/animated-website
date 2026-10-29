/**
 * TunnelInScene - Radial Extension & Convergence Animation
 *
 * CRITICAL: Uses BLADE_VERTICES mesh geometry—the single source of truth
 * for emblem shape. This ensures pixel-perfect matching with SVG emblem.
 *
 * DO NOT use shader-drawn lines or BLADE_CONFIGS approximations.
 * The emblem is made of 32 trapezoid blade shapes, not radial lines.
 *
 * Animation:
 * - Extension: Outer vertices push outward toward screen edges
 * - Convergence: Blades collapse inward toward center
 * - Inner vertices stay anchored during extension phase
 */

import { useRef, useMemo, useEffect, useState } from 'react';
import { useThree, invalidate } from '@react-three/fiber';
import { useTransform } from 'framer-motion';
import * as THREE from 'three';
import { useSceneVisibility } from '../useSceneVisibility';
import { SCROLL_RANGES } from '@/config/scrollRanges';
import { SVG_EMBLEM_HANDOFF, WEBGL_TUNNEL_HANDOFF } from '@/config/emblemConstants';
import { useOrbitSystem } from '@/context/OrbitSystem';
import { BLADE_VERTICES } from '@/components/emblem/ApertureEmblem/bladeVertices';
import { useOrbitEmblemRect } from '@/components/emblem/ApertureEmblem/useOrbitEmblemRect';

// ============================================================================
// BLADE GEOMETRY CALCULATIONS (from BLADE_VERTICES - source of truth)
// ============================================================================

/**
 * Pre-calculate the bounding box of all blade vertices.
 * Used for proper scaling to match SVG emblem size.
 */
const BLADE_BOUNDS = (() => {
  let minX = Infinity, maxX = -Infinity;
  let minY = Infinity, maxY = -Infinity;

  for (const blade of BLADE_VERTICES) {
    for (const v of blade) {
      minX = Math.min(minX, v.x);
      maxX = Math.max(maxX, v.x);
      minY = Math.min(minY, v.y);
      maxY = Math.max(maxY, v.y);
    }
  }

  return {
    minX,
    maxX,
    minY,
    maxY,
    width: maxX - minX,
    height: maxY - minY,
    centerX: (minX + maxX) / 2,
    centerY: (minY + maxY) / 2,
  };
})();

/**
 * The visual center of the inner circle (aperture).
 * Calculated from the midpoints of all inner edges.
 * This is what should align with viewport center for the color invert effect.
 */
const INNER_CIRCLE_CENTER = (() => {
  let sumX = 0, sumY = 0;
  for (const blade of BLADE_VERTICES) {
    // Inner vertices are v0 and v3
    const inner1 = blade[0];
    const inner2 = blade[3];
    sumX += (inner1.x + inner2.x) / 2;
    sumY += (inner1.y + inner2.y) / 2;
  }
  return {
    x: sumX / BLADE_VERTICES.length,
    y: sumY / BLADE_VERTICES.length,
  };
})();

/**
 * Get blade metadata for animation.
 * Vertices are wound: inner1 (v0), outer1 (v1), outer2 (v2), inner2 (v3)
 */
function getBladeMetadata(vertices: { x: number; y: number }[]) {
  const inner1 = vertices[0];
  const inner2 = vertices[3];
  const outer1 = vertices[1];
  const outer2 = vertices[2];

  // Inner edge midpoint (anchor during extension)
  const innerMidX = (inner1.x + inner2.x) / 2;
  const innerMidY = (inner1.y + inner2.y) / 2;

  // Outer edge midpoint
  const outerMidX = (outer1.x + outer2.x) / 2;
  const outerMidY = (outer1.y + outer2.y) / 2;

  // Direction from inner to outer (extension direction)
  const dirX = outerMidX - innerMidX;
  const dirY = outerMidY - innerMidY;
  const dirLen = Math.sqrt(dirX * dirX + dirY * dirY);
  const normDirX = dirX / dirLen;
  const normDirY = dirY / dirLen;

  // Blade angle from center
  const angle = Math.atan2(innerMidY, innerMidX);

  return {
    innerMidX,
    innerMidY,
    outerMidX,
    outerMidY,
    normDirX,
    normDirY,
    angle,
    originalLength: dirLen,
  };
}

// ============================================================================
// PHASE TIMING CONFIGURATION
// ============================================================================

const PHASES = {
  /**
   * Phase 1: Brightness ramp → Extension → Fly off
   *
   * Local progress 0.22 = global 0.202 = WEBGL_TUNNEL_HANDOFF.fadeEnd (full brightness)
   * Extension should only begin AFTER full brightness is reached
   *
   * Extended range (0-0.45) gives more time for deliberate, slow animation
   * tunnelIn range: 0.182-0.273 (0.091 total)
   * Phase 1 range: 0.182-0.223 (0.041 = 45% of tunnelIn)
   */
  phase1: { start: 0, end: 0.37 },
  /** Phase 2: SKIPPED - Sequential tunnel - blades extend then fly off with overlap */
  phase2: { start: 0.37, end: 0.37 }, // Zero duration = skipped
  /** Phase 3: Sequential burst - blades extend and STAY, white mask expands */
  phase3: { start: 0.37, end: 1.0 }, // Starts right after Phase 1 ends
} as const;

type AnimationPhase = 'phase1' | 'phase2' | 'phase3';

const BLADE_COUNT = 32;

/** Blade length in normalized units - used as standard length for Phase 2 tunnel */
const PHASE2_BLADE_LENGTH = 0.70;

/** Get current phase and progress within that phase */
function getPhaseInfo(localProgress: number): { phase: AnimationPhase; phaseProgress: number } {
  if (localProgress < PHASES.phase1.end) {
    return { phase: 'phase1', phaseProgress: localProgress / PHASES.phase1.end };
  }
  if (localProgress < PHASES.phase2.end) {
    const t = (localProgress - PHASES.phase2.start) / (PHASES.phase2.end - PHASES.phase2.start);
    return { phase: 'phase2', phaseProgress: t };
  }
  const t = (localProgress - PHASES.phase3.start) / (PHASES.phase3.end - PHASES.phase3.start);
  return { phase: 'phase3', phaseProgress: Math.min(1, t) };
}

/** Calculate per-blade state for Phase 2 (sequential tunnel) */
function getPhase2BladeState(phaseProgress: number, bladeIndex: number) {
  // Stagger timing: each blade starts slightly after the previous
  // With overlap, multiple blades are visible at once creating tunnel effect
  const overlap = 0.85; // 85% overlap - many blades visible at once for tunnel effect

  // Calculate timing so all 32 blades complete within phase
  // Total span = bladeWindow + (BLADE_COUNT - 1) * bladeStep = 1.0
  // bladeStep = bladeWindow * (1 - overlap)
  // bladeWindow * (1 + (BLADE_COUNT - 1) * (1 - overlap)) = 1.0
  const bladeWindow = 1 / (1 + (BLADE_COUNT - 1) * (1 - overlap));
  const bladeStep = bladeWindow * (1 - overlap);
  const bladeStart = bladeIndex * bladeStep;

  // Is this blade active yet?
  if (phaseProgress < bladeStart) {
    return { visible: false, extensionProgress: 0, travelProgress: 0 };
  }

  // Local progress within this blade's window
  const bladeLocalProgress = Math.min(1, (phaseProgress - bladeStart) / bladeWindow);

  // 50% extend, 50% travel - travel same speed as grow
  const extensionPhaseEnd = 0.5;

  if (bladeLocalProgress < extensionPhaseEnd) {
    const extensionProgress = bladeLocalProgress / extensionPhaseEnd;
    return { visible: true, extensionProgress, travelProgress: 0 };
  }

  const travelProgress = (bladeLocalProgress - extensionPhaseEnd) / (1 - extensionPhaseEnd);
  return { visible: true, extensionProgress: 1, travelProgress };
}

/** Calculate per-blade state for Phase 3 (sequential burst from center that stays) */
function getPhase3BladeState(phaseProgress: number, bladeIndex: number) {
  // Phase 3 timing: blades extend 0-0.7, white circle expands 0.7-1.0
  const bladePhaseEnd = 0.7;

  // Normalize progress for blade extension phase
  const bladePhaseProgress = Math.min(1, phaseProgress / bladePhaseEnd);

  // Stagger for wave effect - all 32 blades complete within blade phase
  const overlap = 0.90; // 90% overlap - almost simultaneous burst with subtle wave
  const bladeWindow = 1 / (1 + (BLADE_COUNT - 1) * (1 - overlap));
  const bladeStep = bladeWindow * (1 - overlap);
  const bladeStart = bladeIndex * bladeStep;

  if (bladePhaseProgress < bladeStart) {
    return { visible: false, extensionProgress: 0 };
  }

  const bladeLocalProgress = Math.min(1, (bladePhaseProgress - bladeStart) / bladeWindow);

  // Extend and stay - use ease-out for snappy extension
  const extensionProgress = 1 - Math.pow(1 - bladeLocalProgress, 2);
  return { visible: true, extensionProgress };
}

// ============================================================================
// BLADE MESH COMPONENT
// ============================================================================

interface BladeProps {
  vertices: { x: number; y: number }[];
  index: number;
  phase: AnimationPhase;
  phaseProgress: number;
  scale: number;
  maxExtension: number;
  opacity: number;
  revealHoleRadius: number;
}

function Blade({ vertices, index, phase, phaseProgress, scale, maxExtension, opacity, revealHoleRadius }: BladeProps) {
  const meshRef = useRef<THREE.Mesh>(null);
  const geometryRef = useRef<THREE.BufferGeometry>(null);

  const metadata = useMemo(() => getBladeMetadata(vertices), [vertices]);

  // Update geometry based on current phase
  useEffect(() => {
    if (!geometryRef.current) return;

    const geo = geometryRef.current;
    const positions = geo.attributes.position.array as Float32Array;

    // Original vertices (scaled) - NEVER change blade shape
    const v0 = { x: vertices[0].x * scale, y: vertices[0].y * scale }; // inner1
    const v1 = { x: vertices[1].x * scale, y: vertices[1].y * scale }; // outer1
    const v2 = { x: vertices[2].x * scale, y: vertices[2].y * scale }; // outer2
    const v3 = { x: vertices[3].x * scale, y: vertices[3].y * scale }; // inner2

    let finalV0 = v0;
    let finalV1 = v1;
    let finalV2 = v2;
    let finalV3 = v3;

    if (phase === 'phase1') {
      // PHASE 1: First extend blades to viewport edge, then fly OFF screen
      // At handoff (phaseProgress=0): blades are in normal state matching SVG
      // Brief hold at start for emblem to reach full brightness
      // Then extend blades outward toward viewport edge
      // Finally fly off screen

      // Hold period: blades stay at normal state while opacity ramps to full
      // Hold until AFTER full brightness is reached
      // Full brightness at localProgress 0.22, Phase 1 ends at 0.45
      // phaseProgress 0.50 = localProgress 0.50 * 0.45 = 0.225 (just past full brightness)
      const holdEnd = 0.50; // Hold for first 50% of phase (until bright)

      if (phaseProgress >= holdEnd) {
        // Adjust progress to account for hold period
        const adjustedProgress = (phaseProgress - holdEnd) / (1 - holdEnd);

        // Slower stagger for more deliberate sequential effect
        const stagger = 0.35;
        const bladeOffset = (index / BLADE_COUNT) * stagger;
        const bladeProgress = Math.max(0, Math.min(1, (adjustedProgress - bladeOffset) / (1 - stagger)));

        // Longer extension phase (0-0.65) before fly phase (0.65-1.0)
        const extensionPhaseEnd = 0.65;

        if (bladeProgress < extensionPhaseEnd) {
          // EXTENSION: Outer vertices push outward, inner stay anchored
          const extensionProgress = bladeProgress / extensionPhaseEnd;
          const eased = 1 - Math.pow(1 - extensionProgress, 3); // ease-out
          const extOffset = eased * maxExtension;

          finalV0 = v0; // Inner anchored
          finalV3 = v3; // Inner anchored
          finalV1 = {
            x: v1.x + metadata.normDirX * extOffset,
            y: v1.y + metadata.normDirY * extOffset,
          };
          finalV2 = {
            x: v2.x + metadata.normDirX * extOffset,
            y: v2.y + metadata.normDirY * extOffset,
          };
        } else {
          // FLY OFF: Entire blade translates outward
          const flyProgress = (bladeProgress - extensionPhaseEnd) / (1 - extensionPhaseEnd);
          const eased = flyProgress * flyProgress; // ease-in for acceleration

          // Start from fully extended position
          const fullExtension = maxExtension;
          const travelDistance = eased * maxExtension * 1.5; // Travel beyond edge

          finalV0 = {
            x: v0.x + metadata.normDirX * travelDistance,
            y: v0.y + metadata.normDirY * travelDistance,
          };
          finalV1 = {
            x: v1.x + metadata.normDirX * (fullExtension + travelDistance),
            y: v1.y + metadata.normDirY * (fullExtension + travelDistance),
          };
          finalV2 = {
            x: v2.x + metadata.normDirX * (fullExtension + travelDistance),
            y: v2.y + metadata.normDirY * (fullExtension + travelDistance),
          };
          finalV3 = {
            x: v3.x + metadata.normDirX * travelDistance,
            y: v3.y + metadata.normDirY * travelDistance,
          };
        }
      }
      // else: phaseProgress < holdEnd, blades stay at normal position (finalV0-3 = v0-3)

    } else if (phase === 'phase2') {
      // PHASE 2: Sequential tunnel - extend from inner circle to blade-30 length, then fly off
      const bladeState = getPhase2BladeState(phaseProgress, index);

      if (!bladeState.visible) {
        // Not visible yet - collapse to degenerate point
        finalV0 = finalV1 = finalV2 = finalV3 = { x: 0, y: 0 };
      } else {
        const { extensionProgress, travelProgress } = bladeState;

        // Blade extends from inner circle edge outward to blade-30 length
        // extensionProgress: 0 = blade at inner circle (no extension), 1 = blade-30 length
        // travelProgress: 0 = in place, 1 = flown off screen

        // Blade grows FROM inner circle edge (not from original blade position)
        // At extensionProgress = 0: outer vertices collapsed to inner vertices (blade is a line)
        // At extensionProgress = 1: blade has grown to PHASE2_BLADE_LENGTH
        const bladeExtension = extensionProgress * PHASE2_BLADE_LENGTH * scale;

        // Travel offset: entire blade moves outward after reaching full extension
        // Reduced multiplier (0.6) for slower, more deliberate travel that matches extension speed
        const travelOffset = travelProgress * maxExtension * 0.6;

        // Inner vertices stay at original position, then travel outward
        finalV0 = {
          x: v0.x + metadata.normDirX * travelOffset,
          y: v0.y + metadata.normDirY * travelOffset,
        };
        finalV3 = {
          x: v3.x + metadata.normDirX * travelOffset,
          y: v3.y + metadata.normDirY * travelOffset,
        };

        // Outer vertices START at inner edge (collapsed) and grow outward
        // v1 starts at v0's position, v2 starts at v3's position
        // They extend outward by bladeExtension along the blade direction
        finalV1 = {
          x: v0.x + metadata.normDirX * (bladeExtension + travelOffset),
          y: v0.y + metadata.normDirY * (bladeExtension + travelOffset),
        };
        finalV2 = {
          x: v3.x + metadata.normDirX * (bladeExtension + travelOffset),
          y: v3.y + metadata.normDirY * (bladeExtension + travelOffset),
        };
      }

    } else if (phase === 'phase3') {
      // PHASE 3: Blades grow from VIEWPORT CENTER to viewport edge and STAY
      const bladeState = getPhase3BladeState(phaseProgress, index);

      if (!bladeState.visible) {
        // Not visible yet - collapsed at center
        finalV0 = finalV1 = finalV2 = finalV3 = { x: 0, y: 0 };
      } else {
        const { extensionProgress } = bladeState;

        // Half-width vectors to maintain blade width throughout
        const innerHalfWidthX = (v0.x - v3.x) / 2;
        const innerHalfWidthY = (v0.y - v3.y) / 2;
        const outerHalfWidthX = (v1.x - v2.x) / 2;
        const outerHalfWidthY = (v1.y - v2.y) / 2;

        // Outer edge extends from center to viewport edge
        const outerExtension = extensionProgress * maxExtension;

        // During reveal phase, the expanding hole clips the blades
        // Inner edge is pushed outward to match the hole radius
        const innerRadius = revealHoleRadius > 0 ? revealHoleRadius : 0;

        // If the hole has expanded past the outer edge, blade is fully clipped
        if (innerRadius >= outerExtension) {
          finalV0 = finalV1 = finalV2 = finalV3 = { x: 0, y: 0 };
        } else {
          // Inner edge follows the expanding hole (or stays at center if no reveal yet)
          const innerMidX = metadata.normDirX * innerRadius;
          const innerMidY = metadata.normDirY * innerRadius;

          finalV0 = { x: innerMidX + innerHalfWidthX, y: innerMidY + innerHalfWidthY };
          finalV3 = { x: innerMidX - innerHalfWidthX, y: innerMidY - innerHalfWidthY };

          // Outer edge at full extension
          const outerMidX = metadata.normDirX * outerExtension;
          const outerMidY = metadata.normDirY * outerExtension;

          finalV1 = { x: outerMidX + outerHalfWidthX, y: outerMidY + outerHalfWidthY };
          finalV2 = { x: outerMidX - outerHalfWidthX, y: outerMidY - outerHalfWidthY };
        }
      }
    }

    // Triangle 1: v0, v1, v2
    positions[0] = finalV0.x; positions[1] = finalV0.y; positions[2] = 0;
    positions[3] = finalV1.x; positions[4] = finalV1.y; positions[5] = 0;
    positions[6] = finalV2.x; positions[7] = finalV2.y; positions[8] = 0;

    // Triangle 2: v0, v2, v3
    positions[9] = finalV0.x; positions[10] = finalV0.y; positions[11] = 0;
    positions[12] = finalV2.x; positions[13] = finalV2.y; positions[14] = 0;
    positions[15] = finalV3.x; positions[16] = finalV3.y; positions[17] = 0;

    geo.attributes.position.needsUpdate = true;
    geo.computeBoundingSphere();
  }, [vertices, scale, phase, phaseProgress, maxExtension, metadata, index, revealHoleRadius]);

  // Create initial geometry
  const initialGeometry = useMemo(() => {
    const geo = new THREE.BufferGeometry();
    const positions = new Float32Array(18); // 6 vertices * 3 components

    // Initial positions (will be updated by effect)
    const v0 = { x: vertices[0].x * scale, y: vertices[0].y * scale };
    const v1 = { x: vertices[1].x * scale, y: vertices[1].y * scale };
    const v2 = { x: vertices[2].x * scale, y: vertices[2].y * scale };
    const v3 = { x: vertices[3].x * scale, y: vertices[3].y * scale };

    // Triangle 1
    positions[0] = v0.x; positions[1] = v0.y; positions[2] = 0;
    positions[3] = v1.x; positions[4] = v1.y; positions[5] = 0;
    positions[6] = v2.x; positions[7] = v2.y; positions[8] = 0;

    // Triangle 2
    positions[9] = v0.x; positions[10] = v0.y; positions[11] = 0;
    positions[12] = v2.x; positions[13] = v2.y; positions[14] = 0;
    positions[15] = v3.x; positions[16] = v3.y; positions[17] = 0;

    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    return geo;
  }, [vertices, scale]);

  return (
    <mesh ref={meshRef}>
      <bufferGeometry ref={geometryRef} attach="geometry" {...initialGeometry} />
      <meshBasicMaterial color="#ffffff" side={THREE.DoubleSide} transparent opacity={opacity} />
    </mesh>
  );
}

// ============================================================================
// MAIN SCENE COMPONENT
// ============================================================================

export function TunnelInScene() {
  const { scrollProgress } = useOrbitSystem();

  // Extended visibility range for seamless SVG→WebGL crossfade
  // Scene needs to render when SVG starts fading so WebGL can fade in simultaneously
  // SVG fadeStart is when crossfade begins (~0.148)
  const extendedRange = useMemo(() => ({
    start: SVG_EMBLEM_HANDOFF.fadeStart - 0.01, // Start rendering just before crossfade
    end: SCROLL_RANGES.tunnelIn.end,
  }), []);

  const { visible } = useSceneVisibility(scrollProgress, extendedRange);

  // Animation progress based on original tunnelIn range (not extended visibility range)
  // This keeps tunnel animation timing correct while allowing early visibility for handoff
  const localProgress = useTransform(
    scrollProgress,
    [SCROLL_RANGES.tunnelIn.start, SCROLL_RANGES.tunnelIn.end],
    [0, 1]
  );

  const { size } = useThree();

  // Measure actual SVG emblem for size matching
  const orbitRect = useOrbitEmblemRect();

  // Track window size
  const [windowSize, setWindowSize] = useState(() => ({
    width: typeof window !== 'undefined' ? window.innerWidth : 1920,
    height: typeof window !== 'undefined' ? window.innerHeight : 1080,
  }));

  useEffect(() => {
    const handleResize = () => {
      setWindowSize({ width: window.innerWidth, height: window.innerHeight });
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Animation state - phase based
  const [currentPhase, setCurrentPhase] = useState<AnimationPhase>('phase1');
  const [phaseProgress, setPhaseProgress] = useState(0);

  // Scene opacity for crossfade with SVG emblem
  // Uses WEBGL_TUNNEL_HANDOFF for proper timing coordination
  //
  // Timeline (from emblemConstants.ts):
  // - SVG fadeStart (~0.148): SVG begins fading from 0.06
  // - WEBGL fadeStart (~0.165): WebGL begins appearing (50% through SVG fade)
  // - SVG fadeEnd (~0.182): SVG fully hidden, WebGL at crossfade level
  // - WEBGL fadeEnd (~0.202): WebGL at full brightness
  //
  // This timing ensures WebGL is at full brightness BEFORE blade extension begins
  const sceneOpacity = useTransform(
    scrollProgress,
    [SVG_EMBLEM_HANDOFF.fadeStart, WEBGL_TUNNEL_HANDOFF.fadeStart, WEBGL_TUNNEL_HANDOFF.fadeEnd],
    [0, 0.06, 1]
  );

  // Initialize opacity with current sceneOpacity value, then subscribe to changes
  const [opacity, setOpacity] = useState(() => {
    const initial = sceneOpacity.get();
    return Math.max(0, Math.min(1, initial));
  });

  useEffect(() => {
    // Set initial value in case it changed between useState and useEffect
    setOpacity(Math.max(0, Math.min(1, sceneOpacity.get())));

    const unsubscribe = sceneOpacity.on('change', (v) => {
      setOpacity(Math.max(0, Math.min(1, v)));
      invalidate();
    });
    return unsubscribe;
  }, [sceneOpacity]);

  // Update animation from scroll - phase based
  useEffect(() => {
    const unsubscribe = localProgress.on('change', (value) => {
      const clamped = Math.max(0, Math.min(1, value));
      const { phase, phaseProgress: progress } = getPhaseInfo(clamped);
      setCurrentPhase(phase);
      setPhaseProgress(progress);
      invalidate();
    });
    return unsubscribe;
  }, [localProgress]);

  // Calculate scale to match SVG emblem size
  // useOrbitEmblemRect() uses getBoundingClientRect() which INCLUDES CSS transforms
  // So orbitRect already reflects the scroll-driven scale - no need to multiply again
  // With orthographic camera zoom=100: 1 world unit = 100 pixels
  const finalScale = useMemo(() => {
    const bladeSpan = Math.max(BLADE_BOUNDS.width, BLADE_BOUNDS.height);
    
    if (!orbitRect) {
      // Fallback based on typical emblem size at handoff (~56vmin * 4x scale)
      const vminPx = Math.min(windowSize.width, windowSize.height);
      const targetPx = vminPx * 0.56 * 4; // Base size * expected scale at handoff
      return targetPx / (100 * bladeSpan);
    }

    // Match measured SVG size exactly (already includes CSS transform scale)
    const targetPx = Math.max(orbitRect.width, orbitRect.height);
    return targetPx / (100 * bladeSpan);
  }, [orbitRect, windowSize]);

  // Max extension distance (reach past screen corners)
  const maxExtension = useMemo(() => {
    const diagonal = Math.sqrt(
      Math.pow(windowSize.width / 100, 2) +
      Math.pow(windowSize.height / 100, 2)
    );
    return diagonal * 1.5;
  }, [windowSize]);

  // Background color stays dark
  const bgColor = '#0a0a0a';

  // Phase 3 reveal: expanding hole in center after blades finish extending
  // This creates a transparent center that reveals Services below
  const revealHoleRadius = useMemo(() => {
    const revealStart = 0.68;
    if (currentPhase !== 'phase3' || phaseProgress <= revealStart) return 0;
    // Map revealStart-1.0 to 0-1, then ease in/out for a longer, smoother reveal
    const revealProgress = Math.min(1, (phaseProgress - revealStart) / (1 - revealStart));
    const eased = revealProgress < 0.5
      ? 4 * revealProgress * revealProgress * revealProgress
      : 1 - Math.pow(-2 * revealProgress + 2, 3) / 2;
    return eased * maxExtension * 0.5; // Much slower expansion
  }, [currentPhase, phaseProgress, maxExtension]);

  // Center the inner circle of the WebGL emblem at viewport center
  // The INNER_CIRCLE_CENTER offset accounts for the emblem's geometric offset
  const centerOffsetX = -INNER_CIRCLE_CENTER.x * finalScale;
  const centerOffsetY = -INNER_CIRCLE_CENTER.y * finalScale;

  if (!visible) return null;

  // In Phase 3, everything should be fully opaque for clean white blades
  const phase3Opacity = currentPhase === 'phase3' ? 1 : opacity;

  return (
    <group position={[centerOffsetX, centerOffsetY, 0]} renderOrder={1}>
      {/* Background: solid plane, or ring with expanding hole during reveal */}
      {revealHoleRadius > 0 ? (
        <mesh position={[0, 0, -1]} renderOrder={0}>
          <ringGeometry args={[revealHoleRadius, maxExtension * 3, 64]} />
          <meshBasicMaterial
            color={bgColor}
            opacity={phase3Opacity}
            transparent
          />
        </mesh>
      ) : (
        <mesh position={[0, 0, -1]} renderOrder={0}>
          <planeGeometry args={[size.width / 50, size.height / 50]} />
          <meshBasicMaterial
            color={bgColor}
            opacity={phase3Opacity}
            transparent
          />
        </mesh>
      )}

      {/* Blade meshes */}
      <group>
        {BLADE_VERTICES.map((vertices, index) => (
          <Blade
            key={index}
            vertices={vertices}
            index={index}
            phase={currentPhase}
            phaseProgress={phaseProgress}
            scale={finalScale}
            maxExtension={maxExtension}
            opacity={phase3Opacity}
            revealHoleRadius={revealHoleRadius}
          />
        ))}
      </group>
    </group>
  );
}
