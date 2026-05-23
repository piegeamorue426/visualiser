/**
 * Registry of built-in shader configurations with names, descriptions, and defaults.
 */

import * as THREE from 'three';

export interface ShaderPreset {
  name: string;
  description: string;
  vertexShader: string;
  fragmentShader: string;
  uniforms?: Record<string, THREE.IUniform>;
  transparent?: boolean;
  side?: THREE.Side;
  depthWrite?: boolean;
}

const energyFieldPreset: ShaderPreset = {
  name: 'energy-field',
  description: 'Plasma energy field reactive to audio energy and bass',
  vertexShader: `
    varying vec2 vUv;
    varying vec3 vPosition;
    void main() {
      vUv = uv;
      vPosition = position;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `,
  fragmentShader: `
    uniform float u_time;
    uniform float u_bass;
    uniform float u_energy;
    uniform vec2 u_resolution;
    varying vec2 vUv;
    void main() {
      vec2 uv = vUv * 2.0 - 1.0;
      float d = length(uv);
      float angle = atan(uv.y, uv.x);
      float plasma = sin(d * 10.0 - u_time * 2.0 + u_bass * 3.0)
                   + sin(angle * 5.0 + u_time)
                   + sin((uv.x + uv.y) * 5.0 + u_time * 1.5);
      plasma /= 3.0;
      vec3 color = vec3(
        0.5 + 0.5 * sin(plasma * 3.14 + u_time),
        0.5 + 0.5 * sin(plasma * 3.14 + u_time + 2.094),
        0.5 + 0.5 * sin(plasma * 3.14 + u_time + 4.188)
      );
      color *= 0.5 + u_energy;
      gl_FragColor = vec4(color, 1.0);
    }
  `,
  transparent: false,
};

const raymarchingPreset: ShaderPreset = {
  name: 'raymarching-basic',
  description: 'Basic SDF raymarcher with audio-reactive sphere',
  vertexShader: `
    varying vec2 vUv;
    void main() {
      vUv = uv;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `,
  fragmentShader: `
    uniform float u_time;
    uniform float u_bass;
    uniform float u_energy;
    uniform vec2 u_resolution;
    varying vec2 vUv;
    float sdSphere(vec3 p, float r) {
      return length(p) - r;
    }
    float map(vec3 p) {
      vec3 q = mod(p + 2.0, 4.0) - 2.0;
      float radius = 0.5 + u_bass * 0.5;
      return sdSphere(q, radius);
    }
    void main() {
      vec2 uv = (vUv - 0.5) * 2.0;
      uv.x *= u_resolution.x / u_resolution.y;
      vec3 ro = vec3(0.0, 0.0, u_time * 0.5);
      vec3 rd = normalize(vec3(uv, 1.0));
      float t = 0.0;
      for (int i = 0; i < 64; i++) {
        vec3 p = ro + rd * t;
        float d = map(p);
        if (d < 0.001) break;
        t += d;
        if (t > 50.0) break;
      }
      vec3 color = vec3(0.0);
      if (t < 50.0) {
        color = vec3(0.2 + u_energy, 0.4, 0.8) * (1.0 - t * 0.02);
      }
      gl_FragColor = vec4(color, 1.0);
    }
  `,
  transparent: false,
};

const displacementPreset: ShaderPreset = {
  name: 'displacement',
  description: 'Vertex displacement driven by bass and energy',
  vertexShader: `
    uniform float u_time;
    uniform float u_bass;
    uniform float u_energy;
    varying vec2 vUv;
    varying vec3 vNormal;
    varying float vDisplacement;
    void main() {
      vUv = uv;
      vNormal = normal;
      float displacement = sin(position.x * 5.0 + u_time) *
                           sin(position.y * 5.0 + u_time) *
                           u_bass * 0.5;
      vDisplacement = displacement;
      vec3 newPosition = position + normal * displacement;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(newPosition, 1.0);
    }
  `,
  fragmentShader: `
    uniform float u_time;
    uniform float u_energy;
    varying vec2 vUv;
    varying vec3 vNormal;
    varying float vDisplacement;
    void main() {
      vec3 color = vec3(0.3 + vDisplacement, 0.5, 0.8 + u_energy * 0.2);
      float fresnel = pow(1.0 - abs(dot(vNormal, vec3(0.0, 0.0, 1.0))), 2.0);
      color += fresnel * 0.5;
      gl_FragColor = vec4(color, 1.0);
    }
  `,
  transparent: false,
  depthWrite: true,
};

const fluidPreset: ShaderPreset = {
  name: 'fluid',
  description: 'Fluid simulation-style shader with audio reactivity',
  vertexShader: `
    varying vec2 vUv;
    void main() {
      vUv = uv;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `,
  fragmentShader: `
    uniform float u_time;
    uniform float u_bass;
    uniform float u_energy;
    uniform vec2 u_resolution;
    varying vec2 vUv;
    void main() {
      vec2 uv = vUv * 2.0 - 1.0;
      uv.x *= u_resolution.x / u_resolution.y;
      float t = u_time * 0.5;
      vec2 p = uv;
      float d1 = length(p - vec2(sin(t), cos(t)) * 0.5);
      float d2 = length(p - vec2(cos(t * 1.3), sin(t * 0.7)) * 0.4);
      float d3 = length(p - vec2(sin(t * 0.8 + 1.0), cos(t * 1.1)) * 0.6);
      float metaball = (1.0 / d1 + 1.0 / d2 + 1.0 / d3) * 0.1;
      metaball *= 0.5 + u_energy;
      vec3 color = vec3(
        metaball * 0.3,
        metaball * 0.5 + u_bass * 0.2,
        metaball * 0.8
      );
      gl_FragColor = vec4(color, 1.0);
    }
  `,
  transparent: false,
};

const nebulaPreset: ShaderPreset = {
  name: 'nebula',
  description: 'Nebula cloud effect with energy-driven brightness',
  vertexShader: `
    varying vec2 vUv;
    void main() {
      vUv = uv;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `,
  fragmentShader: `
    uniform float u_time;
    uniform float u_bass;
    uniform float u_energy;
    uniform vec2 u_resolution;
    varying vec2 vUv;
    float noise(vec2 p) {
      return fract(sin(dot(p, vec2(12.9898, 78.233))) * 43758.5453);
    }
    float fbm(vec2 p) {
      float f = 0.0;
      float amp = 0.5;
      for (int i = 0; i < 5; i++) {
        f += amp * noise(p);
        p *= 2.0;
        amp *= 0.5;
      }
      return f;
    }
    void main() {
      vec2 uv = vUv * 3.0;
      float t = u_time * 0.2;
      float n1 = fbm(uv + t + u_bass);
      float n2 = fbm(uv * 1.5 - t * 0.5);
      float n3 = fbm(uv * 2.0 + vec2(t * 0.3, -t * 0.2));
      vec3 color = vec3(
        n1 * 0.4 + 0.1,
        n2 * 0.3 + n1 * 0.2,
        n3 * 0.6 + n2 * 0.3
      );
      color *= 0.8 + u_energy * 1.2;
      color = pow(color, vec3(0.8));
      gl_FragColor = vec4(color, 1.0);
    }
  `,
  transparent: false,
};

export const SHADER_PRESETS: Map<string, ShaderPreset> = new Map([
  ['energy-field', energyFieldPreset],
  ['raymarching-basic', raymarchingPreset],
  ['displacement', displacementPreset],
  ['fluid', fluidPreset],
  ['nebula', nebulaPreset],
]);
