/**
 * Scene selector grid with category filters.
 */

import React, { useState, useMemo } from 'react';
import type { SceneConfig } from '@scenes/types';

interface SceneEntry {
  id: string;
  config: SceneConfig;
}

interface SceneSelectorProps {
  scenes: SceneEntry[];
  activeSceneId: string | null;
  onSelect: (sceneId: string) => void;
  onClose: () => void;
}

const categories = ['all', 'spectrum', 'particles', 'geometric', 'environment', 'abstract', 'shader'] as const;

export const SceneSelector: React.FC<SceneSelectorProps> = ({
  scenes,
  activeSceneId,
  onSelect,
  onClose,
}) => {
  const [filter, setFilter] = useState<string>('all');

  const filteredScenes = useMemo(() => {
    if (filter === 'all') return scenes;
    return scenes.filter((s) => s.config.category === filter);
  }, [scenes, filter]);

  return (
    <div className="bg-black/60 backdrop-blur-xl border border-white/10 rounded-xl p-4 w-[500px] max-h-[70vh] overflow-hidden flex flex-col">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-sm font-mono text-white font-bold">Scenes</h2>
        <button
          onClick={onClose}
          className="text-gray-400 hover:text-white text-sm font-mono transition-colors"
        >
          ESC
        </button>
      </div>

      {/* Category tabs */}
      <div className="flex gap-1 mb-3 flex-wrap">
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => setFilter(cat)}
            className={`px-2 py-0.5 rounded text-[10px] font-mono transition-all duration-200 ${
              filter === cat
                ? 'bg-cyan-500/20 border border-cyan-500/50 text-cyan-400'
                : 'text-gray-500 hover:text-gray-300 border border-transparent'
            }`}
          >
            {cat.toUpperCase()}
          </button>
        ))}
      </div>

      {/* Scene grid */}
      <div className="grid grid-cols-2 gap-2 overflow-y-auto pr-1">
        {filteredScenes.map((scene) => (
          <button
            key={scene.id}
            onClick={() => onSelect(scene.id)}
            className={`p-3 rounded-lg text-left transition-all duration-200 border ${
              activeSceneId === scene.id
                ? 'bg-cyan-500/10 border-cyan-500/40'
                : 'bg-white/5 border-white/5 hover:border-white/20 hover:bg-white/10'
            }`}
          >
            <div className="text-xs font-mono text-white mb-1">
              {scene.config.name}
            </div>
            <div className="text-[10px] font-mono text-gray-500 leading-tight">
              {scene.config.description}
            </div>
            <div className="mt-1.5">
              <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-white/5 text-gray-500">
                {scene.config.category}
              </span>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
};
