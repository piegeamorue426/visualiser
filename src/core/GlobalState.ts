/**
 * Simple reactive state store using pub/sub pattern.
 */

import type { RenderStats } from '@render/types';

export interface GlobalStateValues {
  currentPresetId: string | null;
  currentSceneId: string | null;
  isPlaying: boolean;
  uiVisible: boolean;
  fullscreen: boolean;
  performanceStats: RenderStats;
  streamingMode: string;
}

type StateKey = keyof GlobalStateValues;
type StateCallback<K extends StateKey> = (value: GlobalStateValues[K]) => void;

export class GlobalState {
  private state: GlobalStateValues = {
    currentPresetId: null,
    currentSceneId: null,
    isPlaying: false,
    uiVisible: true,
    fullscreen: false,
    performanceStats: {
      fps: 0,
      frameTime: 0,
      drawCalls: 0,
      triangles: 0,
      memoryUsage: 0,
    },
    streamingMode: 'normal',
  };

  private subscribers: Map<StateKey, Set<StateCallback<any>>> = new Map();

  /**
   * Get a state value by key.
   */
  get<K extends StateKey>(key: K): GlobalStateValues[K] {
    return this.state[key];
  }

  /**
   * Set a state value and notify subscribers.
   */
  set<K extends StateKey>(key: K, value: GlobalStateValues[K]): void {
    this.state[key] = value;
    const subs = this.subscribers.get(key);
    if (subs) {
      subs.forEach((cb) => cb(value));
    }
  }

  /**
   * Subscribe to changes of a specific state key.
   */
  subscribe<K extends StateKey>(key: K, callback: StateCallback<K>): () => void {
    if (!this.subscribers.has(key)) {
      this.subscribers.set(key, new Set());
    }
    this.subscribers.get(key)!.add(callback);
    return () => {
      this.subscribers.get(key)?.delete(callback);
    };
  }

  /**
   * Get the entire state snapshot.
   */
  getSnapshot(): GlobalStateValues {
    return { ...this.state };
  }
}
