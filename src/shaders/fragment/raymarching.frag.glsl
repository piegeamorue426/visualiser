/**
 * SDF raymarcher fragment shader.
 * Renders repeated spheres with audio-reactive radius.
 */

uniform float u_time;
uniform float u_bass;
uniform float u_energy;
uniform vec2 u_resolution;

varying vec2 vUv;

float sdSphere(vec3 p, float r) {
  return length(p) - r;
}

float sdBox(vec3 p, vec3 b) {
  vec3 q = abs(p) - b;
  return length(max(q, 0.0)) + min(max(q.x, max(q.y, q.z)), 0.0);
}

float map(vec3 p) {
  // Repeat space
  vec3 q = mod(p + 2.0, 4.0) - 2.0;

  // Audio-reactive radius
  float radius = 0.4 + u_bass * 0.6;

  // Mix between sphere and box based on energy
  float sphere = sdSphere(q, radius);
  float box = sdBox(q, vec3(radius * 0.7));
  return mix(sphere, box, u_energy * 0.5);
}

vec3 calcNormal(vec3 p) {
  vec2 e = vec2(0.001, 0.0);
  return normalize(vec3(
    map(p + e.xyy) - map(p - e.xyy),
    map(p + e.yxy) - map(p - e.yxy),
    map(p + e.yyx) - map(p - e.yyx)
  ));
}

void main() {
  vec2 uv = (vUv - 0.5) * 2.0;
  uv.x *= u_resolution.x / u_resolution.y;

  // Camera
  vec3 ro = vec3(0.0, 0.0, u_time * 0.5);
  vec3 rd = normalize(vec3(uv, 1.5));

  // Raymarch
  float t = 0.0;
  float hit = 0.0;
  for (int i = 0; i < 80; i++) {
    vec3 p = ro + rd * t;
    float d = map(p);
    if (d < 0.001) {
      hit = 1.0;
      break;
    }
    t += d;
    if (t > 60.0) break;
  }

  // Shading
  vec3 color = vec3(0.02, 0.02, 0.05);
  if (hit > 0.5) {
    vec3 p = ro + rd * t;
    vec3 n = calcNormal(p);

    // Simple lighting
    vec3 lightDir = normalize(vec3(1.0, 1.0, -1.0));
    float diffuse = max(dot(n, lightDir), 0.0);
    float specular = pow(max(dot(reflect(-lightDir, n), -rd), 0.0), 32.0);

    color = vec3(0.2 + u_energy * 0.3, 0.4, 0.8) * diffuse;
    color += vec3(1.0) * specular * 0.5;
    color *= exp(-t * 0.03);
  }

  gl_FragColor = vec4(color, 1.0);
}
