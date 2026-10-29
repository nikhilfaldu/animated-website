import { useEffect, useMemo, useState } from 'react';
import type { Rect } from './bridgeTypes';

/**
 * Hook to measure Work card bounding boxes for the bridge overlay.
 * Only measures while bridge is active for performance optimization.
 */
export function useWorkCardRects(projectIds: string[], active: boolean) {
  const [rects, setRects] = useState<Record<string, Rect>>({});
  const [ready, setReady] = useState(false);

  const ids = useMemo(() => projectIds.slice(0, 4), [projectIds]);

  useEffect(() => {
    if (!active) return;
    if (!ids.length) return;

    let raf = 0;

    function measure() {
      const next: Record<string, Rect> = {};

      for (const id of ids) {
        const el = document.getElementById(`work-card-${id}`);
        if (!el) continue;
        const b = el.getBoundingClientRect();

        next[id] = {
          x: b.left,
          y: b.top,
          w: b.width,
          h: b.height,
          r: 16, // Matches Work card border-radius
        };
      }

      setRects(next);
      setReady(ids.every((id) => !!next[id]));
    }

    const measureSoon = () => {
      if (raf) cancelAnimationFrame(raf);
      raf = requestAnimationFrame(measure);
    };

    const run = async () => {
      // Wait for fonts to prevent layout shifts
      if ('fonts' in document) {
        try {
          await document.fonts.ready;
        } catch {
          // Ignore font loading errors
        }
      }
      measureSoon();
    };

    run();

    // Watch for layout changes
    const ro = new ResizeObserver(() => measureSoon());
    ro.observe(document.documentElement);

    window.addEventListener('resize', measureSoon);
    window.addEventListener('scroll', measureSoon, { passive: true });

    return () => {
      if (raf) cancelAnimationFrame(raf);
      ro.disconnect();
      window.removeEventListener('resize', measureSoon);
      window.removeEventListener('scroll', measureSoon);
    };
  }, [ids, active]);

  return { rects, ready };
}
