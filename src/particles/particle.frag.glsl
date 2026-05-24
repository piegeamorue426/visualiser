/**
 * Particle fragment shader.
 * Renders a soft circle with color and alpha from the vertex shader.
 */

varying vec3 vColor;
varying float vAlpha;

void main() {
  // Soft circle using distance from center of point sprite
  vec2 center = gl_PointCoord - 0.5;
  float dist = length(center);
  float alpha = smoothstep(0.5, 0.2, dist) * vAlpha;

  // Discard fully transparent fragments
  if (alpha < 0.01) discard;

  gl_FragColor = vec4(vColor, alpha);
}
