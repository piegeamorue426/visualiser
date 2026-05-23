/**
 * PluginManager - Manages plugin lifecycle, loading, and unloading.
 * Provides a sandboxed PluginContext to each plugin.
 */

import type { AudioState } from '@audio/types';
import type { Plugin, PluginContext, PluginMetadata } from './types';

export class PluginManager {
  private plugins: Map<string, Plugin> = new Map();
  private enabledPlugins: Set<string> = new Set();
  private commands: Map<string, () => void> = new Map();
  private contextFactory: (() => PluginContext) | null = null;

  /**
   * Set the factory function that creates PluginContext for plugins.
   */
  setContextFactory(factory: () => PluginContext): void {
    this.contextFactory = factory;
  }

  /**
   * Register a plugin. Initializes it if a context factory is available.
   */
  register(plugin: Plugin): void {
    if (this.plugins.has(plugin.id)) {
      this.unregister(plugin.id);
    }

    this.plugins.set(plugin.id, plugin);
    this.enabledPlugins.add(plugin.id);

    if (this.contextFactory) {
      const context = this.contextFactory();
      plugin.init(context);
    }
  }

  /**
   * Unregister a plugin by ID, calling its destroy method.
   */
  unregister(id: string): void {
    const plugin = this.plugins.get(id);
    if (plugin) {
      plugin.destroy();
      this.plugins.delete(id);
      this.enabledPlugins.delete(id);
    }
  }

  /**
   * Enable a previously disabled plugin.
   */
  enable(id: string): void {
    const plugin = this.plugins.get(id);
    if (plugin && !this.enabledPlugins.has(id)) {
      this.enabledPlugins.add(id);
      if (this.contextFactory) {
        plugin.init(this.contextFactory());
      }
    }
  }

  /**
   * Disable a plugin without unregistering it.
   */
  disable(id: string): void {
    const plugin = this.plugins.get(id);
    if (plugin && this.enabledPlugins.has(id)) {
      plugin.destroy();
      this.enabledPlugins.delete(id);
    }
  }

  /**
   * Get all registered plugins with their metadata.
   */
  getAll(): PluginMetadata[] {
    return Array.from(this.plugins.values()).map((p) => ({
      id: p.id,
      name: p.name,
      version: p.version,
      description: p.description,
      author: p.author,
      enabled: this.enabledPlugins.has(p.id),
    }));
  }

  /**
   * Get a plugin by ID.
   */
  getById(id: string): Plugin | undefined {
    return this.plugins.get(id);
  }

  /**
   * Notify all enabled plugins of an audio update.
   */
  onAudioUpdate(audioState: AudioState): void {
    for (const [id, plugin] of this.plugins) {
      if (this.enabledPlugins.has(id) && plugin.onAudioUpdate) {
        plugin.onAudioUpdate(audioState);
      }
    }
  }

  /**
   * Notify all enabled plugins of a render tick.
   */
  onRender(deltaTime: number): void {
    for (const [id, plugin] of this.plugins) {
      if (this.enabledPlugins.has(id) && plugin.onRender) {
        plugin.onRender(deltaTime);
      }
    }
  }

  /**
   * Register a command that plugins can expose.
   */
  registerCommand(name: string, handler: () => void): void {
    this.commands.set(name, handler);
  }

  /**
   * Execute a registered command by name.
   */
  executeCommand(name: string): void {
    const handler = this.commands.get(name);
    if (handler) {
      handler();
    }
  }

  /**
   * Dispose all plugins and clear state.
   */
  dispose(): void {
    for (const [id] of this.plugins) {
      this.unregister(id);
    }
    this.commands.clear();
    this.contextFactory = null;
  }
}
