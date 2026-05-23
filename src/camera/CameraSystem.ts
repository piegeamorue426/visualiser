/**
 * Cinematic camera controller with multiple modes and audio reactivity.
 * Supports orbit, static, cinematic, and follow modes with smooth transitions.
 */

import * as THREE from 'three';
import type { AudioState } from '@audio/types';
import { CameraMode } from './types';
import type { CameraConfig } from './types';
import { createDefaultCameraConfig } from './types';
import { lerp, clamp } from '@utils/math';

export class CameraSystem {
  private camera: THREE.PerspectiveCamera;
  private config: CameraConfig;
  private currentMode: CameraMode;
  private orbitAngle = 0;
  private time = 0;

  // Transition state
  private transitioning = false;
  private transitionDuration = 0;
  private transitionElapsed = 0;
  private transitionStartPos = new THREE.Vector3();
  private transitionEndPos = new THREE.Vector3();
  private transitionStartQuat = new THREE.Quaternion();
  private transitionEndQuat = new THREE.Quaternion();
  private transitionStartFov = 75;
  private transitionEndFov = 75;

  // Shake state
  private shakeOffset = new THREE.Vector3();
  private shakeDamping = 0;

  // Auto-zoom state
  private baseFov: number;
  private currentFov: number;

  constructor(config?: Partial<CameraConfig>) {
    this.config = { ...createDefaultCameraConfig(), ...config };
    this.currentMode = this.config.mode;
    this.baseFov = this.config.fov;
    this.currentFov = this.config.fov;

    this.camera = new THREE.PerspectiveCamera(
      this.config.fov,
      16 / 9,
      this.config.near,
      this.config.far
    );

    this.camera.position.set(
      this.config.position[0],
      this.config.position[1],
      this.config.position[2]
    );
    this.camera.lookAt(
      this.config.lookAt[0],
      this.config.lookAt[1],
      this.config.lookAt[2]
    );
  }

  /**
   * Update and apply camera effects to a target camera (the scene's camera).
   * This allows the CameraSystem to augment the scene's own camera rather than
   * maintaining a completely separate camera.
   */
  updateTarget(target: THREE.PerspectiveCamera, deltaTime: number, audioState?: AudioState): void {
    this.time += deltaTime;

    // Apply audio reactivity effects directly to the target camera
    if (audioState) {
      this.applyBassShake(audioState);
      this.applyAutoZoom(audioState, deltaTime);
    }

    // Apply shake offset to the target camera
    target.position.add(this.shakeOffset);

    // Apply auto-zoom FOV to target camera
    if (this.config.autoZoom && audioState) {
      target.fov = this.currentFov;
      target.updateProjectionMatrix();
    }

    // Dampen shake
    this.shakeOffset.multiplyScalar(0.85);
  }

  /**
   * Update the camera each frame based on mode and audio state.
   */
  update(deltaTime: number, audioState?: AudioState): void {
    this.time += deltaTime;

    // Handle transition
    if (this.transitioning) {
      this.updateTransition(deltaTime);
      return;
    }

    // Update based on current mode
    switch (this.currentMode) {
      case CameraMode.Orbit:
        this.updateOrbit(deltaTime);
        break;
      case CameraMode.Static:
        // Static: no movement
        break;
      case CameraMode.Cinematic:
        this.updateCinematic(deltaTime);
        break;
      case CameraMode.Follow:
        this.updateFollow(deltaTime);
        break;
    }

    // Apply audio reactivity
    if (audioState) {
      this.applyBassShake(audioState);
      this.applyAutoZoom(audioState, deltaTime);
    }

    // Apply shake offset
    this.camera.position.add(this.shakeOffset);

    // Dampen shake
    this.shakeOffset.multiplyScalar(0.85);
  }

  /**
   * Orbit mode: rotate around the origin.
   */
  private updateOrbit(deltaTime: number): void {
    this.orbitAngle += this.config.orbitSpeed * deltaTime;

    const radius = Math.sqrt(
      this.config.position[0] ** 2 + this.config.position[2] ** 2
    );
    const height = this.config.position[1];

    this.camera.position.set(
      Math.cos(this.orbitAngle) * radius,
      height,
      Math.sin(this.orbitAngle) * radius
    );

    this.camera.lookAt(
      this.config.lookAt[0],
      this.config.lookAt[1],
      this.config.lookAt[2]
    );
  }

  /**
   * Cinematic mode: interpolate along a preset path.
   */
  private updateCinematic(deltaTime: number): void {
    const t = (Math.sin(this.time * 0.2) + 1) * 0.5;
    const radius = 8 + Math.sin(this.time * 0.3) * 3;
    const height = 2 + Math.sin(this.time * 0.15) * 2;

    this.camera.position.set(
      Math.cos(this.time * 0.1) * radius,
      height,
      Math.sin(this.time * 0.1) * radius
    );

    // Slowly rotate look target
    const lookX = Math.sin(this.time * 0.05) * 2;
    const lookY = Math.cos(this.time * 0.07);
    this.camera.lookAt(lookX, lookY, 0);
  }

  /**
   * Follow mode: follow a virtual target with smooth interpolation.
   */
  private updateFollow(deltaTime: number): void {
    // Follow a slowly-moving virtual target
    const target = new THREE.Vector3(
      Math.sin(this.time * 0.3) * 3,
      Math.cos(this.time * 0.2),
      Math.cos(this.time * 0.3) * 3
    );

    const desiredPos = target.clone().add(new THREE.Vector3(0, 2, 5));
    this.camera.position.lerp(desiredPos, 0.02);
    this.camera.lookAt(target);
  }

  /**
   * Apply camera shake on bass hits.
   */
  private applyBassShake(audioState: AudioState): void {
    if (audioState.beatDetected && this.config.shakeIntensity > 0) {
      const intensity = this.config.shakeIntensity * audioState.bass;
      this.shakeOffset.set(
        (Math.random() - 0.5) * intensity,
        (Math.random() - 0.5) * intensity,
        (Math.random() - 0.5) * intensity * 0.5
      );
    }
  }

  /**
   * Apply auto-zoom based on energy.
   */
  private applyAutoZoom(audioState: AudioState, deltaTime: number): void {
    if (!this.config.autoZoom) return;

    const targetFov = this.baseFov + audioState.energy * 15;
    this.currentFov = lerp(this.currentFov, targetFov, deltaTime * 3);
    this.camera.fov = this.currentFov;
    this.camera.updateProjectionMatrix();
  }

  /**
   * Update transition between configurations.
   */
  private updateTransition(deltaTime: number): void {
    this.transitionElapsed += deltaTime;
    const t = clamp(this.transitionElapsed / this.transitionDuration, 0, 1);

    // Smooth easing (ease in-out cubic)
    const eased = t < 0.5
      ? 4 * t * t * t
      : 1 - Math.pow(-2 * t + 2, 3) / 2;

    // Interpolate position
    this.camera.position.lerpVectors(
      this.transitionStartPos,
      this.transitionEndPos,
      eased
    );

    // Interpolate rotation
    this.camera.quaternion.slerpQuaternions(
      this.transitionStartQuat,
      this.transitionEndQuat,
      eased
    );

    // Interpolate FOV
    this.camera.fov = lerp(this.transitionStartFov, this.transitionEndFov, eased);
    this.camera.updateProjectionMatrix();

    if (t >= 1.0) {
      this.transitioning = false;
    }
  }

  /**
   * Set the camera mode immediately.
   */
  setMode(mode: CameraMode): void {
    this.currentMode = mode;
  }

  /**
   * Set the shake intensity.
   */
  setShakeIntensity(intensity: number): void {
    this.config.shakeIntensity = intensity;
  }

  /**
   * Set the orbit speed.
   */
  setOrbitSpeed(speed: number): void {
    this.config.orbitSpeed = speed;
  }

  /**
   * Smoothly transition to a new camera configuration over the given duration.
   */
  transitionTo(config: Partial<CameraConfig>, duration: number): void {
    this.transitioning = true;
    this.transitionDuration = duration;
    this.transitionElapsed = 0;

    this.transitionStartPos.copy(this.camera.position);
    this.transitionStartQuat.copy(this.camera.quaternion);
    this.transitionStartFov = this.camera.fov;

    const endConfig = { ...this.config, ...config };
    this.transitionEndPos.set(
      endConfig.position[0],
      endConfig.position[1],
      endConfig.position[2]
    );

    // Calculate the end quaternion by looking at the target from the end position
    const tempCam = new THREE.PerspectiveCamera();
    tempCam.position.set(
      endConfig.position[0],
      endConfig.position[1],
      endConfig.position[2]
    );
    tempCam.lookAt(
      endConfig.lookAt[0],
      endConfig.lookAt[1],
      endConfig.lookAt[2]
    );
    this.transitionEndQuat.copy(tempCam.quaternion);
    this.transitionEndFov = endConfig.fov;

    this.config = endConfig;
    this.currentMode = endConfig.mode;
    this.baseFov = endConfig.fov;
  }

  /**
   * Get the Three.js PerspectiveCamera instance.
   */
  getCamera(): THREE.PerspectiveCamera {
    return this.camera;
  }

  /**
   * Set the camera aspect ratio.
   */
  setAspect(aspect: number): void {
    this.camera.aspect = aspect;
    this.camera.updateProjectionMatrix();
  }

  /**
   * Get the current camera configuration.
   */
  getConfig(): CameraConfig {
    return this.config;
  }

  /**
   * Get the current mode.
   */
  getMode(): CameraMode {
    return this.currentMode;
  }
}
