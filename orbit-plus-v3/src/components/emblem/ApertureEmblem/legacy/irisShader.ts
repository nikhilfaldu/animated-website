/**
 * Iris Shader - Polar coordinate fragment shader for N-blade aperture mask
 *
 * Creates a camera-shutter-like iris effect that reveals content behind it.
 * Uses polar coordinates and N-gon math for the blade pattern.
 */

export const irisVertexShader = /* glsl */ `
  varying vec2 vUv;

  void main() {
    vUv = uv;
    gl_Position = vec4(position.xy, 0.0, 1.0);
  }
`;

export const irisFragmentShader = /* glsl */ `
  precision highp float;

  varying vec2 vUv;

  uniform float uAperture;      // 0 = closed, 1 = open
  uniform float uBlades;        // blade count (e.g., 8-12)
  uniform float uRotation;      // global rotation in radians
  uniform float uTwist;         // blade swirl as aperture closes (0.0-1.0)
  uniform float uFeather;       // edge softness (0.01-0.1)
  uniform float uOpacity;       // overall opacity multiplier
  uniform float uRadiusOpen;    // max radius when fully open (NDC space)
  uniform float uRadiusClosed;  // min radius when closed (center pinhole)
  uniform float uAspect;        // viewport aspect ratio (width/height)

  const float PI = 3.141592653589793;

  // Safe atan to avoid discontinuity at -PI
  float safeAtan(float y, float x) {
    float a = atan(y, x);
    return a < 0.0 ? a + 2.0 * PI : a;
  }

  void main() {
    // Center coordinates (-1 to 1), corrected for aspect ratio
    vec2 p = vUv * 2.0 - 1.0;
    p.x *= uAspect; // Correct for aspect ratio to make circle not ellipse

    // Polar conversion
    float r = length(p);
    float theta = safeAtan(p.y, p.x);

    // Blade geometry - ensure minimum of 3 blades
    float blades = max(3.0, uBlades);
    float w = (2.0 * PI) / blades;

    // Add twist as aperture closes for mechanical shutter feel
    float twist = (1.0 - uAperture) * uTwist;
    float t = theta + uRotation + twist;

    // Fold angle into single blade sector centered around 0
    float a = mod(t, w) - 0.5 * w;

    // Interpolate radius based on aperture state (closed -> open)
    float baseR = mix(uRadiusClosed, uRadiusOpen, uAperture);

    // Regular N-gon boundary: r <= baseR / cos(a)
    // Clamp cos(a) to avoid division issues at blade edges
    float c = max(0.15, cos(a));
    float limitR = baseR / c;

    // Smoothstep mask with feathered edge
    // openMask = 1 inside aperture (visible area), 0 outside (blocked area)
    float openMask = 1.0 - smoothstep(limitR, limitR + uFeather, r);

    // Invert: shutter overlay is opaque where aperture is closed
    // alpha = 1 means fully blocking (shutter), alpha = 0 means transparent (aperture opening)
    float alpha = (1.0 - openMask) * uOpacity;

    // Black shutter blades - transparent where aperture is open
    gl_FragColor = vec4(0.0, 0.0, 0.0, alpha);
  }
`;

/**
 * Default uniform values for the iris shader
 */
export const IRIS_DEFAULTS = {
  aperture: 1.0,        // Start fully open
  blades: 10,           // 10 blades for nice mechanical look
  rotation: 0.0,        // No initial rotation
  twist: 0.65,          // Moderate twist for shutter feel
  feather: 0.02,        // Subtle edge softness
  opacity: 1.0,         // Fully opaque shutter
  radiusOpen: 1.25,     // Extends past viewport when open
  radiusClosed: 0.03,   // Tiny pinhole when closed
} as const;
