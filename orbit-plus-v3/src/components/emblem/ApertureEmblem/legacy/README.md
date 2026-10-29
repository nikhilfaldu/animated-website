# Legacy Files - DO NOT USE

These files are deprecated and kept for reference only.

## Why these files are deprecated:

### Original Instanced Blade Approach (Dec 2024)
- `AperturePlane.tsx` - 32-instance blade quads with vertex shader transforms
- `apertureShader.ts` - Vertex shader for instance transforms
- `useApertureUniforms.ts` - Uniform management for instance approach
- `emblemTexture.ts` - Texture loading (moved to EmblemLogo.tsx)

**Problem**: Center offset issues, complex instance management, didn't achieve desired mechanical shutter feel.

### Polar Coordinate Mask Approach (Dec 2024)
- `IrisOverlay.tsx` - Fullscreen quad with shaped mask shader
- `irisShader.ts` - Fragment shader polar coordinate N-gon mask
- `useIrisUniforms.ts` - Uniform management for mask shader

**Problem**: This was just a shaped polygon hole that grew/shrank - NOT a real camera iris animation with individual rotating blades.

## Current Implementation

The current implementation uses actual blade geometry that rotates:
- `IrisShutter.tsx` - Assembles blades with spring-smoothed animation
- `IrisBlade.tsx` - Individual blade components that rotate around pivot points
- `createBladeGeometry.ts` - Creates curved trapezoid blade mesh geometry
