/**
 * GPU-accelerated particle system using Three.js Points with BufferGeometry.
 * Supports 100k+ particles with custom vertex/fragment shaders.
 */

import * as THREE from 'three';
import type { AudioState } from '@audio/types';
import type { ParticleSystemConfig } from './types';
import { createDefaultParticleConfig } from './types';
import { ParticleEmitter } from './ParticleEmitter';

import particleVertShader from './particle.vert.glsl';
import particleFragShader from './particle.frag.glsl';

export class GPUParticleSystem {
  private points: THREE.Points;
  private geometry: THREE.BufferGeometry;
  private material: THREE.ShaderMaterial;
  private config: ParticleSystemConfig;
  private emitter: ParticleEmitter;

  // Buffer attributes
  private positions: Float32Array;
  private velocities: Float32Array;
  private colors: Float32Array;
  private sizes: Float32Array;
  private lives: Float32Array;
  private maxLives: Float32Array;

  private particleCount: number;
  private nextSpawnIndex = 0;
  private spawnAccumulator = 0;

  constructor(config?: Partial<ParticleSystemConfig>) {
    this.config = { ...createDefaultParticleConfig(), ...config };
    this.particleCount = this.config.count;
    this.emitter = new ParticleEmitter(this.config);

    // Initialize buffers
    this.positions = new Float32Array(this.particleCount * 3);
    this.velocities = new Float32Array(this.particleCount * 3);
    this.colors = new Float32Array(this.particleCount * 3);
    this.sizes = new Float32Array(this.particleCount);
    this.lives = new Float32Array(this.particleCount);
    this.maxLives = new Float32Array(this.particleCount);

    // Initialize all particles as dead (life = 0)
    this.lives.fill(0);
    this.maxLives.fill(1);

    // Create geometry
    this.geometry = new THREE.BufferGeometry();
    this.geometry.setAttribute(
      'position',
      new THREE.BufferAttribute(this.positions, 3)
    );
    this.geometry.setAttribute(
      'aVelocity',
      new THREE.BufferAttribute(this.velocities, 3)
    );
    this.geometry.setAttribute(
      'aColor',
      new THREE.BufferAttribute(this.colors, 3)
    );
    this.geometry.setAttribute(
      'aSize',
      new THREE.BufferAttribute(this.sizes, 1)
    );
    this.geometry.setAttribute(
      'aLife',
      new THREE.BufferAttribute(this.lives, 1)
    );
    this.geometry.setAttribute(
      'aMaxLife',
      new THREE.BufferAttribute(this.maxLives, 1)
    );

    // Create material
    this.material = new THREE.ShaderMaterial({
      uniforms: {
        u_time: { value: 0.0 },
        u_pixelRatio: { value: window?.devicePixelRatio ?? 1.0 },
      },
      vertexShader: particleVertShader,
      fragmentShader: particleFragShader,
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    });

    // Create points mesh
    this.points = new THREE.Points(this.geometry, this.material);
    this.points.frustumCulled = false;
  }

  /**
   * Update the particle system each frame.
   */
  update(deltaTime: number, audioState?: AudioState): void {
    this.material.uniforms['u_time'].value += deltaTime;

    // Determine spawn rate
    let spawnRate = this.config.spawnRate;
    if (audioState && this.config.audioReactivity.spawnOnBeat && audioState.beatDetected) {
      spawnRate *= this.config.audioReactivity.beatSpawnMultiplier;
    }

    // Accumulate spawn
    this.spawnAccumulator += spawnRate * deltaTime;
    const spawnCount = Math.floor(this.spawnAccumulator);
    this.spawnAccumulator -= spawnCount;

    // Spawn new particles
    for (let i = 0; i < spawnCount; i++) {
      this.spawnParticle(audioState);
    }

    // Update existing particles
    for (let i = 0; i < this.particleCount; i++) {
      if (this.lives[i] <= 0) continue;

      this.lives[i] -= deltaTime;

      if (this.lives[i] <= 0) {
        this.lives[i] = 0;
        continue;
      }

      const i3 = i * 3;

      // Apply velocity
      this.positions[i3] += this.velocities[i3] * deltaTime;
      this.positions[i3 + 1] += this.velocities[i3 + 1] * deltaTime;
      this.positions[i3 + 2] += this.velocities[i3 + 2] * deltaTime;

      // Apply gravity
      this.velocities[i3] += this.config.gravity[0] * deltaTime;
      this.velocities[i3 + 1] += this.config.gravity[1] * deltaTime;
      this.velocities[i3 + 2] += this.config.gravity[2] * deltaTime;

      // Apply turbulence (simple noise-like perturbation)
      if (this.config.turbulence > 0) {
        const turb = this.config.turbulence * deltaTime;
        this.velocities[i3] += (Math.random() - 0.5) * turb;
        this.velocities[i3 + 1] += (Math.random() - 0.5) * turb;
        this.velocities[i3 + 2] += (Math.random() - 0.5) * turb;
      }
    }

    // Mark attributes as needing update
    (this.geometry.attributes['position'] as THREE.BufferAttribute).needsUpdate = true;
    (this.geometry.attributes['aVelocity'] as THREE.BufferAttribute).needsUpdate = true;
    (this.geometry.attributes['aLife'] as THREE.BufferAttribute).needsUpdate = true;
  }

  /**
   * Spawn a single particle at the next available index.
   */
  private spawnParticle(audioState?: AudioState): void {
    const i = this.nextSpawnIndex;
    this.nextSpawnIndex = (this.nextSpawnIndex + 1) % this.particleCount;

    const spawn = this.emitter.emit(audioState);
    const i3 = i * 3;

    // Position
    this.positions[i3] = spawn.position[0];
    this.positions[i3 + 1] = spawn.position[1];
    this.positions[i3 + 2] = spawn.position[2];

    // Velocity
    this.velocities[i3] = spawn.velocity[0];
    this.velocities[i3 + 1] = spawn.velocity[1];
    this.velocities[i3 + 2] = spawn.velocity[2];

    // Color
    this.colors[i3] = spawn.color[0];
    this.colors[i3 + 1] = spawn.color[1];
    this.colors[i3 + 2] = spawn.color[2];

    // Size
    this.sizes[i] = spawn.size;

    // Life
    this.lives[i] = spawn.life;
    this.maxLives[i] = spawn.life;

    // Mark color/size attributes for update
    (this.geometry.attributes['aColor'] as THREE.BufferAttribute).needsUpdate = true;
    (this.geometry.attributes['aSize'] as THREE.BufferAttribute).needsUpdate = true;
    (this.geometry.attributes['aMaxLife'] as THREE.BufferAttribute).needsUpdate = true;
  }

  /**
   * Update the particle system configuration.
   */
  setConfig(config: Partial<ParticleSystemConfig>): void {
    this.config = { ...this.config, ...config };
    this.emitter = new ParticleEmitter(this.config);
  }

  /**
   * Get the Three.js Points object for adding to a scene.
   */
  getPoints(): THREE.Points {
    return this.points;
  }

  /**
   * Get the current configuration.
   */
  getConfig(): ParticleSystemConfig {
    return this.config;
  }

  /**
   * Dispose of all GPU resources.
   */
  dispose(): void {
    this.geometry.dispose();
    this.material.dispose();
  }
}
