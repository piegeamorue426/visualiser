import * as THREE from 'three';
import { AudioState } from '../audio-engine/types';
import { BaseScene, SceneConfig } from './types';
import { lerp, clamp } from '../utils/math';

/**
 * 3D neon waveform visualization with multiple parallel layers.
 * Glow intensity linked to energy, color cycling with beat.
 */
export class NeonWaveform implements BaseScene {
  readonly config: SceneConfig = {
    name: 'Neon Waveform',
    description: 'Layered 3D neon waveform with glow and beat-reactive color cycling',
    category: 'spectrum',
    parameters: [
      { key: 'layerCount', label: 'Layers', type: 'number', default: 5, min: 1, max: 10, step: 1 },
      { key: 'lineWidth', label: 'Line Width', type: 'number', default: 2, min: 0.5, max: 5, step: 0.5 },
      { key: 'amplitude', label: 'Amplitude', type: 'number', default: 2, min: 0.5, max: 5, step: 0.25 },
    ],
  };

  private scene: THREE.Scene;
  private camera: THREE.PerspectiveCamera;
  private lines: THREE.Line[] = [];
  private layerCount = 5;
  private amplitude = 2;
  private smoothedEnergy = 0;
  private hueOffset = 0;
  private cameraSwayTime = 0;

  constructor() {
    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(60, 16 / 9, 0.1, 100);
    this.camera.position.set(0, 0, 6);
    this.camera.lookAt(0, 0, 0);
  }

  init(_renderer: THREE.WebGLRenderer): void {
    this.createLines();
  }

  private createLines(): void {
    for (const line of this.lines) {
      this.scene.remove(line);
      line.geometry.dispose();
      (line.material as THREE.Material).dispose();
    }
    this.lines = [];

    const pointCount = 128;
    const width = 8;

    for (let layer = 0; layer < this.layerCount; layer++) {
      const positions = new Float32Array(pointCount * 3);
      const geometry = new THREE.BufferGeometry();

      for (let i = 0; i < pointCount; i++) {
        const x = (i / (pointCount - 1)) * width - width / 2;
        positions[i * 3] = x;
        positions[i * 3 + 1] = 0;
        positions[i * 3 + 2] = -layer * 0.8;
      }

      geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));

      const hue = layer / this.layerCount;
      const material = new THREE.LineBasicMaterial({
        color: new THREE.Color().setHSL(hue * 0.3 + 0.5, 1.0, 0.6),
        transparent: true,
        opacity: 1 - layer * 0.15,
      });

      const line = new THREE.Line(geometry, material);
      this.lines.push(line);
      this.scene.add(line);
    }
  }

  update(deltaTime: number, audioState: AudioState): void {
    this.smoothedEnergy = lerp(this.smoothedEnergy, audioState.energy, 0.1);

    // Color cycling on beat
    if (audioState.beatDetected) {
      this.hueOffset += 0.1;
    }

    const waveform = audioState.waveform;
    const pointCount = 128;

    for (let layer = 0; layer < this.lines.length; layer++) {
      const line = this.lines[layer];
      const posAttr = line.geometry.getAttribute('position') as THREE.BufferAttribute;

      const layerDelay = layer * 4;

      for (let i = 0; i < pointCount; i++) {
        // Sample waveform with layer-based offset
        const waveIdx = Math.floor(((i + layerDelay) / pointCount) * waveform.length) % waveform.length;
        const waveValue = waveform[waveIdx] || 0;
        const y = waveValue * this.amplitude * (1 - layer * 0.1);
        posAttr.setY(i, y);
      }
      posAttr.needsUpdate = true;

      // Update color with hue cycling
      const mat = line.material as THREE.LineBasicMaterial;
      const hue = (layer / this.layerCount * 0.3 + 0.5 + this.hueOffset) % 1;
      const brightness = clamp(0.4 + this.smoothedEnergy * 0.4, 0.4, 0.8);
      mat.color.setHSL(hue, 1.0, brightness);
      mat.opacity = clamp((1 - layer * 0.12) * (0.5 + this.smoothedEnergy * 0.5), 0.2, 1.0);
    }

    // Camera slight sway
    this.cameraSwayTime += deltaTime * 0.5;
    this.camera.position.x = Math.sin(this.cameraSwayTime) * 0.3;
    this.camera.position.y = Math.cos(this.cameraSwayTime * 0.7) * 0.2;
    this.camera.lookAt(0, 0, -2);
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
      case 'layerCount':
        this.layerCount = value;
        this.createLines();
        break;
      case 'amplitude':
        this.amplitude = value;
        break;
    }
  }

  dispose(): void {
    for (const line of this.lines) {
      line.geometry.dispose();
      (line.material as THREE.Material).dispose();
    }
    this.lines = [];
  }
}
