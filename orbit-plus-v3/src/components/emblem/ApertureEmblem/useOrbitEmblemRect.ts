import { useEffect, useState } from 'react';

/**
 * Rect representing the OrbitSystem emblem's position and size in pixels.
 */
export type OrbitRect = {
  x: number;
  y: number;
  width: number;
  height: number;
} | null;

/**
 * Hook to measure the OrbitSystem emblem's rendered DOM bounding box.
 * Used to size the WebGL plane for pixel-perfect handoff alignment.
 *
 * Requires the OrbitSystem emblem container to have data-orbit-emblem-container="true" attribute.
 * We measure the container (not the SVG) because the SVG has overflow:visible which
 * expands its bounding box beyond the actual emblem dimensions.
 */
export function useOrbitEmblemRect(): OrbitRect {
  const [rect, setRect] = useState<OrbitRect>(null);

  useEffect(() => {
    const measure = () => {
      const el = document.querySelector('[data-orbit-emblem-container="true"]') as HTMLElement | null;
      if (!el) return;
      const r = el.getBoundingClientRect();
      setRect({ x: r.left, y: r.top, width: r.width, height: r.height });
    };

    measure();
    window.addEventListener('resize', measure);
    return () => window.removeEventListener('resize', measure);
  }, []);

  return rect;
}
