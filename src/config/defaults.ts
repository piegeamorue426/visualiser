/**
 * Default configuration constants for the visualizer engine.
 */

export const DEFAULTS = {
  /** Target render resolution width */
  RESOLUTION_WIDTH: 1920,
  /** Target render resolution height */
  RESOLUTION_HEIGHT: 1080,
  /** Target frames per second */
  FPS_TARGET: 60,
  /** Audio FFT size (must be power of 2) */
  FFT_SIZE: 2048,
  /** Audio smoothing time constant (0-1) */
  SMOOTHING_TIME_CONSTANT: 0.8,
  /** Minimum decibels for frequency analysis */
  MIN_DECIBELS: -90,
  /** Maximum decibels for frequency analysis */
  MAX_DECIBELS: -10,
  /** Default camera field of view */
  CAMERA_FOV: 75,
  /** Camera near clipping plane */
  CAMERA_NEAR: 0.1,
  /** Camera far clipping plane */
  CAMERA_FAR: 1000,
  /** Maximum particle count */
  MAX_PARTICLES: 100000,
  /** Default bloom intensity */
  BLOOM_INTENSITY: 1.5,
  /** Default bloom threshold */
  BLOOM_THRESHOLD: 0.6,
} as const;

export type Defaults = typeof DEFAULTS;
