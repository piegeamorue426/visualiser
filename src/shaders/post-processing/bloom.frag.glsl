/**
 * Custom bloom fragment shader.
 * Applies a gaussian blur with luminance threshold for bloom glow effect.
 */

uniform sampler2D tDiffuse;
uniform float u_threshold;
uniform float u_intensity;
uniform vec2 u_resolution;

varying vec2 vUv;

vec3 luminanceThreshold(vec3 color, float threshold) {
  float lum = dot(color, vec3(0.2126, 0.7152, 0.0722));
  return color * max(0.0, lum - threshold) / (lum + 0.0001);
}

void main() {
  vec2 texelSize = 1.0 / u_resolution;
  vec3 result = vec3(0.0);

  // 9-tap gaussian blur
  float weights[5];
  weights[0] = 0.227027;
  weights[1] = 0.194596;
  weights[2] = 0.121622;
  weights[3] = 0.054054;
  weights[4] = 0.016216;

  vec3 center = texture2D(tDiffuse, vUv).rgb;
  vec3 thresholded = luminanceThreshold(center, u_threshold);
  result += thresholded * weights[0];

  for (int i = 1; i < 5; i++) {
    vec2 offset = vec2(float(i)) * texelSize;
    vec3 s1 = texture2D(tDiffuse, vUv + vec2(offset.x, 0.0)).rgb;
    vec3 s2 = texture2D(tDiffuse, vUv - vec2(offset.x, 0.0)).rgb;
    result += luminanceThreshold(s1, u_threshold) * weights[i];
    result += luminanceThreshold(s2, u_threshold) * weights[i];
  }

  vec3 finalColor = center + result * u_intensity;
  gl_FragColor = vec4(finalColor, 1.0);
}
