export const vertexShader = /* glsl */`
  uniform float uTime;
  varying vec2 vUv;
  varying vec3 vNormal;
  varying vec3 vViewPosition;

  float hash(vec2 p) { return fract(1e4 * sin(17.0 * p.x + p.y * 0.1) * (0.1 + abs(sin(p.y * 13.0 + p.x)))); }
  float noise(vec2 x) {
    vec2 i = floor(x);
    vec2 f = fract(x);
    float a = hash(i);
    float b = hash(i + vec2(1.0, 0.0));
    float c = hash(i + vec2(0.0, 1.0));
    float d = hash(i + vec2(1.0, 1.0));
    vec2 u = f * f * (3.0 - 2.0 * f);
    return mix(a, b, u.x) + (c - a) * u.y * (1.0 - u.x) + (d - b) * u.x * u.y;
  }

  void main() {
    vUv = uv;
    vNormal = normalize(normalMatrix * normal);
    
    vec3 p = position;
    // subtle displacement
    float n = noise(p.xy * 2.0 + uTime * 0.5) * 0.1;
    p += normal * n;

    vec4 mvPosition = modelViewMatrix * vec4(p, 1.0);
    vViewPosition = -mvPosition.xyz;
    gl_Position = projectionMatrix * mvPosition;
  }
`;

export const fragmentShader = /* glsl */`
  uniform float uTime;
  uniform vec3 uColor;
  uniform float uGlowIntensity;
  uniform float uPulseSpeed;

  varying vec2 vUv;
  varying vec3 vNormal;
  varying vec3 vViewPosition;

  void main() {
    vec3 normal = normalize(vNormal);
    vec3 viewDir = normalize(vViewPosition);
    
    float fresnel = pow(1.0 - max(dot(normal, viewDir), 0.0), 3.0);
    
    // Pulsing inner glow
    float pulse = (sin(uTime * uPulseSpeed) * 0.5 + 0.5) * uGlowIntensity;
    
    // Prismatic color shifting
    vec3 shift = vec3(
      sin(uTime * 0.5 + vUv.x * 10.0),
      sin(uTime * 0.6 + vUv.y * 12.0),
      cos(uTime * 0.7 + (vUv.x+vUv.y) * 8.0)
    ) * 0.1;
    
    vec3 baseColor = uColor + shift;
    vec3 finalColor = baseColor * (0.5 + pulse) + vec3(fresnel * 0.8);
    float alpha = 0.6 + fresnel * 0.4;
    
    gl_FragColor = vec4(finalColor, alpha);
  }
`;
