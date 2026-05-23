/**
 * Wave/ripple distortion fragment shader.
 * Distortion amplitude driven by u_bass for audio reactivity.
 */

uniform sampler2D tDiffuse;
uniform float u_time;
uniform float u_amplitude;
uniform float u_frequency;
uniform float u_bass;

varying vec2 vUv;

void main() {
  float amp = u_amplitude * (1.0 + u_bass * 3.0);

  vec2 center = vUv - 0.5;
  float dist = length(center);
  float angle = atan(center.y, center.x);

  float wave = sin(dist * u_frequency * 6.283 - u_time * 2.0) * amp;
  float ripple = sin(angle * 3.0 + u_time) * amp * 0.5;

  vec2 offset = vec2(
    sin(vUv.y * u_frequency * 6.283 + u_time) * amp + ripple,
    cos(vUv.x * u_frequency * 6.283 + u_time) * amp + wave
  );

  gl_FragColor = texture2D(tDiffuse, vUv + offset);
}
