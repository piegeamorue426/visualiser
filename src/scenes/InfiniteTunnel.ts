import * as THREE from 'three';
import { AudioState } from '../audio-engine/types';
import { BaseScene, SceneConfig } from './types';
import { lerp, clamp } from '../utils/math';

/**
 * Fly-through tunnel made of recycling wireframe rings.
 * Ring radius oscillates with bass, speed linked to energy.
 */
export class InfiniteTunnel implements BaseScene {
  readonly config: SceneConfig = {
    name: 'Infinite Tunnel',
    description: 'Fly-through tunnel with bass-reactive ring radius and energy-driven speed',
    category: 'geometric',
    parameters: [
      { key: 'ringCount', label: 'Ring Count', type: 'number', default: 40, min: 20, max: 80, step: 5 },
      { key: 'baseSpeed', label: 'Speed', type: 'number', default: 3, min: 0.5, max: 10, step: 0.5 },
      { key: 'baseRadius', label: 'Tunnel Radius', type: 'number', default: 3, min: 1, max: 8, step: 0.5 },
      { key: 'fogDensity', label: 'Fog Density', type: 'number', default: 0.05, min: 0, max: 0.2, step: 0.01 },
    ],
  };

  private scene: THREE.Scene;
  private camera: THREE.PerspectiveCamera;
  private rings: THREE.LineLoop[] = [];
  private ringCount = 40;
  private baseSpeed = 3;
  private baseRadius = 3;
  private ringSpacing = 2;
  private smoothedEnergy = 0;
  private smoothedBass = 0;
  private totalDistance = 0;

  constructor() {
    this.scene = new THREE.Scene();
    this.scene.fog = new THREE.FogExp2(0x000011, 0.05);
    this.camera = new THREE.PerspectiveCamera(75, 16 / 9, 0.1, 200);
    this.camera.position.set(0, 0, 0);
    this.camera.lookAt(0, 0, -1);
  }

  init(_renderer: THREE.WebGLRenderer): void {
    this.createRings();
  }

  private createRings(): void {
    for (const ring of this.rings) {
      this.scene.remove(ring);
      ring.geometry.dispose();
      (ring.material as THREE.Material).dispose();
    }
    this.rings = [];

    for (let i = 0; i < this.ringCount; i++) {
      const geometry = new THREE.BufferGeometry();
      const segments = 32;
      const positions = new Float32Array((segments + 1) * 3);

      for (let j = 0; j <= segments; j++) {
        const angle = (j / segments) * Math.PI * 2;
        positions[j * 3] = Math.cos(angle) * this.baseRadius;
        positions[j * 3 + 1] = Math.sin(angle) * this.baseRadius;
        positions[j * 3 + 2] = 0;
      }

      geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));

      const hue = (i / this.ringCount) * 0.3;
      const material = new THREE.LineBasicMaterial({
        color: new THREE.Color().setHSL(hue, 0.8, 0.6),
        transparent: true,
        opacity: 0.8,
      });

      const ring = new THREE.LineLoop(geometry, material);
      ring.position.z = -i * this.ringSpacing;
      this.rings.push(ring);
      this.scene.add(ring);
    }
  }

  update(deltaTime: number, audioState: AudioState): void {
    this.smoothedEnergy = lerp(this.smoothedEnergy, audioState.energy, 0.1);
    this.smoothedBass = lerp(this.smoothedBass, audioState.bass, 0.12);

    const speed = this.baseSpeed * (1 + this.smoothedEnergy * 2);
    this.totalDistance += speed * deltaTime;

    const maxZ = 2;
    const minZ = -(this.ringCount * this.ringSpacing);

    for (let i = 0; i < this.rings.length; i++) {
      const ring = this.rings[i];

      // Move rings toward camera
      ring.position.z += speed * deltaTime;

      // Recycle rings that pass behind camera
      if (ring.position.z > maxZ) {
        ring.position.z = minZ + (ring.position.z - maxZ);
      }

      // Ring radius oscillates with bass
      const distanceFactor = Math.abs(ring.position.z) / Math.abs(minZ);
      const radiusScale = 1 + this.smoothedBass * 0.4 * Math.sin(distanceFactor * Math.PI * 2 + this.totalDistance * 0.5);
      const radius = this.baseRadius * radiusScale;

      // Update ring geometry
      const posAttr = ring.geometry.getAttribute('position') as THREE.BufferAttribute;
      const segments = posAttr.count - 1;
      for (let j = 0; j <= segments; j++) {
        const angle = (j / segments) * Math.PI * 2;
        posAttr.setXY(j, Math.cos(angle) * radius, Math.sin(angle) * radius);
      }
      posAttr.needsUpdate = true;

      // Color shift with frequency bands
      const specIdx = Math.floor(distanceFactor * 128);
      const specValue = audioState.spectrum[clamp(specIdx, 0, 255)] || 0;
      const hue = (distanceFactor * 0.5 + this.smoothedEnergy * 0.3) % 1;
      const mat = ring.material as THREE.LineBasicMaterial;
      mat.color.setHSL(hue, 0.8, 0.4 + specValue * 0.4);
      mat.opacity = clamp(0.3 + specValue * 0.7, 0.3, 1.0);
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
      case 'ringCount':
        this.ringCount = value;
        this.createRings();
        break;
      case 'baseSpeed':
        this.baseSpeed = value;
        break;
      case 'baseRadius':
        this.baseRadius = value;
        break;
      case 'fogDensity':
        if (this.scene.fog instanceof THREE.FogExp2) {
          this.scene.fog.density = value;
        }
        break;
    }
  }

  dispose(): void {
    for (const ring of this.rings) {
      ring.geometry.dispose();
      (ring.material as THREE.Material).dispose();
    }
    this.rings = [];
  }
}
