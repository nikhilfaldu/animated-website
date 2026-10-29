export const vertexShader = /* glsl */`
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

export const fragmentShader = /* glsl */`
  uniform float uTime;
  uniform vec3 uRockColor;
  uniform vec3 uLavaColor;
  uniform float uCrackScale;
  uniform float uFlowSpeed;

  varying vec2 vUv;

  vec2 hash2(vec2 p) {
    p = vec2(dot(p,vec2(127.1,311.7)), dot(p,vec2(269.5,183.3)));
    return -1.0 + 2.0*fract(sin(p)*43758.5453123);
  }
  float noise(vec2 p) {
    const float K1 = 0.366025404; // (sqrt(3)-1)/2;
    const float K2 = 0.211324865; // (3-sqrt(3))/6;
    vec2 i = floor(p + (p.x+p.y)*K1);
    vec2 a = p - i + (i.x+i.y)*K2;
    vec2 o = (a.x>a.y) ? vec2(1.0,0.0) : vec2(0.0,1.0);
    vec2 b = a - o + K2;
    vec2 c = a - 1.0 + 2.0*K2;
    vec3 h = max(0.5-vec3(dot(a,a), dot(b,b), dot(c,c)), 0.0);
    vec3 n = h*h*h*h*vec3( dot(a,hash2(i+0.0)), dot(b,hash2(i+o)), dot(c,hash2(i+1.0)));
    return dot(n, vec3(70.0));
  }

  void main() {
    vec2 uv = vUv * uCrackScale;
    
    // Flowing effect
    uv.y += uTime * uFlowSpeed;
    uv.x += noise(uv + uTime * 0.2) * 0.5;

    // Layered noise for cracks
    float n1 = noise(uv);
    float n2 = noise(uv * 2.0 + uTime * 0.1);
    float n3 = noise(uv * 4.0 - uTime * 0.15);
    
    float crack = abs(n1 + n2 * 0.5 + n3 * 0.25);
    crack = 1.0 - smoothstep(0.0, 0.2, crack);
    
    // Hot spots
    float hotSpot = (noise(uv * 0.5 - uTime * 0.5) * 0.5 + 0.5);
    crack *= pow(hotSpot, 2.0) * 2.0;

    vec3 finalColor = mix(uRockColor, uLavaColor, crack);
    // Add extra brightness for lava
    finalColor += uLavaColor * crack * 1.5;
    
    gl_FragColor = vec4(finalColor, 1.0);
  }
`;
