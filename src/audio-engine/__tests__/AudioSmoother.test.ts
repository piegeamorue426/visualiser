import { describe, it, expect } from 'vitest';
import { AudioSmoother, createSmootherBank } from '../AudioSmoother';

describe('AudioSmoother', () => {
  it('should start at zero', () => {
    const smoother = new AudioSmoother();
    expect(smoother.getValue()).toBe(0);
  });

  it('should approach the target value over time', () => {
    const smoother = new AudioSmoother({ attackFrames: 4, releaseFrames: 8 });

    // Feed a constant value of 1.0
    let value = 0;
    for (let i = 0; i < 20; i++) {
      value = smoother.smooth(1.0);
    }

    // After many frames, should be very close to 1.0
    expect(value).toBeGreaterThan(0.95);
  });

  it('should rise faster with shorter attack time', () => {
    const fastAttack = new AudioSmoother({ attackFrames: 1, releaseFrames: 8 });
    const slowAttack = new AudioSmoother({ attackFrames: 8, releaseFrames: 8 });

    // Feed same input to both
    let fastValue = 0;
    let slowValue = 0;
    for (let i = 0; i < 5; i++) {
      fastValue = fastAttack.smooth(1.0);
      slowValue = slowAttack.smooth(1.0);
    }

    // Fast attack should reach target sooner
    expect(fastValue).toBeGreaterThan(slowValue);
  });

  it('should fall slower with longer release time', () => {
    const shortRelease = new AudioSmoother({ attackFrames: 1, releaseFrames: 2 });
    const longRelease = new AudioSmoother({ attackFrames: 1, releaseFrames: 16 });

    // First bring both to 1.0
    for (let i = 0; i < 30; i++) {
      shortRelease.smooth(1.0);
      longRelease.smooth(1.0);
    }

    // Now feed 0 and compare decay
    let shortValue = 0;
    let longValue = 0;
    for (let i = 0; i < 5; i++) {
      shortValue = shortRelease.smooth(0);
      longValue = longRelease.smooth(0);
    }

    // Long release should retain more of the old value
    expect(longValue).toBeGreaterThan(shortValue);
  });

  it('should smooth out jittery input', () => {
    const smoother = new AudioSmoother({ attackFrames: 4, releaseFrames: 4 });

    // Feed alternating high/low values
    const outputs: number[] = [];
    for (let i = 0; i < 20; i++) {
      const input = i % 2 === 0 ? 0.8 : 0.2;
      outputs.push(smoother.smooth(input));
    }

    // Output variance should be less than input variance
    const inputVariance = 0.3 * 0.3; // (0.8 - 0.5)^2 = (0.2 - 0.5)^2 = 0.09
    const outputMean = outputs.reduce((s, v) => s + v, 0) / outputs.length;
    const outputVariance =
      outputs.reduce((s, v) => s + (v - outputMean) ** 2, 0) / outputs.length;

    expect(outputVariance).toBeLessThan(inputVariance);
  });

  it('should reset to zero', () => {
    const smoother = new AudioSmoother();
    smoother.smooth(1.0);
    smoother.smooth(1.0);

    expect(smoother.getValue()).toBeGreaterThan(0);

    smoother.reset();
    expect(smoother.getValue()).toBe(0);
  });

  it('should allow setting value directly', () => {
    const smoother = new AudioSmoother();
    smoother.setValue(0.75);
    expect(smoother.getValue()).toBe(0.75);
  });

  it('should update options dynamically', () => {
    const smoother = new AudioSmoother({ attackFrames: 8, releaseFrames: 8 });

    // Smooth a few times with slow attack
    smoother.smooth(1.0);
    smoother.smooth(1.0);
    const slowValue = smoother.getValue();

    // Reset and use fast attack
    smoother.reset();
    smoother.setOptions({ attackFrames: 1 });
    smoother.smooth(1.0);
    smoother.smooth(1.0);
    const fastValue = smoother.getValue();

    expect(fastValue).toBeGreaterThan(slowValue);
  });
});

describe('createSmootherBank', () => {
  it('should create the specified number of smoothers', () => {
    const bank = createSmootherBank(8);
    expect(bank).toHaveLength(8);
  });

  it('should create independent smoothers', () => {
    const bank = createSmootherBank(3);

    bank[0].smooth(1.0);
    bank[1].smooth(0.5);
    bank[2].smooth(0.0);

    expect(bank[0].getValue()).toBeGreaterThan(bank[1].getValue());
    expect(bank[1].getValue()).toBeGreaterThan(bank[2].getValue());
  });

  it('should apply options to all smoothers', () => {
    const bank = createSmootherBank(3, { attackFrames: 1, releaseFrames: 1 });

    // With very short attack/release, should converge very quickly
    for (let i = 0; i < 10; i++) {
      bank[0].smooth(1.0);
    }
    expect(bank[0].getValue()).toBeGreaterThan(0.99);
  });
});
