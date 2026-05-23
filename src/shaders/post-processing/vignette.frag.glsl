/**
 * Vignette fragment shader.
 * Darkens edges of the screen with strength controlled by u_bass.
 */

uniform sampler2D tDiffuse;
uniform float u_intensity;
uniform float u_smoothness;
uniform float u_bass;

varying vec2 vUv;

void main() {
  vec4 color = texture2D(tDiffuse, vUv);

  vec2 center = vUv - 0.5;
  float dist = length(center);

  float strength = u_intensity * (1.0 + u_bass * 0.5);
  float vignette = smoothstep(0.5, 0.5 - u_smoothness, dist * strength);

  gl_FragColor = vec4(color.rgb * vignette, color.a);
}
