/**
 * Aperture Index WebGL Shaders (instanced blades)
 *
 * Vertex: Builds 32 radial blades as instanced quads, swings them open from a fully closed state,
 * and keeps UV sampling undistorted.
 * Fragment: Samples the emblem texture and applies alpha with global opacity.
 */

export const vertexShader = /* glsl */ `
uniform float uProgress;
uniform float uSwingMax;
uniform float uDelays[32];
uniform vec2 uCenter;

attribute float aAngle;
attribute float aInner;
attribute float aOuter;
attribute float aHalfW;

varying vec2 vUv;

void main() {
  vec2 base = position.xy;
  float r = mix(aInner, aOuter, base.y + 0.5);
  float w = aHalfW;
  vec2 blade = vec2(r, base.x * w * 2.0);

  // Get per-instance delay
  int idx = gl_InstanceID;
  float d = uDelays[idx];
  float p = clamp((uProgress - d) / max(0.0001, (1.0 - d)), 0.0, 1.0);
  p = smoothstep(0.0, 1.0, p);

  // Swing animation
  float swing = (1.0 - p) * uSwingMax;
  float angle = aAngle + swing;

  float s = sin(angle);
  float c = cos(angle);
  vec2 rotated = vec2(c * blade.x - s * blade.y, s * blade.x + c * blade.y);

  gl_Position = projectionMatrix * modelViewMatrix * vec4(rotated, 0.0, 1.0);

  // UV calculation
  float uvScale = 0.5 / max(aOuter, 0.0001);
  vUv = rotated * uvScale + uCenter;
}
`;

export const fragmentShader = /* glsl */ `
uniform float uOpacity;
uniform sampler2D uTex;
uniform float uTexLoaded;
varying vec2 vUv;

void main() {
  // Discard outside UV bounds
  if (vUv.x < 0.0 || vUv.x > 1.0 || vUv.y < 0.0 || vUv.y > 1.0) {
    discard;
  }

  // If texture not loaded, show white placeholder
  if (uTexLoaded < 0.5) {
    gl_FragColor = vec4(1.0, 1.0, 1.0, uOpacity);
    return;
  }

  // Sample texture and use alpha
  vec4 tex = texture2D(uTex, vUv);
  float a = smoothstep(0.15, 0.35, tex.a);
  gl_FragColor = vec4(1.0, 1.0, 1.0, a * uOpacity);
}
`;
