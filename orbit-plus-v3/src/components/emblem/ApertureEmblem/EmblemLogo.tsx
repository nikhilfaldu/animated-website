import { useMemo, useEffect, useState } from 'react';
import * as THREE from 'three';
import { useThree } from '@react-three/fiber';
import { EMBLEM_PATHS } from '@assets/emblemPaths';

interface EmblemLogoProps {
  /** Scale factor relative to viewport (default 0.8) */
  scale?: number;
}

/**
 * Build SVG string from EMBLEM_PATHS array
 */
function buildSvgString(paths: readonly string[]): string {
  const body = paths
    .map((d) => `<path d="${d}" fill="none" stroke="#ffffff" stroke-width="8" />`)
    .join('');
  return `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 588 588" width="1024" height="1024">
      ${body}
    </svg>
  `;
}

/**
 * Create a texture from SVG paths rendered to canvas
 */
async function createEmblemTexture(): Promise<THREE.Texture> {
  const size = 1024;
  const svgString = buildSvgString(EMBLEM_PATHS);

  // Create blob URL from SVG
  const blob = new Blob([svgString], { type: 'image/svg+xml' });
  const url = URL.createObjectURL(blob);

  // Load image
  const img = new Image();
  img.src = url;
  await img.decode();

  // Draw to canvas
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d')!;
  ctx.drawImage(img, 0, 0, size, size);

  // Clean up blob URL
  URL.revokeObjectURL(url);

  // Create texture
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.wrapS = THREE.ClampToEdgeWrapping;
  texture.wrapT = THREE.ClampToEdgeWrapping;
  texture.minFilter = THREE.LinearMipmapLinearFilter;
  texture.magFilter = THREE.LinearFilter;
  texture.generateMipmaps = true;
  texture.needsUpdate = true;

  return texture;
}

/**
 * EmblemLogo - Renders the emblem as a textured plane.
 *
 * Uses canvas-based texture rendering for the stroke-based SVG paths,
 * which can't be converted to filled shapes via SVGLoader.
 */
export function EmblemLogo({ scale: targetScale = 0.8 }: EmblemLogoProps) {
  const { viewport, invalidate } = useThree();
  const [texture, setTexture] = useState<THREE.Texture | null>(null);

  // Load texture on mount
  useEffect(() => {
    let mounted = true;

    createEmblemTexture()
      .then((tex) => {
        if (mounted) {
          setTexture(tex);
          invalidate();
        }
      })
      .catch((err) => {
        console.error('Failed to create emblem texture:', err);
      });

    return () => {
      mounted = false;
    };
  }, [invalidate]);

  // Calculate plane size to fit viewport
  const planeSize = useMemo(() => {
    const viewportMin = Math.min(viewport.width, viewport.height);
    return viewportMin * targetScale;
  }, [viewport.width, viewport.height, targetScale]);

  if (!texture) {
    return null; // Don't render until texture is ready
  }

  return (
    <mesh position={[0, 0, 0]}>
      <planeGeometry args={[planeSize, planeSize]} />
      <meshBasicMaterial
        map={texture}
        transparent
        side={THREE.DoubleSide}
        depthWrite={false}
      />
    </mesh>
  );
}
