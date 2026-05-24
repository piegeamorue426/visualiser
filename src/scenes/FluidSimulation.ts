import * as THREE from 'three';
import { AudioState } from '../audio-engine/types';
import { BaseScene, SceneConfig } from './types';
import { lerp } from '../utils/math';

const vertexShader = `
varying vec2 vUv;
void main() {
  vUv = uv;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
`;

const fragmentShader = `
uniform float u_time;
uniform float u_bass;
uniform float u_energy;
uniform float u_mids;
uniform float u_highs;
uniform vec2 u_resolution;
varying vec2 vUv;

// Simplex-like noise
vec3 mod289(vec3 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
vec2 mod289v2(vec2 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
vec3 permute(vec3 x) { return mod289(((x * 34.0) + 1.0) * x); }

float snoise(vec2 v) {
  const vec4 C = vec4(0.211324865405187, 0.366025403784439,
                     -0.577350269189626, 0.024390243902439);
  vec2 i = floor(v + dot(v, C.yy));
  vec2 x0 = v - i + dot(i, C.xx);
  vec2 i1;
  i1 = (x0.x > x0.y) ? vec2(1.0, 0.0) : vec2(0.0, 1.0);
  vec4 x12 = x0.xyxy + C.xxzz;
  x12.xy -= i1;
  i = mod289v2(i);
  vec3 p = permute(permute(i.y + vec3(0.0, i1.y, 1.0)) + i.x + vec3(0.0, i1.x, 1.0));
  vec3 m = max(0.5 - vec3(dot(x0, x0), dot(x12.xy, x12.xy), dot(x12.zw, x12.zw)), 0.0);
  m = m * m;
  m = m * m;
  vec3 x = 2.0 * fract(p * C.www) - 1.0;
  vec3 h = abs(x) - 0.5;
  vec3 ox = floor(x + 0.5);
  vec3 a0 = x - ox;
  m *= 1.79284291400159 - 0.85373472095314 * (a0 * a0 + h * h);
  vec3 g;
  g.x = a0.x * x0.x + h.x * x0.y;
  g.yz = a0.yz * x12.xz + h.yz * x12.yw;
  return 130.0 * dot(m, g);
}

void main() {
  vec2 uv = vUv;
  float swirlSpeed = 0.5 + u_bass * 2.0;
  float distortion = u_energy * 0.5;

  // Create swirling fluid effect
  float n1 = snoise(uv * 3.0 + vec2(u_time * swirlSpeed * 0.3, u_time * 0.2));
  float n2 = snoise(uv * 5.0 - vec2(u_time * 0.4, u_time * swirlSpeed * 0.2));
  float n3 = snoise(uv * 2.0 + vec2(n1, n2) * distortion);

  // Color based on frequency bands
  vec3 bassColor = vec3(0.8, 0.1, 0.3) * u_bass;
  vec3 midColor = vec3(0.1, 0.5, 0.8) * u_mids;
  vec3 highColor = vec3(0.4, 0.9, 0.3) * u_highs;

  float blend1 = smoothstep(-0.3, 0.3, n1);
  float blend2 = smoothstep(-0.2, 0.4, n2);
  float blend3 = smoothstep(-0.1, 0.5, n3);

  vec3 color = mix(bassColor, midColor, blend1);
  color = mix(color, highColor, blend2);
  color += vec3(0.05, 0.02, 0.1); // Base dark

  // Add brightness from energy
  color *= 0.5 + u_energy * 1.5;

  // Vignette
  float vignette = 1.0 - length(uv - 0.5) * 0.8;
  color *= vignette;

  gl_FragColor = vec4(color, 1.0);
}
`;

/**
 * Fullscreen shader-based fluid simulation driven by audio.
 */
export class FluidSimulation implements BaseScene {
  readonly config: SceneConfig = {
    name: 'Fluid Simulation',
    description: 'Fullscreen shader with fluid colors driven by audio frequency bands',
    category: 'shader',
    parameters: [
      { key: 'swirlIntensity', label: 'Swirl Intensity', type: 'number', default: 1, min: 0.1, max: 3, step: 0.1 },
      { key: 'colorIntensity', label: 'Color Intensity', type: 'number', default: 1, min: 0.1, max: 3, step: 0.1 },
    ],
  };

  private scene: THREE.Scene;
  private camera: THREE.OrthographicCamera;
  private quad: THREE.Mesh | null = null;
  private material: THREE.ShaderMaterial | null = null;
  private time = 0;
  private smoothedBass = 0;
  private smoothedEnergy = 0;
  private smoothedMids = 0;
  private smoothedHighs = 0;

  constructor() {
    this.scene = new THREE.Scene();
    this.camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
  }

  init(_renderer: THREE.WebGLRenderer): void {
    this.createQuad();
  }

  private createQuad(): void {
    const geometry = new THREE.PlaneGeometry(2, 2);
    this.material = new THREE.ShaderMaterial({
      vertexShader,
      fragmentShader,
      uniforms: {
        u_time: { value: 0 },
        u_bass: { value: 0 },
        u_energy: { value: 0 },
        u_mids: { value: 0 },
        u_highs: { value: 0 },
        u_resolution: { value: new THREE.Vector2(1920, 1080) },
      },
    });

    this.quad = new THREE.Mesh(geometry, this.material);
    this.scene.add(this.quad);
  }

  update(deltaTime: number, audioState: AudioState): void {
    this.time += deltaTime;
    this.smoothedBass = lerp(this.smoothedBass, audioState.bass, 0.12);
    this.smoothedEnergy = lerp(this.smoothedEnergy, audioState.energy, 0.1);
    this.smoothedMids = lerp(this.smoothedMids, audioState.mids, 0.1);
    this.smoothedHighs = lerp(this.smoothedHighs, audioState.highs, 0.1);

    if (this.material) {
      this.material.uniforms.u_time.value = this.time;
      this.material.uniforms.u_bass.value = this.smoothedBass;
      this.material.uniforms.u_energy.value = this.smoothedEnergy;
      this.material.uniforms.u_mids.value = this.smoothedMids;
      this.material.uniforms.u_highs.value = this.smoothedHighs;
    }
  }

  resize(width: number, height: number): void {
    if (this.material) {
      this.material.uniforms.u_resolution.value.set(width, height);
    }
  }

  getScene(): THREE.Scene {
    return this.scene;
  }

  getCamera(): THREE.Camera {
    return this.camera;
  }

  setParameter(_key: string, _value: any): void {
    // Parameters handled via uniforms
  }

  dispose(): void {
    if (this.quad) {
      this.quad.geometry.dispose();
    }
    if (this.material) {
      this.material.dispose();
    }
  }
}
