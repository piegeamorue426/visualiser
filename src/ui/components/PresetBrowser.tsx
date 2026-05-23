/**
 * Preset browser with category filters and favorites.
 */

import React, { useState, useMemo } from 'react';
import type { Preset, PresetCategory } from '@presets/types';
import { Button } from './Button';

interface PresetBrowserProps {
  presets: Preset[];
  activePresetId: string | null;
  onSelect: (presetId: string) => void;
  onToggleFavorite: (presetId: string) => void;
  onImport: () => void;
  onExport: (presetId: string) => void;
  onClose: () => void;
}

const categories: Array<'all' | PresetCategory> = [
  'all',
  'cyberpunk',
  'synthwave',
  'neon',
  'space',
  'edm',
  'minimal',
  'futuristic',
  'dark',
  'holographic',
  'galaxy',
  'techno',
];

export const PresetBrowser: React.FC<PresetBrowserProps> = ({
  presets,
  activePresetId,
  onSelect,
  onToggleFavorite,
  onImport,
  onExport,
  onClose,
}) => {
  const [filter, setFilter] = useState<string>('all');

  const filteredPresets = useMemo(() => {
    if (filter === 'all') return presets;
    return presets.filter((p) => p.category === filter);
  }, [presets, filter]);

  return (
    <div className="bg-black/60 backdrop-blur-xl border border-white/10 rounded-xl p-4 w-[420px] max-h-[70vh] overflow-hidden flex flex-col">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-sm font-mono text-white font-bold">Presets</h2>
        <div className="flex items-center gap-2">
          <Button variant="ghost" className="!px-2 !py-1 text-[10px]" onClick={onImport}>
            Import
          </Button>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white text-sm font-mono transition-colors"
          >
            ESC
          </button>
        </div>
      </div>

      {/* Category tabs */}
      <div className="flex gap-1 mb-3 flex-wrap">
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => setFilter(cat)}
            className={`px-2 py-0.5 rounded text-[10px] font-mono transition-all duration-200 ${
              filter === cat
                ? 'bg-purple-500/20 border border-purple-500/50 text-purple-400'
                : 'text-gray-500 hover:text-gray-300 border border-transparent'
            }`}
          >
            {cat.toUpperCase()}
          </button>
        ))}
      </div>

      {/* Preset list */}
      <div className="flex flex-col gap-1.5 overflow-y-auto pr-1">
        {filteredPresets.map((preset) => (
          <div
            key={preset.id}
            className={`flex items-center gap-3 p-2.5 rounded-lg transition-all duration-200 border cursor-pointer ${
              activePresetId === preset.id
                ? 'bg-purple-500/10 border-purple-500/40'
                : 'bg-white/5 border-white/5 hover:border-white/20 hover:bg-white/10'
            }`}
            onClick={() => onSelect(preset.id)}
          >
            {/* Color swatch */}
            <div className="flex gap-0.5 shrink-0">
              <div
                className="w-2 h-6 rounded-sm"
                style={{ backgroundColor: preset.colors.primary }}
              />
              <div
                className="w-2 h-6 rounded-sm"
                style={{ backgroundColor: preset.colors.secondary }}
              />
            </div>

            <div className="flex-1 min-w-0">
              <div className="text-xs font-mono text-white truncate">{preset.name}</div>
              <div className="text-[10px] font-mono text-gray-500 truncate">
                {preset.description}
              </div>
            </div>

            {/* Actions */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                onToggleFavorite(preset.id);
              }}
              className={`text-sm transition-colors ${
                preset.isFavorite ? 'text-yellow-400' : 'text-gray-600 hover:text-gray-400'
              }`}
            >
              &#9733;
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                onExport(preset.id);
              }}
              className="text-[10px] font-mono text-gray-600 hover:text-gray-400 transition-colors"
            >
              EXP
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};
