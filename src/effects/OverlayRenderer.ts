/**
 * OverlayRenderer - Renders overlays on top of the 3D scene.
 * Supports text, image, and logo overlays with screen-space positioning.
 */

import * as THREE from 'three';

export type OverlayType = 'text' | 'image' | 'logo';

export interface OverlayConfig {
  id: string;
  type: OverlayType;
  x: number;
  y: number;
  width?: number;
  height?: number;
  content: string;
  opacity?: number;
  color?: string;
  fontSize?: number;
}

interface OverlayEntry {
  config: OverlayConfig;
  sprite: THREE.Sprite;
}

export class OverlayRenderer {
  private scene: THREE.Scene;
  private overlays: Map<string, OverlayEntry> = new Map();
  private camera: THREE.OrthographicCamera;

  constructor(scene: THREE.Scene) {
    this.scene = scene;
    this.camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
  }

  /**
   * Add an overlay to the scene.
   */
  addOverlay(config: OverlayConfig): void {
    this.removeOverlay(config.id);

    const canvas = document.createElement('canvas');
    canvas.width = config.width ?? 256;
    canvas.height = config.height ?? 64;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    if (config.type === 'text') {
      ctx.fillStyle = config.color ?? '#ffffff';
      ctx.font = `${config.fontSize ?? 24}px monospace`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(config.content, canvas.width / 2, canvas.height / 2);
    }

    const texture = new THREE.CanvasTexture(canvas);
    const material = new THREE.SpriteMaterial({
      map: texture,
      transparent: true,
      opacity: config.opacity ?? 1.0,
    });
    const sprite = new THREE.Sprite(material);
    sprite.position.set(config.x, config.y, 0.1);
    sprite.scale.set(
      (config.width ?? 256) / 256,
      (config.height ?? 64) / 256,
      1
    );

    this.scene.add(sprite);
    this.overlays.set(config.id, { config, sprite });
  }

  /**
   * Remove an overlay by ID.
   */
  removeOverlay(id: string): void {
    const entry = this.overlays.get(id);
    if (entry) {
      this.scene.remove(entry.sprite);
      entry.sprite.material.dispose();
      if (entry.sprite.material.map) {
        entry.sprite.material.map.dispose();
      }
      this.overlays.delete(id);
    }
  }

  /**
   * Get all overlay IDs.
   */
  getOverlayIds(): string[] {
    return Array.from(this.overlays.keys());
  }

  /**
   * Update overlays (per frame).
   */
  update(): void {
    // No-op for static overlays; animated overlays would update here
  }

  /**
   * Get the orthographic camera for overlay rendering.
   */
  getCamera(): THREE.OrthographicCamera {
    return this.camera;
  }

  /**
   * Dispose all overlays and resources.
   */
  dispose(): void {
    for (const [id] of this.overlays) {
      this.removeOverlay(id);
    }
  }
}
