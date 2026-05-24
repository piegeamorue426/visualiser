import { BaseScene, SceneConfig } from './types';
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

/**
 * Scene registry entry mapping an ID to a factory function and static metadata.
 */
export interface SceneRegistryEntry {
  id: string;
  factory: () => BaseScene;
  config: SceneConfig;
}

/**
 * All available scenes in the application.
 */
export const sceneRegistry: SceneRegistryEntry[] = [
  {
    id: 'circular-spectrum',
    factory: () => new CircularSpectrum(),
    config: {
      name: 'Circular Spectrum',
      description: 'Bars arranged in a circle with height driven by frequency spectrum',
      category: 'spectrum',
      parameters: [
        { key: 'barCount', label: 'Bar Count', type: 'number', default: 128, min: 32, max: 256, step: 8 },
        { key: 'ringRadius', label: 'Ring Radius', type: 'number', default: 3, min: 1, max: 8, step: 0.5 },
        { key: 'rotationSpeed', label: 'Rotation Speed', type: 'number', default: 0.2, min: 0, max: 2, step: 0.1 },
        { key: 'glowIntensity', label: 'Glow Intensity', type: 'number', default: 1.5, min: 0, max: 5, step: 0.1 },
      ],
    },
  },
  {
    id: 'trap-nation-ring',
    factory: () => new TrapNationRing(),
    config: {
      name: 'Trap Nation Ring',
      description: 'Classic trap nation style ring visualizer with reactive glow',
      category: 'spectrum',
      parameters: [],
    },
  },
  {
    id: 'particle-galaxy',
    factory: () => new ParticleGalaxy(),
    config: {
      name: 'Particle Galaxy',
      description: 'Golden-angle spiral galaxy with 60k audio-reactive particles',
      category: 'particles',
      parameters: [],
    },
  },
  {
    id: 'infinite-tunnel',
    factory: () => new InfiniteTunnel(),
    config: {
      name: 'Infinite Tunnel',
      description: 'Endless tunnel with geometry driven by audio',
      category: 'geometric',
      parameters: [],
    },
  },
  {
    id: 'neon-waveform',
    factory: () => new NeonWaveform(),
    config: {
      name: 'Neon Waveform',
      description: 'Glowing neon waveform display with audio reactivity',
      category: 'spectrum',
      parameters: [],
    },
  },
  {
    id: 'audio-terrain',
    factory: () => new AudioTerrain(),
    config: {
      name: 'Audio Terrain',
      description: 'Terrain mesh deformed by audio frequency data',
      category: 'environment',
      parameters: [],
    },
  },
  {
    id: 'geometric-pulse',
    factory: () => new GeometricPulse(),
    config: {
      name: 'Geometric Pulse',
      description: 'Pulsating geometric shapes reacting to beats',
      category: 'geometric',
      parameters: [],
    },
  },
  {
    id: 'space',
    factory: () => new SpaceScene(),
    config: {
      name: 'Space',
      description: 'Starfield and nebula with audio-reactive elements',
      category: 'environment',
      parameters: [],
    },
  },
  {
    id: 'cyberpunk-city',
    factory: () => new CyberpunkCity(),
    config: {
      name: 'Cyberpunk City',
      description: 'Neon-lit cyberpunk cityscape with audio reactivity',
      category: 'environment',
      parameters: [],
    },
  },
  {
    id: 'reactive-vortex',
    factory: () => new ReactiveVortex(),
    config: {
      name: 'Reactive Vortex',
      description: 'Swirling vortex that reacts to audio energy',
      category: 'abstract',
      parameters: [],
    },
  },
  {
    id: 'energy-storm',
    factory: () => new EnergyStorm(),
    config: {
      name: 'Energy Storm',
      description: 'Electric energy storm driven by audio intensity',
      category: 'abstract',
      parameters: [],
    },
  },
  {
    id: 'fluid-simulation',
    factory: () => new FluidSimulation(),
    config: {
      name: 'Fluid Simulation',
      description: 'Fullscreen simplex-noise fluid shader',
      category: 'shader',
      parameters: [],
    },
  },
];


