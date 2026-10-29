uniform vec3 uColor;
varying float vAlpha;

void main() {
  vec2 uv = gl_PointCoord - vec2(0.5);
  float dist = length(uv);
  float falloff = smoothstep(0.5, 0.0, dist);
  if (falloff <= 0.0) discard;
  gl_FragColor = vec4(uColor, falloff * vAlpha);
}
