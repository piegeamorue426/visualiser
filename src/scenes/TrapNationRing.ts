import * as THREE from 'three';
import { AudioState } from '../audio-engine/types';
import { BaseScene, SceneConfig } from './types';
import { lerp, clamp } from '../utils/math';

/**
 * Iconic Trap Nation style ring visualizer with radiating bars and particle bursts.
 */
export class TrapNationRing implements BaseScene {
  readonly config: SceneConfig = {
    name: 'Trap Nation Ring',
    description: 'Centered ring with radiating bars, bass-reactive scale, and beat particles',
    category: 'spectrum',
    parameters: [
      { key: 'barCount', label: 'Bar Count', type: 'number', default: 64, min: 32, max: 128, step: 8 },
      { key: 'ringSize', label: 'Ring Size', type: 'number', default: 2, min: 0.5, max: 5, step: 0.25 },
      { key: 'barLength', label: 'Bar Length', type: 'number', default: 2, min: 0.5, max: 5, step: 0.25 },
      { key: 'particlesEnabled', label: 'Particles', type: 'boolean', default: true },
    ],
  };

  private scene: THREE.Scene;
  private camera: THREE.PerspectiveCamera;
  private ring: THREE.Mesh | null = null;
  private bars: THREE.Mesh[] = [];
  private barGroup: THREE.Group;
  private particles: THREE.Points | null = null;
  private particlePositions: Float32Array | null = null;
  private particleVelocities: Float32Array | null = null;
  private particleLifetimes: Float32Array | null = null;
  private barCount = 64;
  private ringSize = 2;
  private barLength = 2;
  private smoothedBass = 0;
  private smoothedEnergy = 0;
  private particleCount = 200;

  constructor() {
    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(50, 16 / 9, 0.1, 100);
    this.camera.position.set(0, 0, 7);
    this.camera.lookAt(0, 0, 0);
    this.barGroup = new THREE.Group();
    this.scene.add(this.barGroup);
  }

  init(_renderer: THREE.WebGLRenderer): void {
    this.createRing();
    this.createBars();
    this.createParticles();
    this.createBackground();
  }

  private createRing(): void {
    const geometry = new THREE.TorusGeometry(this.ringSize, 0.05, 16, 64);
    const material = new THREE.MeshBasicMaterial({
      color: 0xffffff,
      transparent: true,
      opacity: 0.9,
    });
    this.ring = new THREE.Mesh(geometry, material);
    this.scene.add(this.ring);
  }

  private createBars(): void {
    for (const bar of this.bars) {
      this.barGroup.remove(bar);
      bar.geometry.dispose();
      (bar.material as THREE.Material).dispose();
    }
    this.bars = [];

    const barWidth = 0.03;
    for (let i = 0; i < this.barCount; i++) {
      const angle = (i / this.barCount) * Math.PI * 2;
      const geometry = new THREE.BoxGeometry(barWidth, 1, barWidth);
      geometry.translate(0, 0.5, 0);

      const material = new THREE.MeshBasicMaterial({
        color: new THREE.Color(0.6, 0.3, 1.0),
        transparent: true,
        opacity: 0.8,
      });

      const mesh = new THREE.Mesh(geometry, material);
      mesh.position.x = Math.cos(angle) * this.ringSize;
      mesh.position.y = Math.sin(angle) * this.ringSize;
      mesh.rotation.z = angle - Math.PI / 2;

      this.bars.push(mesh);
      this.barGroup.add(mesh);
    }
  }

  private createParticles(): void {
    const geometry = new THREE.BufferGeometry();
    this.particlePositions = new Float32Array(this.particleCount * 3);
    this.particleVelocities = new Float32Array(this.particleCount * 3);
    this.particleLifetimes = new Float32Array(this.particleCount);

    for (let i = 0; i < this.particleCount; i++) {
      this.particlePositions[i * 3] = 0;
      this.particlePositions[i * 3 + 1] = 0;
      this.particlePositions[i * 3 + 2] = 0;
      this.particleLifetimes[i] = 0;
    }

    geometry.setAttribute('position', new THREE.BufferAttribute(this.particlePositions, 3));

    const material = new THREE.PointsMaterial({
      color: 0xaa66ff,
      size: 0.05,
      transparent: true,
      opacity: 0.6,
      blending: THREE.AdditiveBlending,
    });

    this.particles = new THREE.Points(geometry, material);
    this.scene.add(this.particles);
  }

  private createBackground(): void {
    const bgGeometry = new THREE.PlaneGeometry(30, 30);
    const bgMaterial = new THREE.MeshBasicMaterial({
      color: 0x0a0a14,
    });
    const bg = new THREE.Mesh(bgGeometry, bgMaterial);
    bg.position.z = -5;
    this.scene.add(bg);
  }

  update(deltaTime: number, audioState: AudioState): void {
    this.smoothedBass = lerp(this.smoothedBass, audioState.bass, 0.15);
    this.smoothedEnergy = lerp(this.smoothedEnergy, audioState.energy, 0.1);

    // Ring diameter pulses with bass
    if (this.ring) {
      const scale = 1 + this.smoothedBass * 0.3;
      this.ring.scale.set(scale, scale, 1);
    }

    // Update bar heights from spectrum
    const specLen = audioState.spectrum.length;
    for (let i = 0; i < this.bars.length; i++) {
      const specIdx = Math.floor((i / this.bars.length) * specLen);
      const value = audioState.spectrum[specIdx] || 0;
      const targetHeight = clamp(value * this.barLength, 0.02, this.barLength);
      const bar = this.bars[i];
      bar.scale.y = lerp(bar.scale.y, targetHeight, 0.3);
    }

    // Particle burst on beat
    if (audioState.beatDetected && this.particlePositions && this.particleVelocities && this.particleLifetimes) {
      for (let i = 0; i < this.particleCount; i++) {
        if (this.particleLifetimes[i] <= 0) {
          const angle = Math.random() * Math.PI * 2;
          const speed = 2 + Math.random() * 3;
          this.particlePositions[i * 3] = Math.cos(angle) * this.ringSize;
          this.particlePositions[i * 3 + 1] = Math.sin(angle) * this.ringSize;
          this.particlePositions[i * 3 + 2] = 0;
          this.particleVelocities[i * 3] = Math.cos(angle) * speed;
          this.particleVelocities[i * 3 + 1] = Math.sin(angle) * speed;
          this.particleVelocities[i * 3 + 2] = (Math.random() - 0.5) * 0.5;
          this.particleLifetimes[i] = 0.5 + Math.random() * 0.5;
          break; // Burst a few at a time
        }
      }
    }

    // Update particles
    if (this.particlePositions && this.particleVelocities && this.particleLifetimes && this.particles) {
      for (let i = 0; i < this.particleCount; i++) {
        if (this.particleLifetimes[i] > 0) {
          this.particleLifetimes[i] -= deltaTime;
          this.particlePositions[i * 3] += this.particleVelocities[i * 3] * deltaTime;
          this.particlePositions[i * 3 + 1] += this.particleVelocities[i * 3 + 1] * deltaTime;
          this.particlePositions[i * 3 + 2] += this.particleVelocities[i * 3 + 2] * deltaTime;
          // Fade velocity
          this.particleVelocities[i * 3] *= 0.97;
          this.particleVelocities[i * 3 + 1] *= 0.97;
          this.particleVelocities[i * 3 + 2] *= 0.97;
        } else {
          // Hide dead particles
          this.particlePositions[i * 3] = 0;
          this.particlePositions[i * 3 + 1] = 0;
          this.particlePositions[i * 3 + 2] = -100;
        }
      }
      const posAttr = this.particles.geometry.getAttribute('position') as THREE.BufferAttribute;
      posAttr.needsUpdate = true;
    }
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
      case 'barCount':
        this.barCount = value;
        this.createBars();
        break;
      case 'ringSize':
        this.ringSize = value;
        if (this.ring) {
          this.ring.geometry.dispose();
          this.ring.geometry = new THREE.TorusGeometry(this.ringSize, 0.05, 16, 64);
        }
        this.createBars();
        break;
      case 'barLength':
        this.barLength = value;
        break;
    }
  }

  dispose(): void {
    if (this.ring) {
      this.ring.geometry.dispose();
      (this.ring.material as THREE.Material).dispose();
    }
    for (const bar of this.bars) {
      bar.geometry.dispose();
      (bar.material as THREE.Material).dispose();
    }
    if (this.particles) {
      this.particles.geometry.dispose();
      (this.particles.material as THREE.Material).dispose();
    }
    this.bars = [];
  }
}
