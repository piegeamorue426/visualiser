/**
 * Tests for ParticleEmitter - configuration validation and spawn logic.
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { ParticleEmitter } from '../ParticleEmitter';
import { EmitterShape, createDefaultParticleConfig } from '../types';
import type { ParticleSystemConfig } from '../types';
import { createDefaultAudioState } from '@audio/types';

describe('ParticleEmitter', () => {
  let config: ParticleSystemConfig;
  let emitter: ParticleEmitter;

  beforeEach(() => {
    config = createDefaultParticleConfig();
    emitter = new ParticleEmitter(config);
  });

  describe('emit', () => {
    it('should produce particles with valid position values', () => {
      const particle = emitter.emit();
      expect(particle.position).toHaveLength(3);
      particle.position.forEach((v) => {
        expect(typeof v).toBe('number');
        expect(isNaN(v)).toBe(false);
      });
    });

    it('should produce particles with valid velocity values', () => {
      const particle = emitter.emit();
      expect(particle.velocity).toHaveLength(3);
      particle.velocity.forEach((v) => {
        expect(typeof v).toBe('number');
        expect(isNaN(v)).toBe(false);
      });
    });

    it('should produce particles with valid color values', () => {
      const particle = emitter.emit();
      expect(particle.color).toHaveLength(3);
      particle.color.forEach((v) => {
        expect(v).toBeGreaterThanOrEqual(0);
        expect(v).toBeLessThanOrEqual(1);
      });
    });

    it('should produce particles with valid size', () => {
      const particle = emitter.emit();
      expect(particle.size).toBeGreaterThan(0);
      expect(particle.size).toBeGreaterThanOrEqual(config.sizeRange[0] * 0.5);
    });

    it('should produce particles with life within configured range', () => {
      for (let i = 0; i < 100; i++) {
        const particle = emitter.emit();
        expect(particle.life).toBeGreaterThanOrEqual(config.minLife);
        expect(particle.life).toBeLessThanOrEqual(config.maxLife);
      }
    });
  });

  describe('emitter shapes', () => {
    it('should emit from point at origin', () => {
      config.emitterShape = EmitterShape.Point;
      emitter = new ParticleEmitter(config);
      const particle = emitter.emit();
      expect(particle.position).toEqual([0, 0, 0]);
    });

    it('should emit from sphere within unit radius', () => {
      config.emitterShape = EmitterShape.Sphere;
      emitter = new ParticleEmitter(config);

      for (let i = 0; i < 100; i++) {
        const particle = emitter.emit();
        const [x, y, z] = particle.position;
        const dist = Math.sqrt(x * x + y * y + z * z);
        expect(dist).toBeLessThanOrEqual(1.0 + 0.001);
      }
    });

    it('should emit from ring on XZ plane', () => {
      config.emitterShape = EmitterShape.Ring;
      emitter = new ParticleEmitter(config);

      for (let i = 0; i < 100; i++) {
        const particle = emitter.emit();
        expect(particle.position[1]).toBe(0); // Y should be 0
        const dist = Math.sqrt(
          particle.position[0] ** 2 + particle.position[2] ** 2
        );
        expect(dist).toBeCloseTo(1.0, 1);
      }
    });

    it('should emit from plane on XZ surface', () => {
      config.emitterShape = EmitterShape.Plane;
      emitter = new ParticleEmitter(config);

      for (let i = 0; i < 100; i++) {
        const particle = emitter.emit();
        expect(particle.position[1]).toBe(0);
        expect(particle.position[0]).toBeGreaterThanOrEqual(-1.0);
        expect(particle.position[0]).toBeLessThanOrEqual(1.0);
        expect(particle.position[2]).toBeGreaterThanOrEqual(-1.0);
        expect(particle.position[2]).toBeLessThanOrEqual(1.0);
      }
    });

    it('should emit from box within bounds', () => {
      config.emitterShape = EmitterShape.Box;
      emitter = new ParticleEmitter(config);

      for (let i = 0; i < 100; i++) {
        const particle = emitter.emit();
        particle.position.forEach((v) => {
          expect(v).toBeGreaterThanOrEqual(-1.0);
          expect(v).toBeLessThanOrEqual(1.0);
        });
      }
    });
  });

  describe('audio reactivity', () => {
    it('should boost velocity when bass is high', () => {
      config.audioReactivity.velocityFromBass = true;
      emitter = new ParticleEmitter(config);

      const audioState = createDefaultAudioState();
      audioState.bass = 1.0;

      const speeds: number[] = [];
      for (let i = 0; i < 50; i++) {
        const particle = emitter.emit(audioState);
        const speed = Math.sqrt(
          particle.velocity[0] ** 2 +
            particle.velocity[1] ** 2 +
            particle.velocity[2] ** 2
        );
        speeds.push(speed);
      }

      const noAudioSpeeds: number[] = [];
      for (let i = 0; i < 50; i++) {
        const particle = emitter.emit();
        const speed = Math.sqrt(
          particle.velocity[0] ** 2 +
            particle.velocity[1] ** 2 +
            particle.velocity[2] ** 2
        );
        noAudioSpeeds.push(speed);
      }

      const avgWithAudio = speeds.reduce((a, b) => a + b, 0) / speeds.length;
      const avgNoAudio =
        noAudioSpeeds.reduce((a, b) => a + b, 0) / noAudioSpeeds.length;
      expect(avgWithAudio).toBeGreaterThan(avgNoAudio);
    });

    it('should scale size with energy when enabled', () => {
      config.audioReactivity.sizeFromEnergy = true;
      emitter = new ParticleEmitter(config);

      const highEnergy = createDefaultAudioState();
      highEnergy.energy = 1.0;

      const lowEnergy = createDefaultAudioState();
      lowEnergy.energy = 0.0;

      const highSizes: number[] = [];
      const lowSizes: number[] = [];

      for (let i = 0; i < 100; i++) {
        highSizes.push(emitter.emit(highEnergy).size);
        lowSizes.push(emitter.emit(lowEnergy).size);
      }

      const avgHigh = highSizes.reduce((a, b) => a + b, 0) / highSizes.length;
      const avgLow = lowSizes.reduce((a, b) => a + b, 0) / lowSizes.length;
      expect(avgHigh).toBeGreaterThan(avgLow);
    });

    it('should map color from energy when enabled', () => {
      config.audioReactivity.colorFromFrequency = true;
      config.colorStart = [0, 0, 1];
      config.colorEnd = [1, 0, 0];
      emitter = new ParticleEmitter(config);

      const highEnergy = createDefaultAudioState();
      highEnergy.energy = 1.0;

      const particle = emitter.emit(highEnergy);
      // With high energy, color should lean toward colorEnd
      expect(particle.color[0]).toBeCloseTo(1, 1);
      expect(particle.color[2]).toBeCloseTo(0, 1);
    });
  });

  describe('validation', () => {
    it('should return no errors for valid config', () => {
      const errors = ParticleEmitter.validate(config);
      expect(errors).toHaveLength(0);
    });

    it('should catch zero or negative particle count', () => {
      config.count = 0;
      const errors = ParticleEmitter.validate(config);
      expect(errors.length).toBeGreaterThan(0);
      expect(errors[0]).toContain('count');
    });

    it('should catch excessive particle count', () => {
      config.count = 2000000;
      const errors = ParticleEmitter.validate(config);
      expect(errors.length).toBeGreaterThan(0);
      expect(errors[0]).toContain('exceeds maximum');
    });

    it('should catch invalid life values', () => {
      config.minLife = 0;
      const errors = ParticleEmitter.validate(config);
      expect(errors.length).toBeGreaterThan(0);
    });

    it('should catch maxLife less than minLife', () => {
      config.minLife = 5;
      config.maxLife = 2;
      const errors = ParticleEmitter.validate(config);
      expect(errors.length).toBeGreaterThan(0);
    });

    it('should catch negative spawn rate', () => {
      config.spawnRate = -1;
      const errors = ParticleEmitter.validate(config);
      expect(errors.length).toBeGreaterThan(0);
    });

    it('should catch invalid speed range', () => {
      config.speedRange = [5, 1];
      const errors = ParticleEmitter.validate(config);
      expect(errors.length).toBeGreaterThan(0);
    });

    it('should catch invalid size range', () => {
      config.sizeRange = [0, 5];
      const errors = ParticleEmitter.validate(config);
      expect(errors.length).toBeGreaterThan(0);
    });

    it('should catch spread angle out of range', () => {
      config.spreadAngle = -1;
      let errors = ParticleEmitter.validate(config);
      expect(errors.length).toBeGreaterThan(0);

      config.spreadAngle = Math.PI + 0.1;
      errors = ParticleEmitter.validate(config);
      expect(errors.length).toBeGreaterThan(0);
    });
  });
});
