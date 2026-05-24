/**
 * BackgroundRenderer - Renders custom backgrounds behind the 3D scene.
 * Supports solid colors, gradients, images, and transparent backgrounds.
 */

import * as THREE from 'three';

export type BackgroundType = 'solid' | 'gradient' | 'image' | 'video' | 'transparent';

export interface BackgroundConfig {
  type: BackgroundType;
  color?: string;
  gradientStart?: string;
  gradientEnd?: string;
  imageUrl?: string;
}

export class BackgroundRenderer {
  private scene: THREE.Scene;
  private mesh: THREE.Mesh | null = null;
  private material: THREE.ShaderMaterial | null = null;
  private texture: THREE.Texture | null = null;
  private config: BackgroundConfig = { type: 'solid', color: '#0a0a0f' };

  constructor(scene: THREE.Scene) {
    this.scene = scene;
  }

  /**
   * Set the background configuration and update rendering.
   */
  setBackground(config: BackgroundConfig): void {
    this.config = config;
    this.rebuild();
  }

  /**
   * Get the current background configuration.
   */
  getConfig(): BackgroundConfig {
    return { ...this.config };
  }

  /**
   * Update background (called per frame if needed).
   */
  update(): void {
    // No-op for static backgrounds; video would update texture here
  }

  /**
   * Dispose all resources.
   */
  dispose(): void {
    if (this.mesh) {
      this.scene.remove(this.mesh);
      this.mesh.geometry.dispose();
      this.mesh = null;
    }
    if (this.material) {
      this.material.dispose();
      this.material = null;
    }
    if (this.texture) {
      this.texture.dispose();
      this.texture = null;
    }
  }

  private rebuild(): void {
    this.dispose();

    switch (this.config.type) {
      case 'solid':
        this.scene.background = new THREE.Color(this.config.color ?? '#0a0a0f');
        break;
      case 'gradient':
        this.buildGradientBackground();
        break;
      case 'image':
        this.buildImageBackground();
        break;
      case 'transparent':
        this.scene.background = null;
        break;
      case 'video':
        // Video background is architecture-only for now
        this.scene.background = new THREE.Color('#000000');
        break;
    }
  }

  private buildGradientBackground(): void {
    const canvas = document.createElement('canvas');
    canvas.width = 2;
    canvas.height = 256;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const gradient = ctx.createLinearGradient(0, 0, 0, 256);
    gradient.addColorStop(0, this.config.gradientStart ?? '#000000');
    gradient.addColorStop(1, this.config.gradientEnd ?? '#1a1a2e');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, 2, 256);

    this.texture = new THREE.CanvasTexture(canvas);
    this.scene.background = this.texture;
  }

  private buildImageBackground(): void {
    if (!this.config.imageUrl) {
      this.scene.background = new THREE.Color('#0a0a0f');
      return;
    }

    const loader = new THREE.TextureLoader();
    loader.load(
      this.config.imageUrl,
      (texture) => {
        this.texture = texture;
        this.scene.background = texture;
      },
      undefined,
      () => {
        this.scene.background = new THREE.Color('#0a0a0f');
      }
    );
  }
}
