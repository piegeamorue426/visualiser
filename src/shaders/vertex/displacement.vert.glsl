/**
 * Audio-reactive vertex displacement shader.
 * Displaces vertices along their normals based on bass and energy.
 */

uniform float u_time;
uniform float u_bass;
uniform float u_energy;

varying vec2 vUv;
varying vec3 vNormal;
varying float vDisplacement;

void main() {
  vUv = uv;
  vNormal = normalize(normalMatrix * normal);

  float amplitude = 0.5;
  float displacement = sin(position.x * 5.0 + u_time * 2.0)
                     * sin(position.y * 5.0 + u_time * 1.5)
                     * sin(position.z * 5.0 + u_time)
                     * u_bass * amplitude;

  displacement += sin(position.x * 3.0 - u_time) * u_energy * amplitude * 0.5;

  vDisplacement = displacement;

  vec3 newPosition = position + normal * displacement;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(newPosition, 1.0);
}
