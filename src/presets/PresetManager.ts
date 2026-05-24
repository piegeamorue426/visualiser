/**
 * Preset manager handling CRUD operations for visualizer presets.
 * Stores user presets in localStorage and provides built-in presets.
 */

import type { Preset, PresetCategory } from './types';
import { builtInPresets } from './built-in';

const STORAGE_KEY = 'visualiser-presets';
const FAVORITES_KEY = 'visualiser-favorites';

export class PresetManager {
  private userPresets: Preset[] = [];
  private favorites: Set<string> = new Set();

  constructor() {
    this.loadFromStorage();
  }

  /**
   * Get all presets (built-in + user).
   */
  getAll(): Preset[] {
    return [...builtInPresets, ...this.userPresets].map((p) => ({
      ...p,
      isFavorite: this.favorites.has(p.id),
    }));
  }

  /**
   * Get a preset by ID.
   */
  getById(id: string): Preset | null {
    const all = this.getAll();
    return all.find((p) => p.id === id) ?? null;
  }

  /**
   * Get presets filtered by category.
   */
  getByCategory(category: PresetCategory): Preset[] {
    return this.getAll().filter((p) => p.category === category);
  }

  /**
   * Save a new or updated user preset.
   */
  save(preset: Preset): void {
    const existingIndex = this.userPresets.findIndex((p) => p.id === preset.id);
    if (existingIndex >= 0) {
      this.userPresets[existingIndex] = preset;
    } else {
      this.userPresets.push(preset);
    }
    this.saveToStorage();
  }

  /**
   * Delete a user preset by ID.
   */
  delete(id: string): void {
    this.userPresets = this.userPresets.filter((p) => p.id !== id);
    this.favorites.delete(id);
    this.saveToStorage();
  }

  /**
   * Import a preset from a JSON string.
   */
  importPreset(json: string): Preset {
    const preset = JSON.parse(json) as Preset;
    preset.id = `import-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    preset.createdAt = Date.now();
    this.save(preset);
    return preset;
  }

  /**
   * Export a preset as a JSON string.
   */
  exportPreset(id: string): string {
    const preset = this.getById(id);
    if (!preset) {
      throw new Error(`Preset "${id}" not found`);
    }
    return JSON.stringify(preset, null, 2);
  }

  /**
   * Toggle favorite status of a preset.
   */
  toggleFavorite(id: string): void {
    if (this.favorites.has(id)) {
      this.favorites.delete(id);
    } else {
      this.favorites.add(id);
    }
    this.saveFavorites();
  }

  /**
   * Get all favorited presets.
   */
  getFavorites(): Preset[] {
    return this.getAll().filter((p) => p.isFavorite);
  }

  /**
   * Get built-in presets only.
   */
  getBuiltIn(): Preset[] {
    return builtInPresets.map((p) => ({
      ...p,
      isFavorite: this.favorites.has(p.id),
    }));
  }

  private loadFromStorage(): void {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        this.userPresets = JSON.parse(stored);
      }
    } catch {
      this.userPresets = [];
    }
    try {
      const favs = localStorage.getItem(FAVORITES_KEY);
      if (favs) {
        this.favorites = new Set(JSON.parse(favs));
      }
    } catch {
      this.favorites = new Set();
    }
  }

  private saveToStorage(): void {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.userPresets));
    } catch {
      // Storage might be full or unavailable
    }
    this.saveFavorites();
  }

  private saveFavorites(): void {
    try {
      localStorage.setItem(FAVORITES_KEY, JSON.stringify([...this.favorites]));
    } catch {
      // Storage might be full or unavailable
    }
  }
}
