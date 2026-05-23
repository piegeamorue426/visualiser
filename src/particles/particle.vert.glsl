/**
 * Particle vertex shader.
 * Handles position, size attenuation by distance, and life-based alpha.
 */

uniform float u_time;
uniform float u_pixelRatio;

attribute vec3 aVelocity;
attribute vec3 aColor;
attribute float aSize;
attribute float aLife;
attribute float aMaxLife;

varying vec3 vColor;
varying float vAlpha;

void main() {
  vColor = aColor;

  // Calculate alpha based on remaining life ratio
  float lifeRatio = aLife / aMaxLife;
  vAlpha = smoothstep(0.0, 0.1, lifeRatio) * smoothstep(1.0, 0.8, lifeRatio);

  // Hide dead particles
  if (aLife <= 0.0) {
    vAlpha = 0.0;
  }

  vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);

  // Size attenuation by distance
  float dist = -mvPosition.z;
  float attenuation = 300.0 / dist;
  gl_PointSize = aSize * attenuation * u_pixelRatio;

  // Clamp point size
  gl_PointSize = clamp(gl_PointSize, 1.0, 64.0);

  gl_Position = projectionMatrix * mvPosition;
}
