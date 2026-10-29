import { noiseGLSL } from './earth'

export const lavaVertexShader = `
varying vec2 vUv;
varying vec3 vPosition;
varying vec3 vNormal;

void main() {
  vUv = uv;
  vPosition = position;
  vNormal = normalize(normalMatrix * normal);
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
`

export const lavaFragmentShader = `
${noiseGLSL}

uniform float uTime;
uniform vec3 uColorRock;
uniform vec3 uColorLava;

varying vec2 vUv;
varying vec3 vPosition;
varying vec3 vNormal;

void main() {
  // High frequency noise for cracks
  float n1 = fbm(vPosition * 5.0 - uTime * 0.05);
  float n2 = fbm(vPosition * 10.0 + uTime * 0.02);
  
  // Combine noises to create sharp cracks
  float cracks = abs(n1) * abs(n2);
  cracks = smoothstep(0.0, 0.05, cracks); // Sharp threshold

  // Color mix: rock vs lava
  vec3 color = mix(uColorLava * 2.0, uColorRock, cracks);

  // Lighting
  vec3 lightDir = normalize(vec3(1.0, 1.0, 1.0));
  float diff = max(dot(vNormal, lightDir), 0.0);
  
  // Emit light from cracks, apply diffuse to rock
  vec3 finalColor = mix(uColorLava * 3.0, uColorRock * (diff * 0.8 + 0.2), cracks);

  gl_FragColor = vec4(finalColor, 1.0);
}
`
