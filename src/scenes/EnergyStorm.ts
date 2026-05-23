import * as THREE from 'three';
import { AudioState } from '../audio-engine/types';
import { BaseScene, SceneConfig } from './types';
import { lerp, clamp } from '../utils/math';

/**
 * Lightning/energy bolts between points. Bolts regenerate on beats,
 * brightness linked to energy, branching complexity to spectral content.
 */
export class EnergyStorm implements BaseScene {
  readonly config: SceneConfig = {
    name: 'Energy Storm',
    description: 'Lightning bolts with beat-synced regeneration and energy-driven brightness',
    category: 'abstract',
    parameters: [
      { key: 'boltCount', label: 'Bolt Count', type: 'number', default: 8, min: 2, max: 20, step: 1 },
      { key: 'segments', label: 'Segments', type: 'number', default: 20, min: 5, max: 50, step: 5 },
      { key: 'spread', label: 'Spread', type: 'number', default: 4, min: 1, max: 10, step: 0.5 },
    ],
  };

  private scene: THREE.Scene;
  private camera: THREE.PerspectiveCamera;
  private bolts: THREE.Line[] = [];
  private boltCount = 8;
  private segments = 20;
  private spread = 4;
  private smoothedEnergy = 0;
  private cloudSphere: THREE.Mesh | null = null;
  private time = 0;

  constructor() {
    this.scene = new THREE.Scene();
    this.scene.fog = new THREE.FogExp2(0x050510, 0.04);
    this.camera = new THREE.PerspectiveCamera(60, 16 / 9, 0.1, 100);
    this.camera.position.set(0, 0, 8);
    this.camera.lookAt(0, 0, 0);
  }

  init(_renderer: THREE.WebGLRenderer): void {
    this.createBolts();
    this.createCloudSphere();
  }

  private createBolts(): void {
    for (const bolt of this.bolts) {
      this.scene.remove(bolt);
      bolt.geometry.dispose();
      (bolt.material as THREE.Material).dispose();
    }
    this.bolts = [];

    for (let i = 0; i < this.boltCount; i++) {
      const geometry = new THREE.BufferGeometry();
      const positions = new Float32Array(this.segments * 3);
      geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));

      const hue = Math.random() * 0.3 + 0.5; // Blue to purple range
      const material = new THREE.LineBasicMaterial({
        color: new THREE.Color().setHSL(hue, 0.9, 0.7),
        transparent: true,
        opacity: 0.8,
      });

      const bolt = new THREE.Line(geometry, material);
      this.bolts.push(bolt);
      this.scene.add(bolt);
    }

    this.regenerateBolts();
  }

  private createCloudSphere(): void {
    const geometry = new THREE.SphereGeometry(12, 32, 32);
    const material = new THREE.MeshBasicMaterial({
      color: 0x111122,
      side: THREE.BackSide,
      transparent: true,
      opacity: 0.8,
    });
    this.cloudSphere = new THREE.Mesh(geometry, material);
    this.scene.add(this.cloudSphere);
  }

  private regenerateBolts(): void {
    for (let b = 0; b < this.bolts.length; b++) {
      const bolt = this.bolts[b];
      const posAttr = bolt.geometry.getAttribute('position') as THREE.BufferAttribute;

      // Random start and end points
      const startX = (Math.random() - 0.5) * this.spread;
      const startY = (Math.random() - 0.5) * this.spread;
      const startZ = (Math.random() - 0.5) * 2;

      const endX = (Math.random() - 0.5) * this.spread;
      const endY = (Math.random() - 0.5) * this.spread;
      const endZ = (Math.random() - 0.5) * 2;

      for (let i = 0; i < this.segments; i++) {
        const t = i / (this.segments - 1);
        const jitter = (1 - Math.abs(t - 0.5) * 2) * 0.8; // More jitter in middle

        const x = startX + (endX - startX) * t + (Math.random() - 0.5) * jitter;
        const y = startY + (endY - startY) * t + (Math.random() - 0.5) * jitter;
        const z = startZ + (endZ - startZ) * t + (Math.random() - 0.5) * jitter * 0.3;

        posAttr.setXYZ(i, x, y, z);
      }
      posAttr.needsUpdate = true;
    }
  }

  update(deltaTime: number, audioState: AudioState): void {
    this.smoothedEnergy = lerp(this.smoothedEnergy, audioState.energy, 0.1);
    this.time += deltaTime;

    // Regenerate bolts on beats
    if (audioState.beatDetected) {
      this.regenerateBolts();
    }

    // Update bolt appearance
    for (let i = 0; i < this.bolts.length; i++) {
      const bolt = this.bolts[i];
      const mat = bolt.material as THREE.LineBasicMaterial;

      // Brightness linked to energy
      const brightness = clamp(0.3 + this.smoothedEnergy * 0.7, 0.3, 1.0);
      mat.opacity = brightness;

      // Jitter bolt vertices slightly each frame for electric effect
      const posAttr = bolt.geometry.getAttribute('position') as THREE.BufferAttribute;
      for (let j = 1; j < this.segments - 1; j++) {
        const jitterAmount = 0.02 * this.smoothedEnergy;
        posAttr.setX(j, posAttr.getX(j) + (Math.random() - 0.5) * jitterAmount);
        posAttr.setY(j, posAttr.getY(j) + (Math.random() - 0.5) * jitterAmount);
      }
      posAttr.needsUpdate = true;
    }

    // Rotate cloud sphere
    if (this.cloudSphere) {
      this.cloudSphere.rotation.y += deltaTime * 0.05;
      this.cloudSphere.rotation.x += deltaTime * 0.02;
      const mat = this.cloudSphere.material as THREE.MeshBasicMaterial;
      mat.color.setHSL(0.7, 0.2, 0.05 + this.smoothedEnergy * 0.03);
    }

    // Camera slight movement
    this.camera.position.x = Math.sin(this.time * 0.2) * 0.5;
    this.camera.position.y = Math.cos(this.time * 0.15) * 0.3;
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
      case 'boltCount':
        this.boltCount = value;
        this.createBolts();
        break;
      case 'segments':
        this.segments = value;
        this.createBolts();
        break;
      case 'spread':
        this.spread = value;
        this.regenerateBolts();
        break;
    }
  }

  dispose(): void {
    for (const bolt of this.bolts) {
      bolt.geometry.dispose();
      (bolt.material as THREE.Material).dispose();
    }
    if (this.cloudSphere) {
      this.cloudSphere.geometry.dispose();
      (this.cloudSphere.material as THREE.Material).dispose();
    }
    this.bolts = [];
  }
}
