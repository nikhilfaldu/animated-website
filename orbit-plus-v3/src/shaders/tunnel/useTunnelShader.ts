import * as THREE from 'three'
import { tunnelVertex, tunnelFragmentBase } from './tunnelShaders.ts'
export const tunnelFragment = tunnelFragmentBase

export interface UseTunnelShaderParams { reduced: boolean; maskUrl?: string }

/**
 * Modular shader organization and runtime uniform validation follow best practices for maintainability and debugging:
 * - Modular shader code: https://threejs.org/docs/#api/en/materials/ShaderMaterial, https://github.com/pmndrs/react-three-fiber/discussions/2192
 * - Runtime uniform validation: https://toji.dev/webgpu-best-practices/#validation, https://webglfundamentals.org/webgl/lessons/webgl-shaders-and-glsl.html#debugging-shaders
 */
export function useTunnelShader({ reduced, maskUrl }: UseTunnelShaderParams){
  // Fallback 1x1 white texture if mask fails to load (avoids WebGL warnings & conditionals in shader path)
  const fallback = useSingletonFallbackTexture();
  const loader = new THREE.TextureLoader();
  const maskTex = maskUrl ? loader.load(maskUrl, t => { t.wrapS = t.wrapT = THREE.ClampToEdgeWrapping; }) : fallback;
  // Define expected uniform ranges for runtime assertion
  const uniformRanges: Record<string, [number, number]> = {
    uProgress: [-0.05, 1.05],
    uChromaBase: [-0.01, 1.10],
    uGrainBase: [-0.01, 1.10],
    uFadeToWhite: [-0.01, 1.05],
    uSvgMix: [-0.01, 1.05],
  };
  const uniforms = {
    uResolution: { value: new THREE.Vector2(1,1) },
    uTime: { value: 0 },
    uProgress: { value: 0 },
    uVelocity: { value: 0 },
    uChromaBase: { value: 0 },
    uGrainBase: { value: 0 },
    uFadeToWhite: { value: 0 },
    uSvgMix: { value: 0 },
    uReduced: { value: reduced ? 1 : 0 },
    uMaskTex: { value: maskTex }
  };
  // Proxy to warn on out-of-range uniform assignments (dev only)
  if ((import.meta as { env?: { DEV?: boolean } })?.env?.DEV) {
    const uniformsAny = uniforms as Record<string, Record<string, unknown>>;
    for (const key of Object.keys(uniformRanges)) {
      const [min, max] = uniformRanges[key];
      const orig = uniformsAny[key];
      Object.defineProperty(orig, 'value', {
        set(val) {
          if (!Number.isFinite(val) || val < min || val > max) {
            console.warn(`[TunnelShader] Uniform ${key} set to out-of-range value (${min}..${max}):`, val);
          }
          orig._value = val;
        },
        get() {
          return orig._value;
        },
        configurable: true
      });
      orig._value = orig.value;
    }
  }
  return { uniforms };
}

// Singleton tiny texture to avoid creating multiple throwaway textures.
let __fallbackTex: THREE.DataTexture | null = null;
function useSingletonFallbackTexture(){
  if(!__fallbackTex){
    const data = new Uint8Array([255,255,255,255]);
    const tex = new THREE.DataTexture(data,1,1);
    tex.needsUpdate = true;
    __fallbackTex = tex;
  }
  return __fallbackTex!;
}

export function createTunnelMaterial(uniforms: Record<string, { value: unknown }>){ assertTunnelUniforms(uniforms); return new THREE.ShaderMaterial({ vertexShader: tunnelVertex, fragmentShader: tunnelFragment, uniforms }) }

// Dev-time runtime guards to catch integration mistakes early.
export function assertTunnelUniforms(uniforms: Record<string, { value: unknown }>){
  if (!(import.meta as { env?: { DEV?: boolean } })?.env?.DEV) return;
  const required = ['uResolution','uTime','uProgress','uVelocity','uChromaBase','uGrainBase','uFadeToWhite','uSvgMix','uReduced','uMaskTex'];
  const missing = required.filter(k => !(k in uniforms));
  if (missing.length){
    console.warn('[TunnelShader] Missing uniforms:', missing.join(', '));
  }
  // Soft range assertions (non-throwing): warn if outside expected operational window.
  const checks:[string, number, number, number][] = [
    ['uProgress', uniforms.uProgress.value as number, -0.05, 1.05],
    ['uChromaBase', uniforms.uChromaBase.value as number, -0.01, 1.10],
    ['uGrainBase', uniforms.uGrainBase.value as number, -0.01, 1.10],
    ['uFadeToWhite', uniforms.uFadeToWhite.value as number, -0.01, 1.05],
    ['uSvgMix', uniforms.uSvgMix.value as number, -0.01, 1.05],
  ];
  for(const [key,val,min,max] of checks){
    if(!Number.isFinite(val) || val < min || val > max){
      console.warn(`[TunnelShader] Uniform ${key} out of expected range (${min}..${max}):`, val);
    }
  }
}
