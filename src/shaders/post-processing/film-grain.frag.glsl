/**
 * Film grain fragment shader.
 * Animated noise overlay that varies per frame using u_time.
 */

uniform sampler2D tDiffuse;
uniform float u_time;
uniform float u_intensity;

varying vec2 vUv;

float rand(vec2 co) {
  return fract(sin(dot(co.xy, vec2(12.9898, 78.233))) * 43758.5453);
}

float grain(vec2 uv, float t) {
  float noise = rand(uv + vec2(t, t * 0.7));
  return noise * 2.0 - 1.0;
}

void main() {
  vec4 color = texture2D(tDiffuse, vUv);

  float noise = grain(vUv * 1000.0, u_time);
  color.rgb += vec3(noise) * u_intensity;

  gl_FragColor = color;
}
