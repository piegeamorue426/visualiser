/**
 * Performance overlay showing FPS, frame time, draw calls, and quality.
 */

import React from 'react';
import type { RenderStats } from '@render/types';

interface PerformanceOverlayProps {
  stats: RenderStats;
  visible: boolean;
}

export const PerformanceOverlay: React.FC<PerformanceOverlayProps> = ({
  stats,
  visible,
}) => {
  if (!visible) return null;

  return (
    <div className="bg-black/40 backdrop-blur-xl border border-white/10 rounded-xl px-3 py-2 font-mono text-xs space-y-0.5">
      <div className="flex justify-between gap-4">
        <span className="text-gray-400">FPS</span>
        <span className={stats.fps >= 55 ? 'text-green-400' : stats.fps >= 30 ? 'text-yellow-400' : 'text-red-400'}>
          {stats.fps}
        </span>
      </div>
      <div className="flex justify-between gap-4">
        <span className="text-gray-400">Frame</span>
        <span className="text-gray-300">{stats.frameTime.toFixed(1)}ms</span>
      </div>
      <div className="flex justify-between gap-4">
        <span className="text-gray-400">Draws</span>
        <span className="text-gray-300">{stats.drawCalls}</span>
      </div>
      <div className="flex justify-between gap-4">
        <span className="text-gray-400">Tris</span>
        <span className="text-gray-300">{(stats.triangles / 1000).toFixed(1)}k</span>
      </div>
    </div>
  );
};
