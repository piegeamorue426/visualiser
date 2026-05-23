/**
 * Energy field / plasma pattern fragment shader.
 * Reactive to audio bass and energy for dynamic visual output.
 */

uniform float u_time;
uniform float u_bass;
uniform float u_energy;
uniform vec2 u_resolution;

varying vec2 vUv;

void main() {
  vec2 uv = (vUv - 0.5) * 2.0;
  uv.x *= u_resolution.x / u_resolution.y;

  float d = length(uv);
  float angle = atan(uv.y, uv.x);

  // Multi-layered plasma
  float plasma = sin(d * 10.0 - u_time * 2.0 + u_bass * 4.0);
  plasma += sin(angle * 6.0 + u_time * 1.5);
  plasma += sin((uv.x * 5.0 + u_time) + sin(uv.y * 3.0 + u_time * 0.5));
  plasma += sin(length(uv - vec2(sin(u_time), cos(u_time)) * 0.3) * 8.0);
  plasma *= 0.25;

  // Color palette
  vec3 color1 = vec3(0.1, 0.3, 0.9);
  vec3 color2 = vec3(0.9, 0.1, 0.5);
  vec3 color3 = vec3(0.0, 0.8, 0.7);

  vec3 color = mix(color1, color2, 0.5 + 0.5 * sin(plasma * 3.14159));
  color = mix(color, color3, 0.5 + 0.5 * cos(plasma * 2.0 + u_time));

  // Energy boost
  color *= 0.6 + u_energy * 0.8;

  // Pulse on beat
  color += vec3(0.1) * u_bass;

  // Fade edges
  float fade = 1.0 - smoothstep(0.5, 1.5, d);
  color *= fade;

  gl_FragColor = vec4(color, 1.0);
}
