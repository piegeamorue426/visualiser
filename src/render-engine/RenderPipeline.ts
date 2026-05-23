/**
 * Main rendering pipeline wrapping Three.js WebGLRenderer.
 * Handles initialization, render loop, adaptive quality, and post-processing integration.
 */

import * as THREE from 'three';
import { DEFAULTS } from '@config/defaults';
import { PerformanceMonitor } from './PerformanceMonitor';
import { PostProcessingStack } from './PostProcessingStack';
import type { RenderConfig, RenderStats, PostProcessingConfig } from './types';
import { createDefaultRenderConfig, createDefaultPostProcessingConfig } from './types';
import type { AudioState } from '@audio/types';

export class RenderPipeline {
  private renderer: THREE.WebGLRenderer;
  private performanceMonitor: PerformanceMonitor;
  private postProcessing: PostProcessingStack;
  private config: RenderConfig;
  private lastTime = 0;
  private lastAppliedScale = 1.0;

  constructor(canvas: HTMLCanvasElement, config?: Partial<RenderConfig>) {
    this.config = { ...createDefaultRenderConfig(), ...config };

    this.renderer = new THREE.WebGLRenderer({
      canvas,
      antialias: this.config.antialias,
      alpha: this.config.alpha,
      powerPreference: 'high-performance',
    });

    this.renderer.setSize(this.config.width, this.config.height);
    this.renderer.setPixelRatio(this.config.pixelRatio);
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.0;

    this.performanceMonitor = new PerformanceMonitor(DEFAULTS.FPS_TARGET);
    this.postProcessing = new PostProcessingStack(
      this.renderer,
      this.config.width,
      this.config.height
    );
  }

  /**
   * Render a scene with the given camera and optional audio state for post-processing.
   */
  render(scene: THREE.Scene, camera: THREE.Camera, audioState?: AudioState): void {
    const now = performance.now();
    const delta = this.lastTime > 0 ? now - this.lastTime : 16.67;
    this.lastTime = now;

    this.performanceMonitor.recordFrame(delta);

    if (this.postProcessing.isEnabled()) {
      this.postProcessing.render(scene, camera, audioState);
    } else {
      this.renderer.render(scene, camera);
    }

    const info = this.renderer.info;
    this.performanceMonitor.updateRenderInfo(
      info.render.calls,
      info.render.triangles
    );

    // Evaluate adaptive quality and apply resolution scaling
    const recommendedScale = this.performanceMonitor.evaluatePerformance();
    if (recommendedScale !== this.lastAppliedScale) {
      this.lastAppliedScale = recommendedScale;
      const w = Math.round(this.config.width * recommendedScale);
      const h = Math.round(this.config.height * recommendedScale);
      this.renderer.setSize(w, h, false);
      this.postProcessing.resize(w, h);
    }
  }

  /**
   * Resize the renderer and post-processing stack.
   */
  resize(width: number, height: number): void {
    this.config.width = width;
    this.config.height = height;
    this.renderer.setSize(width, height);
    this.postProcessing.resize(width, height);
  }

  /**
   * Set the resolution quality scale (0.5 to 1.0).
   */
  setQuality(scale: number): void {
    this.performanceMonitor.setResolutionScale(scale);
    const w = Math.round(this.config.width * scale);
    const h = Math.round(this.config.height * scale);
    this.renderer.setSize(w, h, false);
    this.postProcessing.resize(w, h);
  }

  /**
   * Configure post-processing effects.
   */
  setPostProcessingConfig(config: Partial<PostProcessingConfig>): void {
    const merged = { ...createDefaultPostProcessingConfig(), ...config };
    this.postProcessing.configure(merged);
  }

  /**
   * Get the current render statistics.
   */
  getStats(): RenderStats {
    return this.performanceMonitor.getStats();
  }

  /**
   * Get the underlying Three.js renderer.
   */
  getRenderer(): THREE.WebGLRenderer {
    return this.renderer;
  }

  /**
   * Get the post-processing stack.
   */
  getPostProcessing(): PostProcessingStack {
    return this.postProcessing;
  }

  /**
   * Dispose of all resources.
   */
  dispose(): void {
    this.postProcessing.dispose();
    this.renderer.dispose();
  }
}
