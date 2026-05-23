/**
 * WallpaperPanel - UI panel for wallpaper mode settings.
 */

import React, { useState } from 'react';
import { DEFAULT_WALLPAPER_CONFIG } from '@config/wallpaper';
import { Toggle } from '../components/Toggle';
import { Slider } from '../components/Slider';

interface WallpaperPanelProps {
  visible?: boolean;
  onClose?: () => void;
}

export const WallpaperPanel: React.FC<WallpaperPanelProps> = ({
  visible = true,
  onClose,
}) => {
  const [enabled, setEnabled] = useState(DEFAULT_WALLPAPER_CONFIG.enabled);
  const [fpsLimit, setFpsLimit] = useState(DEFAULT_WALLPAPER_CONFIG.fpsLimit);
  const [lowCpuMode, setLowCpuMode] = useState(DEFAULT_WALLPAPER_CONFIG.lowCpuMode);
  const [autoStart, setAutoStart] = useState(DEFAULT_WALLPAPER_CONFIG.autoStart);
  const [reducedParticles, setReducedParticles] = useState(
    DEFAULT_WALLPAPER_CONFIG.reducedParticles
  );

  if (!visible) return null;

  return (
    <div className="bg-black/80 backdrop-blur-xl border border-cyan-500/20 rounded-lg p-4 w-64">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-xs font-mono font-bold text-cyan-400 uppercase">
          Wallpaper Mode
        </h3>
        {onClose && (
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-300 text-xs"
          >
            X
          </button>
        )}
      </div>

      <div className="space-y-3">
        <Toggle
          label="Enable Wallpaper Mode"
          checked={enabled}
          onChange={setEnabled}
        />

        <div>
          <label className="text-[10px] font-mono text-gray-400 uppercase block mb-1">
            FPS Limit: {fpsLimit}
          </label>
          <Slider label="FPS Limit" min={5} max={60} step={1} value={fpsLimit} onChange={setFpsLimit} />
        </div>

        <Toggle
          label="Low CPU Mode"
          checked={lowCpuMode}
          onChange={setLowCpuMode}
        />

        <Toggle
          label="Auto-start with System"
          checked={autoStart}
          onChange={setAutoStart}
        />

        <Toggle
          label="Reduced Particles"
          checked={reducedParticles}
          onChange={setReducedParticles}
        />
      </div>
    </div>
  );
};
