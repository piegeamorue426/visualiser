/**
 * Wallpaper Engine compatibility configuration.
 */

export interface WallpaperConfig {
  enabled: boolean;
  fpsLimit: number;
  reducedParticles: boolean;
  autoStart: boolean;
  respondToWallpaperEngine: boolean;
  lowCpuMode: boolean;
}

export const DEFAULT_WALLPAPER_CONFIG: WallpaperConfig = {
  enabled: false,
  fpsLimit: 30,
  reducedParticles: true,
  autoStart: false,
  respondToWallpaperEngine: true,
  lowCpuMode: true,
};
