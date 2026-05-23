/**
 * StreamingPanel - UI panel for streaming/OBS mode configuration.
 */

import React, { useState } from 'react';
import type { StreamingMode } from '@config/streaming';
import { DEFAULT_STREAMING_CONFIG, STREAMING_PRESETS } from '@config/streaming';
import { Button } from '../components/Button';
import { Slider } from '../components/Slider';

interface StreamingPanelProps {
  visible?: boolean;
  onClose?: () => void;
}

export const StreamingPanel: React.FC<StreamingPanelProps> = ({
  visible = true,
  onClose,
}) => {
  const [mode, setMode] = useState<StreamingMode>(DEFAULT_STREAMING_CONFIG.mode);
  const [chromaKeyColor, setChromaKeyColor] = useState(DEFAULT_STREAMING_CONFIG.chromaKeyColor);
  const [targetFps, setTargetFps] = useState(DEFAULT_STREAMING_CONFIG.targetFps);

  if (!visible) return null;

  const modes: { value: StreamingMode; label: string }[] = [
    { value: 'normal', label: 'Normal' },
    { value: 'obs-optimized', label: 'OBS Optimized' },
    { value: 'transparent', label: 'Transparent' },
    { value: 'chroma-key', label: 'Chroma Key' },
    { value: 'ui-hidden', label: 'UI Hidden' },
    { value: 'wallpaper', label: 'Wallpaper' },
  ];

  const handleApply = () => {
    const preset = STREAMING_PRESETS[mode] ?? {};
    const _config = {
      ...DEFAULT_STREAMING_CONFIG,
      ...preset,
      mode,
      chromaKeyColor,
      targetFps,
    };
    // Config would be applied to the engine streaming system
  };

  return (
    <div className="bg-black/80 backdrop-blur-xl border border-cyan-500/20 rounded-lg p-4 w-64">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-xs font-mono font-bold text-cyan-400 uppercase">
          Streaming
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
        <div>
          <label className="text-[10px] font-mono text-gray-400 uppercase block mb-1">
            Mode
          </label>
          <select
            value={mode}
            onChange={(e) => setMode(e.target.value as StreamingMode)}
            className="w-full bg-gray-900 border border-gray-700 rounded px-2 py-1 text-xs text-gray-200 font-mono"
          >
            {modes.map((m) => (
              <option key={m.value} value={m.value}>
                {m.label}
              </option>
            ))}
          </select>
        </div>

        {mode === 'chroma-key' && (
          <div>
            <label className="text-[10px] font-mono text-gray-400 uppercase block mb-1">
              Chroma Key Color
            </label>
            <input
              type="color"
              value={chromaKeyColor}
              onChange={(e) => setChromaKeyColor(e.target.value)}
              className="w-full h-8 rounded border border-gray-700 cursor-pointer"
            />
          </div>
        )}

        <div>
          <label className="text-[10px] font-mono text-gray-400 uppercase block mb-1">
            Target FPS: {targetFps}
          </label>
          <Slider
            label="Target FPS"
            min={15}
            max={144}
            step={1}
            value={targetFps}
            onChange={setTargetFps}
          />
        </div>

        <Button variant="primary" className="w-full !text-xs" onClick={handleApply}>
          Apply
        </Button>
      </div>
    </div>
  );
};
