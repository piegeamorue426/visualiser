/**
 * Particle emitter: configures how particles are spawned.
 * Supports multiple emitter shapes and audio-reactive properties.
 */

import type { AudioState } from '@audio/types';
import { EmitterShape } from './types';
import type { ParticleSystemConfig } from './types';

export interface SpawnedParticle {
  position: [number, number, number];
  velocity: [number, number, number];
  color: [number, number, number];
  size: number;
  life: number;
}

export class ParticleEmitter {
  private config: ParticleSystemConfig;

  constructor(config: ParticleSystemConfig) {
    this.config = config;
  }

  /**
   * Emit a single particle based on configuration and current audio state.
   */
  emit(audioState?: AudioState): SpawnedParticle {
    const position = this.getSpawnPosition();
    const velocity = this.getInitialVelocity(audioState);
    const color = this.getColor(audioState);
    const size = this.getSize(audioState);
    const life = this.getLife();

    return { position, velocity, color, size, life };
  }

  /**
   * Get the spawn position based on emitter shape.
   */
  getSpawnPosition(): [number, number, number] {
    switch (this.config.emitterShape) {
      case EmitterShape.Point:
        return [0, 0, 0];

      case EmitterShape.Sphere: {
        const theta = Math.random() * Math.PI * 2;
        const phi = Math.acos(2 * Math.random() - 1);
        const r = Math.cbrt(Math.random());
        return [
          r * Math.sin(phi) * Math.cos(theta),
          r * Math.sin(phi) * Math.sin(theta),
          r * Math.cos(phi),
        ];
      }

      case EmitterShape.Ring: {
        const angle = Math.random() * Math.PI * 2;
        const radius = 1.0;
        return [
          Math.cos(angle) * radius,
          0,
          Math.sin(angle) * radius,
        ];
      }

      case EmitterShape.Plane: {
        return [
          (Math.random() - 0.5) * 2.0,
          0,
          (Math.random() - 0.5) * 2.0,
        ];
      }

      case EmitterShape.Box: {
        return [
          (Math.random() - 0.5) * 2.0,
          (Math.random() - 0.5) * 2.0,
          (Math.random() - 0.5) * 2.0,
        ];
      }

      default:
        return [0, 0, 0];
    }
  }

  /**
   * Calculate initial velocity with optional audio reactivity.
   */
  getInitialVelocity(audioState?: AudioState): [number, number, number] {
    const [minSpeed, maxSpeed] = this.config.speedRange;
    let speed = minSpeed + Math.random() * (maxSpeed - minSpeed);

    // Audio-reactive velocity boost
    if (audioState && this.config.audioReactivity.velocityFromBass) {
      speed *= 1.0 + audioState.bass * 2.0;
    }

    // Random direction within spread angle
    const spreadAngle = this.config.spreadAngle;
    const theta = Math.random() * Math.PI * 2;
    const phi = Math.random() * spreadAngle;

    return [
      speed * Math.sin(phi) * Math.cos(theta),
      speed * Math.cos(phi),
      speed * Math.sin(phi) * Math.sin(theta),
    ];
  }

  /**
   * Calculate particle color with optional frequency mapping.
   */
  getColor(audioState?: AudioState): [number, number, number] {
    const [r1, g1, b1] = this.config.colorStart;
    const [r2, g2, b2] = this.config.colorEnd;
    let t = Math.random();

    if (audioState && this.config.audioReactivity.colorFromFrequency) {
      t = audioState.energy;
    }

    return [
      r1 + (r2 - r1) * t,
      g1 + (g2 - g1) * t,
      b1 + (b2 - b1) * t,
    ];
  }

  /**
   * Calculate particle size with optional energy scaling.
   */
  getSize(audioState?: AudioState): number {
    const [minSize, maxSize] = this.config.sizeRange;
    let size = minSize + Math.random() * (maxSize - minSize);

    if (audioState && this.config.audioReactivity.sizeFromEnergy) {
      size *= 0.5 + audioState.energy * 1.5;
    }

    return size;
  }

  /**
   * Calculate particle lifetime.
   */
  getLife(): number {
    return (
      this.config.minLife +
      Math.random() * (this.config.maxLife - this.config.minLife)
    );
  }

  /**
   * Validate emitter configuration.
   */
  static validate(config: ParticleSystemConfig): string[] {
    const errors: string[] = [];

    if (config.count <= 0) {
      errors.push('Particle count must be greater than 0');
    }
    if (config.count > 1000000) {
      errors.push('Particle count exceeds maximum of 1,000,000');
    }
    if (config.minLife <= 0) {
      errors.push('Minimum life must be greater than 0');
    }
    if (config.maxLife < config.minLife) {
      errors.push('Maximum life must be greater than or equal to minimum life');
    }
    if (config.spawnRate < 0) {
      errors.push('Spawn rate must be non-negative');
    }
    if (config.speedRange[0] < 0 || config.speedRange[1] < config.speedRange[0]) {
      errors.push('Speed range must be [min, max] with non-negative values');
    }
    if (config.sizeRange[0] <= 0 || config.sizeRange[1] < config.sizeRange[0]) {
      errors.push('Size range must be [min, max] with positive values');
    }
    if (config.spreadAngle < 0 || config.spreadAngle > Math.PI) {
      errors.push('Spread angle must be between 0 and PI');
    }

    return errors;
  }
}
