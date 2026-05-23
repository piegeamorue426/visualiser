/**
 * Plugin system type definitions.
 */

import type { AudioState } from '@audio/types';

export interface PluginContext {
  audioState: () => AudioState;
  sceneManager: {
    loadScene: (id: string) => void;
    getActiveSceneId: () => string;
  };
  eventBus: {
    on: (event: string, handler: Function) => void;
    off: (event: string, handler: Function) => void;
  };
  registerCommand: (name: string, handler: () => void) => void;
}

export interface Plugin {
  id: string;
  name: string;
  version: string;
  description: string;
  author: string;
  init(context: PluginContext): void;
  destroy(): void;
  onAudioUpdate?(audioState: AudioState): void;
  onRender?(deltaTime: number): void;
}

export interface PluginMetadata {
  id: string;
  name: string;
  version: string;
  description: string;
  author: string;
  enabled: boolean;
}
