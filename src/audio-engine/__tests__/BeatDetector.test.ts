import { describe, it, expect } from 'vitest';
import { BeatDetector } from '../BeatDetector';

describe('BeatDetector', () => {
  it('should not detect beats without sufficient history', () => {
    const detector = new BeatDetector();
    const result = detector.detect(0.5, 0);
    expect(result.detected).toBe(false);
  });

  it('should detect a beat on sudden energy increase', () => {
    const detector = new BeatDetector({
      historySize: 10,
      thresholdMultiplier: 1.2,
      minBeatInterval: 100,
    });

    // Feed low energy for several frames to build history
    let time = 0;
    for (let i = 0; i < 10; i++) {
      detector.detect(0.1, time);
      time += 50;
    }

    // Sudden spike should trigger a beat
    const result = detector.detect(0.8, time);
    expect(result.detected).toBe(true);
    expect(result.strength).toBeGreaterThan(0);
  });

  it('should respect minimum beat interval', () => {
    const detector = new BeatDetector({
      historySize: 10,
      thresholdMultiplier: 1.0,
      minBeatInterval: 300,
    });

    let time = 0;

    // Build history
    for (let i = 0; i < 10; i++) {
      detector.detect(0.1, time);
      time += 50;
    }

    // First beat
    const first = detector.detect(0.9, time);
    expect(first.detected).toBe(true);
    time += 50;

    // Drop back down
    detector.detect(0.1, time);
    time += 50;

    // Another spike too soon (within 300ms)
    const tooSoon = detector.detect(0.9, time);
    expect(tooSoon.detected).toBe(false);
  });

  it('should not detect beats during steady energy', () => {
    const detector = new BeatDetector({ historySize: 20 });

    let time = 0;
    let detectedCount = 0;

    // Feed constant energy
    for (let i = 0; i < 50; i++) {
      const result = detector.detect(0.5, time);
      if (result.detected) detectedCount++;
      time += 50;
    }

    // Should detect very few or no beats with constant energy
    expect(detectedCount).toBeLessThanOrEqual(1);
  });

  it('should detect regular beat patterns', () => {
    const detector = new BeatDetector({
      historySize: 15,
      thresholdMultiplier: 1.2,
      minBeatInterval: 200,
    });

    let time = 0;
    let detectedCount = 0;

    // Simulate a beat pattern: low energy with periodic spikes every 500ms
    for (let i = 0; i < 100; i++) {
      const isBeatFrame = i % 10 === 0 && i > 0; // every 10th frame
      const energy = isBeatFrame ? 0.8 : 0.1;

      const result = detector.detect(energy, time);
      if (result.detected) detectedCount++;
      time += 50;
    }

    // Should detect multiple beats
    expect(detectedCount).toBeGreaterThan(3);
  });

  it('should track confidence over time', () => {
    const detector = new BeatDetector({
      historySize: 10,
      minBeatInterval: 200,
    });

    let time = 0;

    // Build history
    for (let i = 0; i < 10; i++) {
      detector.detect(0.1, time);
      time += 50;
    }

    // First beat
    const first = detector.detect(0.8, time);
    const confidenceAfterFirst = first.confidence;
    time += 300;

    // Low energy period
    for (let i = 0; i < 5; i++) {
      detector.detect(0.1, time);
      time += 50;
    }

    // Second beat
    const second = detector.detect(0.8, time);

    // Confidence should increase with detected beats
    expect(second.confidence).toBeGreaterThan(0);

    // After many non-beat frames, confidence should decay
    time += 300;
    for (let i = 0; i < 30; i++) {
      detector.detect(0.1, time);
      time += 50;
    }
    const afterDecay = detector.detect(0.1, time);
    expect(afterDecay.confidence).toBeLessThan(confidenceAfterFirst);
  });

  it('should provide beat intervals', () => {
    const detector = new BeatDetector({
      historySize: 10,
      thresholdMultiplier: 1.0,
      minBeatInterval: 100,
    });

    let time = 0;

    // Build history
    for (let i = 0; i < 10; i++) {
      detector.detect(0.05, time);
      time += 50;
    }

    // Create two beats separated by known interval
    detector.detect(0.9, time);
    time += 500;

    // Low energy between
    for (let i = 0; i < 8; i++) {
      detector.detect(0.05, time);
      time += 50;
    }

    detector.detect(0.9, time);

    const intervals = detector.getBeatIntervals();
    // Should have at least one interval
    expect(intervals.length).toBeGreaterThanOrEqual(1);
  });

  it('should reset cleanly', () => {
    const detector = new BeatDetector();

    detector.detect(0.5, 100);
    detector.detect(0.8, 200);

    detector.reset();

    const result = detector.detect(0.1, 0);
    expect(result.detected).toBe(false);
    expect(result.lastBeatTime).toBe(0);
    expect(detector.getBeatIntervals()).toHaveLength(0);
  });
});
