export const vertexShader = /* glsl */`
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

export const fragmentShader = /* glsl */`
  uniform float uTime;
  uniform vec3 uColor;
  uniform float uSpeed;
  uniform float uIntensity;

  varying vec2 vUv;

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
    vec2 uv = vUv;
    uv.y -= uTime * uSpeed;
    
    // Noise distortion
    float n = noise(uv * 10.0) * 0.5 + 0.5;
    float n2 = noise(uv * 20.0 + vec2(uTime * 2.0, 0.0)) * 0.5 + 0.5;
    
    float pulse = sin(uTime * 5.0) * 0.2 + 0.8;
    float energy = pow(n * n2, 1.5) * uIntensity * pulse;
    
    vec3 finalColor = uColor * energy;
    float alpha = smoothstep(0.1, 0.8, energy);
    
    gl_FragColor = vec4(finalColor, alpha);
  }
`;
