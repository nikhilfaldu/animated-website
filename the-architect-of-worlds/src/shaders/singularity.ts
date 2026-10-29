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
  uniform float uDistortion;
  uniform float uRingRadius;

  varying vec2 vUv;

  void main() {
    vec2 centered = vUv - 0.5;
    float dist = length(centered);
    float angle = atan(centered.y, centered.x);

    // Event horizon
    float blackHole = smoothstep(uRingRadius * 0.8, uRingRadius, dist);
    
    // Swirl distortion
    float swirl = uTime * 2.0 - dist * uDistortion;
    angle += swirl;
    
    // Accretion disk
    float disk = smoothstep(uRingRadius * 1.5, uRingRadius, dist) * smoothstep(uRingRadius * 0.5, uRingRadius, dist);
    
    // Add rings and patterns
    float rings = sin(dist * 50.0 - uTime * 5.0) * 0.5 + 0.5;
    float rays = sin(angle * 10.0 + uTime * 3.0) * 0.5 + 0.5;
    
    float brightness = disk * (0.5 + rings * 0.3 + rays * 0.2);
    
    // Inner brightness (photon ring)
    float photonRing = smoothstep(uRingRadius + 0.05, uRingRadius, dist) * smoothstep(uRingRadius - 0.05, uRingRadius, dist);
    brightness += photonRing * 2.0;

    vec3 finalColor = uColor * brightness;
    finalColor *= blackHole; // Cut out center
    
    float alpha = smoothstep(0.0, 0.1, brightness);
    alpha *= smoothstep(0.5, uRingRadius, dist);

    gl_FragColor = vec4(finalColor, alpha);
  }
`;
