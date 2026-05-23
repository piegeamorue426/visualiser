import * as THREE from 'three';
import { AudioState } from '../audio-engine/types';

/**
 * Configuration for a scene parameter that can be adjusted at runtime.
 */
export interface SceneParameter {
  key: string;
  label: string;
  type: 'number' | 'color' | 'boolean' | 'select';
  default: any;
  min?: number;
  max?: number;
  step?: number;
  options?: { label: string; value: any }[];
}

/**
 * Static configuration describing a scene.
 */
export interface SceneConfig {
  name: string;
  description: string;
  category: 'spectrum' | 'particles' | 'geometric' | 'environment' | 'abstract' | 'shader';
  thumbnail?: string;
  parameters: SceneParameter[];
}

/**
 * Base interface for all visualizer scenes.
 */
export interface BaseScene {
  readonly config: SceneConfig;
  init(renderer: THREE.WebGLRenderer): void;
  update(deltaTime: number, audioState: AudioState): void;
  resize(width: number, height: number): void;
  getScene(): THREE.Scene;
  getCamera(): THREE.Camera;
  setParameter(key: string, value: any): void;
  dispose(): void;
}
