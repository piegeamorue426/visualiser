import * as THREE from 'three';
import { AudioState } from '../audio-engine/types';
import { BaseScene, SceneConfig } from './types';
import { lerp, clamp } from '../utils/math';

/**
 * Space environment with starfield, central pulsing sphere, orbiting objects,
 * and nebula-like colored planes.
 */
export class SpaceScene implements BaseScene {
  readonly config: SceneConfig = {
    name: 'Space',
    description: 'Starfield with a pulsing energy sphere, orbiting particles, and nebula effects',
    category: 'environment',
    parameters: [
      { key: 'starCount', label: 'Stars', type: 'number', default: 10000, min: 1000, max: 30000, step: 1000 },
      { key: 'sphereSize', label: 'Sphere Size', type: 'number', default: 1.5, min: 0.5, max: 4, step: 0.25 },
      { key: 'nebulaEnabled', label: 'Nebula', type: 'boolean', default: true },
    ],
  };

  private scene: THREE.Scene;
  private camera: THREE.PerspectiveCamera;
  private stars: THREE.Points | null = null;
  private centralSphere: THREE.Mesh | null = null;
  private orbitingSpheres: THREE.Mesh[] = [];
  private nebulaPlanes: THREE.Mesh[] = [];
  private lensFlare: THREE.Sprite | null = null;
  private smoothedBass = 0;
  private smoothedEnergy = 0;
  private time = 0;
  private sphereSize = 1.5;

  constructor() {
    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(60, 16 / 9, 0.1, 500);
    this.camera.position.set(0, 2, 8);
    this.camera.lookAt(0, 0, 0);
  }

  init(_renderer: THREE.WebGLRenderer): void {
    this.createStarfield();
    this.createCentralSphere();
    this.createOrbitingSpheres();
    this.createNebula();
    this.createLensFlare();
  }

  private createStarfield(): void {
    const starCount = 10000;
    const geometry = new THREE.BufferGeometry();
    const positions = new Float32Array(starCount * 3);
    const colors = new Float32Array(starCount * 3);

    for (let i = 0; i < starCount; i++) {
      positions[i * 3] = (Math.random() - 0.5) * 200;
      positions[i * 3 + 1] = (Math.random() - 0.5) * 200;
      positions[i * 3 + 2] = (Math.random() - 0.5) * 200;

      const brightness = 0.5 + Math.random() * 0.5;
      colors[i * 3] = brightness;
      colors[i * 3 + 1] = brightness;
      colors[i * 3 + 2] = brightness + Math.random() * 0.1;
    }

    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));

    const material = new THREE.PointsMaterial({
      size: 0.15,
      vertexColors: true,
      transparent: true,
      opacity: 0.8,
      sizeAttenuation: true,
    });

    this.stars = new THREE.Points(geometry, material);
    this.scene.add(this.stars);
  }

  private createCentralSphere(): void {
    const geometry = new THREE.SphereGeometry(this.sphereSize, 32, 32);
    const material = new THREE.MeshBasicMaterial({
      color: 0x4488ff,
      transparent: true,
      opacity: 0.9,
    });
    this.centralSphere = new THREE.Mesh(geometry, material);
    this.scene.add(this.centralSphere);
  }

  private createOrbitingSpheres(): void {
    const count = 6;
    for (let i = 0; i < count; i++) {
      const geometry = new THREE.SphereGeometry(0.15, 16, 16);
      const hue = i / count;
      const material = new THREE.MeshBasicMaterial({
        color: new THREE.Color().setHSL(hue, 0.8, 0.6),
        transparent: true,
        opacity: 0.8,
      });
      const mesh = new THREE.Mesh(geometry, material);
      this.orbitingSpheres.push(mesh);
      this.scene.add(mesh);
    }
  }

  private createNebula(): void {
    const colors = [0xff4488, 0x4488ff, 0x44ffaa];
    for (let i = 0; i < 3; i++) {
      const geometry = new THREE.PlaneGeometry(15, 15);
      const material = new THREE.MeshBasicMaterial({
        color: colors[i],
        transparent: true,
        opacity: 0.04,
        side: THREE.DoubleSide,
        blending: THREE.AdditiveBlending,
      });
      const mesh = new THREE.Mesh(geometry, material);
      mesh.position.z = -10 - i * 5;
      mesh.rotation.z = (i / 3) * Math.PI;
      this.nebulaPlanes.push(mesh);
      this.scene.add(mesh);
    }
  }

  private createLensFlare(): void {
    const material = new THREE.SpriteMaterial({
      color: 0xffffff,
      transparent: true,
      opacity: 0,
      blending: THREE.AdditiveBlending,
    });
    this.lensFlare = new THREE.Sprite(material);
    this.lensFlare.scale.set(2, 2, 1);
    this.scene.add(this.lensFlare);
  }

  update(deltaTime: number, audioState: AudioState): void {
    this.smoothedBass = lerp(this.smoothedBass, audioState.bass, 0.12);
    this.smoothedEnergy = lerp(this.smoothedEnergy, audioState.energy, 0.1);
    this.time += deltaTime;

    // Central sphere pulses with bass
    if (this.centralSphere) {
      const scale = 1 + this.smoothedBass * 0.5;
      this.centralSphere.scale.set(scale, scale, scale);
      const mat = this.centralSphere.material as THREE.MeshBasicMaterial;
      const brightness = 0.3 + this.smoothedEnergy * 0.5;
      mat.color.setHSL(0.6 + this.smoothedBass * 0.1, 0.8, brightness);
    }

    // Orbiting spheres
    for (let i = 0; i < this.orbitingSpheres.length; i++) {
      const sphere = this.orbitingSpheres[i];
      const angle = this.time * (0.5 + i * 0.2) + (i / this.orbitingSpheres.length) * Math.PI * 2;
      const radius = 3 + i * 0.3;
      sphere.position.x = Math.cos(angle) * radius;
      sphere.position.y = Math.sin(angle * 0.7) * radius * 0.3;
      sphere.position.z = Math.sin(angle) * radius;

      const specIdx = Math.floor((i / this.orbitingSpheres.length) * 128);
      const specValue = audioState.spectrum[specIdx] || 0;
      const s = 0.8 + specValue * 1.5;
      sphere.scale.set(s, s, s);
    }

    // Nebula rotation
    for (let i = 0; i < this.nebulaPlanes.length; i++) {
      this.nebulaPlanes[i].rotation.z += deltaTime * 0.02 * (i + 1);
      const mat = this.nebulaPlanes[i].material as THREE.MeshBasicMaterial;
      mat.opacity = clamp(0.02 + this.smoothedEnergy * 0.04, 0.02, 0.08);
    }

    // Lens flare on peaks
    if (this.lensFlare) {
      const mat = this.lensFlare.material as THREE.SpriteMaterial;
      if (audioState.peakDetected) {
        mat.opacity = 0.8;
      } else {
        mat.opacity = lerp(mat.opacity, 0, 0.05);
      }
    }

    // Slow starfield rotation
    if (this.stars) {
      this.stars.rotation.y += deltaTime * 0.01;
    }

    // Camera slight orbit
    this.camera.position.x = Math.sin(this.time * 0.1) * 2;
    this.camera.position.y = 2 + Math.cos(this.time * 0.08) * 0.5;
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
      case 'sphereSize':
        this.sphereSize = value;
        if (this.centralSphere) {
          this.centralSphere.geometry.dispose();
          this.centralSphere.geometry = new THREE.SphereGeometry(this.sphereSize, 32, 32);
        }
        break;
    }
  }

  dispose(): void {
    if (this.stars) {
      this.stars.geometry.dispose();
      (this.stars.material as THREE.Material).dispose();
    }
    if (this.centralSphere) {
      this.centralSphere.geometry.dispose();
      (this.centralSphere.material as THREE.Material).dispose();
    }
    for (const sphere of this.orbitingSpheres) {
      sphere.geometry.dispose();
      (sphere.material as THREE.Material).dispose();
    }
    for (const plane of this.nebulaPlanes) {
      plane.geometry.dispose();
      (plane.material as THREE.Material).dispose();
    }
    if (this.lensFlare) {
      (this.lensFlare.material as THREE.Material).dispose();
    }
  }
}
