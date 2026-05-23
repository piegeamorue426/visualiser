import * as THREE from 'three';
import { AudioState } from '../audio-engine/types';
import { BaseScene, SceneConfig } from './types';
import { lerp, clamp } from '../utils/math';

/**
 * Spiral galaxy made of 50k+ particles using golden angle distribution.
 * Rotation speed linked to energy, particle brightness to audio energy.
 */
export class ParticleGalaxy implements BaseScene {
  readonly config: SceneConfig = {
    name: 'Particle Galaxy',
    description: 'Spiral galaxy of 50k+ particles with audio-reactive rotation and color',
    category: 'particles',
    parameters: [
      { key: 'particleCount', label: 'Particle Count', type: 'number', default: 60000, min: 10000, max: 100000, step: 5000 },
      { key: 'armSpread', label: 'Arm Spread', type: 'number', default: 0.5, min: 0.1, max: 2, step: 0.1 },
      { key: 'coreColor', label: 'Core Color', type: 'color', default: '#ff8844' },
      { key: 'edgeColor', label: 'Edge Color', type: 'color', default: '#4488ff' },
    ],
  };

  private scene: THREE.Scene;
  private camera: THREE.PerspectiveCamera;
  private points: THREE.Points | null = null;
  private particleCount = 60000;
  private orbitAngle = 0;
  private smoothedEnergy = 0;
  private smoothedBass = 0;
  private basePositions: Float32Array | null = null;
  private sizes: Float32Array | null = null;

  constructor() {
    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(60, 16 / 9, 0.1, 200);
    this.camera.position.set(0, 8, 12);
    this.camera.lookAt(0, 0, 0);
  }

  init(_renderer: THREE.WebGLRenderer): void {
    this.createGalaxy();
  }

  private createGalaxy(): void {
    if (this.points) {
      this.points.geometry.dispose();
      (this.points.material as THREE.Material).dispose();
      this.scene.remove(this.points);
    }

    const geometry = new THREE.BufferGeometry();
    const positions = new Float32Array(this.particleCount * 3);
    const colors = new Float32Array(this.particleCount * 3);
    this.sizes = new Float32Array(this.particleCount);
    this.basePositions = new Float32Array(this.particleCount * 3);

    const goldenAngle = Math.PI * (3 - Math.sqrt(5));
    const maxRadius = 8;

    const coreColor = new THREE.Color(0xff8844);
    const edgeColor = new THREE.Color(0x4488ff);

    for (let i = 0; i < this.particleCount; i++) {
      const t = i / this.particleCount;
      const radius = Math.sqrt(t) * maxRadius;
      const angle = i * goldenAngle;

      // Add randomness for arm spread
      const randomOffset = (Math.random() - 0.5) * 0.5 * radius * 0.3;
      const y = (Math.random() - 0.5) * 0.3 * (1 - t);

      positions[i * 3] = Math.cos(angle) * radius + randomOffset;
      positions[i * 3 + 1] = y;
      positions[i * 3 + 2] = Math.sin(angle) * radius + randomOffset;

      this.basePositions[i * 3] = positions[i * 3];
      this.basePositions[i * 3 + 1] = positions[i * 3 + 1];
      this.basePositions[i * 3 + 2] = positions[i * 3 + 2];

      // Color: warm core, cool edges
      const color = coreColor.clone().lerp(edgeColor, t);
      colors[i * 3] = color.r;
      colors[i * 3 + 1] = color.g;
      colors[i * 3 + 2] = color.b;

      this.sizes[i] = 0.02 + Math.random() * 0.03;
    }

    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));

    const material = new THREE.PointsMaterial({
      size: 0.05,
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
    this.smoothedEnergy = lerp(this.smoothedEnergy, audioState.energy, 0.08);
    this.smoothedBass = lerp(this.smoothedBass, audioState.bass, 0.1);

    if (!this.points) return;

    // Rotation speed linked to energy
    const rotSpeed = 0.1 + this.smoothedEnergy * 0.5;
    this.points.rotation.y += rotSpeed * deltaTime;

    // Particle size linked to energy
    const mat = this.points.material as THREE.PointsMaterial;
    mat.size = lerp(mat.size, 0.03 + this.smoothedEnergy * 0.05, 0.1);
    mat.opacity = clamp(0.6 + this.smoothedEnergy * 0.4, 0.6, 1.0);

    // Camera orbits slowly
    this.orbitAngle += deltaTime * 0.15;
    const camDist = 14 - this.smoothedBass * 2;
    this.camera.position.x = Math.cos(this.orbitAngle) * camDist;
    this.camera.position.z = Math.sin(this.orbitAngle) * camDist;
    this.camera.position.y = 6 + Math.sin(this.orbitAngle * 0.5) * 2;
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
        this.createGalaxy();
        break;
    }
  }

  dispose(): void {
    if (this.points) {
      this.points.geometry.dispose();
      (this.points.material as THREE.Material).dispose();
    }
  }
}
