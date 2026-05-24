/**
 * Camera system type definitions.
 */

export enum CameraMode {
  Orbit = 'orbit',
  Static = 'static',
  Cinematic = 'cinematic',
  Follow = 'follow',
}

export interface CameraConfig {
  mode: CameraMode;
  orbitSpeed: number;
  shakeIntensity: number;
  autoZoom: boolean;
  fov: number;
  near: number;
  far: number;
  position: [number, number, number];
  lookAt: [number, number, number];
}

export function createDefaultCameraConfig(): CameraConfig {
  return {
    mode: CameraMode.Orbit,
    orbitSpeed: 0.3,
    shakeIntensity: 0.1,
    autoZoom: true,
    fov: 75,
    near: 0.1,
    far: 1000,
    position: [0, 2, 8],
    lookAt: [0, 0, 0],
  };
}
