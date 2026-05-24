/**
 * Predefined camera configurations for different visual perspectives.
 */

import { CameraMode } from './types';
import type { CameraConfig } from './types';

export const CAMERA_PRESETS: Record<string, CameraConfig> = {
  'close-up': {
    mode: CameraMode.Static,
    orbitSpeed: 0,
    shakeIntensity: 0.05,
    autoZoom: false,
    fov: 45,
    near: 0.1,
    far: 100,
    position: [0, 1, 3],
    lookAt: [0, 0, 0],
  },
  'wide-angle': {
    mode: CameraMode.Orbit,
    orbitSpeed: 0.15,
    shakeIntensity: 0.02,
    autoZoom: true,
    fov: 90,
    near: 0.1,
    far: 2000,
    position: [0, 5, 20],
    lookAt: [0, 0, 0],
  },
  overhead: {
    mode: CameraMode.Static,
    orbitSpeed: 0,
    shakeIntensity: 0.03,
    autoZoom: true,
    fov: 60,
    near: 0.1,
    far: 500,
    position: [0, 15, 0.1],
    lookAt: [0, 0, 0],
  },
  dramatic: {
    mode: CameraMode.Cinematic,
    orbitSpeed: 0.5,
    shakeIntensity: 0.15,
    autoZoom: true,
    fov: 35,
    near: 0.1,
    far: 1000,
    position: [5, 1, 5],
    lookAt: [0, 0, 0],
  },
  'first-person': {
    mode: CameraMode.Follow,
    orbitSpeed: 0,
    shakeIntensity: 0.08,
    autoZoom: false,
    fov: 75,
    near: 0.01,
    far: 500,
    position: [0, 1.7, 0],
    lookAt: [0, 1.7, -5],
  },
};
