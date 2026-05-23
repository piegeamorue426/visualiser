/**
 * Chromatic aberration fragment shader.
 * RGB channel offset controlled by u_energy uniform for audio reactivity.
 */

uniform sampler2D tDiffuse;
uniform float u_offset;
uniform float u_energy;

varying vec2 vUv;

void main() {
  float offsetAmount = u_offset * (1.0 + u_energy * 2.0);

  vec2 direction = normalize(vUv - 0.5);
  float dist = length(vUv - 0.5);

  vec2 rOffset = direction * offsetAmount * dist;
  vec2 bOffset = -direction * offsetAmount * dist;

  float r = texture2D(tDiffuse, vUv + rOffset).r;
  float g = texture2D(tDiffuse, vUv).g;
  float b = texture2D(tDiffuse, vUv + bOffset).b;

  gl_FragColor = vec4(r, g, b, 1.0);
}
