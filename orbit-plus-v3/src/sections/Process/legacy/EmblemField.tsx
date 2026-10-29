/**
 * EmblemField Component
 *
 * Pinned layer (z-10) displaying the gear background SVG with scroll-driven rotation.
 * Uses a custom-designed SVG for precise gear positioning.
 * Each gear group rotates based on scroll progress.
 *
 * Performance: CSS transforms for rotation, GPU-accelerated.
 * Accessibility: Decorative layer with aria-hidden.
 */

import { memo, useRef, useEffect } from 'react';
import { type MotionValue, useMotionValueEvent } from 'framer-motion';
import gearBackgroundRaw from '@assets/gearbackground.svg?raw';
import mobileGearBackgroundRaw from '@assets/mobile_gearbackground.svg?raw';
import { useReducedMotion } from '@hooks/useReducedMotion';
import { useIsMobile } from '@/hooks/useResponsive';
import { ROTATION_PER_SCROLL } from './processData';

interface EmblemFieldProps {
  // Section scroll progress (0-1)
  scrollProgress: MotionValue<number>;
}

// Warm metallic accent palette
// Hero gears get amber/copper tints, others stay white at varying opacities
const ACCENT_GEARS = [3, 7, 11, 15, 19, 23, 27]; // Select gears for accent color
const ACCENT_COLOR = '#C9A227'; // Warm amber/gold
const ACCENT_COLOR_ALT = '#B87333'; // Copper for variety

// Base styles for SVG with color variations
const generateBaseStyles = (): string => {
  const styles: string[] = [];

  // Default all shapes to white
  styles.push(`
    [data-gear-bg] svg path,
    [data-gear-bg] svg polygon,
    [data-gear-bg] svg rect,
    [data-gear-bg] svg circle {
      fill: white !important;
      stroke: white !important;
      transition: fill 0.3s ease, stroke 0.3s ease;
    }
  `);

  // Apply accent colors to hero gears
  for (let i = 2; i <= 28; i++) {
    const isAccent = ACCENT_GEARS.includes(i);
    const useAltColor = i % 4 === 3; // Alternate between amber and copper

    if (isAccent) {
      const color = useAltColor ? ACCENT_COLOR_ALT : ACCENT_COLOR;
      styles.push(`
        #Layer_1-2-${i} path,
        #Layer_1-2-${i} polygon,
        #Layer_1-2-${i} rect,
        #Layer_1-2-${i} circle {
          fill: ${color} !important;
          stroke: ${color} !important;
        }
      `);
    }
  }

  return styles.join('\n');
};

// Generate CSS for gear rotations
// Alternating directions, varying speeds
const generateGearStyles = (progress: number, reducedMotion: boolean): string => {
  const styles: string[] = [generateBaseStyles()];

  if (reducedMotion) return styles.join('\n');

  // Gears 2-28 (skipping Layer_1 and Layer_1-2 which are containers)
  for (let i = 2; i <= 28; i++) {
    const direction = i % 2 === 0 ? 1 : -1; // Alternate CW/CCW
    const speed = 0.5 + (i % 5) * 0.2; // Varying speeds: 0.5, 0.7, 0.9, 1.1, 1.3
    const rotation = progress * ROTATION_PER_SCROLL * speed * direction;
    // transform-box: fill-box makes transform-origin relative to element's bounding box
    styles.push(`#Layer_1-2-${i} { transform-box: fill-box; transform-origin: center center; transform: rotate(${rotation}deg); }`);
  }
  return styles.join('\n');
};

export const EmblemField = memo(function EmblemField({
  scrollProgress,
}: EmblemFieldProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const styleRef = useRef<HTMLStyleElement | null>(null);
  const reducedMotion = useReducedMotion();
  const isMobile = useIsMobile();

  // Create style element on mount
  useEffect(() => {
    const style = document.createElement('style');
    style.setAttribute('data-gear-rotation', 'true');
    document.head.appendChild(style);
    styleRef.current = style;

    return () => {
      style.remove();
    };
  }, []);

  // Update rotation based on scroll progress
  useMotionValueEvent(scrollProgress, 'change', (progress) => {
    if (styleRef.current) {
      styleRef.current.textContent = generateGearStyles(progress, reducedMotion);
    }
  });

  return (
    <div
      ref={containerRef}
      className="sticky top-0 left-0 w-full h-screen pointer-events-none overflow-hidden"
      style={{ zIndex: 10 }}
      aria-hidden="true"
    >
      {/* Gear background SVG - custom designed layout with scroll rotation */}
      {/* Uses slice preserveAspectRatio to ensure full viewport coverage */}
      {/* Mobile uses a separate SVG with more/smaller gears optimized for the cutout */}
      <div
        data-gear-bg
        className="absolute inset-0 w-full h-full [&>svg]:w-full [&>svg]:h-full [&>svg]:object-cover"
        style={{ opacity: 0.3 }}
        dangerouslySetInnerHTML={{
          __html: (isMobile ? mobileGearBackgroundRaw : gearBackgroundRaw).replace(
            /viewBox="([^"]+)"/,
            'viewBox="$1" preserveAspectRatio="xMidYMid slice"'
          )
        }}
      />
    </div>
  );
});
