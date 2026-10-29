import { noiseGLSL } from './earth'

export const oceanVertexShader = `
${noiseGLSL}

uniform float uTime;
varying vec2 vUv;
varying vec3 vPosition;
varying vec3 vNormal;

void main() {
  vUv = uv;
  vNormal = normalize(normalMatrix * normal);
  
  // Displace vertices to create physical waves
  float wave = snoise(position * 3.0 + uTime * 0.5) * 0.05;
  vec3 newPosition = position + normal * wave;
  
  vPosition = newPosition;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(newPosition, 1.0);
}
`

export const oceanFragmentShader = `
${noiseGLSL}

uniform float uTime;
uniform vec3 uColorDeep;
uniform vec3 uColorShallow;

varying vec2 vUv;
varying vec3 vPosition;
varying vec3 vNormal;

void main() {
  // Surface noise for smaller ripples
  float n = fbm(vPosition * 8.0 - uTime * 0.2);
  n = n * 0.5 + 0.5;

  vec3 color = mix(uColorDeep, uColorShallow, n);

  // Lighting and Specular Highlight
  vec3 lightDir = normalize(vec3(1.0, 1.0, 1.0));
  vec3 viewDir = normalize(cameraPosition - vPosition);
  vec3 halfVector = normalize(lightDir + viewDir);

  float diff = max(dot(vNormal, lightDir), 0.0);
  float spec = pow(max(dot(vNormal, halfVector), 0.0), 64.0); // Shiny water

  vec3 finalColor = color * (diff * 0.8 + 0.2) + vec3(1.0) * spec * 0.5;

  gl_FragColor = vec4(finalColor, 0.9);
}
`
