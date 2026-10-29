import { type MotionValue, useTransform } from 'framer-motion';
import {
  BRIDGE_GLOBAL_START,
  BRIDGE_CLICK_LOCAL_START,
  BRIDGE_CLICK_LOCAL_END,
  BRIDGE_MORPH_START,
  BRIDGE_MORPH_END,
  BRIDGE_FADE_OUT_END,
} from './bridgeConstants';
import { SCROLL_RANGES, getLocalProgress } from '@/config/scrollRanges';

function clamp01(n: number) {
  return Math.max(0, Math.min(1, n));
}

/**
 * Transforms global scrollProgress into three derived MotionValues
 * for controlling the bridge overlay animation phases.
 */
export function useBridgeProgress(globalProgress: MotionValue<number>) {
  const localReveal = useTransform(globalProgress, (v) =>
    clamp01(getLocalProgress(v, SCROLL_RANGES.reveal))
  );

  // sequence: 0..1 across the 4-click aperture sequence (local to Reveal)
  const sequence = useTransform(localReveal, (v) => {
    const p = (v - BRIDGE_CLICK_LOCAL_START) /
      (BRIDGE_CLICK_LOCAL_END - BRIDGE_CLICK_LOCAL_START);
    return clamp01(p);
  });

  // morph: ramp from 0 to 1 during 0.80-0.86 (windows move to card positions)
  const morph = useTransform(globalProgress, (v) => {
    const p = (v - BRIDGE_MORPH_START) / (BRIDGE_MORPH_END - BRIDGE_MORPH_START);
    return clamp01(p);
  });

  // opacity: 1 until morph completes, then fade to 0 by fade-out end
  const opacity = useTransform(globalProgress, (v) => {
    if (v < BRIDGE_GLOBAL_START) return 0;
    const fadeInEnd = BRIDGE_GLOBAL_START + 0.015;
    if (v < fadeInEnd) {
      return clamp01((v - BRIDGE_GLOBAL_START) / (fadeInEnd - BRIDGE_GLOBAL_START));
    }
    if (v < BRIDGE_MORPH_END) return 1;
    const p = (v - BRIDGE_MORPH_END) / (BRIDGE_FADE_OUT_END - BRIDGE_MORPH_END);
    return 1 - clamp01(p);
  });

  return { sequence, morph, opacity };
}
