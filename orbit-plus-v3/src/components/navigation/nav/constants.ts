export const NAV_MORPH_V2 = true;

export const CYL_PANEL_SIZE = 40;
export const CYL_ITEM_COUNT = 8;
export const CYL_RADIUS = Math.round(
  CYL_PANEL_SIZE / 2 / Math.tan(Math.PI / CYL_ITEM_COUNT)
);

export const MORPH_DURATION_MS = 1400; // slowed slightly for smoother morph
export const MORPH_PERSIST_BEAT_MS = 140;
export const FADE_DURATION_MS = 120;
export const RADIAL_STAGGER_MS = 16;
export const RADIAL_GROW_SCALE = 2.0;
export const ANIMATED_RADIALS_COUNT = 16;
