import * as THREE from 'three';
import { AudioState } from '../audio-engine/types';
import { BaseScene, SceneConfig } from './types';
import { lerp, clamp } from '../utils/math';

/**
 * Classic circular spectrum analyzer with bars arranged in a circle.
 * Height driven by frequency, color gradient from bass (warm) to highs (cool).
 */
export class CircularSpectrum implements BaseScene {
  readonly config: SceneConfig = {
    name: 'Circular Spectrum',
    description: 'Bars arranged in a circle with height driven by frequency spectrum',
    category: 'spectrum',
    parameters: [
      { key: 'barCount', label: 'Bar Count', type: 'number', default: 128, min: 32, max: 256, step: 8 },
      { key: 'ringRadius', label: 'Ring Radius', type: 'number', default: 3, min: 1, max: 8, step: 0.5 },
      { key: 'rotationSpeed', label: 'Rotation Speed', type: 'number', default: 0.2, min: 0, max: 2, step: 0.1 },
      { key: 'glowIntensity', label: 'Glow Intensity', type: 'number', default: 1.5, min: 0, max: 5, step: 0.1 },
    ],
  };

  private scene: THREE.Scene;
  private camera: THREE.PerspectiveCamera;
  private bars: THREE.Mesh[] = [];
  private barCount = 128;
  private ringRadius = 3;
  private rotationSpeed = 0.2;
  private ringGroup: THREE.Group;
  private currentRotation = 0;
  private smoothedEnergy = 0;
  private smoothedBass = 0;

  constructor() {
    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(60, 16 / 9, 0.1, 100);
    this.camera.position.set(0, 0, 8);
    this.camera.lookAt(0, 0, 0);
    this.ringGroup = new THREE.Group();
    this.scene.add(this.ringGroup);
  }

  init(_renderer: THREE.WebGLRenderer): void {
    this.createBars();
  }

  private createBars(): void {
    // Clear existing bars
    for (const bar of this.bars) {
      this.ringGroup.remove(bar);
      bar.geometry.dispose();
      (bar.material as THREE.Material).dispose();
    }
    this.bars = [];

    const barWidth = 0.04;
    const barDepth = 0.04;

    for (let i = 0; i < this.barCount; i++) {
      const angle = (i / this.barCount) * Math.PI * 2;
      const hue = i / this.barCount;

      const geometry = new THREE.BoxGeometry(barWidth, 1, barDepth);
      geometry.translate(0, 0.5, 0); // pivot at bottom

      const material = new THREE.MeshBasicMaterial({
        color: new THREE.Color().setHSL(hue * 0.8, 0.9, 0.5),
        transparent: true,
        opacity: 0.9,
      });

      const mesh = new THREE.Mesh(geometry, material);
      mesh.position.x = Math.cos(angle) * this.ringRadius;
      mesh.position.y = Math.sin(angle) * this.ringRadius;
      mesh.rotation.z = angle - Math.PI / 2;

      this.bars.push(mesh);
      this.ringGroup.add(mesh);
    }
  }

  update(deltaTime: number, audioState: AudioState): void {
    this.smoothedEnergy = lerp(this.smoothedEnergy, audioState.energy, 0.1);
    this.smoothedBass = lerp(this.smoothedBass, audioState.bass, 0.15);

    // Rotate ring, speed increases with energy
    const speed = this.rotationSpeed * (1 + this.smoothedEnergy * 2);
    this.currentRotation += speed * deltaTime;
    this.ringGroup.rotation.z = this.currentRotation;

    // Pulse ring scale with bass
    const scale = 1 + this.smoothedBass * 0.2;
    this.ringGroup.scale.set(scale, scale, 1);

    // Update bar heights from spectrum
    const spectrumLength = audioState.spectrum.length;
    for (let i = 0; i < this.bars.length; i++) {
      const specIndex = Math.floor((i / this.bars.length) * spectrumLength);
      const value = audioState.spectrum[specIndex] || 0;
      const targetHeight = clamp(value * 3, 0.05, 3);

      const bar = this.bars[i];
      const currentScale = bar.scale.y;
      bar.scale.y = lerp(currentScale, targetHeight, 0.3);

      // Update emissive brightness
      const mat = bar.material as THREE.MeshBasicMaterial;
      const brightness = clamp(0.3 + value * 0.7, 0.3, 1.0);
      const hue = i / this.bars.length * 0.8;
      mat.color.setHSL(hue, 0.9, brightness * 0.5);
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
      case 'ringRadius':
        this.ringRadius = value;
        this.createBars();
        break;
      case 'rotationSpeed':
        this.rotationSpeed = value;
        break;
    }
  }

  dispose(): void {
    for (const bar of this.bars) {
      bar.geometry.dispose();
      (bar.material as THREE.Material).dispose();
    }
    this.bars = [];
  }
}
