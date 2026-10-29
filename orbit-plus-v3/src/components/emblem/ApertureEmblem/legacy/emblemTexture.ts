import * as THREE from 'three';
import { EMBLEM_PATHS } from '@/assets/emblemPaths';

export type EmblemTextureResult = {
  texture: THREE.CanvasTexture;
  center: { x: number; y: number }; // normalized UV center of the emblem content
};

/**
 * Creates a CanvasTexture from the emblem SVG paths and measures the
 * true emblem centroid (accounts for asymmetry).
 */
export async function createEmblemTexture(size = 2048): Promise<EmblemTextureResult> {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 588 588" width="${size}" height="${size}">
    <rect width="100%" height="100%" fill="transparent"/>
    <g fill="white">
      ${EMBLEM_PATHS.map((d) => `<path d="${d}"/>`).join('')}
    </g>
  </svg>`.trim();

  const img = new Image();
  img.decoding = 'async';
  img.src = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;

  await new Promise<void>((resolve, reject) => {
    img.onload = () => resolve();
    img.onerror = () => reject(new Error('Failed to load emblem SVG into Image()'));
  });

  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;

  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('No 2D canvas context available');

  ctx.clearRect(0, 0, size, size);
  ctx.drawImage(img, 0, 0, size, size);

  // Measure non-transparent pixels to find emblem center in UV space
  const data = ctx.getImageData(0, 0, size, size).data;
  let minX = size;
  let maxX = 0;
  let minY = size;
  let maxY = 0;
  let found = false;

  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const idx = (y * size + x) * 4;
      const alpha = data[idx + 3];
      if (alpha > 0) {
        found = true;
        if (x < minX) minX = x;
        if (x > maxX) maxX = x;
        if (y < minY) minY = y;
        if (y > maxY) maxY = y;
      }
    }
  }

  const centerPx = found
    ? {
        x: (minX + maxX) / 2,
        y: (minY + maxY) / 2,
      }
    : { x: size / 2, y: size / 2 };

  const center = { x: centerPx.x / size, y: centerPx.y / size };

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.wrapS = THREE.ClampToEdgeWrapping;
  tex.wrapT = THREE.ClampToEdgeWrapping;
  tex.minFilter = THREE.LinearMipmapLinearFilter;
  tex.magFilter = THREE.LinearFilter;
  tex.generateMipmaps = true;
  tex.needsUpdate = true;

  return { texture: tex, center };
}
