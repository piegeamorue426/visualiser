/**
 * Audio level meter showing frequency band levels and BPM.
 */

import React from 'react';
import type { AudioState } from '@audio/types';

interface AudioMeterProps {
  audioState: AudioState;
}

export const AudioMeter: React.FC<AudioMeterProps> = ({ audioState }) => {
  const bands = [
    { label: 'BASS', value: audioState.bass, color: 'bg-red-500' },
    { label: 'MID', value: audioState.mids, color: 'bg-yellow-400' },
    { label: 'HIGH', value: audioState.highs, color: 'bg-cyan-400' },
  ];

  return (
    <div className="flex items-center gap-3">
      {bands.map((band) => (
        <div key={band.label} className="flex items-center gap-1.5">
          <span className="text-[10px] font-mono text-gray-500 w-7">{band.label}</span>
          <div className="w-16 h-2 bg-gray-800 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-75 ${band.color}`}
              style={{ width: `${Math.min(band.value * 100, 100)}%` }}
            />
          </div>
        </div>
      ))}
      <div className="flex items-center gap-1.5 ml-2">
        <span className="text-[10px] font-mono text-gray-500">BPM</span>
        <span className="text-xs font-mono text-cyan-400 w-8">
          {audioState.bpm > 0 ? Math.round(audioState.bpm) : '--'}
        </span>
      </div>
      <div
        className={`w-2 h-2 rounded-full transition-all duration-75 ${
          audioState.beatDetected ? 'bg-cyan-400 shadow-neon' : 'bg-gray-700'
        }`}
      />
    </div>
  );
};
