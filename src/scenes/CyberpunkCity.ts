import * as THREE from 'three';
import { AudioState } from '../audio-engine/types';
import { BaseScene, SceneConfig } from './types';
import { lerp, clamp } from '../utils/math';

/**
 * Cyberpunk city silhouette with neon edges, bass-reactive building heights,
 * rain particles, and reflective ground.
 */
export class CyberpunkCity implements BaseScene {
  readonly config: SceneConfig = {
    name: 'Cyberpunk City',
    description: 'Neon-lit city skyline with audio-reactive building heights and rain',
    category: 'environment',
    parameters: [
      { key: 'buildingCount', label: 'Buildings', type: 'number', default: 50, min: 20, max: 100, step: 5 },
      { key: 'rainEnabled', label: 'Rain', type: 'boolean', default: true },
      { key: 'neonIntensity', label: 'Neon Intensity', type: 'number', default: 1, min: 0, max: 3, step: 0.1 },
    ],
  };

  private scene: THREE.Scene;
  private camera: THREE.PerspectiveCamera;
  private buildings: THREE.Mesh[] = [];
  private neonEdges: THREE.LineSegments[] = [];
  private buildingBaseHeights: number[] = [];
  private rain: THREE.Points | null = null;
  private rainPositions: Float32Array | null = null;
  private ground: THREE.Mesh | null = null;
  private smoothedBass = 0;
  private smoothedEnergy = 0;
  private buildingCount = 50;
  private rainCount = 3000;

  constructor() {
    this.scene = new THREE.Scene();
    this.scene.fog = new THREE.FogExp2(0x0a0a1a, 0.02);
    this.camera = new THREE.PerspectiveCamera(60, 16 / 9, 0.1, 200);
    this.camera.position.set(0, 4, 12);
    this.camera.lookAt(0, 2, 0);
  }

  init(_renderer: THREE.WebGLRenderer): void {
    this.createGround();
    this.createBuildings();
    this.createRain();
    this.createLighting();
  }

  private createGround(): void {
    const geometry = new THREE.PlaneGeometry(60, 60);
    const material = new THREE.MeshStandardMaterial({
      color: 0x111122,
      metalness: 0.9,
      roughness: 0.2,
    });
    this.ground = new THREE.Mesh(geometry, material);
    this.ground.rotation.x = -Math.PI / 2;
    this.ground.position.y = 0;
    this.scene.add(this.ground);
  }

  private createBuildings(): void {
    // Clear existing
    for (const b of this.buildings) {
      this.scene.remove(b);
      b.geometry.dispose();
      (b.material as THREE.Material).dispose();
    }
    for (const e of this.neonEdges) {
      this.scene.remove(e);
      e.geometry.dispose();
      (e.material as THREE.Material).dispose();
    }
    this.buildings = [];
    this.neonEdges = [];
    this.buildingBaseHeights = [];

    for (let i = 0; i < this.buildingCount; i++) {
      const width = 0.5 + Math.random() * 1.5;
      const depth = 0.5 + Math.random() * 1.5;
      const height = 1 + Math.random() * 6;
      this.buildingBaseHeights.push(height);

      const geometry = new THREE.BoxGeometry(width, height, depth);
      geometry.translate(0, height / 2, 0);

      const material = new THREE.MeshStandardMaterial({
        color: 0x1a1a2e,
        metalness: 0.5,
        roughness: 0.7,
      });

      const mesh = new THREE.Mesh(geometry, material);
      mesh.position.x = (Math.random() - 0.5) * 25;
      mesh.position.z = (Math.random() - 0.5) * 15 - 3;

      this.buildings.push(mesh);
      this.scene.add(mesh);

      // Neon edges
      const edgeGeometry = new THREE.EdgesGeometry(geometry);
      const neonColors = [0xff00ff, 0x00ffff, 0xff4400, 0x44ff00];
      const edgeMaterial = new THREE.LineBasicMaterial({
        color: neonColors[Math.floor(Math.random() * neonColors.length)],
        transparent: true,
        opacity: 0.6,
      });
      const edges = new THREE.LineSegments(edgeGeometry, edgeMaterial);
      edges.position.copy(mesh.position);
      this.neonEdges.push(edges);
      this.scene.add(edges);
    }
  }

  private createRain(): void {
    const geometry = new THREE.BufferGeometry();
    this.rainPositions = new Float32Array(this.rainCount * 3);

    for (let i = 0; i < this.rainCount; i++) {
      this.rainPositions[i * 3] = (Math.random() - 0.5) * 30;
      this.rainPositions[i * 3 + 1] = Math.random() * 15;
      this.rainPositions[i * 3 + 2] = (Math.random() - 0.5) * 20;
    }

    geometry.setAttribute('position', new THREE.BufferAttribute(this.rainPositions, 3));

    const material = new THREE.PointsMaterial({
      color: 0x6688cc,
      size: 0.04,
      transparent: true,
      opacity: 0.5,
    });

    this.rain = new THREE.Points(geometry, material);
    this.scene.add(this.rain);
  }

  private createLighting(): void {
    const ambient = new THREE.AmbientLight(0x111133, 0.3);
    this.scene.add(ambient);

    const neonLight1 = new THREE.PointLight(0xff00ff, 1.5, 20);
    neonLight1.position.set(-5, 5, 3);
    this.scene.add(neonLight1);

    const neonLight2 = new THREE.PointLight(0x00ffff, 1.5, 20);
    neonLight2.position.set(5, 4, 5);
    this.scene.add(neonLight2);
  }

  update(deltaTime: number, audioState: AudioState): void {
    this.smoothedBass = lerp(this.smoothedBass, audioState.bass, 0.12);
    this.smoothedEnergy = lerp(this.smoothedEnergy, audioState.energy, 0.1);

    // Building heights pulse with bass
    for (let i = 0; i < this.buildings.length; i++) {
      const building = this.buildings[i];
      const baseH = this.buildingBaseHeights[i];
      const pulse = 1 + this.smoothedBass * 0.3 * (0.5 + Math.random() * 0.5);
      building.scale.y = lerp(building.scale.y, pulse, 0.1);

      // Neon edge flicker with highs
      if (i < this.neonEdges.length) {
        const edgeMat = this.neonEdges[i].material as THREE.LineBasicMaterial;
        const flicker = audioState.highs > 0.5 ? Math.random() * 0.3 : 0;
        edgeMat.opacity = clamp(0.4 + this.smoothedEnergy * 0.4 + flicker, 0.2, 1.0);
        this.neonEdges[i].scale.y = building.scale.y;
      }
    }

    // Rain falling
    if (this.rainPositions && this.rain) {
      const fallSpeed = 8 + this.smoothedEnergy * 5;
      for (let i = 0; i < this.rainCount; i++) {
        this.rainPositions[i * 3 + 1] -= fallSpeed * deltaTime;
        if (this.rainPositions[i * 3 + 1] < 0) {
          this.rainPositions[i * 3 + 1] = 15;
          this.rainPositions[i * 3] = (Math.random() - 0.5) * 30;
          this.rainPositions[i * 3 + 2] = (Math.random() - 0.5) * 20;
        }
      }
      const posAttr = this.rain.geometry.getAttribute('position') as THREE.BufferAttribute;
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
      case 'buildingCount':
        this.buildingCount = value;
        this.createBuildings();
        break;
      case 'neonIntensity':
        for (const edge of this.neonEdges) {
          const mat = edge.material as THREE.LineBasicMaterial;
          mat.opacity = clamp(value * 0.5, 0, 1);
        }
        break;
    }
  }

  dispose(): void {
    for (const b of this.buildings) {
      b.geometry.dispose();
      (b.material as THREE.Material).dispose();
    }
    for (const e of this.neonEdges) {
      e.geometry.dispose();
      (e.material as THREE.Material).dispose();
    }
    if (this.rain) {
      this.rain.geometry.dispose();
      (this.rain.material as THREE.Material).dispose();
    }
    if (this.ground) {
      this.ground.geometry.dispose();
      (this.ground.material as THREE.Material).dispose();
    }
    this.buildings = [];
    this.neonEdges = [];
  }
}
