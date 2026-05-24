/**
 * Particle system type definitions.
 */

export enum EmitterShape {
  Point = 'point',
  Sphere = 'sphere',
  Ring = 'ring',
  Plane = 'plane',
  Box = 'box',
}

export interface ParticleSystemConfig {
  /** Maximum number of particles */
  count: number;
  /** Maximum particle lifetime in seconds */
  maxLife: number;
  /** Minimum particle lifetime in seconds */
  minLife: number;
  /** Shape of the particle emitter */
  emitterShape: EmitterShape;
  /** Gravity vector [x, y, z] */
  gravity: [number, number, number];
  /** Turbulence intensity (0-1) */
  turbulence: number;
  /** Audio reactivity settings */
  audioReactivity: AudioReactivityConfig;
  /** Spawn rate (particles per second) */
  spawnRate: number;
  /** Initial speed range [min, max] */
  speedRange: [number, number];
  /** Spread angle in radians */
  spreadAngle: number;
  /** Particle size range [min, max] */
  sizeRange: [number, number];
  /** Color start (normalized RGB) */
  colorStart: [number, number, number];
  /** Color end (normalized RGB) */
  colorEnd: [number, number, number];
}

export interface AudioReactivityConfig {
  /** Link spawn rate to beat detection */
  spawnOnBeat: boolean;
  /** Multiplier for spawn rate on beat */
  beatSpawnMultiplier: number;
  /** Link color to frequency */
  colorFromFrequency: boolean;
  /** Link size to energy */
  sizeFromEnergy: boolean;
  /** Link velocity to bass */
  velocityFromBass: boolean;
}

export function createDefaultParticleConfig(): ParticleSystemConfig {
  return {
    count: 100000,
    maxLife: 4.0,
    minLife: 1.0,
    emitterShape: EmitterShape.Sphere,
    gravity: [0, -0.5, 0],
    turbulence: 0.3,
    audioReactivity: {
      spawnOnBeat: true,
      beatSpawnMultiplier: 3.0,
      colorFromFrequency: true,
      sizeFromEnergy: true,
      velocityFromBass: true,
    },
    spawnRate: 1000,
    speedRange: [0.5, 2.0],
    spreadAngle: Math.PI * 0.5,
    sizeRange: [1.0, 5.0],
    colorStart: [0.2, 0.5, 1.0],
    colorEnd: [1.0, 0.2, 0.5],
  };
}
