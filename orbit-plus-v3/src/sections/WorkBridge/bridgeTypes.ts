/**
 * Type definitions for the WorkBridge exposure windows system.
 */

export type ProjectPreview = {
  id: string;
  previewImageUrl: string;
  previewFocalPoint?: string;
  logoUrl: string;
};

export type Rect = {
  x: number;
  y: number;
  w: number;
  h: number;
  r: number;
};
