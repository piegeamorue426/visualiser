import * as THREE from 'three';
import { AudioState } from '../audio-engine/types';
import { BaseScene, SceneConfig } from './types';
import { lerp, clamp } from '../utils/math';

/**
 * Spiraling particle vortex pulled toward center.
 * Audio energy controls spiral tightness, beats cause expansion bursts.
 */
export class ReactiveVortex implements BaseScene {
  readonly config: SceneConfig = {
    name: 'Reactive Vortex',
    description: 'Spiraling particle vortex with beat-driven expansion bursts',
    category: 'particles',
    parameters: [
      { key: 'particleCount', label: 'Particles', type: 'number', default: 20000, min: 5000, max: 50000, step: 5000 },
      { key: 'spiralSpeed', label: 'Spiral Speed', type: 'number', default: 1, min: 0.1, max: 5, step: 0.1 },
      { key: 'pullStrength', label: 'Pull Strength', type: 'number', default: 1, min: 0.1, max: 3, step: 0.1 },
    ],
  };

  private scene: THREE.Scene;
  private camera: THREE.PerspectiveCamera;
  private points: THREE.Points | null = null;
  private positions: Float32Array | null = null;
  private velocities: Float32Array | null = null;
  private distances: Float32Array | null = null;
  private angles: Float32Array | null = null;
  private particleCount = 20000;
  private spiralSpeed = 1;
  private pullStrength = 1;
  private smoothedEnergy = 0;
  private smoothedBass = 0;
  private burstForce = 0;

  constructor() {
    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(60, 16 / 9, 0.1, 200);
    this.camera.position.set(0, 3, 8);
    this.camera.lookAt(0, 0, 0);
  }

  init(_renderer: THREE.WebGLRenderer): void {
    this.createParticles();
  }

  private createParticles(): void {
    if (this.points) {
      this.scene.remove(this.points);
      this.points.geometry.dispose();
      (this.points.material as THREE.Material).dispose();
    }

    const geometry = new THREE.BufferGeometry();
    this.positions = new Float32Array(this.particleCount * 3);
    this.velocities = new Float32Array(this.particleCount * 3);
    this.distances = new Float32Array(this.particleCount);
    this.angles = new Float32Array(this.particleCount);
    const colors = new Float32Array(this.particleCount * 3);

    for (let i = 0; i < this.particleCount; i++) {
      const dist = 1 + Math.random() * 6;
      const angle = Math.random() * Math.PI * 2;
      const y = (Math.random() - 0.5) * 2;

      this.positions[i * 3] = Math.cos(angle) * dist;
      this.positions[i * 3 + 1] = y;
      this.positions[i * 3 + 2] = Math.sin(angle) * dist;

      this.distances[i] = dist;
      this.angles[i] = angle;
      this.velocities[i * 3] = 0;
      this.velocities[i * 3 + 1] = 0;
      this.velocities[i * 3 + 2] = 0;

      // Color gradient based on distance from center
      const t = dist / 7;
      const color = new THREE.Color().setHSL(0.7 - t * 0.4, 0.9, 0.4 + (1 - t) * 0.3);
      colors[i * 3] = color.r;
      colors[i * 3 + 1] = color.g;
      colors[i * 3 + 2] = color.b;
    }

    geometry.setAttribute('position', new THREE.BufferAttribute(this.positions, 3));
    geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));

    const material = new THREE.PointsMaterial({
      size: 0.04,
      vertexColors: true,
      transparent: true,
      opacity: 0.8,
      blending: THREE.AdditiveBlending,
      sizeAttenuation: true,
    });

    this.points = new THREE.Points(geometry, material);
    this.scene.add(this.points);
  }

  update(deltaTime: number, audioState: AudioState): void {
    this.smoothedEnergy = lerp(this.smoothedEnergy, audioState.energy, 0.1);
    this.smoothedBass = lerp(this.smoothedBass, audioState.bass, 0.12);

    // Beat burst
    if (audioState.beatDetected) {
      this.burstForce = 3 + audioState.energy * 4;
    }
    this.burstForce = lerp(this.burstForce, 0, 0.05);

    if (!this.positions || !this.distances || !this.angles || !this.points) return;

    const spiralTightness = 1 + this.smoothedEnergy * 3;
    const rotSpeed = this.spiralSpeed * (1 + this.smoothedEnergy);

    for (let i = 0; i < this.particleCount; i++) {
      // Rotate particles around center
      this.angles[i] += rotSpeed * deltaTime * (1 / (0.5 + this.distances[i] * 0.3));

      // Pull toward center (tighter with more energy)
      const pullRate = this.pullStrength * 0.3 * deltaTime * spiralTightness;
      this.distances[i] -= pullRate;

      // Burst outward on beats
      if (this.burstForce > 0.1) {
        this.distances[i] += this.burstForce * deltaTime * 0.5;
      }

      // Reset particles that reach center
      if (this.distances[i] < 0.2) {
        this.distances[i] = 5 + Math.random() * 2;
        this.angles[i] = Math.random() * Math.PI * 2;
      }

      // Cap max distance
      if (this.distances[i] > 8) {
        this.distances[i] = 8;
      }

      // Update positions
      const dist = this.distances[i];
      const angle = this.angles[i];
      this.positions[i * 3] = Math.cos(angle) * dist;
      this.positions[i * 3 + 1] = Math.sin(angle * 2) * 0.5 * (dist / 7);
      this.positions[i * 3 + 2] = Math.sin(angle) * dist;
    }

    const posAttr = this.points.geometry.getAttribute('position') as THREE.BufferAttribute;
    posAttr.needsUpdate = true;

    // Update particle size with energy
    const mat = this.points.material as THREE.PointsMaterial;
    mat.size = lerp(mat.size, 0.03 + this.smoothedEnergy * 0.04, 0.1);

    // Camera slight movement
    const t = Date.now() * 0.0003;
    this.camera.position.x = Math.sin(t) * 2;
    this.camera.position.y = 3 + Math.cos(t * 0.7) * 0.5;
    this.camera.lookAt(0, 0, 0);
  }

  resize(width: number, height: number): void {
    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
  }

  getScene(): THREE.Scene {
    return this.scene;
  }

  getCamera(): THREE.Camera {
    return this.camera;
  }

  setParameter(key: string, value: any): void {
    switch (key) {
      case 'particleCount':
        this.particleCount = value;
        this.createParticles();
        break;
      case 'spiralSpeed':
        this.spiralSpeed = value;
        break;
      case 'pullStrength':
        this.pullStrength = value;
        break;
    }
  }

  dispose(): void {
    if (this.points) {
      this.points.geometry.dispose();
      (this.points.material as THREE.Material).dispose();
    }
    this.positions = null;
    this.velocities = null;
    this.distances = null;
    this.angles = null;
  }
}
