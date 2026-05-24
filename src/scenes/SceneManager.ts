import * as THREE from 'three';
import { AudioState } from '../audio-engine/types';
import { BaseScene, SceneConfig } from './types';
import { lerp } from '../utils/math';

/**
 * Manages scene lifecycle including loading, transitions, and disposal.
 */
export class SceneManager {
  private activeScene: BaseScene | null = null;
  private previousScene: BaseScene | null = null;
  private registry: Map<string, () => BaseScene> = new Map();
  private configRegistry: Map<string, SceneConfig> = new Map();
  private renderer: THREE.WebGLRenderer | null = null;
  private transitionProgress = 1;
  private transitionDuration = 1.5;
  private isTransitioning = false;

  /**
   * Register a scene factory by id for lazy construction, with optional static metadata.
   */
  registerScene(id: string, factory: () => BaseScene, config?: SceneConfig): void {
    this.registry.set(id, factory);
    if (config) {
      this.configRegistry.set(id, config);
    }
  }

  /**
   * Set the renderer to be used for scene initialization.
   */
  setRenderer(renderer: THREE.WebGLRenderer): void {
    this.renderer = renderer;
  }

  /**
   * Load a scene by ID with crossfade transition.
   */
  loadScene(id: string): void {
    const factory = this.registry.get(id);
    if (!factory) {
      console.warn(`[SceneManager] Scene "${id}" not found. Available: ${Array.from(this.registry.keys()).join(', ')}`);
      return;
    }

    const newScene = factory();
    if (this.renderer) {
      newScene.init(this.renderer);
    }

    if (this.activeScene) {
      this.previousScene = this.activeScene;
      this.transitionProgress = 0;
      this.isTransitioning = true;
    }

    this.activeScene = newScene;
  }

  /**
   * Update the active scene. Handles crossfade transitions.
   */
  update(deltaTime: number, audioState: AudioState): void {
    if (this.isTransitioning) {
      this.transitionProgress = Math.min(
        1,
        this.transitionProgress + deltaTime / this.transitionDuration
      );

      if (this.transitionProgress >= 1) {
        this.isTransitioning = false;
        if (this.previousScene) {
          this.previousScene.dispose();
          this.previousScene = null;
        }
      }
    }

    if (this.previousScene) {
      this.previousScene.update(deltaTime, audioState);
    }

    if (this.activeScene) {
      this.activeScene.update(deltaTime, audioState);
    }
  }

  /**
   * Get the current transition opacity for crossfade rendering.
   */
  getTransitionAlpha(): number {
    return this.isTransitioning ? lerp(0, 1, this.transitionProgress) : 1;
  }

  /**
   * Get the active scene.
   */
  getActiveScene(): BaseScene | null {
    return this.activeScene;
  }

  /**
   * Get the previous scene (during transitions).
   */
  getPreviousScene(): BaseScene | null {
    return this.previousScene;
  }

  /**
   * Whether a transition is in progress.
   */
  getIsTransitioning(): boolean {
    return this.isTransitioning;
  }

  /**
   * Get a list of all available scene configurations without instantiating scenes.
   */
  getAvailableScenes(): { id: string; config: SceneConfig }[] {
    const scenes: { id: string; config: SceneConfig }[] = [];
    for (const [id] of this.registry.entries()) {
      const config = this.configRegistry.get(id);
      if (config) {
        scenes.push({ id, config });
      }
    }
    return scenes;
  }

  /**
   * Resize the active scene.
   */
  resize(width: number, height: number): void {
    if (this.activeScene) {
      this.activeScene.resize(width, height);
    }
    if (this.previousScene) {
      this.previousScene.resize(width, height);
    }
  }

  /**
   * Dispose all scenes and clear registry.
   */
  dispose(): void {
    if (this.activeScene) {
      this.activeScene.dispose();
      this.activeScene = null;
    }
    if (this.previousScene) {
      this.previousScene.dispose();
      this.previousScene = null;
    }
    this.registry.clear();
  }
}
