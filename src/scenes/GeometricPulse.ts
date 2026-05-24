import * as THREE from 'three';
import { AudioState } from '../audio-engine/types';
import { BaseScene, SceneConfig } from './types';
import { lerp, clamp } from '../utils/math';

/**
 * Morphing polyhedra with vertices displaced by frequency band values.
 * Wireframe + solid overlay, rotation linked to energy.
 */
export class GeometricPulse implements BaseScene {
  readonly config: SceneConfig = {
    name: 'Geometric Pulse',
    description: 'Morphing polyhedra displaced by audio frequency bands',
    category: 'geometric',
    parameters: [
      { key: 'detail', label: 'Detail Level', type: 'number', default: 3, min: 1, max: 5, step: 1 },
      { key: 'displacement', label: 'Displacement', type: 'number', default: 0.5, min: 0.1, max: 2, step: 0.1 },
      { key: 'nested', label: 'Nested Shapes', type: 'boolean', default: true },
    ],
  };

  private scene: THREE.Scene;
  private camera: THREE.PerspectiveCamera;
  private solidMesh: THREE.Mesh | null = null;
  private wireMesh: THREE.Mesh | null = null;
  private innerMesh: THREE.Mesh | null = null;
  private outerWire: THREE.Mesh | null = null;
  private basePositions: Float32Array | null = null;
  private innerBasePositions: Float32Array | null = null;
  private displacementAmount = 0.5;
  private smoothedEnergy = 0;
  private smoothedBass = 0;
  private hueOffset = 0;
  private rotationSpeed = new THREE.Vector3(0, 0, 0);

  constructor() {
    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(60, 16 / 9, 0.1, 100);
    this.camera.position.set(0, 0, 5);
    this.camera.lookAt(0, 0, 0);
  }

  init(_renderer: THREE.WebGLRenderer): void {
    this.createGeometry();
    this.createLighting();
  }

  private createGeometry(): void {
    // Main solid icosahedron
    const mainGeom = new THREE.IcosahedronGeometry(1.5, 3);
    this.basePositions = new Float32Array(mainGeom.attributes.position.array);

    const solidMaterial = new THREE.MeshStandardMaterial({
      color: 0x4444ff,
      metalness: 0.3,
      roughness: 0.5,
      transparent: true,
      opacity: 0.7,
    });
    this.solidMesh = new THREE.Mesh(mainGeom, solidMaterial);
    this.scene.add(this.solidMesh);

    // Wireframe overlay
    const wireGeom = new THREE.IcosahedronGeometry(1.5, 3);
    const wireMaterial = new THREE.MeshBasicMaterial({
      color: 0x88aaff,
      wireframe: true,
      transparent: true,
      opacity: 0.5,
    });
    this.wireMesh = new THREE.Mesh(wireGeom, wireMaterial);
    this.scene.add(this.wireMesh);

    // Inner smaller shape
    const innerGeom = new THREE.IcosahedronGeometry(0.8, 2);
    this.innerBasePositions = new Float32Array(innerGeom.attributes.position.array);
    const innerMaterial = new THREE.MeshBasicMaterial({
      color: 0xff4488,
      wireframe: true,
      transparent: true,
      opacity: 0.6,
    });
    this.innerMesh = new THREE.Mesh(innerGeom, innerMaterial);
    this.scene.add(this.innerMesh);

    // Outer wire shape
    const outerGeom = new THREE.IcosahedronGeometry(2.5, 1);
    const outerMaterial = new THREE.MeshBasicMaterial({
      color: 0x44ffaa,
      wireframe: true,
      transparent: true,
      opacity: 0.2,
    });
    this.outerWire = new THREE.Mesh(outerGeom, outerMaterial);
    this.scene.add(this.outerWire);
  }

  private createLighting(): void {
    const ambient = new THREE.AmbientLight(0x333366, 0.5);
    this.scene.add(ambient);

    const point = new THREE.PointLight(0x4488ff, 2, 20);
    point.position.set(3, 3, 3);
    this.scene.add(point);

    const point2 = new THREE.PointLight(0xff4488, 1.5, 20);
    point2.position.set(-3, -2, 2);
    this.scene.add(point2);
  }

  update(deltaTime: number, audioState: AudioState): void {
    this.smoothedEnergy = lerp(this.smoothedEnergy, audioState.energy, 0.1);
    this.smoothedBass = lerp(this.smoothedBass, audioState.bass, 0.12);

    // Color shift on beats
    if (audioState.beatDetected) {
      this.hueOffset += 0.15;
    }

    // Rotation speed linked to energy
    this.rotationSpeed.x = lerp(this.rotationSpeed.x, 0.3 + this.smoothedEnergy * 1.5, 0.05);
    this.rotationSpeed.y = lerp(this.rotationSpeed.y, 0.5 + this.smoothedEnergy * 2, 0.05);

    // Apply rotation
    if (this.solidMesh) {
      this.solidMesh.rotation.x += this.rotationSpeed.x * deltaTime;
      this.solidMesh.rotation.y += this.rotationSpeed.y * deltaTime;
    }
    if (this.wireMesh) {
      this.wireMesh.rotation.x += this.rotationSpeed.x * deltaTime;
      this.wireMesh.rotation.y += this.rotationSpeed.y * deltaTime;
    }
    if (this.innerMesh) {
      this.innerMesh.rotation.x -= this.rotationSpeed.x * 0.7 * deltaTime;
      this.innerMesh.rotation.y -= this.rotationSpeed.y * 0.7 * deltaTime;
    }
    if (this.outerWire) {
      this.outerWire.rotation.x += this.rotationSpeed.x * 0.3 * deltaTime;
      this.outerWire.rotation.z += this.rotationSpeed.y * 0.2 * deltaTime;
    }

    // Displace vertices by frequency bands on main mesh
    if (this.solidMesh && this.wireMesh && this.basePositions) {
      const solidPos = this.solidMesh.geometry.getAttribute('position') as THREE.BufferAttribute;
      const wirePos = this.wireMesh.geometry.getAttribute('position') as THREE.BufferAttribute;
      const vertCount = solidPos.count;
      const spectrum = audioState.spectrum;

      for (let i = 0; i < vertCount; i++) {
        const baseX = this.basePositions[i * 3];
        const baseY = this.basePositions[i * 3 + 1];
        const baseZ = this.basePositions[i * 3 + 2];

        // Direction from center
        const len = Math.sqrt(baseX * baseX + baseY * baseY + baseZ * baseZ);
        const nx = baseX / len;
        const ny = baseY / len;
        const nz = baseZ / len;

        // Map vertex index to spectrum
        const specIdx = Math.floor((i / vertCount) * spectrum.length);
        const specValue = spectrum[clamp(specIdx, 0, 255)] || 0;
        const displacement = specValue * this.displacementAmount;

        solidPos.setXYZ(i, baseX + nx * displacement, baseY + ny * displacement, baseZ + nz * displacement);
        wirePos.setXYZ(i, baseX + nx * displacement, baseY + ny * displacement, baseZ + nz * displacement);
      }

      solidPos.needsUpdate = true;
      wirePos.needsUpdate = true;
      this.solidMesh.geometry.computeVertexNormals();
    }

    // Displace inner mesh
    if (this.innerMesh && this.innerBasePositions) {
      const pos = this.innerMesh.geometry.getAttribute('position') as THREE.BufferAttribute;
      const vertCount = pos.count;

      for (let i = 0; i < vertCount; i++) {
        const baseX = this.innerBasePositions[i * 3];
        const baseY = this.innerBasePositions[i * 3 + 1];
        const baseZ = this.innerBasePositions[i * 3 + 2];

        const len = Math.sqrt(baseX * baseX + baseY * baseY + baseZ * baseZ);
        const nx = baseX / len;
        const ny = baseY / len;
        const nz = baseZ / len;

        const displacement = this.smoothedBass * 0.3;
        pos.setXYZ(i, baseX + nx * displacement, baseY + ny * displacement, baseZ + nz * displacement);
      }
      pos.needsUpdate = true;
    }

    // Update colors
    if (this.solidMesh) {
      const mat = this.solidMesh.material as THREE.MeshStandardMaterial;
      const hue = (this.hueOffset * 0.5) % 1;
      mat.color.setHSL(hue, 0.7, 0.4);
    }
    if (this.wireMesh) {
      const mat = this.wireMesh.material as THREE.MeshBasicMaterial;
      const hue = (this.hueOffset * 0.5 + 0.1) % 1;
      mat.color.setHSL(hue, 0.8, 0.6);
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
      case 'displacement':
        this.displacementAmount = value;
        break;
    }
  }

  dispose(): void {
    if (this.solidMesh) {
      this.solidMesh.geometry.dispose();
      (this.solidMesh.material as THREE.Material).dispose();
    }
    if (this.wireMesh) {
      this.wireMesh.geometry.dispose();
      (this.wireMesh.material as THREE.Material).dispose();
    }
    if (this.innerMesh) {
      this.innerMesh.geometry.dispose();
      (this.innerMesh.material as THREE.Material).dispose();
    }
    if (this.outerWire) {
      this.outerWire.geometry.dispose();
      (this.outerWire.material as THREE.Material).dispose();
    }
    this.basePositions = null;
    this.innerBasePositions = null;
  }
}
