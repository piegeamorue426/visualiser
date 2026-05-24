/**
 * Performance monitoring and adaptive quality management.
 * Tracks FPS, frame time, and adjusts rendering quality to maintain target frame rate.
 */

import { DEFAULTS } from '@config/defaults';
import type { RenderStats } from './types';

export class PerformanceMonitor {
  private frameTimeHistory: number[] = [];
  private readonly historySize = 60;
  private lastFrameTime = 0;
  private currentResolutionScale = 1.0;
  private readonly minResolutionScale = 0.5;
  private readonly maxResolutionScale = 1.0;
  private readonly targetFps: number;
  private readonly downscaleThreshold: number;
  private readonly upscaleThreshold: number;
  private drawCalls = 0;
  private triangles = 0;

  constructor(targetFps?: number) {
    this.targetFps = targetFps ?? DEFAULTS.FPS_TARGET;
    this.downscaleThreshold = this.targetFps * 0.8;
    this.upscaleThreshold = this.targetFps * 0.95;
  }

  /**
   * Record a frame with the given delta time in milliseconds.
   */
  recordFrame(deltaMs: number): void {
    this.lastFrameTime = deltaMs;
    this.frameTimeHistory.push(deltaMs);
    if (this.frameTimeHistory.length > this.historySize) {
      this.frameTimeHistory.shift();
    }
  }

  /**
   * Update draw call and triangle stats from the renderer.
   */
  updateRenderInfo(drawCalls: number, triangles: number): void {
    this.drawCalls = drawCalls;
    this.triangles = triangles;
  }

  /**
   * Get the average FPS over the history window.
   */
  getAverageFps(): number {
    if (this.frameTimeHistory.length === 0) return this.targetFps;
    const avgFrameTime =
      this.frameTimeHistory.reduce((sum, t) => sum + t, 0) /
      this.frameTimeHistory.length;
    if (avgFrameTime === 0) return this.targetFps;
    return 1000 / avgFrameTime;
  }

  /**
   * Evaluate performance and adjust resolution scale if needed.
   * Returns the recommended resolution scale.
   */
  evaluatePerformance(): number {
    const avgFps = this.getAverageFps();

    if (avgFps < this.downscaleThreshold) {
      this.currentResolutionScale = Math.max(
        this.minResolutionScale,
        this.currentResolutionScale - 0.05
      );
    } else if (
      avgFps > this.upscaleThreshold &&
      this.currentResolutionScale < this.maxResolutionScale
    ) {
      this.currentResolutionScale = Math.min(
        this.maxResolutionScale,
        this.currentResolutionScale + 0.02
      );
    }

    return this.currentResolutionScale;
  }

  /**
   * Get the current resolution scale.
   */
  getResolutionScale(): number {
    return this.currentResolutionScale;
  }

  /**
   * Set the resolution scale directly.
   */
  setResolutionScale(scale: number): void {
    this.currentResolutionScale = Math.max(
      this.minResolutionScale,
      Math.min(this.maxResolutionScale, scale)
    );
  }

  /**
   * Get the current render statistics.
   */
  getStats(): RenderStats {
    return {
      fps: Math.round(this.getAverageFps()),
      frameTime: this.lastFrameTime,
      drawCalls: this.drawCalls,
      triangles: this.triangles,
      memoryUsage: 0,
    };
  }

  /**
   * Reset all tracking data.
   */
  reset(): void {
    this.frameTimeHistory = [];
    this.lastFrameTime = 0;
    this.currentResolutionScale = 1.0;
    this.drawCalls = 0;
    this.triangles = 0;
  }
}
