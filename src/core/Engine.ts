/**
 * Engine - Main orchestrator class that initializes and coordinates
 * all systems: audio, rendering, scenes, camera, presets, plugins, and performance.
 */

import { AudioManager } from '@audio/AudioManager';
import type { AudioState } from '@audio/types';
import { createDefaultAudioState } from '@audio/types';
import * as THREE from 'three';
import { RenderPipeline } from '@render/RenderPipeline';
import type { RenderStats, PostProcessingConfig } from '@render/types';
import { createDefaultPostProcessingConfig } from '@render/types';
import { SceneManager } from '@scenes/SceneManager';
import { createSceneManager } from '@scenes/registry';
import { CameraSystem } from '@camera/CameraSystem';
import { CameraMode } from '@camera/types';
import { PresetManager } from '@presets/PresetManager';
import type { Preset } from '@presets/types';
import { PluginManager } from '@plugins/PluginManager';
import type { PluginContext } from '@plugins/types';
import { BackgroundRenderer } from '@effects/BackgroundRenderer';
import type { BackgroundConfig } from '@effects/BackgroundRenderer';
import type { StreamingConfig } from '@config/streaming';
import { DEFAULT_STREAMING_CONFIG } from '@config/streaming';
import type { WallpaperConfig } from '@config/wallpaper';
import { DEFAULT_WALLPAPER_CONFIG } from '@config/wallpaper';
import { EventBus } from './EventBus';
import { GlobalState } from './GlobalState';

export class Engine {
  private audioManager: AudioManager;
  private renderPipeline: RenderPipeline | null = null;
  private sceneManager: SceneManager;
  private cameraSystem: CameraSystem;
  private presetManager: PresetManager;
  private pluginManager: PluginManager;
  private backgroundRenderer: BackgroundRenderer | null = null;
  private eventBus: EventBus;
  private globalState: GlobalState;
  private streamingConfig: StreamingConfig;
  private wallpaperConfig: WallpaperConfig;

  private canvas: HTMLCanvasElement | null = null;
  private running = false;
  private animationFrameId: number | null = null;
  private lastTime = 0;
  private lastRenderTime = 0;
  private audioState: AudioState;

  constructor() {
    this.audioManager = AudioManager.getInstance();
    this.sceneManager = createSceneManager();
    this.cameraSystem = new CameraSystem();
    this.presetManager = new PresetManager();
    this.pluginManager = new PluginManager();
    this.eventBus = new EventBus();
    this.globalState = new GlobalState();
    this.audioState = createDefaultAudioState();
    this.streamingConfig = { ...DEFAULT_STREAMING_CONFIG };
    this.wallpaperConfig = { ...DEFAULT_WALLPAPER_CONFIG };

    this.setupPluginContext();
  }

  /**
   * Initialize the engine with a canvas element.
   */
  init(canvas: HTMLCanvasElement): void {
    this.canvas = canvas;
    const width = canvas.clientWidth || 1920;
    const height = canvas.clientHeight || 1080;

    this.renderPipeline = new RenderPipeline(canvas, {
      width,
      height,
      pixelRatio: window?.devicePixelRatio ?? 1,
      antialias: true,
      alpha: false,
    });

    this.sceneManager.setRenderer(this.renderPipeline.getRenderer());
    this.cameraSystem.setAspect(width / height);

    // Initialize background renderer on the active scene
    const activeScene = this.sceneManager.getActiveScene();
    if (activeScene) {
      this.backgroundRenderer = new BackgroundRenderer(activeScene.getScene());
    }

    // Load the first scene
    this.sceneManager.loadScene('circular-spectrum');
    this.globalState.set('currentSceneId', 'circular-spectrum');
  }

  /**
   * Start the render loop.
   */
  start(): void {
    if (this.running) return;
    this.running = true;
    this.lastTime = performance.now();
    this.globalState.set('isPlaying', true);
    this.loop();
  }

  /**
   * Stop the render loop.
   */
  stop(): void {
    this.running = false;
    this.globalState.set('isPlaying', false);
    if (this.animationFrameId !== null) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }
  }

  /**
   * Load a preset by ID, applying its configuration to all systems.
   */
  loadPreset(presetId: string): void {
    const preset = this.presetManager.getById(presetId);
    if (!preset) return;

    this.applyPreset(preset);
    this.globalState.set('currentPresetId', presetId);
    this.eventBus.emit('presetLoaded', { presetId });
  }

  /**
   * Load a scene by ID.
   */
  loadScene(sceneId: string): void {
    this.sceneManager.loadScene(sceneId);
    this.globalState.set('currentSceneId', sceneId);
    this.eventBus.emit('sceneChange', { sceneId });
  }

  /**
   * Start microphone audio input.
   */
  async startMicrophone(): Promise<void> {
    await this.audioManager.initializeFromMicrophone();
  }

  /**
   * Get the current audio state.
   */
  getAudioState(): AudioState {
    return this.audioState;
  }

  /**
   * Get current performance stats.
   */
  getPerformanceStats(): RenderStats {
    if (!this.renderPipeline) {
      return { fps: 0, frameTime: 0, drawCalls: 0, triangles: 0, memoryUsage: 0 };
    }
    return this.renderPipeline.getStats();
  }

  /**
   * Resize the renderer and all systems.
   */
  resize(width: number, height: number): void {
    if (this.renderPipeline) {
      this.renderPipeline.resize(width, height);
    }
    this.cameraSystem.setAspect(width / height);
    this.sceneManager.resize(width, height);
  }

  /**
   * Get the preset manager instance.
   */
  getPresetManager(): PresetManager {
    return this.presetManager;
  }

  /**
   * Get the scene manager instance.
   */
  getSceneManager(): SceneManager {
    return this.sceneManager;
  }

  /**
   * Get the camera system instance.
   */
  getCameraSystem(): CameraSystem {
    return this.cameraSystem;
  }

  /**
   * Get the event bus instance.
   */
  getEventBus(): EventBus {
    return this.eventBus;
  }

  /**
   * Get the global state instance.
   */
  getGlobalState(): GlobalState {
    return this.globalState;
  }

  /**
   * Get the render pipeline instance.
   */
  getRenderPipeline(): RenderPipeline | null {
    return this.renderPipeline;
  }

  /**
   * Get the plugin manager instance.
   */
  getPluginManager(): PluginManager {
    return this.pluginManager;
  }

  /**
   * Get the background renderer instance.
   */
  getBackgroundRenderer(): BackgroundRenderer | null {
    return this.backgroundRenderer;
  }

  /**
   * Set the streaming configuration.
   */
  setStreamingConfig(config: Partial<StreamingConfig>): void {
    this.streamingConfig = { ...this.streamingConfig, ...config };
    this.globalState.set('streamingMode', this.streamingConfig.mode);
  }

  /**
   * Get the current streaming configuration.
   */
  getStreamingConfig(): StreamingConfig {
    return { ...this.streamingConfig };
  }

  /**
   * Set the wallpaper configuration.
   */
  setWallpaperConfig(config: Partial<WallpaperConfig>): void {
    this.wallpaperConfig = { ...this.wallpaperConfig, ...config };
  }

  /**
   * Get the current wallpaper configuration.
   */
  getWallpaperConfig(): WallpaperConfig {
    return { ...this.wallpaperConfig };
  }

  /**
   * Set the background configuration.
   */
  setBackground(config: BackgroundConfig): void {
    if (this.backgroundRenderer) {
      this.backgroundRenderer.setBackground(config);
    }
  }

  /**
   * Apply control panel settings to the relevant engine systems.
   */
  applyControlSettings(settings: {
    audio?: { sensitivity?: number; smoothing?: number };
    visual?: {
      bloom?: boolean;
      bloomIntensity?: number;
      chromaticAberration?: boolean;
      vignette?: boolean;
      filmGrain?: boolean;
    };
    camera?: { mode?: string; shakeIntensity?: number; orbitSpeed?: number };
  }): void {
    // Apply audio sensitivity/smoothing
    if (settings.audio) {
      const analyzer = this.audioManager.getAnalyzer();
      if (analyzer) {
        analyzer.setSensitivity(settings.audio.sensitivity ?? 1.0);
        analyzer.setSmoothing(settings.audio.smoothing ?? 0.8);
      }
    }

    // Apply visual/post-processing settings
    if (settings.visual && this.renderPipeline) {
      const ppConfig: Partial<PostProcessingConfig> = {
        bloom: {
          enabled: settings.visual.bloom ?? true,
          intensity: settings.visual.bloomIntensity ?? 1.5,
          threshold: 0.6,
          radius: 0.4,
        },
        chromaticAberration: {
          enabled: settings.visual.chromaticAberration ?? true,
          offset: 0.002,
        },
        vignette: {
          enabled: settings.visual.vignette ?? true,
          intensity: 0.8,
          smoothness: 0.4,
        },
        filmGrain: {
          enabled: settings.visual.filmGrain ?? false,
          intensity: 0.05,
          speed: 1.0,
        },
      };
      const merged = { ...createDefaultPostProcessingConfig(), ...ppConfig };
      this.renderPipeline.setPostProcessingConfig(merged);
    }

    // Apply camera settings
    if (settings.camera) {
      if (settings.camera.mode) {
        const modeMap: Record<string, CameraMode> = {
          orbit: CameraMode.Orbit,
          static: CameraMode.Static,
          cinematic: CameraMode.Cinematic,
          follow: CameraMode.Follow,
        };
        const mode = modeMap[settings.camera.mode];
        if (mode !== undefined) {
          this.cameraSystem.setMode(mode);
        }
      }
      if (settings.camera.shakeIntensity !== undefined) {
        this.cameraSystem.setShakeIntensity(settings.camera.shakeIntensity);
      }
      if (settings.camera.orbitSpeed !== undefined) {
        this.cameraSystem.setOrbitSpeed(settings.camera.orbitSpeed);
      }
    }
  }

  /**
   * Get whether the engine is running.
   */
  getIsRunning(): boolean {
    return this.running;
  }

  /**
   * Dispose all engine resources.
   */
  dispose(): void {
    this.stop();
    this.audioManager.destroy();
    this.sceneManager.dispose();
    this.pluginManager.dispose();
    if (this.backgroundRenderer) {
      this.backgroundRenderer.dispose();
      this.backgroundRenderer = null;
    }
    if (this.renderPipeline) {
      this.renderPipeline.dispose();
      this.renderPipeline = null;
    }
    this.eventBus.clear();
  }

  private getTargetFps(): number {
    // Wallpaper mode FPS limit takes priority
    if (this.wallpaperConfig.enabled && this.wallpaperConfig.fpsLimit > 0) {
      return this.wallpaperConfig.fpsLimit;
    }
    // Streaming mode FPS target
    if (this.streamingConfig.mode !== 'normal' && this.streamingConfig.targetFps > 0) {
      return this.streamingConfig.targetFps;
    }
    return 0; // 0 means uncapped
  }

  private loop(): void {
    if (!this.running) return;

    const now = performance.now();

    // Frame throttling: skip frame if target FPS is set and interval hasn't elapsed
    const targetFps = this.getTargetFps();
    if (targetFps > 0 && targetFps < 60) {
      const minFrameInterval = 1000 / targetFps;
      if (now - this.lastRenderTime < minFrameInterval) {
        this.animationFrameId = requestAnimationFrame(() => this.loop());
        return;
      }
    }
    this.lastRenderTime = now;

    const deltaTime = Math.min((now - this.lastTime) / 1000, 0.1);
    this.lastTime = now;

    // 1. Update audio state
    this.audioState = this.audioManager.update();

    // 2. Emit events based on audio
    if (this.audioState.beatDetected) {
      this.eventBus.emit('beat', { strength: this.audioState.bass });
    }
    if (this.audioState.dropDetected) {
      this.eventBus.emit('drop', { energy: this.audioState.energy });
    }

    // 3. Update scene
    this.sceneManager.update(deltaTime, this.audioState);

    // 4. Update camera - apply camera system to active scene's camera
    const activeScene = this.sceneManager.getActiveScene();
    if (activeScene) {
      this.cameraSystem.updateTarget(activeScene.getCamera() as THREE.PerspectiveCamera, deltaTime, this.audioState);
    }

    // 5. Notify plugins
    this.pluginManager.onAudioUpdate(this.audioState);
    this.pluginManager.onRender(deltaTime);

    // 6. Update background
    if (this.backgroundRenderer) {
      this.backgroundRenderer.update();
    }

    // 7. Render
    if (activeScene && this.renderPipeline) {
      this.renderPipeline.render(
        activeScene.getScene(),
        activeScene.getCamera(),
        this.audioState
      );
    }

    // 8. Update performance stats in global state
    const stats = this.getPerformanceStats();
    this.globalState.set('performanceStats', stats);

    this.animationFrameId = requestAnimationFrame(() => this.loop());
  }

  private applyPreset(preset: Preset): void {
    // Apply scene
    this.loadScene(preset.sceneId);

    // Apply camera config
    const modeMap: Record<string, CameraMode> = {
      orbit: CameraMode.Orbit,
      static: CameraMode.Static,
      cinematic: CameraMode.Cinematic,
      follow: CameraMode.Follow,
    };
    this.cameraSystem.setMode(modeMap[preset.cameraConfig.mode] ?? CameraMode.Orbit);

    // Apply post-processing config
    if (this.renderPipeline) {
      const ppConfig: Partial<PostProcessingConfig> = {
        bloom: {
          enabled: preset.renderConfig.bloom,
          intensity: preset.renderConfig.bloomIntensity,
          threshold: 0.6,
          radius: 0.4,
        },
        chromaticAberration: {
          enabled: preset.renderConfig.chromaticAberration,
          offset: 0.002,
        },
        vignette: {
          enabled: preset.renderConfig.vignette,
          intensity: 0.8,
          smoothness: 0.4,
        },
        filmGrain: {
          enabled: preset.renderConfig.filmGrain,
          intensity: 0.05,
          speed: 1.0,
        },
      };
      const merged = { ...createDefaultPostProcessingConfig(), ...ppConfig };
      this.renderPipeline.setPostProcessingConfig(merged);
    }
  }

  private setupPluginContext(): void {
    this.pluginManager.setContextFactory((): PluginContext => ({
      audioState: () => this.audioState,
      sceneManager: {
        loadScene: (id: string) => this.loadScene(id),
        getActiveSceneId: () =>
          (this.globalState.get('currentSceneId') as string) ?? '',
      },
      eventBus: {
        on: (event: string, handler: Function) =>
          this.eventBus.on(event as any, handler as any),
        off: (event: string, handler: Function) =>
          this.eventBus.off(event as any, handler as any),
      },
      registerCommand: (name: string, handler: () => void) =>
        this.pluginManager.registerCommand(name, handler),
    }));
  }
}
