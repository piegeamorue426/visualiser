/**
 * Composable post-processing stack using Three.js EffectComposer.
 * Supports toggling and configuring individual effects with audio reactivity.
 */

import * as THREE from 'three';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js';
import { ShaderPass } from 'three/examples/jsm/postprocessing/ShaderPass.js';
import type { PostProcessingConfig } from './types';
import { createDefaultPostProcessingConfig } from './types';
import type { AudioState } from '@audio/types';

function createChromaticAberrationShader() {
  return {
    uniforms: {
      tDiffuse: { value: null },
      u_offset: { value: 0.002 },
      u_energy: { value: 0.0 },
    },
    vertexShader: `
      varying vec2 vUv;
      void main() {
        vUv = uv;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `,
    fragmentShader: `
      uniform sampler2D tDiffuse;
      uniform float u_offset;
      uniform float u_energy;
      varying vec2 vUv;
      void main() {
        float offset = u_offset * (1.0 + u_energy * 2.0);
        float r = texture2D(tDiffuse, vUv + vec2(offset, 0.0)).r;
        float g = texture2D(tDiffuse, vUv).g;
        float b = texture2D(tDiffuse, vUv - vec2(offset, 0.0)).b;
        gl_FragColor = vec4(r, g, b, 1.0);
      }
    `,
  };
}

function createVignetteShader() {
  return {
    uniforms: {
      tDiffuse: { value: null },
      u_intensity: { value: 0.8 },
      u_smoothness: { value: 0.4 },
      u_bass: { value: 0.0 },
    },
    vertexShader: `
      varying vec2 vUv;
      void main() {
        vUv = uv;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `,
    fragmentShader: `
      uniform sampler2D tDiffuse;
      uniform float u_intensity;
      uniform float u_smoothness;
      uniform float u_bass;
      varying vec2 vUv;
      void main() {
        vec4 color = texture2D(tDiffuse, vUv);
        vec2 center = vUv - 0.5;
        float dist = length(center);
        float strength = u_intensity * (1.0 + u_bass * 0.5);
        float vignette = smoothstep(0.5, 0.5 - u_smoothness, dist * strength);
        gl_FragColor = vec4(color.rgb * vignette, color.a);
      }
    `,
  };
}

function createFilmGrainShader() {
  return {
    uniforms: {
      tDiffuse: { value: null },
      u_time: { value: 0.0 },
      u_intensity: { value: 0.05 },
    },
    vertexShader: `
      varying vec2 vUv;
      void main() {
        vUv = uv;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `,
    fragmentShader: `
      uniform sampler2D tDiffuse;
      uniform float u_time;
      uniform float u_intensity;
      varying vec2 vUv;
      float rand(vec2 co) {
        return fract(sin(dot(co, vec2(12.9898, 78.233))) * 43758.5453);
      }
      void main() {
        vec4 color = texture2D(tDiffuse, vUv);
        float noise = rand(vUv + u_time) * 2.0 - 1.0;
        color.rgb += noise * u_intensity;
        gl_FragColor = color;
      }
    `,
  };
}

function createColorGradingShader() {
  return {
    uniforms: {
      tDiffuse: { value: null },
      u_hueShift: { value: 0.0 },
      u_saturation: { value: 1.0 },
      u_contrast: { value: 1.0 },
    },
    vertexShader: `
      varying vec2 vUv;
      void main() {
        vUv = uv;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `,
    fragmentShader: `
      uniform sampler2D tDiffuse;
      uniform float u_hueShift;
      uniform float u_saturation;
      uniform float u_contrast;
      varying vec2 vUv;
      vec3 rgb2hsv(vec3 c) {
        vec4 K = vec4(0.0, -1.0/3.0, 2.0/3.0, -1.0);
        vec4 p = mix(vec4(c.bg, K.wz), vec4(c.gb, K.xy), step(c.b, c.g));
        vec4 q = mix(vec4(p.xyw, c.r), vec4(c.r, p.yzx), step(p.x, c.r));
        float d = q.x - min(q.w, q.y);
        float e = 1.0e-10;
        return vec3(abs(q.z + (q.w - q.y) / (6.0 * d + e)), d / (q.x + e), q.x);
      }
      vec3 hsv2rgb(vec3 c) {
        vec4 K = vec4(1.0, 2.0/3.0, 1.0/3.0, 3.0);
        vec3 p = abs(fract(c.xxx + K.xyz) * 6.0 - K.www);
        return c.z * mix(K.xxx, clamp(p - K.xxx, 0.0, 1.0), c.y);
      }
      void main() {
        vec4 color = texture2D(tDiffuse, vUv);
        vec3 hsv = rgb2hsv(color.rgb);
        hsv.x = fract(hsv.x + u_hueShift);
        hsv.y *= u_saturation;
        vec3 rgb = hsv2rgb(hsv);
        rgb = (rgb - 0.5) * u_contrast + 0.5;
        gl_FragColor = vec4(rgb, color.a);
      }
    `,
  };
}

function createDistortionShader() {
  return {
    uniforms: {
      tDiffuse: { value: null },
      u_time: { value: 0.0 },
      u_amplitude: { value: 0.01 },
      u_frequency: { value: 4.0 },
      u_bass: { value: 0.0 },
    },
    vertexShader: `
      varying vec2 vUv;
      void main() {
        vUv = uv;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `,
    fragmentShader: `
      uniform sampler2D tDiffuse;
      uniform float u_time;
      uniform float u_amplitude;
      uniform float u_frequency;
      uniform float u_bass;
      varying vec2 vUv;
      void main() {
        float amp = u_amplitude * (1.0 + u_bass * 3.0);
        vec2 offset = vec2(
          sin(vUv.y * u_frequency * 6.283 + u_time) * amp,
          cos(vUv.x * u_frequency * 6.283 + u_time) * amp
        );
        gl_FragColor = texture2D(tDiffuse, vUv + offset);
      }
    `,
  };
}

export class PostProcessingStack {
  private composer: EffectComposer;
  private renderPass: RenderPass;
  private bloomPass: UnrealBloomPass;
  private chromaticAberrationPass: ShaderPass;
  private vignettePass: ShaderPass;
  private filmGrainPass: ShaderPass;
  private colorGradingPass: ShaderPass;
  private distortionPass: ShaderPass;
  private config: PostProcessingConfig;
  private enabled = true;
  private time = 0;

  constructor(renderer: THREE.WebGLRenderer, width: number, height: number) {
    this.config = createDefaultPostProcessingConfig();

    this.composer = new EffectComposer(renderer);

    // Render pass (always first)
    this.renderPass = new RenderPass(new THREE.Scene(), new THREE.Camera());
    this.composer.addPass(this.renderPass);

    // Bloom
    this.bloomPass = new UnrealBloomPass(
      new THREE.Vector2(width, height),
      this.config.bloom.intensity,
      0.4,
      this.config.bloom.threshold
    );
    this.bloomPass.enabled = this.config.bloom.enabled;
    this.composer.addPass(this.bloomPass);

    // Chromatic Aberration
    this.chromaticAberrationPass = new ShaderPass(createChromaticAberrationShader());
    this.chromaticAberrationPass.enabled = this.config.chromaticAberration.enabled;
    this.composer.addPass(this.chromaticAberrationPass);

    // Vignette
    this.vignettePass = new ShaderPass(createVignetteShader());
    this.vignettePass.enabled = this.config.vignette.enabled;
    this.composer.addPass(this.vignettePass);

    // Film Grain
    this.filmGrainPass = new ShaderPass(createFilmGrainShader());
    this.filmGrainPass.enabled = this.config.filmGrain.enabled;
    this.composer.addPass(this.filmGrainPass);

    // Color Grading
    this.colorGradingPass = new ShaderPass(createColorGradingShader());
    this.colorGradingPass.enabled = this.config.colorGrading.enabled;
    this.composer.addPass(this.colorGradingPass);

    // Distortion
    this.distortionPass = new ShaderPass(createDistortionShader());
    this.distortionPass.enabled = this.config.distortion.enabled;
    this.composer.addPass(this.distortionPass);
  }

  /**
   * Render the scene with post-processing effects applied.
   */
  render(scene: THREE.Scene, camera: THREE.Camera, audioState?: AudioState): void {
    this.renderPass.scene = scene;
    this.renderPass.camera = camera;

    this.time += 0.016;

    if (audioState) {
      this.updateAudioUniforms(audioState);
    }

    this.filmGrainPass.uniforms['u_time'].value = this.time;
    this.distortionPass.uniforms['u_time'].value = this.time;

    this.composer.render();
  }

  /**
   * Update shader uniforms based on audio state.
   */
  private updateAudioUniforms(audioState: AudioState): void {
    this.chromaticAberrationPass.uniforms['u_energy'].value = audioState.energy;
    this.vignettePass.uniforms['u_bass'].value = audioState.bass;
    this.distortionPass.uniforms['u_bass'].value = audioState.bass;
  }

  /**
   * Configure the post-processing effects.
   */
  configure(config: PostProcessingConfig): void {
    this.config = config;

    // Bloom
    this.bloomPass.enabled = config.bloom.enabled;
    this.bloomPass.strength = config.bloom.intensity;
    this.bloomPass.threshold = config.bloom.threshold;
    this.bloomPass.radius = config.bloom.radius;

    // Chromatic Aberration
    this.chromaticAberrationPass.enabled = config.chromaticAberration.enabled;
    this.chromaticAberrationPass.uniforms['u_offset'].value =
      config.chromaticAberration.offset;

    // Vignette
    this.vignettePass.enabled = config.vignette.enabled;
    this.vignettePass.uniforms['u_intensity'].value = config.vignette.intensity;
    this.vignettePass.uniforms['u_smoothness'].value = config.vignette.smoothness;

    // Film Grain
    this.filmGrainPass.enabled = config.filmGrain.enabled;
    this.filmGrainPass.uniforms['u_intensity'].value = config.filmGrain.intensity;

    // Color Grading
    this.colorGradingPass.enabled = config.colorGrading.enabled;
    this.colorGradingPass.uniforms['u_hueShift'].value = config.colorGrading.hueShift;
    this.colorGradingPass.uniforms['u_saturation'].value =
      config.colorGrading.saturation;
    this.colorGradingPass.uniforms['u_contrast'].value = config.colorGrading.contrast;

    // Distortion
    this.distortionPass.enabled = config.distortion.enabled;
    this.distortionPass.uniforms['u_amplitude'].value = config.distortion.amplitude;
    this.distortionPass.uniforms['u_frequency'].value = config.distortion.frequency;
  }

  /**
   * Check if post-processing is enabled.
   */
  isEnabled(): boolean {
    return this.enabled;
  }

  /**
   * Get the current post-processing configuration.
   */
  getConfig(): PostProcessingConfig {
    return { ...this.config };
  }

  /**
   * Enable or disable the entire post-processing stack.
   */
  setEnabled(enabled: boolean): void {
    this.enabled = enabled;
  }

  /**
   * Resize the post-processing render targets.
   */
  resize(width: number, height: number): void {
    this.composer.setSize(width, height);
    this.bloomPass.resolution.set(width, height);
  }

  /**
   * Dispose of all resources.
   */
  dispose(): void {
    this.composer.dispose();
  }
}
