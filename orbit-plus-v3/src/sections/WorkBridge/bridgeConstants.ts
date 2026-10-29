/**
 * Global scroll timing constants for the WorkBridge overlay.
 * These values drive the aperture "clicks" and morph into the Work grid.
 */

import { SCROLL_RANGES } from '@/config/scrollRanges';

// GLOBAL scroll values (0..1), aligned to Reveal start and early Work
export const BRIDGE_GLOBAL_START = SCROLL_RANGES.reveal.start;

// Local Reveal progress (0..1) window for click sequence
export const BRIDGE_CLICK_LOCAL_START = 0.06;
export const BRIDGE_CLICK_LOCAL_END = 0.92;

export const BRIDGE_MORPH_START = SCROLL_RANGES.work.start;
export const BRIDGE_MORPH_END = SCROLL_RANGES.work.start + 0.07;    // Windows aligned with cards

export const BRIDGE_FADE_OUT_END = SCROLL_RANGES.work.start + 0.1;  // Overlay fades out
