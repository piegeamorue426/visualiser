/**
 * Shader Manager: registry and factory for shader materials.
 * Provides standard audio-reactive uniforms and manages material creation.
 */

import * as THREE from 'three';
import type { AudioState } from '@audio/types';
import { SHADER_PRESETS } from './ShaderPresets';

export interface ShaderUniforms {
  u_time: THREE.IUniform<number>;
  u_bass: THREE.IUniform<number>;
  u_energy: THREE.IUniform<number>;
  u_beat: THREE.IUniform<number>;
  u_bpm: THREE.IUniform<number>;
  u_resolution: THREE.IUniform<THREE.Vector2>;
  u_spectrum: THREE.IUniform<THREE.DataTexture>;
  [key: string]: THREE.IUniform;
}

/**
 * Create audio-reactive uniforms shared across all shader materials.
 */
function createAudioUniforms(): ShaderUniforms {
  const spectrumData = new Uint8Array(256 * 4);
  const spectrumTexture = new THREE.DataTexture(
    spectrumData,
    256,
    1,
    THREE.RGBAFormat
  );
  spectrumTexture.needsUpdate = true;

  return {
    u_time: { value: 0 },
    u_bass: { value: 0 },
    u_energy: { value: 0 },
    u_beat: { value: 0 },
    u_bpm: { value: 0 },
    u_resolution: { value: new THREE.Vector2(1920, 1080) },
    u_spectrum: { value: spectrumTexture },
  };
}

export class ShaderManager {
  private materials: Map<string, THREE.ShaderMaterial> = new Map();
  private audioUniforms: ShaderUniforms;
  private time = 0;

  constructor() {
    this.audioUniforms = createAudioUniforms();
  }

  /**
   * Create a shader material from a preset name or custom shader code.
   */
  createMaterial(
    shaderName: string,
    additionalUniforms?: Record<string, THREE.IUniform>
  ): THREE.ShaderMaterial {
    const preset = SHADER_PRESETS.get(shaderName);

    const uniforms: Record<string, THREE.IUniform> = {
      ...this.audioUniforms,
      ...(preset?.uniforms ?? {}),
      ...(additionalUniforms ?? {}),
    };

    const material = new THREE.ShaderMaterial({
      uniforms,
      vertexShader: preset?.vertexShader ?? defaultVertexShader,
      fragmentShader: preset?.fragmentShader ?? defaultFragmentShader,
      transparent: preset?.transparent ?? true,
      side: preset?.side ?? THREE.FrontSide,
      depthWrite: preset?.depthWrite ?? true,
    });

    this.materials.set(shaderName, material);
    return material;
  }

  /**
   * Update all audio-reactive uniforms from the current audio state.
   */
  updateAudioUniforms(audioState: AudioState): void {
    this.time += 0.016;
    this.audioUniforms.u_time.value = this.time;
    this.audioUniforms.u_bass.value = audioState.bass;
    this.audioUniforms.u_energy.value = audioState.energy;
    this.audioUniforms.u_beat.value = audioState.beatDetected ? 1.0 : 0.0;
    this.audioUniforms.u_bpm.value = audioState.bpm;

    // Update spectrum texture
    const texture = this.audioUniforms.u_spectrum.value;
    const data = texture.image.data as Uint8Array;
    for (let i = 0; i < 256; i++) {
      const val = Math.round((audioState.spectrum[i] ?? 0) * 255);
      data[i * 4] = val;
      data[i * 4 + 1] = val;
      data[i * 4 + 2] = val;
      data[i * 4 + 3] = 255;
    }
    texture.needsUpdate = true;
  }

  /**
   * Set the resolution uniform on all materials.
   */
  setResolution(width: number, height: number): void {
    this.audioUniforms.u_resolution.value.set(width, height);
  }

  /**
   * Get a previously created material by name.
   */
  getMaterial(name: string): THREE.ShaderMaterial | undefined {
    return this.materials.get(name);
  }

  /**
   * Dispose of all materials.
   */
  dispose(): void {
    for (const material of this.materials.values()) {
      material.dispose();
    }
    this.materials.clear();
    this.audioUniforms.u_spectrum.value.dispose();
  }
}

const defaultVertexShader = `
varying vec2 vUv;
varying vec3 vPosition;
void main() {
  vUv = uv;
  vPosition = position;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
`;

const defaultFragmentShader = `
uniform float u_time;
uniform float u_energy;
varying vec2 vUv;
void main() {
  vec3 color = vec3(vUv, 0.5 + 0.5 * sin(u_time));
  color *= 0.5 + 0.5 * u_energy;
  gl_FragColor = vec4(color, 1.0);
}
`;
