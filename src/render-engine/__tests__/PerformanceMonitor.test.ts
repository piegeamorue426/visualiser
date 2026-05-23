/**
 * Tests for PerformanceMonitor - FPS tracking and adaptive quality.
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { PerformanceMonitor } from '../PerformanceMonitor';

describe('PerformanceMonitor', () => {
  let monitor: PerformanceMonitor;

  beforeEach(() => {
    monitor = new PerformanceMonitor(60);
  });

  it('should initialize with default values', () => {
    const stats = monitor.getStats();
    expect(stats.fps).toBe(60);
    expect(stats.frameTime).toBe(0);
    expect(stats.drawCalls).toBe(0);
    expect(stats.triangles).toBe(0);
  });

  it('should track FPS from frame times', () => {
    // Simulate 60fps (16.67ms per frame)
    for (let i = 0; i < 60; i++) {
      monitor.recordFrame(16.67);
    }
    const stats = monitor.getStats();
    expect(stats.fps).toBeCloseTo(60, 0);
  });

  it('should detect low FPS correctly', () => {
    // Simulate 30fps (33.33ms per frame)
    for (let i = 0; i < 60; i++) {
      monitor.recordFrame(33.33);
    }
    const stats = monitor.getStats();
    expect(stats.fps).toBeCloseTo(30, 0);
  });

  it('should track render info', () => {
    monitor.updateRenderInfo(150, 50000);
    const stats = monitor.getStats();
    expect(stats.drawCalls).toBe(150);
    expect(stats.triangles).toBe(50000);
  });

  it('should trigger quality reduction when FPS is low', () => {
    // Simulate very low FPS (below 80% of target = below 48fps)
    for (let i = 0; i < 60; i++) {
      monitor.recordFrame(30); // ~33fps
    }

    const scale = monitor.evaluatePerformance();
    expect(scale).toBeLessThan(1.0);
  });

  it('should maintain scale when FPS is good', () => {
    // Simulate target FPS
    for (let i = 0; i < 60; i++) {
      monitor.recordFrame(16.67); // 60fps
    }

    const scale = monitor.evaluatePerformance();
    expect(scale).toBe(1.0);
  });

  it('should recover quality when FPS improves', () => {
    // First drop quality
    for (let i = 0; i < 60; i++) {
      monitor.recordFrame(30);
    }
    monitor.evaluatePerformance();
    const lowScale = monitor.getResolutionScale();

    // Then reset and provide good frames
    monitor.reset();
    for (let i = 0; i < 60; i++) {
      monitor.recordFrame(16.67);
    }
    monitor.evaluatePerformance();
    const highScale = monitor.getResolutionScale();

    // After reset it should be back to 1.0
    expect(highScale).toBeGreaterThan(lowScale);
  });

  it('should not drop below minimum resolution scale', () => {
    // Simulate extremely low FPS for many evaluations
    for (let i = 0; i < 60; i++) {
      monitor.recordFrame(100); // 10fps
    }

    // Evaluate multiple times to try to drive scale down
    for (let i = 0; i < 50; i++) {
      monitor.evaluatePerformance();
    }

    expect(monitor.getResolutionScale()).toBeGreaterThanOrEqual(0.5);
  });

  it('should allow manual setting of resolution scale', () => {
    monitor.setResolutionScale(0.75);
    expect(monitor.getResolutionScale()).toBe(0.75);
  });

  it('should clamp resolution scale to valid range', () => {
    monitor.setResolutionScale(0.1);
    expect(monitor.getResolutionScale()).toBe(0.5);

    monitor.setResolutionScale(2.0);
    expect(monitor.getResolutionScale()).toBe(1.0);
  });

  it('should handle history window size correctly', () => {
    // Add more frames than history size
    for (let i = 0; i < 120; i++) {
      monitor.recordFrame(16.67);
    }

    // Should still report correctly (only uses last 60 frames)
    const stats = monitor.getStats();
    expect(stats.fps).toBeCloseTo(60, 0);
  });

  it('should reset all state correctly', () => {
    monitor.recordFrame(20);
    monitor.updateRenderInfo(100, 5000);
    monitor.setResolutionScale(0.7);

    monitor.reset();

    const stats = monitor.getStats();
    expect(stats.fps).toBe(60); // Default when no history
    expect(stats.frameTime).toBe(0);
    expect(stats.drawCalls).toBe(0);
    expect(stats.triangles).toBe(0);
    expect(monitor.getResolutionScale()).toBe(1.0);
  });
});
