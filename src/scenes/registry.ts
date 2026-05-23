import { BaseScene } from './types';
import { CircularSpectrum } from './CircularSpectrum';
import { TrapNationRing } from './TrapNationRing';
import { ParticleGalaxy } from './ParticleGalaxy';
import { InfiniteTunnel } from './InfiniteTunnel';
import { NeonWaveform } from './NeonWaveform';
import { AudioTerrain } from './AudioTerrain';
import { GeometricPulse } from './GeometricPulse';
import { SpaceScene } from './SpaceScene';
import { CyberpunkCity } from './CyberpunkCity';
import { ReactiveVortex } from './ReactiveVortex';
import { EnergyStorm } from './EnergyStorm';
import { FluidSimulation } from './FluidSimulation';
import { SceneManager } from './SceneManager';

/**
 * Scene registry entry mapping an ID to a factory function.
 */
export interface SceneRegistryEntry {
  id: string;
  factory: () => BaseScene;
}

/**
 * All available scenes in the application.
 */
export const sceneRegistry: SceneRegistryEntry[] = [
  { id: 'circular-spectrum', factory: () => new CircularSpectrum() },
  { id: 'trap-nation-ring', factory: () => new TrapNationRing() },
  { id: 'particle-galaxy', factory: () => new ParticleGalaxy() },
  { id: 'infinite-tunnel', factory: () => new InfiniteTunnel() },
  { id: 'neon-waveform', factory: () => new NeonWaveform() },
  { id: 'audio-terrain', factory: () => new AudioTerrain() },
  { id: 'geometric-pulse', factory: () => new GeometricPulse() },
  { id: 'space', factory: () => new SpaceScene() },
  { id: 'cyberpunk-city', factory: () => new CyberpunkCity() },
  { id: 'reactive-vortex', factory: () => new ReactiveVortex() },
  { id: 'energy-storm', factory: () => new EnergyStorm() },
  { id: 'fluid-simulation', factory: () => new FluidSimulation() },
];

/**
 * Create a SceneManager with all scenes registered.
 */
export function createSceneManager(): SceneManager {
  const manager = new SceneManager();
  for (const entry of sceneRegistry) {
    manager.registerScene(entry.id, entry.factory);
  }
  return manager;
}
