/**
 * Common math utilities for the visualizer engine.
 */

/** Linear interpolation between two values. */
export function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

/** Clamp a value between min and max. */
export function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

/** Map a value from one range to another. */
export function map(
  value: number,
  inMin: number,
  inMax: number,
  outMin: number,
  outMax: number
): number {
  return outMin + ((value - inMin) / (inMax - inMin)) * (outMax - outMin);
}

/** Hermite interpolation (smooth step) between 0 and 1. */
export function smoothstep(edge0: number, edge1: number, x: number): number {
  const t = clamp((x - edge0) / (edge1 - edge0), 0, 1);
  return t * t * (3 - 2 * t);
}

/** Convert degrees to radians. */
export function degToRad(degrees: number): number {
  return degrees * (Math.PI / 180);
}

/** Convert radians to degrees. */
export function radToDeg(radians: number): number {
  return radians * (180 / Math.PI);
}

/** Normalize a value in a given range to 0-1. */
export function normalize(value: number, min: number, max: number): number {
  return (value - min) / (max - min);
}
