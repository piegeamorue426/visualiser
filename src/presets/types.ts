/**
 * Preset system type definitions.
 */

export type PresetCategory =
  | 'cyberpunk'
  | 'synthwave'
  | 'neon'
  | 'space'
  | 'edm'
  | 'minimal'
  | 'futuristic'
  | 'dark'
  | 'holographic'
  | 'galaxy'
  | 'techno';

export interface Preset {
  id: string;
  name: string;
  description: string;
  category: PresetCategory;
  sceneId: string;
  audioConfig: {
    sensitivity: number;
    smoothing: number;
    fftSize: number;
  };
  renderConfig: {
    bloom: boolean;
    bloomIntensity: number;
    chromaticAberration: boolean;
    vignette: boolean;
    filmGrain: boolean;
  };
  cameraConfig: {
    mode: string;
    shakeIntensity: number;
    orbitSpeed: number;
    autoZoom: boolean;
  };
  colors: {
    primary: string;
    secondary: string;
    accent: string;
    background: string;
  };
  createdAt: number;
  isFavorite: boolean;
  tags: string[];
}
