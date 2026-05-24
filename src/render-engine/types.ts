/**
 * Render engine type definitions.
 */

export interface RenderConfig {
  width: number;
  height: number;
  pixelRatio: number;
  antialias: boolean;
  alpha: boolean;
}

export interface PostProcessingConfig {
  bloom: {
    enabled: boolean;
    intensity: number;
    threshold: number;
    radius: number;
  };
  chromaticAberration: {
    enabled: boolean;
    offset: number;
  };
  vignette: {
    enabled: boolean;
    intensity: number;
    smoothness: number;
  };
  filmGrain: {
    enabled: boolean;
    intensity: number;
    speed: number;
  };
  colorGrading: {
    enabled: boolean;
    hueShift: number;
    saturation: number;
    contrast: number;
  };
  distortion: {
    enabled: boolean;
    amplitude: number;
    frequency: number;
  };
}

export interface RenderStats {
  fps: number;
  frameTime: number;
  drawCalls: number;
  triangles: number;
  memoryUsage: number;
}

export function createDefaultRenderConfig(): RenderConfig {
  return {
    width: 1920,
    height: 1080,
    pixelRatio: 1,
    antialias: true,
    alpha: false,
  };
}

export function createDefaultPostProcessingConfig(): PostProcessingConfig {
  return {
    bloom: {
      enabled: true,
      intensity: 1.5,
      threshold: 0.6,
      radius: 0.4,
    },
    chromaticAberration: {
      enabled: true,
      offset: 0.002,
    },
    vignette: {
      enabled: true,
      intensity: 0.8,
      smoothness: 0.4,
    },
    filmGrain: {
      enabled: true,
      intensity: 0.05,
      speed: 1.0,
    },
    colorGrading: {
      enabled: false,
      hueShift: 0,
      saturation: 1.0,
      contrast: 1.0,
    },
    distortion: {
      enabled: false,
      amplitude: 0.01,
      frequency: 4.0,
    },
  };
}
