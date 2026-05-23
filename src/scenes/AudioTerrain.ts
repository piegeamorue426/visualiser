import * as THREE from 'three';
import { AudioState } from '../audio-engine/types';
import { BaseScene, SceneConfig } from './types';
import { lerp, clamp } from '../utils/math';

/**
 * Procedural terrain with vertices displaced by frequency spectrum.
 * Rows scroll forward over time, creating an evolving landscape.
 */
export class AudioTerrain implements BaseScene {
  readonly config: SceneConfig = {
    name: 'Audio Terrain',
    description: 'Procedural terrain displaced by audio spectrum with height-based coloring',
    category: 'environment',
    parameters: [
      { key: 'heightScale', label: 'Height Scale', type: 'number', default: 2, min: 0.5, max: 5, step: 0.25 },
      { key: 'scrollSpeed', label: 'Scroll Speed', type: 'number', default: 1, min: 0.1, max: 5, step: 0.1 },
      { key: 'wireframe', label: 'Wireframe', type: 'boolean', default: false },
    ],
  };

  private scene: THREE.Scene;
  private camera: THREE.PerspectiveCamera;
  private terrain: THREE.Mesh | null = null;
  private segments = 128;
  private heightScale = 2;
  private scrollSpeed = 1;
  private scrollOffset = 0;
  private heightHistory: Float32Array[] = [];
  private smoothedEnergy = 0;

  constructor() {
    this.scene = new THREE.Scene();
    this.scene.fog = new THREE.FogExp2(0x001122, 0.03);
    this.camera = new THREE.PerspectiveCamera(60, 16 / 9, 0.1, 200);
    this.camera.position.set(0, 5, 8);
    this.camera.lookAt(0, 0, -5);
  }

  init(_renderer: THREE.WebGLRenderer): void {
    this.createTerrain();
    this.createLighting();

    // Initialize height history
    for (let i = 0; i < this.segments; i++) {
      this.heightHistory.push(new Float32Array(this.segments));
    }
  }

  private createTerrain(): void {
    if (this.terrain) {
      this.scene.remove(this.terrain);
      this.terrain.geometry.dispose();
      (this.terrain.material as THREE.Material).dispose();
    }

    const geometry = new THREE.PlaneGeometry(20, 20, this.segments - 1, this.segments - 1);
    geometry.rotateX(-Math.PI / 2);

    const material = new THREE.MeshStandardMaterial({
      vertexColors: true,
      side: THREE.DoubleSide,
      flatShading: true,
    });

    // Initialize vertex colors
    const count = geometry.attributes.position.count;
    const colors = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      colors[i * 3] = 0.1;
      colors[i * 3 + 1] = 0.2;
      colors[i * 3 + 2] = 0.4;
    }
    geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));

    this.terrain = new THREE.Mesh(geometry, material);
    this.scene.add(this.terrain);
  }

  private createLighting(): void {
    const ambient = new THREE.AmbientLight(0x223344, 0.5);
    this.scene.add(ambient);

    const directional = new THREE.DirectionalLight(0xffffff, 1);
    directional.position.set(5, 10, 5);
    this.scene.add(directional);
  }

  update(deltaTime: number, audioState: AudioState): void {
    if (!this.terrain) return;

    this.smoothedEnergy = lerp(this.smoothedEnergy, audioState.energy, 0.1);
    this.scrollOffset += deltaTime * this.scrollSpeed * (1 + this.smoothedEnergy);

    // Shift height history and add new row from spectrum
    if (this.heightHistory.length > 0) {
      // Shift rows
      const newRow = new Float32Array(this.segments);
      for (let i = 0; i < this.segments; i++) {
        const specIdx = Math.floor((i / this.segments) * audioState.spectrum.length);
        newRow[i] = (audioState.spectrum[specIdx] || 0) * this.heightScale;
      }

      // Remove last row and prepend new one
      if (this.scrollOffset >= 1) {
        this.scrollOffset -= 1;
        this.heightHistory.pop();
        this.heightHistory.unshift(newRow);
      }
    }

    // Apply height history to terrain vertices
    const posAttr = this.terrain.geometry.getAttribute('position') as THREE.BufferAttribute;
    const colorAttr = this.terrain.geometry.getAttribute('color') as THREE.BufferAttribute;

    for (let row = 0; row < this.segments; row++) {
      for (let col = 0; col < this.segments; col++) {
        const idx = row * this.segments + col;
        const height = this.heightHistory[row] ? this.heightHistory[row][col] : 0;
        posAttr.setY(idx, height);

        // Color by height
        const t = clamp(height / this.heightScale, 0, 1);
        if (t < 0.3) {
          // Deep blue
          colorAttr.setXYZ(idx, 0.05, 0.1, 0.3 + t);
        } else if (t < 0.6) {
          // Green
          colorAttr.setXYZ(idx, 0.1, 0.3 + t * 0.5, 0.2);
        } else {
          // Red/orange
          colorAttr.setXYZ(idx, 0.5 + t * 0.5, 0.2, 0.1);
        }
      }
    }

    posAttr.needsUpdate = true;
    colorAttr.needsUpdate = true;
    this.terrain.geometry.computeVertexNormals();

    // Camera slowly moves forward
    this.camera.position.z = 8 + Math.sin(Date.now() * 0.0002) * 2;
    this.camera.lookAt(0, 0, -5);
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
      case 'heightScale':
        this.heightScale = value;
        break;
      case 'scrollSpeed':
        this.scrollSpeed = value;
        break;
      case 'wireframe':
        if (this.terrain) {
          (this.terrain.material as THREE.MeshStandardMaterial).wireframe = value;
        }
        break;
    }
  }

  dispose(): void {
    if (this.terrain) {
      this.terrain.geometry.dispose();
      (this.terrain.material as THREE.Material).dispose();
    }
    this.heightHistory = [];
  }
}
